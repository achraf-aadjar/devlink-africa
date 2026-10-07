"""Tests de l'API Dev Match (DL-24) et du retour sur match (DL-39).

Critères de DL-24 : réponse conforme au contrat, match à sens unique plafonné,
recalcul incrémental, pagination.
Critère de DL-39 : un retour par utilisateur et par match, sans effet sur le score.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from matching.models import Match, MatchFeedback
from matching.scoring import ONE_WAY_CAP, WEIGHTS
from matching.services import recompute_for_user
from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

MATCHES = "/api/v1/matches/"


def make_user(email, *, offered=(), wanted=(), name=None):
    user = User.objects.create_user(
        email, "mot-de-passe-solide-2026", full_name=name or email.split("@")[0].title()
    )
    Profile.objects.create(user=user, availability=["MENTORING"], domains=["WEB"], country="SN")
    for skill_name in offered:
        UserSkill.objects.create(
            user=user, skill=Skill.objects.get(name=skill_name), kind="OFFERED", level="ADVANCED"
        )
    for skill_name in wanted:
        UserSkill.objects.create(user=user, skill=Skill.objects.get(name=skill_name), kind="WANTED")
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def pair():
    """Ada enseigne React et veut Python ; Kofi l'inverse."""
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"], name="Ada")
    kofi = make_user("kofi@example.org", offered=["Python"], wanted=["React"], name="Kofi")
    recompute_for_user(ada.pk)
    return ada, kofi, Match.objects.get()


# --- Liste ------------------------------------------------------------------


def test_the_list_returns_my_matches(pair):
    ada, kofi, _ = pair

    response = client_for(ada).get(MATCHES)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["user"]["id"] == kofi.pk
    assert body["results"][0]["score"] > 80


def test_the_list_describes_the_partner_from_my_point_of_view(pair):
    """Chacun voit l'autre, jamais lui-même."""
    ada, kofi, _ = pair

    ada_view = client_for(ada).get(MATCHES).json()["results"][0]
    kofi_view = client_for(kofi).get(MATCHES).json()["results"][0]

    assert ada_view["user"]["full_name"] == "Kofi"
    assert kofi_view["user"]["full_name"] == "Ada"


def test_the_list_never_exposes_an_email(pair):
    ada, _, _ = pair

    body = client_for(ada).get(MATCHES).json()

    assert "email" not in body["results"][0]["user"]


def test_the_reasons_are_written_from_my_point_of_view(pair):
    ada, _, _ = pair

    reasons = client_for(ada).get(MATCHES).json()["results"][0]["reasons"]

    assert any("Kofi peut vous apprendre Python" in reason for reason in reasons)


def test_the_reasons_are_mirrored_for_the_other_party(pair):
    _, kofi, _ = pair

    reasons = client_for(kofi).get(MATCHES).json()["results"][0]["reasons"]

    assert any("Ada peut vous apprendre React" in reason for reason in reasons)


def test_the_list_is_sorted_by_decreasing_score():
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python", "Docker"])
    make_user("best@example.org", offered=["Python", "Docker"], wanted=["React"])
    make_user("good@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)

    scores = [item["score"] for item in client_for(ada).get(MATCHES).json()["results"]]

    assert scores == sorted(scores, reverse=True)


def test_the_list_is_paginated():
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    for index in range(25):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)

    body = client_for(ada).get(MATCHES).json()

    assert body["count"] == 25
    assert len(body["results"]) == 20
    assert body["next"] is not None


def test_the_list_only_shows_my_own_matches(pair):
    _, _, _ = pair
    stranger = make_user("x@example.org")

    assert client_for(stranger).get(MATCHES).json()["count"] == 0


def test_the_list_requires_authentication():
    assert APIClient().get(MATCHES).status_code == 401


def test_an_empty_list_is_not_an_error():
    lonely = make_user("seul@example.org", offered=["Python"])

    response = client_for(lonely).get(MATCHES)

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_the_list_avoids_n_plus_one_queries(django_assert_num_queries):
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    for index in range(5):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)
    client = client_for(ada)

    with django_assert_num_queries(2):
        client.get(MATCHES)

    for index in range(5, 15):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)

    with django_assert_num_queries(2):
        client.get(MATCHES)


# --- Détail -----------------------------------------------------------------


def test_the_detail_gives_the_breakdown_by_criterion(pair):
    ada, _, match = pair

    response = client_for(ada).get(f"{MATCHES}{match.pk}/")

    assert response.status_code == 200
    explanation = response.json()["explanation"]
    assert {item["criterion"] for item in explanation["breakdown"]} == set(WEIGHTS)
    for item in explanation["breakdown"]:
        assert {"criterion", "label", "weight", "points"} <= set(item)


def test_the_breakdown_sums_to_the_score(pair):
    """L'explication affichée doit être vérifiable par l'utilisateur."""
    ada, _, match = pair

    body = client_for(ada).get(f"{MATCHES}{match.pk}/").json()

    total = sum(item["points"] for item in body["explanation"]["breakdown"])
    assert total == pytest.approx(body["score"], abs=0.05)


def test_the_detail_says_who_teaches_what(pair):
    ada, _, match = pair

    explanation = client_for(ada).get(f"{MATCHES}{match.pk}/").json()["explanation"]

    assert [item["name"] for item in explanation["they_can_teach_you"]] == ["Python"]
    assert [item["name"] for item in explanation["you_can_teach_them"]] == ["React"]


def test_the_direction_is_reversed_for_the_other_party(pair):
    """Le point clé : chacun voit « il peut m'apprendre » correctement."""
    _, kofi, match = pair

    explanation = client_for(kofi).get(f"{MATCHES}{match.pk}/").json()["explanation"]

    assert [item["name"] for item in explanation["they_can_teach_you"]] == ["React"]
    assert [item["name"] for item in explanation["you_can_teach_them"]] == ["Python"]


def test_a_one_way_match_is_flagged_and_capped():
    learner = make_user("apprenant@example.org", wanted=["Python"])
    make_user("prof@example.org", offered=["Python"])
    recompute_for_user(learner.pk)
    match = Match.objects.get()

    body = client_for(learner).get(f"{MATCHES}{match.pk}/").json()

    assert body["score"] <= ONE_WAY_CAP
    assert body["explanation"]["you_can_teach_them"] == []
    assert any("sens unique" in reason for reason in body["explanation"]["reasons"])


def test_the_detail_of_someone_elses_match_is_404(pair):
    _, _, match = pair
    stranger = make_user("x@example.org")

    assert client_for(stranger).get(f"{MATCHES}{match.pk}/").status_code == 404


def test_an_unknown_match_is_404():
    user = make_user("ada@example.org")

    assert client_for(user).get(f"{MATCHES}999999/").status_code == 404


def test_the_detail_requires_authentication(pair):
    _, _, match = pair

    assert APIClient().get(f"{MATCHES}{match.pk}/").status_code == 401


# --- Recalcul ---------------------------------------------------------------


def test_the_score_changes_when_skills_change(pair):
    ada, _, match = pair
    before = client_for(ada).get(f"{MATCHES}{match.pk}/").json()["score"]

    # Ada n'apprend plus rien à Kofi : l'échange devient à sens unique.
    UserSkill.objects.filter(user=ada, kind="OFFERED").delete()
    recompute_for_user(ada.pk)

    after = client_for(ada).get(f"{MATCHES}{match.pk}/").json()["score"]
    assert after < before


# --- Retour sur un match (DL-39) -------------------------------------------


def test_a_feedback_can_be_given(pair):
    ada, _, match = pair

    response = client_for(ada).post(
        f"{MATCHES}{match.pk}/feedback/",
        {"is_relevant": True, "comment": "Profil très proche de ce que je cherche."},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["is_relevant"] is True
    assert MatchFeedback.objects.count() == 1


def test_the_comment_is_optional(pair):
    ada, _, match = pair

    response = client_for(ada).post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": False}, format="json")

    assert response.status_code == 201


def test_only_one_feedback_per_user_and_match(pair):
    ada, _, match = pair
    client = client_for(ada)
    client.post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": True}, format="json")

    response = client.post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": False}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_feedback"
    assert MatchFeedback.objects.count() == 1


def test_both_parties_can_each_give_their_own_feedback(pair):
    ada, kofi, match = pair

    first = client_for(ada).post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": True}, format="json")
    second = client_for(kofi).post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": False}, format="json")

    assert first.status_code == 201
    assert second.status_code == 201
    assert MatchFeedback.objects.count() == 2


def test_the_feedback_does_not_change_the_score(pair):
    """Critère de DL-39 : aucun impact sur le score du MVP."""
    ada, _, match = pair
    before = match.score

    client_for(ada).post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": False}, format="json")

    match.refresh_from_db()
    assert match.score == before


def test_my_feedback_appears_in_the_detail(pair):
    ada, _, match = pair
    client = client_for(ada)
    client.post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": True, "comment": "Utile."}, format="json")

    body = client.get(f"{MATCHES}{match.pk}/").json()

    assert body["my_feedback"]["is_relevant"] is True
    assert body["my_feedback"]["comment"] == "Utile."


def test_the_detail_shows_no_feedback_before_one_is_given(pair):
    ada, _, match = pair

    assert client_for(ada).get(f"{MATCHES}{match.pk}/").json()["my_feedback"] is None


def test_i_do_not_see_the_feedback_of_the_other_party(pair):
    ada, kofi, match = pair
    client_for(kofi).post(f"{MATCHES}{match.pk}/feedback/", {"is_relevant": False}, format="json")

    assert client_for(ada).get(f"{MATCHES}{match.pk}/").json()["my_feedback"] is None


def test_a_feedback_on_someone_elses_match_is_404(pair):
    _, _, match = pair
    stranger = make_user("x@example.org")

    response = client_for(stranger).post(
        f"{MATCHES}{match.pk}/feedback/", {"is_relevant": True}, format="json"
    )

    assert response.status_code == 404
    assert MatchFeedback.objects.count() == 0


def test_is_relevant_is_required(pair):
    ada, _, match = pair

    response = client_for(ada).post(f"{MATCHES}{match.pk}/feedback/", {}, format="json")

    assert response.status_code == 400
    assert "is_relevant" in response.json()["errors"]


def test_a_comment_that_is_too_long_is_refused(pair):
    ada, _, match = pair

    response = client_for(ada).post(
        f"{MATCHES}{match.pk}/feedback/",
        {"is_relevant": True, "comment": "x" * 501},
        format="json",
    )

    assert response.status_code == 400
