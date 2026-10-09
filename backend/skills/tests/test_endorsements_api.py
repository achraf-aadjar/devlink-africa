"""Tests de la validation des compétences par les pairs.

Règle : on ne valide que ce qu'on a vu à l'œuvre. Après un échange terminé,
toutes les compétences proposées par l'autre ; dans un cercle actif, celle
qu'on apprend de son professeur, et seulement celle-là.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from circles.models import Circle, CircleMember
from exchanges.models import Exchange
from profiles.models import Profile
from skills.models import Skill, SkillEndorsement, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

ENDORSE = "/api/v1/endorsements/"
CANDIDATES = "/api/v1/endorsements/candidates/"


def make_user(name, *, offered=(), wanted=(), country="SN"):
    user = User.objects.create_user(f"{name.lower()}@example.org", "mot-de-passe-solide-2026", full_name=name)
    Profile.objects.create(user=user, country=country)
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


def skill_of(user, name, kind="OFFERED"):
    return UserSkill.objects.get(user=user, skill__name=name, kind=kind)


def exchange(a, b, status="COMPLETED"):
    return Exchange.objects.create(requester=a, partner=b, type="MENTORAT", message="Bonjour.", status=status)


@pytest.fixture
def pair():
    ada = make_user("Ada", offered=["React"], wanted=["Python"])
    kofi = make_user("Kofi", offered=["Python", "Docker"], wanted=["React"], country="GH")
    return ada, kofi


def endorse(user, user_skill, comment=""):
    return client_for(user).post(ENDORSE, {"user_skill": user_skill.pk, "comment": comment}, format="json")


# --- Après un échange ---------------------------------------------------------


def test_after_a_completed_exchange_any_offered_skill_can_be_endorsed(pair):
    ada, kofi = pair
    exchange(ada, kofi)

    first = endorse(ada, skill_of(kofi, "Python"), "Patient et clair.")
    second = endorse(ada, skill_of(kofi, "Docker"))

    assert first.status_code == 201 and second.status_code == 201
    body = first.json()
    assert body["context"] == "EXCHANGE"
    assert body["comment"] == "Patient et clair."
    assert body["by"] == {"id": ada.pk, "full_name": "Ada", "country": "SN"}


def test_both_sides_of_the_exchange_can_endorse_each_other(pair):
    ada, kofi = pair
    exchange(kofi, ada)

    assert endorse(ada, skill_of(kofi, "Python")).status_code == 201
    assert endorse(kofi, skill_of(ada, "React")).status_code == 201


@pytest.mark.parametrize("status", ["PROPOSED", "ACCEPTED", "DECLINED", "CANCELLED"])
def test_an_exchange_that_is_not_completed_is_not_enough(pair, status):
    ada, kofi = pair
    exchange(ada, kofi, status=status)

    assert endorse(ada, skill_of(kofi, "Python")).status_code == 403


def test_strangers_cannot_endorse(pair):
    ada, kofi = pair

    assert endorse(ada, skill_of(kofi, "Python")).status_code == 403


def test_nobody_endorses_themselves(pair):
    ada, _ = pair

    response = endorse(ada, skill_of(ada, "React"))

    assert response.status_code == 400
    assert "user_skill" in response.json()["errors"]


def test_a_wanted_skill_cannot_be_endorsed(pair):
    ada, kofi = pair
    exchange(ada, kofi)

    assert endorse(ada, skill_of(kofi, "React", kind="WANTED")).status_code == 404


def test_a_skill_is_endorsed_only_once_by_the_same_person(pair):
    ada, kofi = pair
    exchange(ada, kofi)
    endorse(ada, skill_of(kofi, "Python"))

    response = endorse(ada, skill_of(kofi, "Python"))

    assert response.status_code == 409
    assert response.json()["code"] == "already_endorsed"


def test_endorsing_requires_authentication(pair):
    _, kofi = pair

    assert (
        APIClient().post(ENDORSE, {"user_skill": skill_of(kofi, "Python").pk}, format="json").status_code
        == 401
    )


# --- Dans un cercle -------------------------------------------------------------


@pytest.fixture
def circle():
    """Awa → Kwame (React), Kwame → Imani (FastAPI), Imani → Awa (Docker), actif."""
    awa = make_user("Awa", offered=["React", "Linux"], wanted=["Docker"])
    kwame = make_user("Kwame", offered=["FastAPI"], wanted=["React"], country="GH")
    imani = make_user("Imani", offered=["Docker", "Kubernetes"], wanted=["FastAPI"], country="KE")
    record = Circle.objects.create(
        key=f"{awa.pk}-{kwame.pk}-{imani.pk}",
        score=100,
        status=Circle.Status.ACTIVE,
        arrows=[
            {"teacher": awa.pk, "learner": kwame.pk, "skill": {"name": "React", "level": "ADVANCED"}},
            {"teacher": kwame.pk, "learner": imani.pk, "skill": {"name": "FastAPI", "level": "ADVANCED"}},
            {"teacher": imani.pk, "learner": awa.pk, "skill": {"name": "Docker", "level": "ADVANCED"}},
        ],
    )
    for position, user in enumerate((awa, kwame, imani)):
        CircleMember.objects.create(circle=record, user=user, position=position, response="ACCEPTED")
    return awa, kwame, imani, record


def test_in_a_circle_the_learner_endorses_what_their_teacher_taught(circle):
    awa, _, imani, _ = circle

    response = endorse(awa, skill_of(imani, "Docker"))

    assert response.status_code == 201
    assert response.json()["context"] == "CIRCLE"


def test_in_a_circle_only_the_taught_skill_can_be_endorsed(circle):
    awa, _, imani, _ = circle

    assert endorse(awa, skill_of(imani, "Kubernetes")).status_code == 403


def test_in_a_circle_one_cannot_endorse_someone_who_did_not_teach_them(circle):
    awa, kwame, _, _ = circle

    # Awa apprend React à Kwame : c'est Kwame qui peut valider Awa, pas l'inverse.
    assert endorse(awa, skill_of(kwame, "FastAPI")).status_code == 403
    assert endorse(kwame, skill_of(awa, "React")).status_code == 201


def test_a_circle_that_is_not_active_is_not_enough(circle):
    awa, _, imani, record = circle
    record.status = Circle.Status.PROPOSED
    record.save()

    assert endorse(awa, skill_of(imani, "Docker")).status_code == 403


# --- Candidats ------------------------------------------------------------------


def test_candidates_list_who_i_can_endorse_and_what(pair, circle):
    ada, kofi = pair
    exchange(ada, kofi)
    endorsed = endorse(ada, skill_of(kofi, "Docker")).json()

    [candidate] = client_for(ada).get(CANDIDATES).json()["results"]

    assert candidate["user"] == {"id": kofi.pk, "full_name": "Kofi", "country": "GH"}
    assert candidate["context"] == "EXCHANGE"
    assert [(s["name"], s["endorsement"]) for s in candidate["skills"]] == [
        ("Docker", endorsed["id"]),
        ("Python", None),
    ]


def test_candidates_in_a_circle_offer_only_the_taught_skill(circle):
    awa, _, imani, _ = circle

    [candidate] = client_for(awa).get(CANDIDATES).json()["results"]

    assert candidate["user"]["id"] == imani.pk
    assert [s["name"] for s in candidate["skills"]] == ["Docker"]


def test_without_any_shared_work_there_is_no_candidate(pair):
    ada, _ = pair

    assert client_for(ada).get(CANDIDATES).json()["results"] == []


# --- Retirer, afficher ---------------------------------------------------------------


def test_an_endorsement_can_be_withdrawn_by_its_author_only(pair):
    ada, kofi = pair
    exchange(ada, kofi)
    endorsement_id = endorse(ada, skill_of(kofi, "Python")).json()["id"]

    assert client_for(kofi).delete(f"{ENDORSE}{endorsement_id}/").status_code == 404
    assert client_for(ada).delete(f"{ENDORSE}{endorsement_id}/").status_code == 204
    assert not SkillEndorsement.objects.exists()


def test_endorsements_appear_on_the_public_profile(pair):
    ada, kofi = pair
    exchange(ada, kofi)
    endorse(ada, skill_of(kofi, "Python"), "Patient et clair.")

    body = APIClient().get(f"/api/v1/users/{kofi.pk}/").json()

    python = next(s for s in body["skills"]["offered"] if s["skill"]["name"] == "Python")
    assert [(e["by"]["full_name"], e["comment"]) for e in python["endorsements"]] == [
        ("Ada", "Patient et clair.")
    ]
    docker = next(s for s in body["skills"]["offered"] if s["skill"]["name"] == "Docker")
    assert docker["endorsements"] == []


def test_removing_a_skill_removes_its_endorsements(pair):
    ada, kofi = pair
    exchange(ada, kofi)
    endorse(ada, skill_of(kofi, "Python"))

    client_for(kofi).delete(f"/api/v1/me/skills/{skill_of(kofi, 'Python').pk}/")

    assert not SkillEndorsement.objects.exists()
