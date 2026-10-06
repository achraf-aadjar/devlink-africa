"""Tests de DL-03 : inscription, connexion, rafraîchissement, déconnexion.

Les critères d'acceptation du ticket sont repris un par un :
- email unique (409 si doublon), mot de passe d'au moins 10 caractères ;
- limitation de débit sur /auth/* (5 essais par minute) ;
- aucun mot de passe ni jeton dans les journaux ;
- cas passants et cas d'erreur.
"""

import logging

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from accounts.models import User

REGISTER = "/api/v1/auth/register/"
LOGIN = "/api/v1/auth/login/"
REFRESH = "/api/v1/auth/refresh/"
LOGOUT = "/api/v1/auth/logout/"

VALID_PAYLOAD = {
    "email": "ada@example.org",
    "password": "mot-de-passe-solide-2026",
    "full_name": "Ada Lovelace",
    "consent": True,
}


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Le throttling DRF s'appuie sur le cache : on l'isole entre les tests."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


# --- Inscription ------------------------------------------------------------


@pytest.mark.django_db
def test_register_creates_user_and_returns_tokens(client):
    response = client.post(REGISTER, VALID_PAYLOAD, format="json")

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "ada@example.org"
    assert body["user"]["full_name"] == "Ada Lovelace"
    assert body["access"] and body["refresh"]
    assert "password" not in body["user"]

    user = User.objects.get(email="ada@example.org")
    assert user.check_password(VALID_PAYLOAD["password"])
    assert user.password.startswith("argon2")


@pytest.mark.django_db
def test_register_creates_the_related_profile(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    user = User.objects.get(email="ada@example.org")
    assert user.profile.pk is not None
    assert user.profile.is_demo is False


@pytest.mark.django_db
def test_register_normalises_the_email(client):
    response = client.post(REGISTER, {**VALID_PAYLOAD, "email": "  Ada@Example.ORG "}, format="json")

    assert response.status_code == 201
    assert User.objects.filter(email="ada@example.org").exists()


@pytest.mark.django_db
def test_register_rejects_a_duplicate_email_with_409(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    response = client.post(REGISTER, {**VALID_PAYLOAD, "email": "ADA@example.org"}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "email_already_used"
    assert User.objects.filter(email="ada@example.org").count() == 1


@pytest.mark.django_db
@pytest.mark.parametrize("password", ["court", "123456789", "abc"])
def test_register_rejects_a_password_shorter_than_10_characters(client, password):
    response = client.post(REGISTER, {**VALID_PAYLOAD, "password": password}, format="json")

    assert response.status_code == 400
    assert "password" in response.json()["errors"]
    assert not User.objects.exists()


@pytest.mark.django_db
def test_register_rejects_a_password_too_close_to_the_email(client):
    response = client.post(REGISTER, {**VALID_PAYLOAD, "password": "ada@example.org"}, format="json")

    assert response.status_code == 400
    assert "password" in response.json()["errors"]


@pytest.mark.django_db
@pytest.mark.parametrize("email", ["pas-un-email", "", "a@", "a@b"])
def test_register_rejects_an_invalid_email(client, email):
    response = client.post(REGISTER, {**VALID_PAYLOAD, "email": email}, format="json")

    assert response.status_code == 400
    assert "email" in response.json()["errors"]


@pytest.mark.django_db
def test_register_requires_the_privacy_consent(client):
    """Loi sénégalaise n° 2008-12 : le consentement doit être explicite."""
    response = client.post(REGISTER, {**VALID_PAYLOAD, "consent": False}, format="json")

    assert response.status_code == 400
    assert "consent" in response.json()["errors"]
    assert not User.objects.exists()


@pytest.mark.django_db
def test_register_rejects_unknown_fields(client):
    response = client.post(REGISTER, {**VALID_PAYLOAD, "is_staff": True, "is_superuser": True}, format="json")

    assert response.status_code == 400
    assert not User.objects.filter(is_staff=True).exists()


# --- Connexion --------------------------------------------------------------


@pytest.mark.django_db
def test_login_returns_tokens(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    response = client.post(
        LOGIN, {"email": VALID_PAYLOAD["email"], "password": VALID_PAYLOAD["password"]}, format="json"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["access"] and body["refresh"]
    assert body["user"]["email"] == "ada@example.org"


@pytest.mark.django_db
def test_login_is_case_insensitive_on_the_email(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    response = client.post(
        LOGIN, {"email": "ADA@Example.org", "password": VALID_PAYLOAD["password"]}, format="json"
    )

    assert response.status_code == 200


@pytest.mark.django_db
def test_login_rejects_a_wrong_password_with_401(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    response = client.post(
        LOGIN, {"email": VALID_PAYLOAD["email"], "password": "mauvais-mot-de-passe"}, format="json"
    )

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


@pytest.mark.django_db
def test_login_of_an_unknown_email_gives_the_same_answer_as_a_wrong_password(client):
    """Le message ne doit pas révéler si l'adresse existe (énumération de comptes)."""
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    unknown = client.post(
        LOGIN, {"email": "inconnu@example.org", "password": "mot-de-passe-solide-2026"}, format="json"
    )
    wrong_password = client.post(
        LOGIN, {"email": VALID_PAYLOAD["email"], "password": "autre-mot-de-passe"}, format="json"
    )

    assert unknown.status_code == wrong_password.status_code == 401
    assert unknown.json() == wrong_password.json()


@pytest.mark.django_db
def test_login_rejects_an_inactive_account(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")
    User.objects.filter(email="ada@example.org").update(is_active=False)

    response = client.post(
        LOGIN, {"email": VALID_PAYLOAD["email"], "password": VALID_PAYLOAD["password"]}, format="json"
    )

    assert response.status_code == 401


# --- Rafraîchissement et déconnexion ---------------------------------------


@pytest.mark.django_db
def test_refresh_returns_a_new_access_token(client):
    refresh = client.post(REGISTER, VALID_PAYLOAD, format="json").json()["refresh"]

    response = client.post(REFRESH, {"refresh": refresh}, format="json")

    assert response.status_code == 200
    assert response.json()["access"]


@pytest.mark.django_db
def test_logout_blacklists_the_refresh_token(client):
    tokens = client.post(REGISTER, VALID_PAYLOAD, format="json").json()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    response = client.post(LOGOUT, {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 204
    reuse = APIClient().post(REFRESH, {"refresh": tokens["refresh"]}, format="json")
    assert reuse.status_code == 401


@pytest.mark.django_db
def test_logout_requires_authentication(client):
    tokens = client.post(REGISTER, VALID_PAYLOAD, format="json").json()

    response = client.post(LOGOUT, {"refresh": tokens["refresh"]}, format="json")

    assert response.status_code == 401


@pytest.mark.django_db
def test_logout_rejects_an_invalid_refresh_token(client):
    tokens = client.post(REGISTER, VALID_PAYLOAD, format="json").json()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    response = client.post(LOGOUT, {"refresh": "pas-un-jeton"}, format="json")

    assert response.status_code == 400


# --- Limitation de débit ----------------------------------------------------


@pytest.mark.django_db
def test_login_is_throttled_after_five_attempts_per_minute(client):
    client.post(REGISTER, VALID_PAYLOAD, format="json")
    cache.clear()
    payload = {"email": VALID_PAYLOAD["email"], "password": "mauvais-mot-de-passe"}

    codes = [client.post(LOGIN, payload, format="json").status_code for _ in range(6)]

    assert codes[:5] == [401] * 5
    assert codes[5] == 429


@pytest.mark.django_db
def test_register_is_throttled_after_five_attempts_per_minute(client):
    codes = [
        client.post(REGISTER, {**VALID_PAYLOAD, "email": f"dev{i}@example.org"}, format="json").status_code
        for i in range(6)
    ]

    assert codes[:5] == [201] * 5
    assert codes[5] == 429


# --- Journalisation ---------------------------------------------------------


@pytest.mark.django_db
def test_logs_never_contain_the_password_the_tokens_or_the_email(client, caplog):
    with caplog.at_level(logging.DEBUG):
        tokens = client.post(REGISTER, VALID_PAYLOAD, format="json").json()
        client.post(
            LOGIN, {"email": VALID_PAYLOAD["email"], "password": "mauvais-mot-de-passe"}, format="json"
        )

    logged = "\n".join(record.getMessage() for record in caplog.records)
    assert VALID_PAYLOAD["password"] not in logged
    assert tokens["access"] not in logged
    assert tokens["refresh"] not in logged
    assert VALID_PAYLOAD["email"] not in logged


@pytest.mark.django_db
def test_a_failed_login_is_audited_without_the_email(client, caplog):
    """DL-29 demande un journal d'audit ; il ne doit pas contenir l'adresse en clair."""
    client.post(REGISTER, VALID_PAYLOAD, format="json")

    with caplog.at_level(logging.INFO, logger="accounts.audit"):
        client.post(
            LOGIN, {"email": VALID_PAYLOAD["email"], "password": "mauvais-mot-de-passe"}, format="json"
        )

    messages = [r.getMessage() for r in caplog.records if r.name == "accounts.audit"]
    assert any("login_failed" in m for m in messages)
    assert all(VALID_PAYLOAD["email"] not in m for m in messages)
