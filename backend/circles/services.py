"""Règles métier des cercles d'échange.

Le pont entre la base et le moteur pur (`finder.py`) : on charge les profils,
on appelle le moteur, on enregistre ce que les membres décident.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import exceptions

from core.exceptions import Conflict
from matching.scoring import ProfileInput
from matching.services import _load_profiles, _load_skills, load_profile_input
from skills.models import UserSkill

from . import finder
from .models import Circle, CircleMember

User = get_user_model()

OPEN_STATUSES = (Circle.Status.PROPOSED, Circle.Status.ACTIVE)


def load_profiles(user_ids: list[int] | None = None) -> dict[int, ProfileInput]:
    """Profils du moteur pour ces utilisateurs, ou pour tous ceux qui ont déclaré
    une compétence. Deux requêtes, quel que soit le nombre d'utilisateurs."""
    if user_ids is None:
        user_ids = list(
            UserSkill.objects.filter(user__is_active=True).values_list("user_id", flat=True).distinct()
        )
    skills = _load_skills(user_ids)
    profiles = _load_profiles(user_ids)
    return {
        user_id: load_profile_input(user_id, skills_by_user=skills, profiles=profiles) for user_id in user_ids
    }


def suggest_circles(user, *, limit: int = finder.DEFAULT_LIMIT) -> list[finder.Circle]:
    """Cercles possibles pour l'utilisateur, hors ceux déjà ouverts."""
    profiles = load_profiles()
    open_keys = set(
        Circle.objects.filter(status__in=OPEN_STATUSES, members__user=user).values_list("key", flat=True)
    )
    circles = finder.find_circles_for(user.pk, profiles, limit=limit + len(open_keys))
    return [circle for circle in circles if circle.key not in open_keys][:limit]


def propose_circle(*, user, members: list[int]) -> Circle:
    """Enregistre un cercle proposé par l'un de ses membres.

    Les flèches sont recalculées sur les données du moment : une suggestion
    affichée il y a une heure n'est pas forcément encore valable. Le membre qui
    propose accepte d'office ; les autres doivent répondre.
    """
    if user.pk not in members:
        raise exceptions.ValidationError(
            {"members": ["Vous devez faire partie du cercle que vous proposez."]}
        )

    circle = finder.validate_circle(members, load_profiles(members))
    if circle is None:
        raise exceptions.ValidationError(
            {"members": ["Ce cercle n'est plus possible : les compétences des membres ont changé."]}
        )

    try:
        with transaction.atomic():
            record = Circle.objects.create(
                key=circle.key,
                score=circle.score,
                proposed_by=user,
                arrows=[
                    {
                        "teacher": arrow.teacher,
                        "learner": arrow.learner,
                        "skill": {"name": arrow.skill.name, "level": arrow.skill.level},
                    }
                    for arrow in circle.arrows
                ],
            )
            now = timezone.now()
            CircleMember.objects.bulk_create(
                CircleMember(
                    circle=record,
                    user_id=member,
                    position=position,
                    response=CircleMember.Response.ACCEPTED
                    if member == user.pk
                    else CircleMember.Response.PENDING,
                    responded_at=now if member == user.pk else None,
                )
                for position, member in enumerate(circle.members)
            )
    except IntegrityError as error:
        raise Conflict("Ce cercle est déjà proposé.", code="duplicate_circle") from error

    return record


def respond(*, circle: Circle, user, accept: bool) -> Circle:
    """Réponse d'un membre. Tous acceptent : le cercle devient actif. Un refus le clôt.

    Verrouillage de la ligne du cercle : deux membres qui répondent en même
    temps ne doivent pas laisser un cercle « proposé » alors que tous ont dit oui.
    """
    with transaction.atomic():
        circle = Circle.objects.select_for_update().get(pk=circle.pk)
        if circle.status != Circle.Status.PROPOSED:
            raise Conflict("Ce cercle n'attend plus de réponse.", code="invalid_transition")

        member = circle.members.filter(user=user).first()
        if member is None:
            raise exceptions.NotFound()
        if member.response != CircleMember.Response.PENDING:
            raise Conflict("Vous avez déjà répondu.", code="already_answered")

        now = timezone.now()
        member.response = CircleMember.Response.ACCEPTED if accept else CircleMember.Response.DECLINED
        member.responded_at = now
        member.save(update_fields=["response", "responded_at"])

        if not accept:
            circle.status = Circle.Status.DECLINED
        elif not circle.members.exclude(response=CircleMember.Response.ACCEPTED).exists():
            circle.status = Circle.Status.ACTIVE
            circle.activated_at = now
        circle.save(update_fields=["status", "activated_at", "updated_at"])

    return circle
