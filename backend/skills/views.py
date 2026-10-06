"""Vues des compétences (DL-15) et des preuves (DL-31)."""

from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers, status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsOwner

from . import services
from .models import Skill, SkillProof, UserSkill
from .selectors import list_catalog, list_user_skills
from .serializers import (
    SkillProofSerializer,
    SkillSerializer,
    UserSkillSerializer,
    UserSkillUpdateSerializer,
    UserSkillWriteSerializer,
)


class SkillCatalogView(ListAPIView):
    """GET /skills/ : le catalogue, public et paginé."""

    permission_classes = [AllowAny]
    serializer_class = SkillSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter("category", str, description="Filtre par catégorie."),
            OpenApiParameter("search", str, description="Recherche dans le nom."),
        ],
        summary="Lister le catalogue de compétences",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        category = self.request.query_params.get("category")
        if category and category not in Skill.Category.values:
            raise serializers.ValidationError(
                {"category": [f"Catégorie inconnue. Attendu parmi : {', '.join(Skill.Category.values)}."]}
            )
        return list_catalog(category=category, search=self.request.query_params.get("search"))


def _detail_payload(entry: UserSkill) -> dict:
    """Représentation d'une compétence déclarée, avec ses preuves."""
    data = UserSkillSerializer(entry).data
    data["proofs"] = SkillProofSerializer(entry.proofs.all(), many=True).data
    return data


class MySkillsView(APIView):
    """GET et POST /me/skills/."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSkillSerializer(many=True)}, summary="Lister mes compétences")
    def get(self, request):
        entries = list(list_user_skills(request.user))
        return Response(
            {
                "offered": UserSkillSerializer(
                    [e for e in entries if e.kind == UserSkill.Kind.OFFERED], many=True
                ).data,
                "wanted": UserSkillSerializer(
                    [e for e in entries if e.kind == UserSkill.Kind.WANTED], many=True
                ).data,
            }
        )

    @extend_schema(
        request=UserSkillWriteSerializer,
        responses={201: UserSkillSerializer},
        summary="Déclarer une compétence",
    )
    def post(self, request):
        data = UserSkillWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        entry = services.add_user_skill(user=request.user, **data.validated_data)
        return Response(_detail_payload(entry), status=status.HTTP_201_CREATED)


class MySkillDetailView(APIView):
    """PATCH et DELETE /me/skills/{id}/."""

    permission_classes = [IsAuthenticated, IsOwner]

    def get_object(self, pk: int) -> UserSkill:
        # Filtré sur l'utilisateur : la compétence d'autrui donne un 404.
        from django.shortcuts import get_object_or_404

        return get_object_or_404(UserSkill.objects.select_related("skill"), pk=pk, user=self.request.user)

    @extend_schema(
        request=UserSkillUpdateSerializer,
        responses={200: UserSkillSerializer},
        summary="Changer le niveau d'une compétence",
    )
    def patch(self, request, pk: int):
        entry = self.get_object(pk)
        data = UserSkillUpdateSerializer(data=request.data, partial=True)
        data.is_valid(raise_exception=True)

        entry = services.update_user_skill(entry=entry, level=data.validated_data["level"])
        return Response(_detail_payload(entry))

    @extend_schema(responses={204: None}, summary="Supprimer une compétence")
    def delete(self, request, pk: int):
        services.delete_user_skill(entry=self.get_object(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


class SkillProofsView(APIView):
    """GET et POST /me/skills/{user_skill_id}/proofs/ (DL-31)."""

    permission_classes = [IsAuthenticated]

    def get_user_skill(self, user_skill_id: int) -> UserSkill:
        from django.shortcuts import get_object_or_404

        return get_object_or_404(UserSkill, pk=user_skill_id, user=self.request.user)

    @extend_schema(responses={200: SkillProofSerializer(many=True)}, summary="Lister les preuves")
    def get(self, request, user_skill_id: int):
        entry = self.get_user_skill(user_skill_id)
        return Response(SkillProofSerializer(entry.proofs.all(), many=True).data)

    @extend_schema(
        request=SkillProofSerializer, responses={201: SkillProofSerializer}, summary="Ajouter une preuve"
    )
    def post(self, request, user_skill_id: int):
        entry = self.get_user_skill(user_skill_id)
        data = SkillProofSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        proof = services.add_proof(user_skill=entry, **data.validated_data)
        return Response(SkillProofSerializer(proof).data, status=status.HTTP_201_CREATED)


class SkillProofDetailView(APIView):
    """DELETE /me/skills/{user_skill_id}/proofs/{pk}/ (DL-31)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={204: None}, summary="Supprimer une preuve")
    def delete(self, request, user_skill_id: int, pk: int):
        from django.shortcuts import get_object_or_404

        proof = get_object_or_404(
            SkillProof, pk=pk, user_skill_id=user_skill_id, user_skill__user=request.user
        )
        proof.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
