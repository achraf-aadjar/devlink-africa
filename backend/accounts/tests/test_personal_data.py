"""Tests de l'export et de la suppression de compte (DL-40).

Loi sénégalaise n° 2008-12 : droit d'accès et droit d'effacement. Le cahier des
charges demande des fonctionnalités « simples mais réelles ».
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from exchanges.models import Exchange
from matching.models import Match
from matching.services import recompute_for_user
from profiles.models import Profile
from projects.models import Project
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

EXPORT = "/api/v1/me/export/"
DELETE = "/api/v1/me/delete/"
PASSWORD = "mot-de-passe-solide-2026"


def make_user(email="ada@example.org", **profile_fields):
    user = User.objects.create_user(email, PASSWORD, full_name="Ada Lovelace")
    Profile.objects.create(user=user, **profile_fields)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# --- Export (droit d'accès) -------------------------------------------------


def test_the_export_contains_every_section():
    user = make_user(country="SN", bio="Ma bio.")

    response = client_for(user).get(EXPORT)

    assert response.status_code == 200
    body = response.json()
    assert {
        "exported_at",
        "user",
        "profile",
        "skills",
        "projects",
        "join_requests",
        "exchanges",
        "reports_made",
    } == set(body)


def test_the_export_includes_my_own_email():
    """Il s'agit de *mes* données : mon adresse en fait partie."""
    user = make_user()

    body = client_for(user).get(EXPORT).json()

    assert body["user"]["email"] == "ada@example.org"


def test_the_export_includes_my_skills_and_projects():
    user = make_user()
    UserSkill.objects.create(
        user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED", level="ADVANCED"
    )
    project = Project.objects.create(owner=user, title="Agri-Data")
    project.needs.set([Skill.objects.get(name="Docker")])

    body = client_for(user).get(EXPORT).json()

    assert body["skills"][0]["skill"] == "Python"
    assert body["projects"][0]["title"] == "Agri-Data"
    assert body["projects"][0]["needs"] == ["Docker"]


def test_the_export_includes_my_exchanges_with_my_role():
    user = make_user()
    other = make_user("kofi@example.org")
    Exchange.objects.create(requester=user, partner=other, type="MENTORAT", message="Bonjour.")

    body = client_for(user).get(EXPORT).json()

    assert body["exchanges"][0]["role"] == "demandeur"


def test_the_export_does_not_leak_other_peoples_data():
    user = make_user()
    other = make_user("kofi@example.org")
    UserSkill.objects.create(user=other, skill=Skill.objects.get(name="React"), kind="OFFERED")
    Project.objects.create(owner=other, title="Projet de Kofi")

    body = client_for(user).get(EXPORT).json()

    assert body["skills"] == []
    assert body["projects"] == []
    assert "kofi@example.org" not in str(body)


def test_the_export_requires_authentication():
    assert APIClient().get(EXPORT).status_code == 401


def test_the_export_is_valid_json_for_an_empty_account():
    user = User.objects.create_user("vide@example.org", PASSWORD)

    response = client_for(user).get(EXPORT)

    assert response.status_code == 200
    assert response.json()["skills"] == []


# --- Suppression (droit d'effacement) ---------------------------------------


def test_the_account_can_be_deleted_with_the_password():
    user = make_user()
    user_id = user.pk

    response = client_for(user).delete(DELETE, {"password": PASSWORD}, format="json")

    assert response.status_code == 204
    assert not User.objects.filter(pk=user_id).exists()


def test_deleting_removes_the_profile_and_the_skills():
    user = make_user(country="SN")
    UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    client_for(user).delete(DELETE, {"password": PASSWORD}, format="json")

    assert Profile.objects.count() == 0
    assert UserSkill.objects.count() == 0


def test_deleting_removes_my_projects():
    user = make_user()
    Project.objects.create(owner=user, title="Agri-Data")

    client_for(user).delete(DELETE, {"password": PASSWORD}, format="json")

    assert Project.objects.count() == 0


def test_deleting_removes_my_matches():
    """Les matchs pointent sur deux utilisateurs : ils doivent disparaître."""
    ada = make_user("ada@example.org", availability=["MENTORING"], domains=["WEB"])
    kofi = make_user("kofi@example.org", availability=["MENTORING"], domains=["WEB"])
    UserSkill.objects.create(
        user=ada, skill=Skill.objects.get(name="React"), kind="OFFERED", level="ADVANCED"
    )
    UserSkill.objects.create(user=ada, skill=Skill.objects.get(name="Python"), kind="WANTED")
    UserSkill.objects.create(
        user=kofi, skill=Skill.objects.get(name="Python"), kind="OFFERED", level="ADVANCED"
    )
    UserSkill.objects.create(user=kofi, skill=Skill.objects.get(name="React"), kind="WANTED")
    recompute_for_user(ada.pk)
    assert Match.objects.count() == 1

    client_for(ada).delete(DELETE, {"password": PASSWORD}, format="json")

    assert Match.objects.count() == 0
    assert User.objects.filter(pk=kofi.pk).exists(), "L'autre compte doit survivre."


def test_deleting_removes_my_exchanges():
    user = make_user()
    other = make_user("kofi@example.org")
    Exchange.objects.create(requester=user, partner=other, type="MENTORAT", message="Bonjour.")

    client_for(user).delete(DELETE, {"password": PASSWORD}, format="json")

    assert Exchange.objects.count() == 0


def test_a_wrong_password_does_not_delete_the_account():
    user = make_user()

    response = client_for(user).delete(DELETE, {"password": "mauvais-mot-de-passe"}, format="json")

    assert response.status_code == 400
    assert "password" in response.json()["errors"]
    assert User.objects.filter(pk=user.pk).exists()


def test_the_password_is_required():
    user = make_user()

    response = client_for(user).delete(DELETE, {}, format="json")

    assert response.status_code == 400
    assert User.objects.filter(pk=user.pk).exists()


def test_deleting_requires_authentication():
    make_user()

    response = APIClient().delete(DELETE, {"password": PASSWORD}, format="json")

    assert response.status_code == 401
    assert User.objects.count() == 1


def test_the_deletion_is_audited_without_personal_data(caplog):
    import logging

    user = make_user()

    with caplog.at_level(logging.INFO, logger="accounts.audit"):
        client_for(user).delete(DELETE, {"password": PASSWORD}, format="json")

    messages = [record.getMessage() for record in caplog.records if record.name == "accounts.audit"]
    assert any("account_deleted" in message for message in messages)
    assert all("ada@example.org" not in message for message in messages)
