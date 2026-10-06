"""Sérialiseurs des compétences (DL-15, DL-31)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictModelSerializer
from core.validators import validate_https_url

from .models import Skill, SkillProof, UserSkill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "category")


class SkillProofSerializer(StrictModelSerializer):
    class Meta:
        model = SkillProof
        fields = ("id", "kind", "title", "url", "description", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_url(self, value: str) -> str:
        return validate_https_url(value)


class UserSkillSerializer(serializers.ModelSerializer):
    """Compétence déclarée, avec sa compétence du catalogue développée."""

    skill = SkillSerializer(read_only=True)
    proofs_count = serializers.SerializerMethodField()

    class Meta:
        model = UserSkill
        fields = ("id", "skill", "kind", "level", "proofs_count")

    def get_proofs_count(self, user_skill: UserSkill) -> int:
        # Annoté par le sélecteur quand la liste est chargée en lot.
        annotated = getattr(user_skill, "proofs_total", None)
        if annotated is not None:
            return annotated
        return user_skill.proofs.count()


class UserSkillWriteSerializer(StrictModelSerializer):
    """Entrée de POST /me/skills/.

    `level` est optionnel : un souhait d'apprentissage part naturellement de
    BEGINNER (voir docs/api.md § 5).
    """

    skill = serializers.PrimaryKeyRelatedField(queryset=Skill.objects.all())
    kind = serializers.ChoiceField(choices=UserSkill.Kind.choices)
    level = serializers.ChoiceField(
        choices=UserSkill.Level.choices, required=False, default=UserSkill.Level.BEGINNER
    )

    class Meta:
        model = UserSkill
        fields = ("skill", "kind", "level")


class UserSkillUpdateSerializer(StrictModelSerializer):
    """Entrée de PATCH /me/skills/{id}/ : seul le niveau est modifiable."""

    class Meta:
        model = UserSkill
        fields = ("level",)
