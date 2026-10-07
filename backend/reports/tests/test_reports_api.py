"""Tests des signalements (DL-32).

Critères du ticket : un signalement par personne et par cible, limite de débit
pour éviter l'abus.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from profiles.models import Profile
from projects.models import Project
from reports.models import Report

User = get_user_model()
pytestmark = pytest.mark.django_db

REPORTS = "/api/v1/reports/"


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(email):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name=email.split("@")[0].title())
    Profile.objects.create(user=user)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_a_profile_can_be_reported():
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    response = client_for(reporter).post(
        REPORTS,
        {"target_type": "USER", "target_id": target.pk, "reason": "SPAM", "details": "Publicités."},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["status"] == "OPEN"
    assert Report.objects.count() == 1


def test_a_project_can_be_reported():
    reporter = make_user("ada@example.org")
    owner = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Projet douteux")

    response = client_for(reporter).post(
        REPORTS,
        {"target_type": "PROJECT", "target_id": project.pk, "reason": "INAPPROPRIATE"},
        format="json",
    )

    assert response.status_code == 201


def test_the_details_are_optional():
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    response = client_for(reporter).post(
        REPORTS, {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"}, format="json"
    )

    assert response.status_code == 201


def test_only_one_report_per_person_and_target():
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")
    client = client_for(reporter)
    payload = {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"}
    client.post(REPORTS, payload, format="json")

    response = client.post(REPORTS, {**payload, "reason": "HARASSMENT"}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_report"
    assert Report.objects.count() == 1


def test_two_people_can_report_the_same_target():
    first = make_user("ada@example.org")
    second = make_user("fatou@example.org")
    target = make_user("spam@example.org")
    payload = {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"}

    assert client_for(first).post(REPORTS, payload, format="json").status_code == 201
    assert client_for(second).post(REPORTS, payload, format="json").status_code == 201
    assert Report.objects.count() == 2


def test_the_same_person_can_report_a_user_and_a_project():
    reporter = make_user("ada@example.org")
    owner = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Projet")
    client = client_for(reporter)

    assert (
        client.post(
            REPORTS, {"target_type": "USER", "target_id": owner.pk, "reason": "SPAM"}, format="json"
        ).status_code
        == 201
    )
    assert (
        client.post(
            REPORTS,
            {"target_type": "PROJECT", "target_id": project.pk, "reason": "SPAM"},
            format="json",
        ).status_code
        == 201
    )


def test_i_cannot_report_myself():
    reporter = make_user("ada@example.org")

    response = client_for(reporter).post(
        REPORTS, {"target_type": "USER", "target_id": reporter.pk, "reason": "SPAM"}, format="json"
    )

    assert response.status_code == 400
    assert Report.objects.count() == 0


def test_an_unknown_target_is_refused():
    reporter = make_user("ada@example.org")

    response = client_for(reporter).post(
        REPORTS, {"target_type": "USER", "target_id": 999999, "reason": "SPAM"}, format="json"
    )

    assert response.status_code == 400
    assert "target_id" in response.json()["errors"]


@pytest.mark.parametrize("reason", ["INCONNU", "", "spam"])
def test_an_invalid_reason_is_refused(reason):
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    response = client_for(reporter).post(
        REPORTS, {"target_type": "USER", "target_id": target.pk, "reason": reason}, format="json"
    )

    assert response.status_code == 400


def test_an_invalid_target_type_is_refused():
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    response = client_for(reporter).post(
        REPORTS, {"target_type": "COMMENT", "target_id": target.pk, "reason": "SPAM"}, format="json"
    )

    assert response.status_code == 400


def test_details_that_are_too_long_are_refused():
    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    response = client_for(reporter).post(
        REPORTS,
        {"target_type": "USER", "target_id": target.pk, "reason": "SPAM", "details": "x" * 1001},
        format="json",
    )

    assert response.status_code == 400


def test_reporting_requires_authentication():
    target = make_user("spam@example.org")

    response = APIClient().post(
        REPORTS, {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"}, format="json"
    )

    assert response.status_code == 401


def test_reports_are_rate_limited():
    """Critère du ticket : une limite de débit évite le détournement."""
    reporter = make_user("ada@example.org")
    client = client_for(reporter)
    targets = [make_user(f"cible{index}@example.org") for index in range(12)]

    codes = [
        client.post(
            REPORTS,
            {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"},
            format="json",
        ).status_code
        for target in targets
    ]

    assert codes.count(201) == 10  # plafond de 10 par jour
    assert codes[-1] == 429


def test_the_report_is_audited_without_personal_data(caplog):
    import logging

    reporter = make_user("ada@example.org")
    target = make_user("spam@example.org")

    with caplog.at_level(logging.INFO, logger="accounts.audit"):
        client_for(reporter).post(
            REPORTS, {"target_type": "USER", "target_id": target.pk, "reason": "SPAM"}, format="json"
        )

    messages = [record.getMessage() for record in caplog.records if record.name == "accounts.audit"]
    assert any("report_created" in message for message in messages)
    assert all("ada@example.org" not in message for message in messages)
