"""Lectures des échanges (DL-18)."""

from __future__ import annotations

from django.db.models import Q, QuerySet

from .models import Exchange


def list_exchanges(*, user, direction: str | None = None, status: str | None = None) -> QuerySet[Exchange]:
    """Échanges d'un utilisateur. Il ne voit que les siens, dans les deux sens."""
    queryset = Exchange.objects.select_related("requester__profile", "partner__profile", "skill")

    if direction == "sent":
        queryset = queryset.filter(requester=user)
    elif direction == "received":
        queryset = queryset.filter(partner=user)
    else:
        queryset = queryset.filter(Q(requester=user) | Q(partner=user))

    if status:
        queryset = queryset.filter(status=status)

    return queryset
