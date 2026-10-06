"""Règles métier de l'authentification (DL-03).

Ce module ne connaît ni les requêtes HTTP ni les sérialiseurs : il reçoit des
valeurs simples et lève des exceptions d'API. Les vues restent minces.

Journalisation : on ne journalise jamais un mot de passe, un jeton ni une
adresse e-mail en clair (règle 6 du cahier des charges). Pour l'audit, l'adresse
est remplacée par une empreinte courte et non réversible.
"""

from __future__ import annotations

import hashlib
import logging

from django.contrib.auth import authenticate
from django.db import IntegrityError, transaction
from rest_framework import exceptions
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from core.exceptions import Conflict
from profiles.models import Profile

from .models import User

audit = logging.getLogger("accounts.audit")


def email_fingerprint(email: str) -> str:
    """Empreinte courte d'une adresse, pour l'audit sans donnée personnelle."""
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:12]


def issue_tokens(user: User) -> dict[str, str]:
    """Crée la paire de jetons JWT d'un utilisateur."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


@transaction.atomic
def register_user(*, email: str, password: str, full_name: str = "") -> User:
    """Crée un compte et son profil vide. Lève Conflict si l'email existe déjà."""
    if User.objects.filter(email=email).exists():
        raise Conflict("Cette adresse e-mail est déjà utilisée.", code="email_already_used")

    try:
        user = User.objects.create_user(email=email, password=password, full_name=full_name)
    except IntegrityError as error:
        # Course entre deux inscriptions simultanées sur la même adresse.
        raise Conflict("Cette adresse e-mail est déjà utilisée.", code="email_already_used") from error

    Profile.objects.create(user=user)
    audit.info("register_success user=%s", user.pk)
    return user


def login_user(*, email: str, password: str) -> User:
    """Vérifie les identifiants. Lève AuthenticationFailed si invalides.

    La réponse est volontairement identique qu'il s'agisse d'une adresse
    inconnue, d'un mot de passe faux ou d'un compte désactivé, pour ne pas
    permettre l'énumération des comptes.
    """
    user = authenticate(username=email, password=password)
    if user is None or not user.is_active:
        audit.info("login_failed email_fp=%s", email_fingerprint(email))
        raise exceptions.AuthenticationFailed(
            "Adresse e-mail ou mot de passe incorrect.", code="invalid_credentials"
        )
    audit.info("login_success user=%s", user.pk)
    return user


def logout_user(*, user: User, refresh_token: str) -> None:
    """Révoque le jeton de rafraîchissement (liste noire simplejwt)."""
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as error:
        raise exceptions.ValidationError(
            {"refresh": ["Ce jeton de rafraîchissement est invalide ou déjà révoqué."]}
        ) from error
    audit.info("logout user=%s", user.pk)
