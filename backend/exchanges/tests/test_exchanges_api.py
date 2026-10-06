"""Tests de l'API échanges (DL-18).

Critères du ticket : une seule demande en attente par paire d'utilisateurs, seul
le destinataire accepte ou refuse, on ne peut pas s'envoyer une demande à soi-même.
"""

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient

from exchanges.models import Exchange
from matching.models import Match
from matching.services import recompute_for_user
from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

EXCHANGES = "/api/v1/exchanges/"


def make_user(email, *, offered=(), wanted=()):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name=email.split("@")[0])
    Profile.objects.create(user=user, availability=["MENTORING"], domains=["WEB"], country="SN")
    for name in offered:
        UserSkill.objects.create(
            user=user, skill=Skill.objects.get(name=name), kind="OFFERED", level="ADVANCED"
        )
    for name in wanted:
        UserSkill.objects.create(user=user, skill=Skill.objects.get(name=name), kind="WANTED")
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def matched_pair():
    """Deux utilisateurs complémentaires, avec leur match calculé."""
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    kofi = make_user("kofi@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)
    return ada, kofi, Match.objects.get()


# --- Proposer un échange ----------------------------------------------------


def test_an_exchange_can_be_proposed_from_a_match(matched_pair):
    ada, kofi, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/",
        {"type": "MENTORAT", "message": "Peux-tu m'aider sur Python ?"},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["type"] == "MENTORAT"
    assert body["status"] == "PROPOSED"
    assert body["requester"]["id"] == ada.pk
    assert body["partner"]["id"] == kofi.pk


def test_the_exchange_can_name_a_skill(matched_pair):
    ada, _, match = matched_pair
    python = Skill.objects.get(name="Python")

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/",
        {"type": "MENTORAT", "message": "Bonjour.", "skill": python.pk},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["skill"]["name"] == "Python"


@pytest.mark.parametrize(
    "exchange_type",
    [
        "PAIR_PROGRAMMING",
        "CODE_REVIEW",
        "MENTORAT",
        "DEBUGGING",
        "PROJET_COMMUN",
        "PREPARATION_ENTRETIEN",
        "ECHANGE_COMPETENCES",
        "DISCUSSION",
    ],
)
def test_the_eight_documented_types_are_accepted(matched_pair, exchange_type):
    ada, _, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/",
        {"type": exchange_type, "message": "Bonjour."},
        format="json",
    )

    assert response.status_code == 201


def test_an_unknown_type_is_refused(matched_pair):
    ada, _, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "CAFE", "message": "Bonjour."}, format="json"
    )

    assert response.status_code == 400
    assert "type" in response.json()["errors"]


def test_the_message_is_required(matched_pair):
    ada, _, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT"}, format="json"
    )

    assert response.status_code == 400
    assert "message" in response.json()["errors"]


def test_a_blank_message_is_refused(matched_pair):
    ada, _, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "   "}, format="json"
    )

    assert response.status_code == 400


def test_a_message_that_is_too_long_is_refused(matched_pair):
    ada, _, match = matched_pair

    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/",
        {"type": "MENTORAT", "message": "x" * 1001},
        format="json",
    )

    assert response.status_code == 400


def test_a_user_outside_the_match_cannot_propose(matched_pair):
    _, _, match = matched_pair
    stranger = make_user("x@example.org")

    response = client_for(stranger).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )

    assert response.status_code == 404
    assert Exchange.objects.count() == 0


def test_only_one_pending_request_per_pair(matched_pair):
    """Critère de DL-18, dans un sens comme dans l'autre."""
    ada, _, match = matched_pair
    client = client_for(ada)
    client.post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Première."}, format="json"
    )

    response = client.post(
        f"/api/v1/matches/{match.pk}/request/",
        {"type": "CODE_REVIEW", "message": "Deuxième."},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_request"
    assert Exchange.objects.count() == 1


def test_the_pair_constraint_works_in_the_other_direction(matched_pair):
    """Si Ada a déjà écrit à Kofi, Kofi ne peut pas écrire à Ada en même temps."""
    ada, kofi, match = matched_pair
    client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "De Ada."}, format="json"
    )

    response = client_for(kofi).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "De Kofi."}, format="json"
    )

    assert response.status_code == 409
    assert Exchange.objects.count() == 1


def test_a_new_request_is_possible_after_a_refusal(matched_pair):
    ada, _, match = matched_pair
    client = client_for(ada)
    client.post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Première."}, format="json"
    )
    Exchange.objects.update(status="DECLINED")

    response = client.post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Je réessaie."}, format="json"
    )

    assert response.status_code == 201


def test_a_user_cannot_propose_an_exchange_to_themselves():
    """Garde-fou en base : la contrainte CHECK interdit ce cas."""
    ada = make_user("ada@example.org")

    with pytest.raises(IntegrityError), transaction.atomic():
        Exchange.objects.create(requester=ada, partner=ada, type="MENTORAT", message="Moi.")


def test_proposing_requires_authentication(matched_pair):
    _, _, match = matched_pair

    response = APIClient().post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )

    assert response.status_code == 401


# --- Lister ses échanges ----------------------------------------------------


def test_both_parties_see_the_exchange(matched_pair):
    ada, kofi, match = matched_pair
    client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )

    assert client_for(ada).get(EXCHANGES).json()["count"] == 1
    assert client_for(kofi).get(EXCHANGES).json()["count"] == 1


def test_a_third_party_sees_nothing(matched_pair):
    ada, _, match = matched_pair
    client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )
    stranger = make_user("x@example.org")

    assert client_for(stranger).get(EXCHANGES).json()["count"] == 0


def test_the_list_can_be_filtered_by_direction(matched_pair):
    ada, kofi, match = matched_pair
    client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )

    assert client_for(ada).get(EXCHANGES, {"direction": "sent"}).json()["count"] == 1
    assert client_for(ada).get(EXCHANGES, {"direction": "received"}).json()["count"] == 0
    assert client_for(kofi).get(EXCHANGES, {"direction": "received"}).json()["count"] == 1


def test_the_list_can_be_filtered_by_status(matched_pair):
    ada, _, match = matched_pair
    client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )

    assert client_for(ada).get(EXCHANGES, {"status": "PROPOSED"}).json()["count"] == 1
    assert client_for(ada).get(EXCHANGES, {"status": "ACCEPTED"}).json()["count"] == 0


def test_an_unknown_direction_is_refused(matched_pair):
    ada, _, _ = matched_pair

    assert client_for(ada).get(EXCHANGES, {"direction": "ailleurs"}).status_code == 400


def test_the_list_requires_authentication():
    assert APIClient().get(EXCHANGES).status_code == 401


def test_the_list_avoids_n_plus_one_queries(matched_pair, django_assert_num_queries):
    ada, kofi, match = matched_pair
    for index in range(3):
        Exchange.objects.create(
            requester=ada, partner=kofi, type="DISCUSSION", message=f"Message {index}", status="COMPLETED"
        )
    client = client_for(ada)

    # 2 requêtes constantes : le compte total et la page, relations jointes.
    with django_assert_num_queries(2):
        client.get(EXCHANGES)

    for index in range(3, 12):
        Exchange.objects.create(
            requester=ada, partner=kofi, type="DISCUSSION", message=f"Message {index}", status="COMPLETED"
        )

    with django_assert_num_queries(2):
        client.get(EXCHANGES)


# --- Répondre à une demande -------------------------------------------------


def _propose(ada, match):
    response = client_for(ada).post(
        f"/api/v1/matches/{match.pk}/request/", {"type": "MENTORAT", "message": "Bonjour."}, format="json"
    )
    return response.json()["id"]


def test_the_recipient_can_accept(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "ACCEPTED"}, format="json")

    assert response.status_code == 200
    assert Exchange.objects.get(pk=exchange_id).status == "ACCEPTED"


def test_the_recipient_can_decline(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "DECLINED"}, format="json")

    assert response.status_code == 200
    assert Exchange.objects.get(pk=exchange_id).status == "DECLINED"


def test_the_requester_cannot_accept_their_own_request(matched_pair):
    """Critère de DL-18 : seul le destinataire accepte ou refuse."""
    ada, _, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(ada).patch(f"{EXCHANGES}{exchange_id}/", {"status": "ACCEPTED"}, format="json")

    assert response.status_code == 403
    assert Exchange.objects.get(pk=exchange_id).status == "PROPOSED"


def test_the_requester_can_cancel_their_request(matched_pair):
    ada, _, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(ada).patch(f"{EXCHANGES}{exchange_id}/", {"status": "CANCELLED"}, format="json")

    assert response.status_code == 200
    assert Exchange.objects.get(pk=exchange_id).status == "CANCELLED"


def test_the_recipient_cannot_cancel(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "CANCELLED"}, format="json")

    assert response.status_code == 403


def test_an_accepted_exchange_can_be_completed_by_both(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)
    client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "ACCEPTED"}, format="json")

    response = client_for(ada).patch(f"{EXCHANGES}{exchange_id}/", {"status": "COMPLETED"}, format="json")

    assert response.status_code == 200
    assert Exchange.objects.get(pk=exchange_id).status == "COMPLETED"


def test_a_proposed_exchange_cannot_jump_to_completed(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "COMPLETED"}, format="json")

    assert response.status_code == 409


def test_an_already_declined_exchange_cannot_be_accepted(matched_pair):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)
    client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "DECLINED"}, format="json")

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": "ACCEPTED"}, format="json")

    assert response.status_code == 409


def test_a_third_party_cannot_change_an_exchange(matched_pair):
    ada, _, match = matched_pair
    exchange_id = _propose(ada, match)
    stranger = make_user("x@example.org")

    response = client_for(stranger).patch(f"{EXCHANGES}{exchange_id}/", {"status": "ACCEPTED"}, format="json")

    assert response.status_code == 404


@pytest.mark.parametrize("bad_status", ["PROPOSED", "INCONNU", ""])
def test_an_invalid_target_status_is_refused(matched_pair, bad_status):
    ada, kofi, match = matched_pair
    exchange_id = _propose(ada, match)

    response = client_for(kofi).patch(f"{EXCHANGES}{exchange_id}/", {"status": bad_status}, format="json")

    assert response.status_code == 400
