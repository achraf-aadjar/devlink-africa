"""Règles métier des échanges (DL-18)."""

from __future__ import annotations

from django.db import IntegrityError, transaction
from rest_framework import exceptions

from core.exceptions import Conflict

from .models import Exchange

#: Transitions autorisées, et qui a le droit de les demander.
#: Le destinataire répond, le demandeur annule, les deux concluent.
TRANSITIONS: dict[str, dict[str, str]] = {
    Exchange.Status.ACCEPTED: {"from": Exchange.Status.PROPOSED, "who": "partner"},
    Exchange.Status.DECLINED: {"from": Exchange.Status.PROPOSED, "who": "partner"},
    Exchange.Status.CANCELLED: {"from": Exchange.Status.PROPOSED, "who": "requester"},
    Exchange.Status.COMPLETED: {"from": Exchange.Status.ACCEPTED, "who": "both"},
}


def propose_exchange(*, requester, partner, type: str, message: str, skill=None) -> Exchange:
    """Crée une demande d'échange.

    Une seule demande en attente par paire d'utilisateurs : la contrainte est
    posée en base sur `pair_key`, donc elle tient même en cas de requêtes
    simultanées.
    """
    if requester.pk == partner.pk:
        raise exceptions.ValidationError(
            {"detail": ["Vous ne pouvez pas vous proposer un échange à vous-même."]}
        )

    try:
        with transaction.atomic():
            return Exchange.objects.create(
                requester=requester, partner=partner, type=type, message=message, skill=skill
            )
    except IntegrityError as error:
        raise Conflict(
            "Une demande est déjà en attente avec cette personne.", code="duplicate_request"
        ) from error


def change_status(*, exchange: Exchange, user, status: str) -> Exchange:
    """Applique un changement de statut, si le rôle et l'état le permettent."""
    rule = TRANSITIONS[status]

    if exchange.status != rule["from"]:
        raise Conflict(
            f"Impossible de passer de « {exchange.get_status_display()} » à « {status} ».",
            code="invalid_transition",
        )

    allowed_id = {
        "partner": exchange.partner_id,
        "requester": exchange.requester_id,
    }.get(rule["who"])
    if allowed_id is not None and user.pk != allowed_id:
        message = (
            "Seul le destinataire peut répondre à cette demande."
            if rule["who"] == "partner"
            else "Seul l'auteur de la demande peut l'annuler."
        )
        raise exceptions.PermissionDenied(message)

    exchange.status = status
    exchange.save(update_fields=["status", "updated_at"])
    return exchange
