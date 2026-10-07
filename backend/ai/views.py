"""Vues des fonctions d'IA (DL-41 à DL-47).

Toutes suivent la même règle : si l'IA est indisponible, on répond **503** avec
le code `ai_unavailable`, et l'interface propose le chemin classique. Jamais
d'erreur bloquante pour l'utilisateur.
"""

from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from matching.models import Match
from matching.serializers import oriented_explanation

from . import services
from .client import AIUnavailable, is_available
from .serializers import (
    AIStatusSerializer,
    ExplainMatchInputSerializer,
    ExplainMatchOutputSerializer,
    ExtractSkillsInputSerializer,
    ExtractSkillsOutputSerializer,
    NaturalSearchInputSerializer,
    NaturalSearchOutputSerializer,
    SummarizeInputSerializer,
    SummarizeOutputSerializer,
)

FEATURES = ["skill_extraction", "natural_search", "project_summary", "match_explanation"]


def _unavailable(error: AIUnavailable) -> Response:
    """Réponse 503 uniforme : l'interface sait alors proposer le repli."""
    return Response(
        {"detail": error.reason, "code": error.code},
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


class AIBaseView(APIView):
    """Base commune : authentification et limite de débit propre à l'IA (DL-41)."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai"


class AIStatusView(APIView):
    """GET /ai/status/ : l'interface adapte son affichage sans tâtonner."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: AIStatusSerializer}, summary="Savoir si les fonctions d'IA sont actives")
    def get(self, request):
        return Response({"enabled": is_available(), "features": FEATURES if is_available() else []})


class ExtractSkillsView(AIBaseView):
    """POST /ai/extract-skills/ : suggestions depuis un texte libre (DL-44)."""

    @extend_schema(
        request=ExtractSkillsInputSerializer,
        responses={200: ExtractSkillsOutputSerializer},
        summary="Proposer des compétences depuis un texte",
    )
    def post(self, request):
        data = ExtractSkillsInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        try:
            suggestions = services.extract_skills(data.validated_data["text"])
        except AIUnavailable as error:
            return _unavailable(error)

        # Rien n'est enregistré : l'utilisateur valide via /me/skills/.
        return Response({"suggestions": suggestions})


class NaturalSearchView(AIBaseView):
    """POST /ai/search/ : une phrase devient des critères (DL-45)."""

    @extend_schema(
        request=NaturalSearchInputSerializer,
        responses={200: NaturalSearchOutputSerializer},
        summary="Rechercher en langage naturel",
    )
    def post(self, request):
        data = NaturalSearchInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        try:
            criteria = services.parse_search_query(data.validated_data["query"])
        except AIUnavailable as error:
            return _unavailable(error)

        # On exécute la recherche classique avec ces critères : l'IA n'a servi
        # qu'à les deviner, et l'interface les affiche pour correction.
        from search.selectors import search_users
        from search.serializers import SearchUserSerializer

        found = search_users(**criteria)[:20]
        return Response(
            {
                "criteria": criteria,
                "results": {
                    "count": search_users(**criteria).count(),
                    "results": SearchUserSerializer(found, many=True).data,
                },
            }
        )


class SummarizeProjectView(AIBaseView):
    """POST /ai/summarize-project/ : résumé proposé au propriétaire (DL-46)."""

    @extend_schema(
        request=SummarizeInputSerializer,
        responses={200: SummarizeOutputSerializer},
        summary="Résumer la description d'un projet",
    )
    def post(self, request):
        data = SummarizeInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        try:
            summary = services.summarize_project(data.validated_data["description"])
        except AIUnavailable as error:
            return _unavailable(error)

        return Response({"summary": summary})


class ExplainMatchView(AIBaseView):
    """POST /ai/explain-match/ : une phrase en plus des raisons calculées (DL-47)."""

    @extend_schema(
        request=ExplainMatchInputSerializer,
        responses={200: ExplainMatchOutputSerializer},
        summary="Reformuler l'explication d'un match",
    )
    def post(self, request):
        data = ExplainMatchInputSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        # L'utilisateur doit faire partie de la paire, sinon 404.
        match = get_object_or_404(
            Match.objects.filter(Q(user_a=request.user) | Q(user_b=request.user)),
            pk=data.validated_data["match"],
        )
        oriented = oriented_explanation(match, request.user.pk)

        try:
            sentence = services.phrase_match_explanation(
                score=match.score,
                they_teach=[skill["name"] for skill in oriented["they_can_teach_you"]],
                you_teach=[skill["name"] for skill in oriented["you_can_teach_them"]],
            )
        except AIUnavailable as error:
            return _unavailable(error)

        return Response({"sentence": sentence})
