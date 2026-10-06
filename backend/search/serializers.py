"""Sérialiseurs de la recherche (DL-25) et des pays (DL-38)."""

from __future__ import annotations

from rest_framework import serializers

from skills.models import UserSkill
from skills.serializers import SkillSerializer


class SearchUserSerializer(serializers.Serializer):
    """Résultat de recherche : jamais l'adresse e-mail."""

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    country = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_demo = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()
    offered_skills = serializers.SerializerMethodField()
    wanted_skills = serializers.SerializerMethodField()

    def _profile(self, user, field, default):
        profile = getattr(user, "profile", None)
        return getattr(profile, field) if profile else default

    def get_country(self, user) -> str:
        return self._profile(user, "country", "")

    def get_bio(self, user) -> str:
        return self._profile(user, "bio", "")

    def get_avatar_url(self, user) -> str:
        return self._profile(user, "avatar_url", "")

    def get_is_demo(self, user) -> bool:
        return self._profile(user, "is_demo", False)

    def get_availability(self, user) -> list[str]:
        return self._profile(user, "availability", [])

    def _skills(self, user, kind: str) -> list[dict]:
        # `user_skills` est préchargé par le sélecteur : aucune requête ici.
        return SkillSerializer(
            [entry.skill for entry in user.user_skills.all() if entry.kind == kind], many=True
        ).data

    def get_offered_skills(self, user) -> list[dict]:
        return self._skills(user, UserSkill.Kind.OFFERED)

    def get_wanted_skills(self, user) -> list[dict]:
        return self._skills(user, UserSkill.Kind.WANTED)


class CountrySerializer(serializers.Serializer):
    code = serializers.CharField()
    name = serializers.CharField()
    flag = serializers.CharField()
    developers_count = serializers.IntegerField()
    projects_count = serializers.IntegerField()


class TopSkillSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    count = serializers.IntegerField()


class CountryDetailSerializer(CountrySerializer):
    """Détail d'un pays : les compteurs, les technologies, et des aperçus."""

    top_skills = TopSkillSerializer(many=True)
    developers = SearchUserSerializer(many=True)
    projects = serializers.ListField(child=serializers.DictField())
