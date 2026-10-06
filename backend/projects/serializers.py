"""Sérialiseurs du Project Hub (DL-16, DL-17)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictModelSerializer
from core.validators import validate_https_url
from skills.models import Skill
from skills.serializers import SkillSerializer

from .models import Project, ProjectJoinRequest

TITLE_MAX_LENGTH = 150
DESCRIPTION_MAX_LENGTH = 5000
MESSAGE_MAX_LENGTH = 1000


class ProjectOwnerSerializer(serializers.Serializer):
    """Auteur d'un projet : jamais son adresse e-mail."""

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    country = serializers.SerializerMethodField()
    is_demo = serializers.SerializerMethodField()

    def get_country(self, user) -> str:
        profile = getattr(user, "profile", None)
        return profile.country if profile else ""

    def get_is_demo(self, user) -> bool:
        profile = getattr(user, "profile", None)
        return profile.is_demo if profile else False


class ApplicantSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)


class JoinRequestSerializer(serializers.ModelSerializer):
    applicant = ApplicantSerializer(read_only=True)

    class Meta:
        model = ProjectJoinRequest
        fields = ("id", "project", "applicant", "message", "status", "created_at")
        read_only_fields = fields


class ProjectSerializer(serializers.ModelSerializer):
    """Lecture d'un projet."""

    needs = SkillSerializer(many=True, read_only=True)
    owner = ProjectOwnerSerializer(read_only=True)
    join_requests_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "title",
            "description",
            "status",
            "needs",
            "repo_url",
            "demo_url",
            "owner",
            "join_requests_count",
            "created_at",
            "updated_at",
        )

    def get_join_requests_count(self, project: Project) -> int:
        annotated = getattr(project, "pending_requests", None)
        if annotated is not None:
            return annotated
        return project.join_requests.filter(status=ProjectJoinRequest.Status.PENDING).count()


class ProjectWriteSerializer(StrictModelSerializer):
    """Création et modification d'un projet. Le propriétaire vient du jeton."""

    needs = serializers.PrimaryKeyRelatedField(queryset=Skill.objects.all(), many=True, required=False)
    title = serializers.CharField(max_length=TITLE_MAX_LENGTH)
    description = serializers.CharField(max_length=DESCRIPTION_MAX_LENGTH, required=False, allow_blank=True)

    class Meta:
        model = Project
        fields = ("title", "description", "status", "needs", "repo_url", "demo_url")

    def validate_title(self, value: str) -> str:
        title = value.strip()
        if not title:
            raise serializers.ValidationError("Le titre est obligatoire.")
        return title

    def validate_repo_url(self, value: str) -> str:
        return validate_https_url(value)

    def validate_demo_url(self, value: str) -> str:
        return validate_https_url(value)


class JoinRequestWriteSerializer(serializers.Serializer):
    """Entrée de POST /projects/{id}/join/."""

    message = serializers.CharField(max_length=MESSAGE_MAX_LENGTH)

    def validate_message(self, value: str) -> str:
        message = value.strip()
        if not message:
            raise serializers.ValidationError("Expliquez en quelques mots ce que vous apportez.")
        return message


class JoinRequestDecisionSerializer(serializers.Serializer):
    """Entrée de PATCH /join-requests/{id}/ : accepter ou refuser."""

    status = serializers.ChoiceField(
        choices=[ProjectJoinRequest.Status.ACCEPTED, ProjectJoinRequest.Status.DECLINED]
    )
