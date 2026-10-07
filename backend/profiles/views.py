"""Vues du profil (DL-14) : validation, service ou sélecteur, réponse."""

from __future__ import annotations

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .selectors import get_public_profile
from .serializers import MeSerializer, MeUpdateSerializer, PublicProfileSerializer
from .services import update_me


class MeView(APIView):
    """GET et PATCH /me/ : le profil de l'utilisateur connecté."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MeSerializer}, summary="Lire mon profil")
    def get(self, request):
        Profile.objects.get_or_create(user=request.user)
        request.user.refresh_from_db()
        return Response(MeSerializer(request.user).data)

    @extend_schema(request=MeUpdateSerializer, responses={200: MeSerializer}, summary="Modifier mon profil")
    def patch(self, request):
        data = MeUpdateSerializer(data=request.data, partial=True)
        data.is_valid(raise_exception=True)

        user = update_me(user=request.user, data=data.validated_data)
        return Response(MeSerializer(user).data, status=status.HTTP_200_OK)


class PublicProfileView(APIView):
    """GET /users/{id}/ : profil public, sans adresse e-mail."""

    permission_classes = [AllowAny]

    @extend_schema(responses={200: PublicProfileSerializer}, summary="Voir un profil public")
    def get(self, request, user_id: int):
        user = get_public_profile(user_id)
        return Response(PublicProfileSerializer(user).data)
