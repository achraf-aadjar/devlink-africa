"""Sérialiseurs des signalements (DL-32)."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework import serializers

from core.serializers import StrictSerializer
from projects.models import Project

from .models import Report

DETAILS_MAX_LENGTH = 1000
User = get_user_model()


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("id", "target_type", "target_id", "reason", "details", "status", "created_at")
        read_only_fields = fields


class ReportWriteSerializer(StrictSerializer):
    """Entrée de POST /reports/."""

    target_type = serializers.ChoiceField(choices=Report.TargetType.choices)
    target_id = serializers.IntegerField(min_value=1)
    reason = serializers.ChoiceField(choices=Report.Reason.choices)
    details = serializers.CharField(
        max_length=DETAILS_MAX_LENGTH, required=False, allow_blank=True, default=""
    )

    def validate(self, attrs: dict) -> dict:
        """Vérifie que la cible existe réellement."""
        target_type, target_id = attrs["target_type"], attrs["target_id"]

        if target_type == Report.TargetType.USER:
            exists = User.objects.filter(pk=target_id, is_active=True).exists()
        else:
            exists = Project.objects.filter(pk=target_id).exists()

        if not exists:
            raise serializers.ValidationError({"target_id": ["Cette cible n'existe pas."]})

        return attrs
