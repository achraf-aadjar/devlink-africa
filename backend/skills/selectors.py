"""Lectures des compétences (DL-15, DL-31)."""

from __future__ import annotations

from django.db.models import Count, Prefetch, QuerySet

from .models import Skill, SkillEndorsement, SkillProof, UserSkill


def endorsements_prefetch() -> Prefetch:
    """Validations d'une compétence, avec leur auteur : une requête pour toutes."""
    return Prefetch(
        "endorsements", queryset=SkillEndorsement.objects.select_related("endorser", "endorser__profile")
    )


def proofs_prefetch() -> Prefetch:
    """Preuves d'une compétence (titre, lien, description) : une requête pour toutes."""
    return Prefetch("proofs", queryset=SkillProof.objects.order_by("-created_at"))


def list_catalog(*, category: str | None = None, search: str | None = None) -> QuerySet[Skill]:
    """Catalogue filtrable par catégorie et par nom."""
    queryset = Skill.objects.all()
    if category:
        queryset = queryset.filter(category=category)
    if search:
        queryset = queryset.filter(name__icontains=search)
    return queryset


def list_user_skills(user) -> QuerySet[UserSkill]:
    """Compétences d'un utilisateur, avec le compte de preuves annoté.

    L'annotation évite une requête par compétence lors de la sérialisation.
    """
    return (
        UserSkill.objects.filter(user=user)
        .select_related("skill")
        .annotate(proofs_total=Count("proofs", distinct=True))
        .prefetch_related(endorsements_prefetch(), proofs_prefetch())
        .order_by("skill__name")
    )
