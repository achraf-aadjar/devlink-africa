import logging

from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from exchanges.serializers import ExchangeSerializer
from matching.serializers import MatchListSerializer
from projects.serializers import JoinRequestSerializer, ProjectSerializer

from .selectors import dashboard_for
from .serializers import DashboardSerializer

logger = logging.getLogger(__name__)


class HealthView(APIView):
    """Sonde publique de disponibilité (DL-30).

    Sans paramètre : réponse minimale, utilisée par la surveillance externe.
    Avec `?detail=1` : vérifie aussi la base et les migrations, et répond 503 si
    une dépendance est indisponible.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        parameters=[
            OpenApiParameter("detail", bool, description="Ajoute l'état des dépendances."),
        ],
        responses=inline_serializer(
            "Health",
            {"status": serializers.CharField(), "version": serializers.CharField()},
        ),
        summary="Vérifier la disponibilité",
    )
    def get(self, request):
        payload = {"status": "ok", "version": settings.API_VERSION}

        if request.query_params.get("detail") not in (None, "", "0", "false"):
            checks = self._dependency_checks()
            payload["checks"] = checks
            if not all(check["ok"] for check in checks.values()):
                payload["status"] = "degraded"
                return Response(payload, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(payload)

    def _dependency_checks(self) -> dict:
        """État de la base et des migrations. Aucune donnée sensible exposée."""
        database = {"ok": False, "detail": "non vérifiée"}
        migrations = {"ok": False, "detail": "non vérifiées"}

        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            database = {"ok": True, "detail": connection.vendor}
        except Exception:
            # On ne renvoie jamais le détail de l'erreur : il peut contenir
            # l'hôte, l'utilisateur ou le nom de la base.
            logger.exception("health_database_unavailable")
            database = {"ok": False, "detail": "indisponible"}

        if database["ok"]:
            try:
                plan = MigrationExecutor(connection).migration_plan(
                    MigrationExecutor(connection).loader.graph.leaf_nodes()
                )
                migrations = {
                    "ok": not plan,
                    "detail": "à jour" if not plan else f"{len(plan)} migration(s) en attente",
                }
            except Exception:
                logger.exception("health_migrations_unavailable")
                migrations = {"ok": False, "detail": "indéterminées"}

        return {"database": database, "migrations": migrations}


class DashboardView(APIView):
    """GET /dashboard/ : tout l'écran d'accueil connecté en un appel (DL-28)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: DashboardSerializer}, summary="Lire mon tableau de bord")
    def get(self, request):
        data = dashboard_for(request.user)
        context = {"viewer_id": request.user.pk}

        return Response(
            {
                "profile_completeness": data["profile_completeness"],
                "has_contact": data["has_contact"],
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
