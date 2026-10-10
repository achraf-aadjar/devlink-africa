"""Vues de l'authentification : validation, appel au service, réponse (DL-03)."""

from __future__ import annotations

from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from core.throttling import AuthRateThrottle, PasswordResetRateThrottle

from . import services
from .google_auth import GoogleAuthUnavailable, verify_google_token
from .serializers import (
    AccessTokenSerializer,
    DeleteAccountSerializer,
    ExportSerializer,
    GoogleAuthSerializer,
    GoogleClientIdSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RefreshSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    """POST /auth/register : crée un compte et renvoie une paire de jetons."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=RegisterSerializer,
        responses={201: TokenPairSerializer},
        summary="Créer un compte",
    )
    def post(self, request):
        data = RegisterSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        payload = data.validated_data

        user = services.register_user(
            email=payload["email"],
            password=payload["password"],
            full_name=payload.get("full_name", ""),
        )
        body = {**services.issue_tokens(user), "user": UserSerializer(user).data}
        return Response(body, status=status.HTTP_201_CREATED)


class GoogleClientIdView(APIView):
    """GET /auth/google/client-id/ : l'interface sait si elle doit proposer le bouton."""

    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: GoogleClientIdSerializer},
        summary="Savoir si la connexion avec Google est configurée",
    )
    def get(self, request):
        return Response({"client_id": settings.GOOGLE_CLIENT_ID})


class GoogleAuthView(APIView):
    """POST /auth/google/ : connecte ou crée un compte depuis un jeton Google."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=GoogleAuthSerializer,
        responses={200: TokenPairSerializer},
        summary="Continuer avec Google",
    )
    def post(self, request):
        data = GoogleAuthSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        try:
            google_info = verify_google_token(data.validated_data["credential"])
        except GoogleAuthUnavailable as error:
            # Non configuré : la fonctionnalité est indisponible (503), pas une
            # erreur du client. Un jeton invalide ou non vérifié reste un 400 :
            # c'est la requête elle-même qui est en cause.
            code = (
                status.HTTP_503_SERVICE_UNAVAILABLE
                if error.code == "google_not_configured"
                else status.HTTP_400_BAD_REQUEST
            )
            return Response({"detail": error.reason, "code": error.code}, status=code)

        user = services.login_or_register_with_google(google_info=google_info)
        body = {**services.issue_tokens(user), "user": UserSerializer(user).data}
        return Response(body, status=status.HTTP_200_OK)


class LoginView(APIView):
    """POST /auth/login : vérifie les identifiants et renvoie les jetons."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=LoginSerializer,
        responses={200: TokenPairSerializer},
        summary="Se connecter",
    )
    def post(self, request):
        data = LoginSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        user = services.login_user(**data.validated_data)
        body = {**services.issue_tokens(user), "user": UserSerializer(user).data}
        return Response(body, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """POST /auth/password-reset/ : envoie un lien de réinitialisation par e-mail.

    Répond toujours 204, que l'adresse corresponde à un compte ou non.
    """

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    @extend_schema(
        request=PasswordResetRequestSerializer,
        responses={204: None},
        summary="Demander la réinitialisation du mot de passe",
    )
    def post(self, request):
        data = PasswordResetRequestSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        services.request_password_reset(email=data.validated_data["email"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetConfirmView(APIView):
    """POST /auth/password-reset/confirm/ : choisit un nouveau mot de passe."""

    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    @extend_schema(
        request=PasswordResetConfirmSerializer,
        responses={204: None},
        summary="Choisir un nouveau mot de passe",
    )
    def post(self, request):
        data = PasswordResetConfirmSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        services.confirm_password_reset(**data.validated_data)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RefreshView(TokenRefreshView):
    """POST /auth/refresh : échange un jeton de rafraîchissement contre un accès."""

    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(
        request=RefreshSerializer,
        responses={200: AccessTokenSerializer},
        summary="Renouveler le jeton d'accès",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """POST /auth/logout : révoque le jeton de rafraîchissement."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=RefreshSerializer, responses={204: None}, summary="Se déconnecter")
    def post(self, request):
        data = RefreshSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        services.logout_user(user=request.user, refresh_token=data.validated_data["refresh"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExportMyDataView(APIView):
    """GET /me/export/ : copie de mes données (droit d'accès, DL-40)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ExportSerializer}, summary="Exporter mes données")
    def get(self, request):
        return Response(services.export_user_data(user=request.user))


class DeleteAccountView(APIView):
    """DELETE /me/delete/ : effacement du compte (droit d'effacement, DL-40)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=DeleteAccountSerializer, responses={204: None}, summary="Supprimer mon compte")
    def delete(self, request):
        data = DeleteAccountSerializer(data=request.data)
        data.is_valid(raise_exception=True)

        services.delete_account(user=request.user, password=data.validated_data["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)
