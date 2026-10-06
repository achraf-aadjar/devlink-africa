"""Sérialiseurs des échanges (DL-18)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictSerializer
from skills.models import Skill
from skills.serializers import SkillSerializer

from .models import Exchange

MESSAGE_MAX_LENGTH = 1000


class PartySerializer(serializers.Serializer):
    """Participant à un échange : jamais son adresse e-mail."""

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)


class ExchangeSerializer(serializers.ModelSerializer):
    requester = PartySerializer(read_only=True)
    partner = PartySerializer(read_only=True)
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = Exchange
        fields = (
            "id",
            "type",
            "status",
            "message",
            "skill",
            "requester",
            "partner",
            "scheduled_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ExchangeRequestSerializer(StrictSerializer):
    """Entrée de POST /matches/{id}/request/."""

    type = serializers.ChoiceField(choices=Exchange.Type.choices)
    message = serializers.CharField(max_length=MESSAGE_MAX_LENGTH)
    skill = serializers.PrimaryKeyRelatedField(queryset=Skill.objects.all(), required=False, allow_null=True)

    def validate_message(self, value: str) -> str:
        message = value.strip()
        if not message:
            raise serializers.ValidationError("Écrivez un mot d'introduction.")
        return message


class ExchangeDecisionSerializer(StrictSerializer):
    """Entrée de PATCH /exchanges/{id}/ : changement de statut."""

    status = serializers.ChoiceField(
        choices=[
            Exchange.Status.ACCEPTED,
            Exchange.Status.DECLINED,
            Exchange.Status.CANCELLED,
            Exchange.Status.COMPLETED,
        ]
    )
