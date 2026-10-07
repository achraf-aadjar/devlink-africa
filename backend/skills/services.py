"""Écritures des compétences (DL-15, DL-31).

Toute modification des compétences déclenche le recalcul incrémental des matchs
de l'utilisateur concerné : c'est le critère d'acceptation de DL-15.
"""

from __future__ import annotations

from django.db import IntegrityError, transaction

from core.exceptions import Conflict
from matching.services import recompute_for_user

from .models import SkillProof, UserSkill


def add_user_skill(*, user, skill, kind: str, level: str) -> UserSkill:
    """Déclare une compétence. Lève Conflict si le triplet existe déjà."""
    try:
        with transaction.atomic():
            entry = UserSkill.objects.create(user=user, skill=skill, kind=kind, level=level)
    except IntegrityError as error:
        raise Conflict(
            "Vous avez déjà déclaré cette compétence dans cette catégorie.",
            code="duplicate_skill",
        ) from error

    recompute_for_user(user.pk)
    return entry


def update_user_skill(*, entry: UserSkill, level: str) -> UserSkill:
    """Change le niveau déclaré ; le score en dépend, d'où le recalcul."""
    entry.level = level
    entry.save(update_fields=["level"])
    recompute_for_user(entry.user_id)
    return entry


def delete_user_skill(*, entry: UserSkill) -> None:
    user_id = entry.user_id
    entry.delete()
    recompute_for_user(user_id)


def add_proof(*, user_skill: UserSkill, **fields) -> SkillProof:
    """Ajoute une preuve. Les preuves n'influent pas sur le score."""
    return SkillProof.objects.create(user_skill=user_skill, **fields)
