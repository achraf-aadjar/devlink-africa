"""Vues de la recherche (DL-25) et de l'exploration par pays (DL-38)."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.validators import ALLOWED_COUNTRIES
from projects.models import Project
from projects.serializers import ProjectSerializer
from skills.models import UserSkill

from .selectors import (
    ALLOWED_AVAILABILITY,
    ALLOWED_DOMAINS,
    all_countries,
    country_detail,
    list_countries,
    search_projects,
    search_users,
)
from .serializers import CountryDetailSerializer, CountrySerializer, SearchUserSerializer


def _check_choice(value: str | None, allowed, field: str) -> str | None:
    """Valide un paramètre contraint à une liste. Une valeur inconnue est une erreur."""
    if value and value not in allowed:
        raise serializers.ValidationError(
            {field: [f"Valeur inconnue. Attendu parmi : {', '.join(sorted(allowed))}."]}
        )
    return value


def _check_country(value: str | None) -> str | None:
    if value and value.upper() not in ALLOWED_COUNTRIES:
        raise serializers.ValidationError({"country": ["Code pays inconnu."]})
    return value


def _parse_bool(value: str | None) -> bool | None:
    if value is None:
        return None
    return value.strip().lower() in {"1", "true", "yes", "oui"}


class UserSearchView(ListAPIView):
    """GET /search/users/ : recherche de développeurs, publique."""

    permission_classes = [AllowAny]
    serializer_class = SearchUserSerializer

    def get_queryset(self):
        params = self.request.query_params
        return search_users(
            q=params.get("q"),
            country=_check_country(params.get("country")),
            skill=params.get("skill"),
            skill_wanted=params.get("skill_wanted"),
            level=_check_choice(params.get("level"), UserSkill.Level.values, "level"),
            availability=_check_choice(params.get("availability"), ALLOWED_AVAILABILITY, "availability"),
            domain=_check_choice(params.get("domain"), ALLOWED_DOMAINS, "domain"),
            is_demo=_parse_bool(params.get("is_demo")),
        )

    @extend_schema(
        parameters=[
            OpenApiParameter("q", str, description="Recherche dans le nom et la biographie."),
            OpenApiParameter("country", str),
            OpenApiParameter("skill", str, description="Compétence proposée (identifiant ou nom)."),
            OpenApiParameter("skill_wanted", str, description="Compétence recherchée."),
            OpenApiParameter("level", str, enum=UserSkill.Level.values),
            OpenApiParameter("availability", str, enum=sorted(ALLOWED_AVAILABILITY)),
            OpenApiParameter("domain", str, enum=sorted(ALLOWED_DOMAINS)),
            OpenApiParameter("is_demo", bool),
        ],
        summary="Rechercher des développeurs",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ProjectSearchView(ListAPIView):
    """GET /search/projects/ : recherche de projets, publique."""

    permission_classes = [AllowAny]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        params = self.request.query_params
        return search_projects(
            q=params.get("q"),
            country=_check_country(params.get("country")),
            skill=params.get("skill"),
            status=_check_choice(params.get("status"), Project.Status.values, "status"),
        )

    @extend_schema(
        parameters=[
            OpenApiParameter("q", str),
            OpenApiParameter("country", str),
            OpenApiParameter("skill", str),
            OpenApiParameter("status", str, enum=Project.Status.values),
        ],
        summary="Rechercher des projets",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class CountryListView(APIView):
    """GET /countries/ : pays représentés sur la plateforme (DL-38)."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: CountrySerializer(many=True)}, summary="Lister les pays")
    def get(self, request):
        return Response({"results": CountrySerializer(list_countries(), many=True).data})


class CountryChoicesView(APIView):
    """GET /countries/all/ : tous les pays autorisés, pour les formulaires."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: CountrySerializer(many=True)}, summary="Lister les pays sélectionnables")
    def get(self, request):
        return Response({"results": all_countries()})


class CountryDetailView(APIView):
    """GET /countries/{code}/ : développeurs, projets et technologies (DL-38)."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: CountryDetailSerializer}, summary="Explorer un pays")
    def get(self, request, code: str):
        _check_country(code)
        detail = country_detail(code)

        payload = {
            "code": detail["code"],
            "name": detail["name"],
            "flag": detail["flag"],
            "developers_count": detail["developers_count"],
            "projects_count": detail["projects_count"],
            "top_skills": detail["top_skills"],
            "developers": SearchUserSerializer(detail["developers"], many=True).data,
            "projects": ProjectSerializer(detail["projects"], many=True).data,
        }
        return Response(payload)
