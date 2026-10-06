"""Lectures des matchs (DL-24)."""

from __future__ import annotations

from django.db.models import Q, QuerySet

from .models import Match


def list_matches(*, user) -> QuerySet[Match]:
    """Matchs d'un utilisateur, du meilleur au moins bon.

    Les deux côtés de la paire sont joints avec leur profil : la sérialisation
    ne déclenche aucune requête supplémentaire.
    """
    return (
        Match.objects.filter(Q(user_a=user) | Q(user_b=user))
        .select_related("user_a", "user_a__profile", "user_b", "user_b__profile")
        .order_by("-score", "-computed_at", "-id")
    )


def get_match_for(*, user, match_id: int) -> Match | None:
    """Un match dont l'utilisateur fait partie, avec ses retours préchargés."""
    return list_matches(user=user).prefetch_related("feedbacks").filter(pk=match_id).first()
