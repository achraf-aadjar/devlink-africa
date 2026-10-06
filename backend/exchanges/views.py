"""Vues des échanges (DL-18)."""

from __future__ import annotations

from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from matching.models import Match

from . import services
from .models import Exchange
from .selectors import list_exchanges
from .serializers import ExchangeDecisionSerializer, ExchangeRequestSerializer, ExchangeSerializer

DIRECTIONS = ("sent", "received")


class ExchangeRequestFromMatchView(APIView):
    """POST /matches/{match_id}/request/ : proposer un échange à son match."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ExchangeRequestSerializer,
        responses={201: ExchangeSerializer},
        summary="Proposer un échange",
    )
    def post(self, request, match_id: int):
        # L'utilisateur doit faire partie de la paire, sinon 404.
        match = get_object_or_404(
            Match.objects.filter(Q(user_a=request.user) | Q(user_b=request.user)), pk=match_id
        )
        partner = match.user_b if match.user_a_id == request.user.pk else match.user_a

        data = ExchangeRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        exchange = services.propose_exchange(requester=request.user, partner=partner, **data.validated_data)
        return Response(ExchangeSerializer(exchange).data, status=status.HTTP_201_CREATED)


class ExchangeListView(ListAPIView):
    """GET /exchanges/ : mes échanges, reçus et envoyés."""

    permission_classes = [IsAuthenticated]
    serializer_class = ExchangeSerializer

    def get_queryset(self):
        params = self.request.query_params
        direction = params.get("direction")
        if direction and direction not in DIRECTIONS:
            raise serializers.ValidationError(
                {"direction": [f"Valeur attendue parmi : {', '.join(DIRECTIONS)}."]}
            )
        status_filter = params.get("status")
        if status_filter and status_filter not in Exchange.Status.values:
            raise serializers.ValidationError(
                {"status": [f"Statut inconnu. Attendu parmi : {', '.join(Exchange.Status.values)}."]}
            )
        return list_exchanges(user=self.request.user, direction=direction, status=status_filter)

    @extend_schema(
        parameters=[
            OpenApiParameter("direction", str, enum=DIRECTIONS),
            OpenApiParameter("status", str, enum=Exchange.Status.values),
        ],
        summary="Lister mes échanges",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ExchangeDetailView(APIView):
    """PATCH /exchanges/{id}/ : répondre, annuler ou conclure."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ExchangeDecisionSerializer,
        responses={200: ExchangeSerializer},
        summary="Changer le statut d'un échange",
    )
    def patch(self, request, pk: int):
        data = ExchangeDecisionSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        exchange = get_object_or_404(
            Exchange.objects.filter(Q(requester=request.user) | Q(partner=request.user)).select_related(
                "requester", "partner", "skill"
            ),
            pk=pk,
        )
        exchange = services.change_status(
            exchange=exchange, user=request.user, status=data.validated_data["status"]
        )
        return Response(ExchangeSerializer(exchange).data)
