"""Tests de l'API des cercles d'échange.

Trois développeurs sans aucune paire réciproque : Awa sait React et veut Docker,
Kofi sait Docker et veut Python, Imani sait Python et veut React. Dev Match ne
leur propose rien ; un cercle les réunit tous les trois.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from circles.models import Circle
from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

CIRCLES = "/api/v1/circles/"
SUGGESTIONS = "/api/v1/circles/suggestions/"


def make_user(name, *, offered=(), wanted=(), country="SN", contact=""):
    user = User.objects.create_user(f"{name.lower()}@example.org", "mot-de-passe-solide-2026", full_name=name)
    Profile.objects.create(user=user, country=country, contact=contact)
    for skill in offered:
        UserSkill.objects.create(
            user=user, skill=Skill.objects.get(name=skill), kind="OFFERED", level="ADVANCED"
        )
    for skill in wanted:
        UserSkill.objects.create(user=user, skill=Skill.objects.get(name=skill), kind="WANTED")
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def trio():
    awa = make_user("Awa", offered=["React"], wanted=["Docker"], contact="awa@example.org")
    kofi = make_user(
        "Kofi", offered=["Docker"], wanted=["Python"], country="GH", contact="https://github.com/kofi"
    )
    imani = make_user(
        "Imani", offered=["Python"], wanted=["React"], country="RW", contact="imani@example.org"
    )
    return awa, kofi, imani


def propose(user, members):
    return client_for(user).post(CIRCLES, {"members": [m.pk for m in members]}, format="json")


# --- Suggestions ------------------------------------------------------------


def test_the_trio_is_suggested_a_circle(trio):
    awa, kofi, imani = trio

    response = client_for(awa).get(SUGGESTIONS)

    assert response.status_code == 200
    [circle] = response.json()["results"]
    assert circle["status"] == "SUGGESTED"
    assert circle["score"] == 100.0
    assert {m["full_name"] for m in circle["members"]} == {"Awa", "Kofi", "Imani"}
    assert {(a["teacher"], a["learner"], a["skill"]["name"]) for a in circle["arrows"]} == {
        (awa.pk, imani.pk, "React"),
        (imani.pk, kofi.pk, "Python"),
        (kofi.pk, awa.pk, "Docker"),
    }


def test_suggestions_never_reveal_contacts(trio):
    awa, _, _ = trio

    circle = client_for(awa).get(SUGGESTIONS).json()["results"][0]

    assert all(member["contact"] is None for member in circle["members"])


def test_suggestions_require_authentication():
    assert APIClient().get(SUGGESTIONS).status_code == 401


def test_a_circle_already_proposed_is_no_longer_suggested(trio):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])

    assert client_for(kofi).get(SUGGESTIONS).json()["results"] == []


# --- Proposer ---------------------------------------------------------------


def test_proposing_creates_the_circle_with_the_proposer_already_accepting(trio):
    awa, kofi, imani = trio

    response = propose(awa, [awa, imani, kofi])

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PROPOSED"
    responses = {m["full_name"]: m["response"] for m in body["members"]}
    assert responses == {"Awa": "ACCEPTED", "Imani": "PENDING", "Kofi": "PENDING"}


def test_the_proposer_must_be_in_the_circle(trio):
    awa, kofi, imani = trio
    outsider = make_user("Ousmane")

    response = propose(outsider, [awa, imani, kofi])

    assert response.status_code == 400
    assert "members" in response.json()["errors"]


def test_a_circle_that_does_not_hold_is_refused(trio):
    awa, kofi, imani = trio

    # Mauvais sens : Awa n'apprend rien à Kofi.
    response = propose(awa, [awa, kofi, imani])

    assert response.status_code == 400


def test_the_same_circle_cannot_be_open_twice(trio):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])

    # Même cercle, lu depuis un autre membre.
    response = propose(kofi, [kofi, awa, imani])

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_circle"


@pytest.mark.parametrize("members", [[1, 2], [1, 2, 3, 4, 5]])
def test_a_circle_has_three_or_four_members(trio, members):
    awa, _, _ = trio

    response = client_for(awa).post(CIRCLES, {"members": members}, format="json")

    assert response.status_code == 400


# --- Répondre ----------------------------------------------------------------


def test_the_circle_becomes_active_once_everyone_accepts(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]

    first = client_for(imani).patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json")
    second = client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json")

    assert first.json()["status"] == "PROPOSED"
    assert second.json()["status"] == "ACTIVE"
    assert second.json()["activated_at"] is not None


def test_contacts_are_revealed_to_everyone_only_once_active(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]
    client_for(imani).patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json")

    pending = client_for(awa).get(f"{CIRCLES}{circle_id}/").json()
    assert all(member["contact"] is None for member in pending["members"])

    client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json")

    active = client_for(imani).get(f"{CIRCLES}{circle_id}/").json()
    assert {m["full_name"]: m["contact"] for m in active["members"]} == {
        "Awa": "awa@example.org",
        "Imani": "imani@example.org",
        "Kofi": "https://github.com/kofi",
    }


def test_one_refusal_closes_the_circle_without_revealing_anything(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]

    response = client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "DECLINE"}, format="json")

    assert response.json()["status"] == "DECLINED"
    assert all(member["contact"] is None for member in response.json()["members"])


def test_a_declined_circle_can_be_proposed_again(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]
    client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "DECLINE"}, format="json")

    assert propose(imani, [imani, kofi, awa]).status_code == 201


def test_a_member_answers_only_once(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]

    response = client_for(awa).patch(f"{CIRCLES}{circle_id}/", {"decision": "DECLINE"}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "already_answered"


def test_a_closed_circle_accepts_no_more_answers(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]
    client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "DECLINE"}, format="json")

    response = client_for(imani).patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json")

    assert response.status_code == 409


def test_an_unknown_decision_is_rejected(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]

    response = client_for(kofi).patch(f"{CIRCLES}{circle_id}/", {"decision": "MAYBE"}, format="json")

    assert response.status_code == 400


# --- Lire --------------------------------------------------------------------


def test_outsiders_cannot_see_or_answer_a_circle(trio):
    awa, kofi, imani = trio
    circle_id = propose(awa, [awa, imani, kofi]).json()["id"]
    outsider = client_for(make_user("Ousmane"))

    assert outsider.get(f"{CIRCLES}{circle_id}/").status_code == 404
    assert outsider.patch(f"{CIRCLES}{circle_id}/", {"decision": "ACCEPT"}, format="json").status_code == 404
    assert outsider.get(CIRCLES).json()["count"] == 0


def test_awaiting_me_lists_only_the_circles_waiting_for_my_answer(trio):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])

    assert client_for(kofi).get(CIRCLES, {"awaiting": "me"}).json()["count"] == 1
    assert client_for(awa).get(CIRCLES, {"awaiting": "me"}).json()["count"] == 0
    assert client_for(awa).get(CIRCLES).json()["count"] == 1


def test_listing_circles_does_not_query_each_member(trio, django_assert_max_num_queries):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])
    client = client_for(kofi)

    with django_assert_max_num_queries(4):
        client.get(CIRCLES)


# --- Données personnelles -----------------------------------------------------


def test_deleting_an_account_dissolves_its_circles(trio):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])
    kofi.set_password("mot-de-passe-solide-2026")
    kofi.save()

    response = client_for(kofi).delete(
        "/api/v1/me/delete/", {"password": "mot-de-passe-solide-2026"}, format="json"
    )

    assert response.status_code == 204
    assert Circle.objects.count() == 0


def test_my_circles_are_in_my_data_export_without_the_other_members(trio):
    awa, kofi, imani = trio
    propose(awa, [awa, imani, kofi])

    export = client_for(awa).get("/api/v1/me/export/").json()

    assert export["circles"] == [
        {
            "status": "PROPOSED",
            "my_response": "ACCEPTED",
            "i_teach": ["React"],
            "i_learn": ["Docker"],
            "created_at": export["circles"][0]["created_at"],
        }
    ]
    assert "Kofi" not in str(export["circles"]) and "Imani" not in str(export["circles"])
