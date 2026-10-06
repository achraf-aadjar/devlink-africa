"""Règles métier des signalements (DL-32)."""

from __future__ import annotations

import logging

from django.db import IntegrityError, transaction
from rest_framework import serializers

from core.exceptions import Conflict

from .models import Report

audit = logging.getLogger("accounts.audit")


def create_report(*, reporter, target_type: str, target_id: int, reason: str, details: str = "") -> Report:
    """Enregistre un signalement. Un seul par personne et par cible."""
    if target_type == Report.TargetType.USER and target_id == reporter.pk:
        raise serializers.ValidationError({"detail": ["Vous ne pouvez pas vous signaler vous-même."]})

    try:
        with transaction.atomic():
            report = Report.objects.create(
                reporter=reporter,
                target_type=target_type,
                target_id=target_id,
                reason=reason,
                details=details,
            )
    except IntegrityError as error:
        raise Conflict("Vous avez déjà signalé cet élément.", code="duplicate_report") from error

    # Action sensible : tracée sans donnée personnelle (identifiants seulement).
    audit.info(
        "report_created reporter=%s target=%s#%s reason=%s",
        reporter.pk,
        target_type,
        target_id,
        reason,
    )
    return report
