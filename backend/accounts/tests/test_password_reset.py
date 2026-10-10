"""Tests de la réinitialisation du mot de passe : demande par e-mail, puis lien."""

import logging
import re

import pytest
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.cache import cache
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient

from accounts.models import User

REQUEST = "/api/v1/auth/password-reset/"
CONFIRM = "/api/v1/auth/password-reset/confirm/"
LOGIN = "/api/v1/auth/login/"
REFRESH = "/api/v1/auth/refresh/"

OLD_PASSWORD = "ancien-mot-de-passe-2026"
NEW_PASSWORD = "nouveau-mot-de-passe-2027"


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="ada@example.org", password=OLD_PASSWORD)


def _credentials(user):
    return urlsafe_base64_encode(force_bytes(user.pk)), default_token_generator.make_token(user)


def _confirm(client, user, password=NEW_PASSWORD, **overrides):
    uid, token = _credentials(user)
    payload = {"uid": uid, "token": token, "password": password, **overrides}
    return client.post(CONFIRM, payload, format="json")


def test_request_sends_a_link_to_an_existing_account(client, user):
    response = client.post(REQUEST, {"email": "Ada@Example.org"}, format="json")

    assert response.status_code == 204
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["ada@example.org"]
    assert re.search(r"/mot-de-passe/reinitialiser\?uid=[\w-]+&token=[\w-]+", message.body)


def test_request_looks_identical_for_an_unknown_address(client, db):
    response = client.post(REQUEST, {"email": "personne@example.org"}, format="json")

    assert response.status_code == 204
    assert response.content == b""
    assert mail.outbox == []


def test_request_ignores_inactive_accounts(client, user):
    user.is_active = False
    user.save()

    assert client.post(REQUEST, {"email": user.email}, format="json").status_code == 204
    assert mail.outbox == []


def test_request_rejects_an_invalid_address(client, db):
    assert client.post(REQUEST, {"email": "pas-un-email"}, format="json").status_code == 400


def test_request_is_throttled(client, user):
    statuses = [client.post(REQUEST, {"email": user.email}, format="json").status_code for _ in range(7)]

    assert statuses[:5] == [204] * 5
    assert 429 in statuses[5:]


def test_confirm_changes_the_password(client, user):
    response = _confirm(client, user)

    assert response.status_code == 204
    assert (
        client.post(LOGIN, {"email": user.email, "password": NEW_PASSWORD}, format="json").status_code == 200
    )
    assert (
        client.post(LOGIN, {"email": user.email, "password": OLD_PASSWORD}, format="json").status_code == 401
    )


def test_a_link_works_only_once(client, user):
    uid, token = _credentials(user)
    payload = {"uid": uid, "token": token, "password": NEW_PASSWORD}

    assert client.post(CONFIRM, payload, format="json").status_code == 204
    again = client.post(CONFIRM, {**payload, "password": "autre-mot-de-passe-2028"}, format="json")

    assert again.status_code == 400
    assert again.json()["code"] == "invalid_reset_token"


def test_confirm_rejects_a_forged_token(client, user):
    response = _confirm(client, user, token="abc-0123456789abcdef0123")

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_reset_token"


def test_confirm_rejects_a_garbage_uid(client, user):
    response = _confirm(client, user, uid="!!!")

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_reset_token"


def test_confirm_rejects_an_expired_link(client, user, settings):
    settings.PASSWORD_RESET_TIMEOUT = -1

    response = _confirm(client, user)

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_reset_token"


@pytest.mark.parametrize("password", ["court", "1234567890", "password123"])
def test_confirm_rejects_weak_passwords(client, user, password):
    response = _confirm(client, user, password=password)

    assert response.status_code == 400
    assert "password" in response.json()["errors"]
    # Le mot de passe n'a pas changé : le lien reste utilisable.
    assert _confirm(client, user).status_code == 204


def test_confirm_revokes_open_sessions(client, user):
    refresh = client.post(LOGIN, {"email": user.email, "password": OLD_PASSWORD}, format="json").json()[
        "refresh"
    ]

    assert _confirm(client, user).status_code == 204

    assert client.post(REFRESH, {"refresh": refresh}, format="json").status_code == 401


def test_a_google_only_account_can_set_a_password(client, db):
    user = User.objects.create_user(email="g@example.org", password=None)
    user.set_unusable_password()
    user.save()

    assert _confirm(client, user).status_code == 204
    assert (
        client.post(LOGIN, {"email": user.email, "password": NEW_PASSWORD}, format="json").status_code == 200
    )


def test_logs_never_hold_the_address_or_the_token(client, user, caplog):
    with caplog.at_level(logging.INFO):
        client.post(REQUEST, {"email": user.email}, format="json")
        _confirm(client, user)

    uid, token = _credentials(user)
    logs = caplog.text
    assert user.email not in logs
    assert NEW_PASSWORD not in logs
    assert token not in logs
