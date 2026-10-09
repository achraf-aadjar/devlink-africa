"""Lectures des cercles."""

from __future__ import annotations

from django.db.models import Prefetch, QuerySet

from .models import Circle, CircleMember


def _with_members(queryset: QuerySet[Circle]) -> QuerySet[Circle]:
    return queryset.prefetch_related(
        Prefetch("members", queryset=CircleMember.objects.select_related("user", "user__profile"))
    )


def list_circles(*, user, awaiting: bool = False) -> QuerySet[Circle]:
    """Les cercles dont l'utilisateur est membre. `awaiting` : ceux qui attendent sa réponse."""
    queryset = Circle.objects.filter(members__user=user)
    if awaiting:
        queryset = queryset.filter(
            status=Circle.Status.PROPOSED, members__user=user, members__response=CircleMember.Response.PENDING
        )
    return _with_members(queryset.distinct())


def get_circle_for(*, user, pk: int) -> Circle | None:
    """Un cercle, seulement si l'utilisateur en est membre (sinon 404, pas 403)."""
    return _with_members(Circle.objects.filter(pk=pk, members__user=user)).first()
