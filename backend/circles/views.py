"""Vues des cercles d'échange : validation, service ou sélecteur, réponse."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services
from .models import Circle
from .selectors import get_circle_for, list_circles
from .serializers import (
    CircleDecisionSerializer,
    CircleOutSerializer,
    CircleProposalSerializer,
    serialize_circle,
    serialize_suggestion,
)

User = get_user_model()


class CircleSuggestionsView(APIView):
    """GET /circles/suggestions/ : les cercles possibles pour moi, du meilleur au moins bon."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: CircleOutSerializer(many=True)}, summary="Suggérer des cercles d'échange")
    def get(self, request):
        circles = services.suggest_circles(request.user)
        member_ids = {member for circle in circles for member in circle.members}
        users = {user.pk: user for user in User.objects.filter(pk__in=member_ids).select_related("profile")}
        return Response({"results": [serialize_suggestion(circle, users) for circle in circles]})


class CircleListView(GenericAPIView):
    """GET /circles/ : mes cercles. POST /circles/ : proposer un cercle."""

    permission_classes = [IsAuthenticated]
    serializer_class = CircleOutSerializer
    # Seulement pour la génération du schéma : les vraies lectures passent par le sélecteur.
    queryset = Circle.objects.none()

    @extend_schema(
        parameters=[
            OpenApiParameter("awaiting", str, enum=["me"], description="Ceux qui attendent ma réponse.")
        ],
        responses={200: CircleOutSerializer(many=True)},
        summary="Lister mes cercles",
    )
    def get(self, request):
        queryset = list_circles(user=request.user, awaiting=request.query_params.get("awaiting") == "me")
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response([serialize_circle(circle) for circle in page])

    @extend_schema(
        request=CircleProposalSerializer, responses={201: CircleOutSerializer}, summary="Proposer un cercle"
    )
    def post(self, request):
        data = CircleProposalSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        circle = services.propose_circle(user=request.user, members=data.validated_data["members"])
        circle = get_circle_for(user=request.user, pk=circle.pk)
        return Response(serialize_circle(circle), status=status.HTTP_201_CREATED)


class CircleDetailView(APIView):
    """GET /circles/{id}/ : un de mes cercles. PATCH : accepter ou refuser."""

    permission_classes = [IsAuthenticated]

    def _get(self, request, pk: int):
        circle = get_circle_for(user=request.user, pk=pk)
        if circle is None:
            raise NotFound()
        return circle

    @extend_schema(responses={200: CircleOutSerializer}, summary="Voir un cercle")
    def get(self, request, pk: int):
        return Response(serialize_circle(self._get(request, pk)))

    @extend_schema(
        request=CircleDecisionSerializer, responses={200: CircleOutSerializer}, summary="Répondre à un cercle"
    )
    def patch(self, request, pk: int):
        data = CircleDecisionSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        circle = self._get(request, pk)
        services.respond(circle=circle, user=request.user, accept=data.validated_data["decision"] == "ACCEPT")
        return Response(serialize_circle(self._get(request, pk)))
