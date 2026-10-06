"""Vues du Project Hub (DL-16, DL-17)."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwnerOrReadOnly

from . import services
from .models import Project, ProjectJoinRequest
from .selectors import list_join_requests, list_projects
from .serializers import (
    JoinRequestDecisionSerializer,
    JoinRequestSerializer,
    JoinRequestWriteSerializer,
    ProjectSerializer,
    ProjectWriteSerializer,
)


def _validated_filters(params) -> dict:
    """Valide les filtres de la liste : une valeur hors énumération est une erreur."""
    status_filter = params.get("status")
    if status_filter and status_filter not in Project.Status.values:
        raise serializers.ValidationError(
            {"status": [f"Statut inconnu. Attendu parmi : {', '.join(Project.Status.values)}."]}
        )
    return {
        "status": status_filter,
        "skill": params.get("skill"),
        "country": params.get("country"),
        "search": params.get("q"),
        "owner_id": params.get("owner"),
    }


class ProjectListView(ListAPIView):
    """GET et POST /projects/."""

    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return list_projects(**_validated_filters(self.request.query_params))

    @extend_schema(
        parameters=[
            OpenApiParameter("status", str),
            OpenApiParameter("skill", str, description="Identifiant ou nom d'une compétence."),
            OpenApiParameter("country", str),
            OpenApiParameter("q", str, description="Recherche dans le titre et la description."),
            OpenApiParameter("owner", int),
        ],
        summary="Lister les projets",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        request=ProjectWriteSerializer, responses={201: ProjectSerializer}, summary="Créer un projet"
    )
    def post(self, request):
        data = ProjectWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        project = services.create_project(owner=request.user, **data.validated_data)
        return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    """GET, PATCH et DELETE /projects/{id}/."""

    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    owner_field = "owner"

    def get_object(self, pk: int) -> Project:
        project = get_object_or_404(
            Project.objects.select_related("owner", "owner__profile").prefetch_related("needs"), pk=pk
        )
        self.check_object_permissions(self.request, project)
        return project

    @extend_schema(responses={200: ProjectSerializer}, summary="Voir un projet")
    def get(self, request, pk: int):
        project = self.get_object(pk)
        payload = ProjectSerializer(project).data
        # Les candidatures ne sont visibles que par le propriétaire du projet.
        if request.user.is_authenticated and project.owner_id == request.user.pk:
            payload["join_requests"] = JoinRequestSerializer(
                list_join_requests(project=project), many=True
            ).data
        return Response(payload)

    @extend_schema(
        request=ProjectWriteSerializer, responses={200: ProjectSerializer}, summary="Modifier un projet"
    )
    def patch(self, request, pk: int):
        project = self.get_object(pk)
        data = ProjectWriteSerializer(instance=project, data=request.data, partial=True)
        data.is_valid(raise_exception=True)

        project = services.update_project(project=project, **data.validated_data)
        return Response(ProjectSerializer(project).data)

    @extend_schema(responses={204: None}, summary="Supprimer un projet")
    def delete(self, request, pk: int):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectJoinView(APIView):
    """POST /projects/{id}/join/ (DL-17)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=JoinRequestWriteSerializer,
        responses={201: JoinRequestSerializer},
        summary="Demander à rejoindre un projet",
    )
    def post(self, request, pk: int):
        project = get_object_or_404(Project, pk=pk)
        data = JoinRequestWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        join_request = services.request_to_join(
            project=project, applicant=request.user, message=data.validated_data["message"]
        )
        return Response(JoinRequestSerializer(join_request).data, status=status.HTTP_201_CREATED)


class ProjectJoinRequestsView(ListAPIView):
    """GET /projects/{id}/join-requests/ : réservé au propriétaire (DL-17)."""

    permission_classes = [IsAuthenticated]
    serializer_class = JoinRequestSerializer

    def get_queryset(self):
        # Pendant la génération du schéma, ni utilisateur ni paramètre d'URL.
        if getattr(self, "swagger_fake_view", False) or "pk" not in self.kwargs:
            return ProjectJoinRequest.objects.none()
        # Filtré sur le propriétaire : un projet qui n'est pas le mien donne 404.
        project = get_object_or_404(Project, pk=self.kwargs["pk"], owner=self.request.user)
        return list_join_requests(project=project)

    @extend_schema(summary="Lister les demandes reçues sur mon projet")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class JoinRequestDecisionView(APIView):
    """PATCH /join-requests/{id}/ : accepter ou refuser (DL-17)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=JoinRequestDecisionSerializer,
        responses={200: JoinRequestSerializer},
        summary="Accepter ou refuser une demande",
    )
    def patch(self, request, pk: int):
        data = JoinRequestDecisionSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        join_request = get_object_or_404(
            ProjectJoinRequest.objects.select_related("applicant", "project"),
            pk=pk,
            project__owner=request.user,
        )
        join_request = services.decide_join_request(
            join_request=join_request, status=data.validated_data["status"]
        )
        return Response(JoinRequestSerializer(join_request).data)
