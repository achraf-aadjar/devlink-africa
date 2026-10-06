"""Vues des signalements (DL-32)."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import services
from .serializers import ReportSerializer, ReportWriteSerializer


class ReportView(APIView):
    """POST /reports/ : signaler un profil ou un projet."""

    permission_classes = [IsAuthenticated]
    # Limite dédiée : un signalement est vite détourné en outil de harcèlement.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "reports"

    @extend_schema(
        request=ReportWriteSerializer,
        responses={201: ReportSerializer},
        summary="Signaler un profil ou un projet",
    )
    def post(self, request):
        data = ReportWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        report = services.create_report(reporter=request.user, **data.validated_data)
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)
