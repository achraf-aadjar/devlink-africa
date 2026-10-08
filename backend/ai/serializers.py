"""Sérialiseurs des fonctions d'IA (DL-42 à DL-47)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictSerializer

TEXT_MAX_LENGTH = 4000


class AIStatusSerializer(serializers.Serializer):
    """Sortie de GET /ai/status/ : l'interface sait quoi proposer."""

    enabled = serializers.BooleanField()
    features = serializers.ListField(child=serializers.CharField())


class ExtractSkillsInputSerializer(StrictSerializer):
    text = serializers.CharField(max_length=TEXT_MAX_LENGTH)

    def validate_text(self, value: str) -> str:
        text = value.strip()
        if len(text) < 20:
            raise serializers.ValidationError(
                "Écrivez quelques phrases sur votre parcours pour que nous puissions vous aider."
            )
        return text


class SkillSuggestionSerializer(serializers.Serializer):
    skill = serializers.IntegerField()
    name = serializers.CharField()
    level = serializers.CharField(required=False)


class ExtractSkillsOutputSerializer(serializers.Serializer):
    suggestions = serializers.DictField(child=SkillSuggestionSerializer(many=True))


class NaturalSearchInputSerializer(StrictSerializer):
    query = serializers.CharField(max_length=500)

    def validate_query(self, value: str) -> str:
        query = value.strip()
        if not query:
            raise serializers.ValidationError("Décrivez ce que vous cherchez.")
        return query


class NaturalSearchOutputSerializer(serializers.Serializer):
    criteria = serializers.DictField(child=serializers.CharField())
    results = serializers.DictField()


class SummarizeInputSerializer(StrictSerializer):
    description = serializers.CharField(max_length=TEXT_MAX_LENGTH)

    def validate_description(self, value: str) -> str:
        description = value.strip()
        if len(description) < 50:
            raise serializers.ValidationError(
                "La description est déjà courte : un résumé n'apporterait rien."
            )
        return description


class SummarizeOutputSerializer(serializers.Serializer):
    summary = serializers.CharField()


class ExplainMatchInputSerializer(StrictSerializer):
    match = serializers.IntegerField(min_value=1)


class ExplainMatchOutputSerializer(serializers.Serializer):
    sentence = serializers.CharField()


class CopilotTurnSerializer(serializers.Serializer):
    """Un tour de l'historique envoyé par le navigateur : jamais stocké côté serveur."""

    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(max_length=1000, allow_blank=True)


class CopilotInputSerializer(StrictSerializer):
    message = serializers.CharField(max_length=1000)
    history = CopilotTurnSerializer(many=True, required=False, default=list)

    def validate_message(self, value: str) -> str:
        message = value.strip()
        if not message:
            raise serializers.ValidationError("Écrivez votre question pour DevLink Copilot.")
        return message

    def validate_history(self, value: list[dict]) -> list[dict]:
        # Borne large : la vraie limite (6 tours) vit dans ai/services.py,
        # celle-ci évite seulement une requête démesurée.
        return value[-20:]


class CopilotOutputSerializer(serializers.Serializer):
    reply = serializers.CharField()
