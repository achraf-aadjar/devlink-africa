"""Sérialiseurs des échanges (DL-18)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictSerializer
from skills.models import Skill
from skills.serializers import SkillSerializer

from .models import Exchange

MESSAGE_MAX_LENGTH = 1000


#: Statuts à partir desquels chacun voit le moyen de contact de l'autre.
CONTACT_VISIBLE_STATUSES = frozenset({Exchange.Status.ACCEPTED, Exchange.Status.COMPLETED})


class PartySerializer(serializers.Serializer):
    """Participant à un échange : jamais son adresse e-mail de connexion."""

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

    def to_representation(self, exchange):
        """Ajoute `contact` à chaque participant, rempli seulement une fois l'échange accepté.

        Tant que la demande n'est pas acceptée, personne ne voit le contact de
        l'autre : c'est l'acceptation qui vaut accord pour être joint. La liste
        des échanges ne renvoie que ceux de l'utilisateur, donc seuls les deux
        membres de la paire voient ces valeurs.
        """
        data = super().to_representation(exchange)
        visible = exchange.status in CONTACT_VISIBLE_STATUSES
        for role in ("requester", "partner"):
            profile = getattr(getattr(exchange, role), "profile", None) if visible else None
            data[role]["contact"] = (profile.contact or None) if profile else None
        return data


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
