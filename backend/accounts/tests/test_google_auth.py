"""Tests de la connexion « Continuer avec Google ».

On ne contacte jamais le vrai serveur de Google dans les tests : on simule
`verify_google_token`, qui est elle-même responsable de parler à Google (ce
découpage, c'est tout l'intérêt de `accounts/google_auth.py`).
"""

from unittest.mock import patch

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.google_auth import GoogleAuthUnavailable
from accounts.models import User

GOOGLE_AUTH = "/api/v1/auth/google/"
GOOGLE_CLIENT_ID = "/api/v1/auth/google/client-id/"

VERIFIED_INFO = {
    "sub": "109876543210",
    "email": "ada@example.org",
    "email_verified": True,
    "name": "Ada Lovelace",
}


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_client_id_endpoint_reflects_settings(client, settings):
    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    response = client.get(GOOGLE_CLIENT_ID)
    assert response.status_code == 200
    assert response.data["client_id"] == "abc.apps.googleusercontent.com"


@pytest.mark.django_db
def test_client_id_endpoint_is_empty_when_not_configured(client, settings):
    settings.GOOGLE_CLIENT_ID = ""
    response = client.get(GOOGLE_CLIENT_ID)
    assert response.data["client_id"] == ""


@pytest.mark.django_db
def test_google_auth_creates_an_account_on_first_sign_in(client, settings):
    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    with patch("accounts.views.verify_google_token", return_value=VERIFIED_INFO):
        response = client.post(GOOGLE_AUTH, {"credential": "un-jeton-google"}, format="json")

    assert response.status_code == 200
    assert response.data["user"]["email"] == "ada@example.org"
    assert response.data["user"]["full_name"] == "Ada Lovelace"
    assert "access" in response.data and "refresh" in response.data

    user = User.objects.get(email="ada@example.org")
    assert user.has_usable_password() is False
    assert hasattr(user, "profile")


@pytest.mark.django_db
def test_google_auth_logs_into_an_existing_account_by_email(client, settings):
    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    existing = User.objects.create_user(
        email="ada@example.org", password="mot-de-passe-solide-2026", full_name="Ada"
    )

    with patch("accounts.views.verify_google_token", return_value=VERIFIED_INFO):
        response = client.post(GOOGLE_AUTH, {"credential": "un-jeton-google"}, format="json")

    assert response.status_code == 200
    assert response.data["user"]["id"] == existing.pk
    # Le mot de passe existant n'est pas touché par une connexion Google.
    existing.refresh_from_db()
    assert existing.has_usable_password() is True
    assert User.objects.filter(email="ada@example.org").count() == 1


@pytest.mark.django_db
def test_google_auth_returns_503_when_not_configured(client, settings):
    settings.GOOGLE_CLIENT_ID = ""
    error = GoogleAuthUnavailable(
        "La connexion avec Google n'est pas configurée.", code="google_not_configured"
    )
    with patch("accounts.views.verify_google_token", side_effect=error):
        response = client.post(GOOGLE_AUTH, {"credential": "un-jeton-google"}, format="json")

    assert response.status_code == 503
    assert response.data["code"] == "google_not_configured"


@pytest.mark.django_db
def test_google_auth_rejects_an_invalid_token_with_400(client, settings):
    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    error = GoogleAuthUnavailable("Ce jeton Google n'a pas pu être vérifié.", code="google_token_invalid")
    with patch("accounts.views.verify_google_token", side_effect=error):
        response = client.post(GOOGLE_AUTH, {"credential": "falsifié"}, format="json")

    assert response.status_code == 400
    assert response.data["code"] == "google_token_invalid"


@pytest.mark.django_db
def test_google_auth_requires_a_credential(client, settings):
    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    response = client.post(GOOGLE_AUTH, {}, format="json")
    assert response.status_code == 400


def test_verify_google_token_rejects_an_unverified_email(settings):
    from accounts.google_auth import verify_google_token

    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    unverified = {**VERIFIED_INFO, "email_verified": False}
    with patch("accounts.google_auth.google_id_token.verify_oauth2_token", return_value=unverified):
        with pytest.raises(GoogleAuthUnavailable) as excinfo:
            verify_google_token("un-jeton-google")
    assert excinfo.value.code == "google_email_unverified"


def test_verify_google_token_without_client_id_is_unavailable(settings):
    from accounts.google_auth import verify_google_token

    settings.GOOGLE_CLIENT_ID = ""
    with pytest.raises(GoogleAuthUnavailable) as excinfo:
        verify_google_token("un-jeton-google")
    assert excinfo.value.code == "google_not_configured"


def test_verify_google_token_wraps_a_verification_failure(settings):
    """Signature invalide, jeton expiré, mauvaise audience... : google-auth lève ValueError."""
    from accounts.google_auth import verify_google_token

    settings.GOOGLE_CLIENT_ID = "abc.apps.googleusercontent.com"
    with patch(
        "accounts.google_auth.google_id_token.verify_oauth2_token",
        side_effect=ValueError("Token used too late"),
    ):
        with pytest.raises(GoogleAuthUnavailable) as excinfo:
            verify_google_token("un-jeton-expire")
    assert excinfo.value.code == "google_token_invalid"
