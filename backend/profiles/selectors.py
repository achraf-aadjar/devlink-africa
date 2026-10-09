"""Lectures du profil (DL-14). Requêtes optimisées, aucune écriture."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404

from skills.models import UserSkill
from skills.selectors import endorsements_prefetch

User = get_user_model()


def get_public_profile(user_id: int):
    """Charge un utilisateur actif avec tout ce qu'affiche son profil public.

    Les compétences et les projets sont préchargés : la vue ne déclenche aucune
    requête supplémentaire, même avec beaucoup de compétences (pas de N+1).
    """
    skills = Prefetch(
        "user_skills",
        # proofs_total évite une requête par compétence pour compter les preuves.
        queryset=UserSkill.objects.select_related("skill")
        .annotate(proofs_total=Count("proofs", distinct=True))
        .prefetch_related(endorsements_prefetch())
        .order_by("skill__name"),
    )
    return get_object_or_404(
        User.objects.filter(is_active=True).select_related("profile").prefetch_related(skills, "projects"),
        pk=user_id,
    )
