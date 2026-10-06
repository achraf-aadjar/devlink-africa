from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from exchanges.serializers import ExchangeSerializer
from matching.serializers import MatchListSerializer
from projects.serializers import JoinRequestSerializer, ProjectSerializer

from .selectors import dashboard_for


class HealthView(APIView):
    """Public liveness probe."""

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        responses=inline_serializer(
            "Health",
            {"status": serializers.CharField(), "version": serializers.CharField()},
        )
    )
    def get(self, request):
        return Response({"status": "ok", "version": settings.API_VERSION})


class DashboardView(APIView):
    """GET /dashboard/ : tout l'écran d'accueil connecté en un appel (DL-28)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Lire mon tableau de bord")
    def get(self, request):
        data = dashboard_for(request.user)
        context = {"viewer_id": request.user.pk}

        return Response(
            {
                "profile_completeness": data["profile_completeness"],
                "recommended_matches": MatchListSerializer(data["matches"], many=True, context=context).data,
                "pending_exchanges": {
                    "received": data["exchanges_received"],
                    "sent": data["exchanges_sent"],
                    "items": ExchangeSerializer(data["exchanges"], many=True).data,
                },
                "pending_join_requests": {
                    "count": data["join_requests_count"],
                    "items": JoinRequestSerializer(data["join_requests"], many=True).data,
                },
                "my_projects": ProjectSerializer(data["projects"], many=True).data,
                "counters": data["counters"],
            }
        )
