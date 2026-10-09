"""Tests de l'observatoire des compétences : des comptes, jamais de nom."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

URL = "/api/v1/observatory/"


def make_user(name, country, *, offered=(), wanted=(), active=True):
    user = User.objects.create_user(f"{name.lower()}@example.org", "mot-de-passe-solide-2026", full_name=name)
    user.is_active = active
    user.save(update_fields=["is_active"])
    Profile.objects.create(user=user, country=country)
    for skill in offered:
        UserSkill.objects.create(
            user=user, skill=Skill.objects.get(name=skill), kind="OFFERED", level="ADVANCED"
        )
    for skill in wanted:
        UserSkill.objects.create(user=user, skill=Skill.objects.get(name=skill), kind="WANTED")
    return user


@pytest.fixture
def continent():
    make_user("Awa", "SN", offered=["React"], wanted=["Docker"])
    make_user("Moussa", "SN", offered=["React"], wanted=["Docker", "Kubernetes"])
    make_user("Imani", "KE", offered=["Docker"], wanted=["React"])
    make_user("Kwame", "GH", offered=["Docker", "Python"])
    make_user("Fatou", "CI", wanted=["Kubernetes"])


def get():
    return APIClient().get(URL).json()


def test_the_observatory_is_public(continent):
    assert APIClient().get(URL).status_code == 200


def test_totals_count_developers_countries_and_declarations(continent):
    assert get()["totals"] == {"developers": 5, "countries": 4, "offered": 5, "wanted": 5}


def test_each_skill_counts_who_offers_it_and_who_wants_it(continent):
    skills = {item["name"]: (item["offered"], item["wanted"]) for item in get()["skills"]}

    assert skills == {"Docker": (2, 2), "React": (2, 1), "Kubernetes": (0, 2), "Python": (1, 0)}


def test_skills_are_sorted_by_activity(continent):
    names = [item["name"] for item in get()["skills"]]

    assert names[:2] == ["Docker", "React"]


def test_shortages_are_the_skills_wanted_more_than_offered(continent):
    assert [(s["name"], s["offered"], s["wanted"]) for s in get()["shortages"]] == [("Kubernetes", 0, 2)]


def test_surpluses_are_the_skills_offered_more_than_wanted(continent):
    # Même excédent (+1) : à égalité, la plus proposée d'abord (React 2, Python 1).
    assert [s["name"] for s in get()["surpluses"]] == ["React", "Python"]


def test_a_bridge_links_a_country_that_wants_a_skill_to_those_that_offer_it(continent):
    bridges = {
        (b["skill"], b["wanted_in"]["code"]): [c["code"] for c in b["offered_in"]] for b in get()["bridges"]
    }

    # Le Sénégal cherche Docker, que le Kenya et le Ghana proposent.
    assert bridges[("Docker", "SN")] == ["GH", "KE"]
    # Le Kenya cherche React, proposé au Sénégal.
    assert bridges[("React", "KE")] == ["SN"]
    # Personne ne propose Kubernetes : pas de pont.
    assert not any(skill == "Kubernetes" for skill, _ in bridges)


def test_a_country_is_never_its_own_bridge():
    make_user("Awa", "SN", offered=["React"])
    make_user("Moussa", "SN", wanted=["React"])

    assert get()["bridges"] == []


def test_bridges_carry_country_names_and_flags(continent):
    bridge = next(b for b in get()["bridges"] if b["skill"] == "React")

    assert bridge["wanted_in"] == {"code": "KE", "name": "Kenya", "flag": "🇰🇪"}


def test_no_name_or_email_ever_leaves_the_observatory(continent):
    body = str(get())

    for secret in ("Awa", "Moussa", "Imani", "Kwame", "Fatou", "@example.org"):
        assert secret not in body


def test_deactivated_accounts_are_not_counted(continent):
    make_user("Ancien", "TG", offered=["Linux"], active=False)

    body = get()

    assert body["totals"]["developers"] == 5
    assert "Linux" not in {item["name"] for item in body["skills"]}


def test_an_empty_platform_gives_an_empty_observatory():
    assert get() == {
        "totals": {"developers": 0, "countries": 0, "offered": 0, "wanted": 0},
        "skills": [],
        "shortages": [],
        "surpluses": [],
        "bridges": [],
    }


def test_the_query_count_does_not_grow_with_the_data(continent, django_assert_max_num_queries):
    client = APIClient()
    with django_assert_max_num_queries(3):
        client.get(URL)

    for index in range(10):
        make_user(f"Dev{index}", "NG", offered=["Linux"], wanted=["Python"])
    with django_assert_max_num_queries(3):
        client.get(URL)
