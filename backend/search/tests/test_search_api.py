"""Tests de la recherche (DL-25) et de l'exploration par pays (DL-38).

Critères de DL-25 : combinaison de filtres, résultats paginés, aucune fonction
propre à PostgreSQL (les tests tournent aussi sur SQLite, ce qui le prouve).
Critères de DL-38 : statistiques calculées en base, message clair sans donnée.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from profiles.models import Profile
from projects.models import Project
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

USERS = "/api/v1/search/users/"
PROJECTS = "/api/v1/search/projects/"
COUNTRIES = "/api/v1/countries/"


def make_user(
    email,
    *,
    name=None,
    country="SN",
    bio="",
    offered=(),
    wanted=(),
    availability=("MENTORING",),
    domains=("WEB",),
    is_demo=False,
    level="ADVANCED",
):
    user = User.objects.create_user(
        email, "mot-de-passe-solide-2026", full_name=name or email.split("@")[0].title()
    )
    Profile.objects.create(
        user=user,
        country=country,
        bio=bio,
        availability=list(availability),
        domains=list(domains),
        is_demo=is_demo,
    )
    for skill_name in offered:
        UserSkill.objects.create(
            user=user, skill=Skill.objects.get(name=skill_name), kind="OFFERED", level=level
        )
    for skill_name in wanted:
        UserSkill.objects.create(user=user, skill=Skill.objects.get(name=skill_name), kind="WANTED")
    return user


# --- Recherche d'utilisateurs ----------------------------------------------


def test_the_search_is_public_and_paginated():
    make_user("ada@example.org")

    response = APIClient().get(USERS)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert {"id", "full_name", "country", "offered_skills"} <= set(body["results"][0])


def test_the_search_never_exposes_an_email():
    make_user("ada@example.org")

    assert "email" not in APIClient().get(USERS).json()["results"][0]


def test_inactive_users_are_excluded():
    user = make_user("ada@example.org")
    User.objects.filter(pk=user.pk).update(is_active=False)

    assert APIClient().get(USERS).json()["count"] == 0


def test_search_by_name():
    make_user("ada@example.org", name="Ada Lovelace")
    make_user("kofi@example.org", name="Kofi Mensah")

    body = APIClient().get(USERS, {"q": "lovelace"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Ada Lovelace"]


def test_search_by_bio():
    make_user("ada@example.org", name="Ada", bio="Je fais du backend à Dakar.")
    make_user("kofi@example.org", name="Kofi", bio="Design mobile.")

    body = APIClient().get(USERS, {"q": "backend"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Ada"]


def test_search_ignores_case():
    make_user("ada@example.org", name="Ada Lovelace")

    assert APIClient().get(USERS, {"q": "LOVELACE"}).json()["count"] == 1


def test_filter_by_country():
    make_user("sn@example.org", name="Sénégalaise", country="SN")
    make_user("ci@example.org", name="Ivoirien", country="CI")

    body = APIClient().get(USERS, {"country": "SN"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Sénégalaise"]


def test_filter_by_offered_skill_name():
    make_user("py@example.org", name="Pythoniste", offered=["Python"])
    make_user("js@example.org", name="Reacteur", offered=["React"])

    body = APIClient().get(USERS, {"skill": "Python"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Pythoniste"]


def test_filter_by_offered_skill_id():
    make_user("py@example.org", name="Pythoniste", offered=["Python"])
    python = Skill.objects.get(name="Python")

    assert APIClient().get(USERS, {"skill": str(python.pk)}).json()["count"] == 1


def test_filter_by_wanted_skill():
    make_user("veut@example.org", name="Apprenant", wanted=["Docker"])
    make_user("sait@example.org", name="Expert", offered=["Docker"])

    body = APIClient().get(USERS, {"skill_wanted": "Docker"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Apprenant"]


def test_filter_by_level():
    make_user("avance@example.org", name="Avancée", offered=["Python"], level="ADVANCED")
    make_user("debut@example.org", name="Débutant", offered=["Python"], level="BEGINNER")

    body = APIClient().get(USERS, {"level": "ADVANCED"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Avancée"]


def test_filter_by_availability():
    make_user("mentor@example.org", name="Mentor", availability=["MENTORING"])
    make_user("free@example.org", name="Freelance", availability=["FREELANCE"])

    body = APIClient().get(USERS, {"availability": "MENTORING"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Mentor"]


def test_filter_by_domain():
    make_user("web@example.org", name="Web", domains=["WEB"])
    make_user("data@example.org", name="Data", domains=["DATA"])

    body = APIClient().get(USERS, {"domain": "DATA"}).json()

    assert [item["full_name"] for item in body["results"]] == ["Data"]


def test_filter_by_demo_flag():
    make_user("demo@example.org", name="Démo", is_demo=True)
    make_user("vrai@example.org", name="Vrai", is_demo=False)

    assert APIClient().get(USERS, {"is_demo": "true"}).json()["count"] == 1
    assert APIClient().get(USERS, {"is_demo": "false"}).json()["count"] == 1


def test_filters_can_be_combined():
    """Critère de DL-25 : combinaison de filtres."""
    make_user(
        "bon@example.org",
        name="Cherché",
        country="SN",
        offered=["Python"],
        wanted=["React"],
        availability=["MENTORING"],
        domains=["WEB"],
    )
    make_user("autre@example.org", name="Autre", country="CI", offered=["Python"])

    body = (
        APIClient()
        .get(
            USERS,
            {
                "country": "SN",
                "skill": "Python",
                "skill_wanted": "React",
                "availability": "MENTORING",
                "domain": "WEB",
            },
        )
        .json()
    )

    assert [item["full_name"] for item in body["results"]] == ["Cherché"]


def test_a_user_appears_only_once_despite_several_skills():
    """Sans distinct(), une jointure multiple dupliquerait les lignes."""
    make_user("ada@example.org", offered=["Python", "Docker", "Linux"])

    assert APIClient().get(USERS).json()["count"] == 1


def test_results_are_paginated():
    for index in range(25):
        make_user(f"dev{index}@example.org", name=f"Dev {index:02d}")

    body = APIClient().get(USERS).json()

    assert body["count"] == 25
    assert len(body["results"]) == 20


@pytest.mark.parametrize(
    "params",
    [
        {"country": "XX"},
        {"level": "EXPERT"},
        {"availability": "INCONNU"},
        {"domain": "COBOL"},
    ],
)
def test_an_invalid_filter_is_refused(params):
    assert APIClient().get(USERS, params).status_code == 400


def test_an_empty_result_is_not_an_error():
    response = APIClient().get(USERS, {"q": "personne-de-ce-nom"})

    assert response.status_code == 200
    assert response.json()["results"] == []


def test_the_search_avoids_n_plus_one_queries(django_assert_num_queries):
    for index in range(5):
        make_user(f"dev{index}@example.org", offered=["Python", "Docker"], wanted=["React"])

    with django_assert_num_queries(3):
        APIClient().get(USERS)

    for index in range(5, 15):
        make_user(f"dev{index}@example.org", offered=["Python", "Docker"], wanted=["React"])

    with django_assert_num_queries(3):
        APIClient().get(USERS)


# --- Recherche de projets ---------------------------------------------------


def test_project_search_is_public():
    owner = make_user("ada@example.org")
    Project.objects.create(owner=owner, title="Agri-Data", description="Collecte agricole.")

    response = APIClient().get(PROJECTS)

    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_project_search_by_text():
    owner = make_user("ada@example.org")
    Project.objects.create(owner=owner, title="Agri-Data", description="Collecte agricole.")
    Project.objects.create(owner=owner, title="Santé", description="Suivi médical.")

    body = APIClient().get(PROJECTS, {"q": "médical"}).json()

    assert [item["title"] for item in body["results"]] == ["Santé"]


def test_project_search_by_skill_and_status():
    owner = make_user("ada@example.org")
    wanted = Project.objects.create(owner=owner, title="Cherché", status="OPEN")
    wanted.needs.set([Skill.objects.get(name="Python")])
    other = Project.objects.create(owner=owner, title="Fermé", status="CLOSED")
    other.needs.set([Skill.objects.get(name="Python")])

    body = APIClient().get(PROJECTS, {"skill": "Python", "status": "OPEN"}).json()

    assert [item["title"] for item in body["results"]] == ["Cherché"]


def test_project_search_by_owner_country():
    sn = make_user("sn@example.org", country="SN")
    ci = make_user("ci@example.org", country="CI")
    Project.objects.create(owner=sn, title="Sénégal")
    Project.objects.create(owner=ci, title="Côte d'Ivoire")

    body = APIClient().get(PROJECTS, {"country": "SN"}).json()

    assert [item["title"] for item in body["results"]] == ["Sénégal"]


def test_an_invalid_project_status_is_refused():
    assert APIClient().get(PROJECTS, {"status": "INCONNU"}).status_code == 400


# --- Exploration par pays (DL-38) ------------------------------------------


def test_the_country_list_counts_developers_and_projects():
    ada = make_user("ada@example.org", country="SN")
    make_user("fatou@example.org", country="SN")
    make_user("kofi@example.org", country="GH")
    Project.objects.create(owner=ada, title="Agri-Data")

    body = APIClient().get(COUNTRIES).json()

    by_code = {item["code"]: item for item in body["results"]}
    assert by_code["SN"]["developers_count"] == 2
    assert by_code["SN"]["projects_count"] == 1
    assert by_code["GH"]["developers_count"] == 1


def test_the_country_list_includes_names_and_flags():
    make_user("ada@example.org", country="SN")

    item = APIClient().get(COUNTRIES).json()["results"][0]

    assert item["name"] == "Sénégal"
    assert item["flag"] == "🇸🇳"


def test_countries_without_a_profile_country_are_ignored():
    make_user("sans@example.org", country="")

    assert APIClient().get(COUNTRIES).json()["results"] == []


def test_the_country_detail_lists_developers_projects_and_top_skills():
    ada = make_user("ada@example.org", country="SN", offered=["Python"])
    make_user("fatou@example.org", country="SN", offered=["Python", "Docker"])
    Project.objects.create(owner=ada, title="Agri-Data")

    body = APIClient().get(f"{COUNTRIES}SN/").json()

    assert body["developers_count"] == 2
    assert body["projects_count"] == 1
    assert body["top_skills"][0]["name"] == "Python"
    assert body["top_skills"][0]["count"] == 2
    assert len(body["developers"]) == 2


def test_a_country_without_data_returns_zeros_not_an_error():
    """Critère de DL-38 : un pays sans donnée doit donner un message clair."""
    response = APIClient().get(f"{COUNTRIES}TD/")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Tchad"
    assert body["developers_count"] == 0
    assert body["developers"] == []


def test_an_unknown_country_code_is_refused():
    assert APIClient().get(f"{COUNTRIES}XX/").status_code == 400


def test_the_country_code_is_case_insensitive():
    make_user("ada@example.org", country="SN")

    assert APIClient().get(f"{COUNTRIES}sn/").json()["developers_count"] == 1


def test_the_country_choices_list_covers_all_allowed_countries():
    """Le formulaire de profil a besoin de tous les pays, pas seulement
    de ceux qui comptent déjà un habitant."""
    response = APIClient().get(f"{COUNTRIES}all/")

    assert response.status_code == 200
    results = response.json()["results"]
    codes = {item["code"] for item in results}
    assert "SN" in codes and "TD" in codes
    assert len(results) > 50
    assert all(item["name"] and item["flag"] for item in results)


def test_the_country_choices_are_sorted_by_name():
    results = APIClient().get(f"{COUNTRIES}all/").json()["results"]

    names = [item["name"] for item in results]
    assert names == sorted(names)
