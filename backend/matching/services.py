"""Persistance des matchs (DL-11, DL-24).

Ce module fait le pont entre la base de données et le moteur de score, qui reste
pur (`matching/scoring.py`). Il charge les profils par l'ORM, appelle le moteur,
puis enregistre le résultat.

Le recalcul est **incrémental** : quand un utilisateur change ses compétences, on
ne recalcule que les paires qui le concernent, et non toute la base.
"""

from __future__ import annotations

import logging

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Q

from core.exceptions import Conflict
from profiles.models import Profile
from skills.models import UserSkill

from .models import Match, MatchFeedback
from .scoring import MatchExplanation, ProfileInput, SkillRef, score_pair

logger = logging.getLogger(__name__)
User = get_user_model()

#: En dessous de ce score, le match n'est pas conservé : il n'apporte rien à
#: l'utilisateur et encombrerait la liste.
MIN_SCORE_TO_KEEP = 10.0


def load_profile_input(
    user_id: int, *, skills_by_user: dict | None = None, profiles: dict | None = None
) -> ProfileInput:
    """Construit l'entrée du moteur de score pour un utilisateur.

    `skills_by_user` et `profiles` permettent de passer des données déjà
    chargées, pour éviter une requête par utilisateur lors d'un recalcul en lot.
    """
    if skills_by_user is None:
        skills_by_user = _load_skills([user_id])
    if profiles is None:
        profiles = _load_profiles([user_id])

    offered, wanted = skills_by_user.get(user_id, ([], []))
    profile = profiles.get(user_id)

    return ProfileInput(
        offered=tuple(offered),
        wanted=tuple(wanted),
        availability=frozenset(profile.availability if profile else []),
        domains=frozenset(profile.domains if profile else []),
        country=profile.country if profile else "",
    )


def _load_skills(user_ids: list[int]) -> dict[int, tuple[list[SkillRef], list[SkillRef]]]:
    """Charge les compétences de plusieurs utilisateurs en une seule requête."""
    result: dict[int, tuple[list[SkillRef], list[SkillRef]]] = {user_id: ([], []) for user_id in user_ids}

    rows = UserSkill.objects.filter(user_id__in=user_ids).select_related("skill")
    for row in rows:
        reference = SkillRef(name=row.skill.name, level=row.level)
        offered, wanted = result[row.user_id]
        if row.kind == UserSkill.Kind.OFFERED:
            offered.append(reference)
        else:
            wanted.append(reference)

    return result


def _load_profiles(user_ids: list[int]) -> dict[int, Profile]:
    return {profile.user_id: profile for profile in Profile.objects.filter(user_id__in=user_ids)}


def score_users(user_a_id: int, user_b_id: int) -> MatchExplanation:
    """Score une paire d'utilisateurs, en chargeant leurs données."""
    ids = [user_a_id, user_b_id]
    skills = _load_skills(ids)
    profiles = _load_profiles(ids)

    return score_pair(
        load_profile_input(user_a_id, skills_by_user=skills, profiles=profiles),
        load_profile_input(user_b_id, skills_by_user=skills, profiles=profiles),
    )


def _ordered(user_a_id: int, user_b_id: int) -> tuple[int, int]:
    """Respecte la convention user_a < user_b, imposée en base."""
    return (user_a_id, user_b_id) if user_a_id < user_b_id else (user_b_id, user_a_id)


def recompute_pair(user_a_id: int, user_b_id: int) -> Match | None:
    """Recalcule et enregistre une paire. Renvoie None si le score est trop bas.

    L'explication est stockée **du point de vue de user_a** (le plus petit
    identifiant), afin que `a_can_teach_b` garde toujours le même sens.
    """
    if user_a_id == user_b_id:
        return None

    low, high = _ordered(user_a_id, user_b_id)
    explanation = score_users(low, high)

    if explanation.score < MIN_SCORE_TO_KEEP:
        Match.objects.filter(user_a_id=low, user_b_id=high).delete()
        return None

    match, _ = Match.objects.update_or_create(
        user_a_id=low,
        user_b_id=high,
        defaults={"score": explanation.score, "explanation": explanation.as_dict()},
    )
    return match


def recompute_for_user(user_id: int) -> int:
    """Recalcule tous les matchs d'un utilisateur. Renvoie le nombre conservé.

    Appelé à l'inscription et à chaque changement de compétences. On ne touche
    qu'aux paires contenant cet utilisateur : c'est le recalcul incrémental.
    """
    others = list(User.objects.filter(is_active=True).exclude(pk=user_id).values_list("pk", flat=True))
    if not others:
        return 0

    # Toutes les données nécessaires en deux requêtes, pas une par paire.
    everyone = [user_id, *others]
    skills = _load_skills(everyone)
    profiles = _load_profiles(everyone)
    mine = load_profile_input(user_id, skills_by_user=skills, profiles=profiles)

    to_save: list[Match] = []
    to_update: list[Match] = []
    to_delete: list[tuple[int, int]] = []

    existing = {
        (match.user_a_id, match.user_b_id): match
        for match in Match.objects.filter(Q(user_a_id=user_id) | Q(user_b_id=user_id))
    }

    for other_id in others:
        theirs = load_profile_input(other_id, skills_by_user=skills, profiles=profiles)
        low, high = _ordered(user_id, other_id)
        # L'explication est toujours calculée dans l'ordre (low, high).
        explanation = score_pair(mine, theirs) if user_id == low else score_pair(theirs, mine)

        key = (low, high)
        if explanation.score < MIN_SCORE_TO_KEEP:
            if key in existing:
                to_delete.append(key)
            continue

        match = existing.get(key)
        if match is None:
            to_save.append(
                Match(
                    user_a_id=low,
                    user_b_id=high,
                    score=explanation.score,
                    explanation=explanation.as_dict(),
                )
            )
        else:
            match.score = explanation.score
            match.explanation = explanation.as_dict()
            to_update.append(match)

    # Transactions courtes : trois écritures en lot, pas une par paire.
    with transaction.atomic():
        if to_delete:
            query = Q()
            for low, high in to_delete:
                query |= Q(user_a_id=low, user_b_id=high)
            Match.objects.filter(query).delete()
        if to_save:
            Match.objects.bulk_create(to_save, ignore_conflicts=True)
        if to_update:
            Match.objects.bulk_update(to_update, ["score", "explanation", "computed_at"])

    kept = len(to_save) + len(to_update)
    logger.info("matches_recomputed user=%s kept=%s removed=%s", user_id, kept, len(to_delete))
    return kept


def add_feedback(*, match: Match, author, is_relevant: bool, comment: str = "") -> MatchFeedback:
    """Enregistre un retour sur un match (DL-39).

    Un seul retour par utilisateur et par match. Ce retour est conservé pour
    analyse et **n'influence pas** le score : l'algorithme reste explicable.
    """
    try:
        with transaction.atomic():
            return MatchFeedback.objects.create(
                match=match, author=author, is_relevant=is_relevant, comment=comment
            )
    except IntegrityError as error:
        raise Conflict("Vous avez déjà donné votre avis sur ce match.", code="duplicate_feedback") from error
