"""Sérialiseurs des compétences (DL-15, DL-31)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictModelSerializer, StrictSerializer
from core.validators import validate_https_url

from .models import Skill, SkillEndorsement, SkillProof, UserSkill


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


class EndorserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    country = serializers.CharField()


class SkillEndorsementSerializer(serializers.Serializer):
    """Une validation, telle qu'elle s'affiche sous la compétence : qui, comment, quand."""

    id = serializers.IntegerField()
    by = serializers.SerializerMethodField()
    context = serializers.ChoiceField(choices=SkillEndorsement.Context.choices)
    comment = serializers.CharField()
    created_at = serializers.DateTimeField()

    def get_by(self, endorsement: SkillEndorsement) -> dict:
        endorser = endorsement.endorser
        profile = getattr(endorser, "profile", None)
        return {
            "id": endorser.pk,
            "full_name": endorser.full_name,
            "country": profile.country if profile else "",
        }


class UserSkillSerializer(serializers.ModelSerializer):
    """Compétence déclarée, avec sa compétence du catalogue développée."""

    skill = SkillSerializer(read_only=True)
    proofs_count = serializers.SerializerMethodField()
    endorsements = SkillEndorsementSerializer(many=True, read_only=True)

    class Meta:
        model = UserSkill
        fields = ("id", "skill", "kind", "level", "proofs_count", "endorsements")

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


class EndorsementWriteSerializer(StrictSerializer):
    user_skill = serializers.IntegerField(min_value=1)
    comment = serializers.CharField(max_length=280, required=False, allow_blank=True, default="")


class CandidateSkillSerializer(serializers.Serializer):
    user_skill = serializers.IntegerField()
    name = serializers.CharField()
    level = serializers.CharField()
    endorsement = serializers.IntegerField(
        allow_null=True, help_text="Ma validation, si je l'ai déjà donnée."
    )


class EndorsementCandidateSerializer(serializers.Serializer):
    """Une personne que je peux valider, et ses compétences validables."""

    user = EndorserSerializer()
    context = serializers.ChoiceField(choices=SkillEndorsement.Context.choices)
    skills = CandidateSkillSerializer(many=True)
