"""Vues du Dev Match (DL-24) et du retour sur match (DL-39)."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Match
from .selectors import get_match_for, list_matches
from .serializers import (
    MatchDetailSerializer,
    MatchFeedbackSerializer,
    MatchFeedbackWriteSerializer,
    MatchListSerializer,
)


class MatchListView(ListAPIView):
    """GET /matches/ : mes matchs, triés par score décroissant."""

    permission_classes = [IsAuthenticated]
    serializer_class = MatchListSerializer

    def get_queryset(self):
        # Pendant la génération du schéma, la requête n'a pas d'utilisateur.
        if not self.request.user.is_authenticated:
            return Match.objects.none()
        return list_matches(user=self.request.user)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "viewer_id": self.request.user.pk}

    @extend_schema(summary="Lister mes matchs")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class MatchDetailView(APIView):
    """GET /matches/{id}/ : le détail avec la répartition du score."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MatchDetailSerializer}, summary="Voir un match expliqué")
    def get(self, request, pk: int):
        match = get_match_for(user=request.user, match_id=pk)
        if match is None:
            # 404 et non 403 : on ne confirme pas l'existence du match d'autrui.
            from rest_framework.exceptions import NotFound

            raise NotFound()

        serializer = MatchDetailSerializer(match, context={"viewer_id": request.user.pk})
        return Response(serializer.data)


class MatchFeedbackView(APIView):
    """POST /matches/{id}/feedback/ : ce match était-il utile ? (DL-39)"""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=MatchFeedbackWriteSerializer,
        responses={201: MatchFeedbackSerializer},
        summary="Donner son avis sur un match",
    )
    def post(self, request, pk: int):
        match = get_object_or_404(list_matches(user=request.user), pk=pk)
        data = MatchFeedbackWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        feedback = services.add_feedback(match=match, author=request.user, **data.validated_data)
        return Response(MatchFeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)
