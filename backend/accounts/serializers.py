"""Sérialiseurs de l'authentification : validation des entrées uniquement.

Aucune règle métier ici (voir `accounts/services.py`), conformément à
l'architecture en couches : vue mince → serializer (validation) → service.
"""

from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.serializers import StrictSerializer

from .models import User

MIN_PASSWORD_LENGTH = 10


class UserSerializer(serializers.ModelSerializer):
    """Représentation de l'utilisateur connecté (jamais celle d'un tiers)."""

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "date_joined")
        read_only_fields = fields


class RegisterSerializer(StrictSerializer):
    """Entrée de POST /auth/register."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True,
        min_length=MIN_PASSWORD_LENGTH,
        max_length=128,
        trim_whitespace=False,
        error_messages={
            "min_length": f"Le mot de passe doit contenir au moins {MIN_PASSWORD_LENGTH} caractères."
        },
    )
    full_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default="")
    consent = serializers.BooleanField()

    def validate_email(self, value: str) -> str:
        return User.objects.normalize_email(value.strip()).lower()

    def validate_consent(self, value: bool) -> bool:
        # Loi sénégalaise n° 2008-12 : le consentement doit être explicite.
        if not value:
            raise serializers.ValidationError(
                "Vous devez accepter la politique de confidentialité pour créer un compte."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        # Validateurs Django (similarité avec l'email, mot de passe courant, etc.)
        candidate = User(email=attrs["email"], full_name=attrs.get("full_name", ""))
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error
        return attrs


class LoginSerializer(StrictSerializer):
    """Entrée de POST /auth/login."""

    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PasswordResetRequestSerializer(StrictSerializer):
    """Entrée de POST /auth/password-reset/."""

    email = serializers.EmailField(max_length=254)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class PasswordResetConfirmSerializer(StrictSerializer):
    """Entrée de POST /auth/password-reset/confirm/."""

    uid = serializers.CharField(max_length=64)
    token = serializers.CharField(max_length=128)
    password = serializers.CharField(
        write_only=True,
        min_length=MIN_PASSWORD_LENGTH,
        max_length=128,
        trim_whitespace=False,
        error_messages={
            "min_length": f"Le mot de passe doit contenir au moins {MIN_PASSWORD_LENGTH} caractères."
        },
    )


class GoogleAuthSerializer(StrictSerializer):
    """Entrée de POST /auth/google/ : le jeton d'identité émis par Google."""

    credential = serializers.CharField(max_length=4096, trim_whitespace=True)


class GoogleClientIdSerializer(serializers.Serializer):
    """Sortie de GET /auth/google/client-id/.

    L'identifiant client OAuth n'est pas un secret (Google le fait aussi
    circuler au navigateur pour afficher le bouton) : une chaîne vide signifie
    simplement que la connexion avec Google n'est pas configurée.
    """

    client_id = serializers.CharField(allow_blank=True)


class RefreshSerializer(StrictSerializer):
    """Entrée de POST /auth/refresh et de POST /auth/logout."""

    refresh = serializers.CharField(max_length=2048, trim_whitespace=True)


class TokenPairSerializer(serializers.Serializer):
    """Sortie de /auth/register et /auth/login (documentation OpenAPI)."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class AccessTokenSerializer(serializers.Serializer):
    """Sortie de /auth/refresh."""

    access = serializers.CharField()


class DeleteAccountSerializer(StrictSerializer):
    """Entrée de DELETE /me/delete/ : le mot de passe confirme l'intention."""

    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)


class ExportSerializer(StrictSerializer):
    """Sortie de GET /me/export/ : la copie des données de l'utilisateur."""

    exported_at = serializers.DateTimeField()
    user = serializers.DictField()
    profile = serializers.DictField()
    skills = serializers.ListField(child=serializers.DictField())
    projects = serializers.ListField(child=serializers.DictField())
    join_requests = serializers.ListField(child=serializers.DictField())
    exchanges = serializers.ListField(child=serializers.DictField())
    reports_made = serializers.ListField(child=serializers.DictField())
