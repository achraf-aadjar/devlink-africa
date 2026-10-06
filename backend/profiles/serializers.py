"""Sérialiseurs du profil (DL-14)."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictModelSerializer, StrictSerializer
from core.validators import EnumListField, validate_country, validate_https_url
from skills.serializers import UserSkillSerializer

from .models import AVAILABILITY_CHOICES, DOMAIN_CHOICES, Profile

BIO_MAX_LENGTH = 1000


class ProfileSerializer(StrictModelSerializer):
    """Profil privé, avec son taux de complétude."""

    availability = EnumListField(AVAILABILITY_CHOICES)
    domains = EnumListField(DOMAIN_CHOICES)
    completeness = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            "country",
            "bio",
            "availability",
            "domains",
            "avatar_url",
            "is_demo",
            "completeness",
        )
        read_only_fields = ("is_demo", "completeness")
        extra_kwargs = {"bio": {"max_length": BIO_MAX_LENGTH, "allow_blank": True}}

    def get_completeness(self, profile: Profile) -> int:
        return profile.completeness()

    def validate_country(self, value: str) -> str:
        return validate_country(value)

    def validate_avatar_url(self, value: str) -> str:
        return validate_https_url(value)


class MeSerializer(StrictSerializer):
    """Vue privée complète : l'utilisateur et son profil."""

    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(read_only=True)
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    profile = ProfileSerializer(read_only=True)


class MeUpdateSerializer(StrictSerializer):
    """Entrée de PATCH /me/ : les champs du compte et ceux du profil à plat."""

    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    country = serializers.CharField(max_length=2, required=False, allow_blank=True)
    bio = serializers.CharField(max_length=BIO_MAX_LENGTH, required=False, allow_blank=True)
    availability = EnumListField(AVAILABILITY_CHOICES)
    domains = EnumListField(DOMAIN_CHOICES)
    avatar_url = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate_country(self, value: str) -> str:
        return validate_country(value)

    def validate_avatar_url(self, value: str) -> str:
        return validate_https_url(value)


class PublicProfileSerializer(serializers.Serializer):
    """Profil public : **jamais** l'adresse e-mail (DL-14).

    Les champs du profil sont remontés à plat depuis la relation, pour que le
    frontend n'ait pas à descendre dans un objet imbriqué.
    """

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    country = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    domains = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_demo = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    @staticmethod
    def _profile_value(user, field, default):
        profile = getattr(user, "profile", None)
        return getattr(profile, field) if profile else default

    def get_country(self, user) -> str:
        return self._profile_value(user, "country", "")

    def get_bio(self, user) -> str:
        return self._profile_value(user, "bio", "")

    def get_availability(self, user) -> list[str]:
        return self._profile_value(user, "availability", [])

    def get_domains(self, user) -> list[str]:
        return self._profile_value(user, "domains", [])

    def get_avatar_url(self, user) -> str:
        return self._profile_value(user, "avatar_url", "")

    def get_is_demo(self, user) -> bool:
        return self._profile_value(user, "is_demo", False)

    def get_skills(self, user) -> dict:
        # `user_skills` est préchargé par le sélecteur : pas de requête ici.
        skills = list(user.user_skills.all())
        return {
            "offered": UserSkillSerializer([s for s in skills if s.kind == "OFFERED"], many=True).data,
            "wanted": UserSkillSerializer([s for s in skills if s.kind == "WANTED"], many=True).data,
        }

    def get_projects(self, user) -> list[dict]:
        return [
            {"id": project.pk, "title": project.title, "status": project.status}
            for project in user.projects.all()
        ]
