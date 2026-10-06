"""Tests du tableau de bord agrégé (DL-28).

Critères du ticket : une seule requête côté client, réponse sous 300 ms.
On vérifie donc qu'un seul appel suffit, et que le nombre de requêtes SQL ne
croît pas avec le volume de données.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from exchanges.models import Exchange
from matching.services import recompute_for_user
from profiles.models import Profile
from projects.models import Project, ProjectJoinRequest
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

DASHBOARD = "/api/v1/dashboard/"


def make_user(email, *, offered=(), wanted=(), country="SN"):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name=email.split("@")[0].title())
    Profile.objects.create(
        user=user, country=country, availability=["MENTORING"], domains=["WEB"], bio="Une bio."
    )
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


def test_the_dashboard_returns_every_block():
    user = make_user("ada@example.org", offered=["React"], wanted=["Python"])

    response = client_for(user).get(DASHBOARD)

    assert response.status_code == 200
    body = response.json()
    assert {
        "profile_completeness",
        "recommended_matches",
        "pending_exchanges",
        "pending_join_requests",
        "my_projects",
        "counters",
    } == set(body)


def test_it_requires_authentication():
    assert APIClient().get(DASHBOARD).status_code == 401


def test_the_completeness_is_a_percentage():
    user = make_user("ada@example.org", offered=["React"])

    completeness = client_for(user).get(DASHBOARD).json()["profile_completeness"]

    assert 0 <= completeness <= 100


def test_the_counters_reflect_the_declared_skills():
    user = make_user("ada@example.org", offered=["React", "TypeScript"], wanted=["Python"])

    counters = client_for(user).get(DASHBOARD).json()["counters"]

    assert counters["offered_skills"] == 2
    assert counters["wanted_skills"] == 1


def test_the_recommended_matches_are_sorted_and_limited():
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    for index in range(8):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)

    body = client_for(ada).get(DASHBOARD).json()

    assert len(body["recommended_matches"]) == 5  # aperçu tronqué
    scores = [item["score"] for item in body["recommended_matches"]]
    assert scores == sorted(scores, reverse=True)
    assert body["counters"]["matches"] == 8


def test_the_pending_exchanges_are_split_by_direction():
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    kofi = make_user("kofi@example.org", offered=["Python"], wanted=["React"])
    Exchange.objects.create(requester=ada, partner=kofi, type="MENTORAT", message="Envoyée.")

    ada_view = client_for(ada).get(DASHBOARD).json()["pending_exchanges"]
    kofi_view = client_for(kofi).get(DASHBOARD).json()["pending_exchanges"]

    assert ada_view["sent"] == 1 and ada_view["received"] == 0
    assert kofi_view["received"] == 1 and kofi_view["sent"] == 0


def test_only_pending_exchanges_are_listed():
    ada = make_user("ada@example.org")
    kofi = make_user("kofi@example.org")
    Exchange.objects.create(
        requester=ada, partner=kofi, type="MENTORAT", message="Terminée.", status="COMPLETED"
    )

    body = client_for(ada).get(DASHBOARD).json()

    assert body["pending_exchanges"]["items"] == []


def test_the_join_requests_of_my_projects_are_shown():
    """Critère de DL-17 : la demande est visible dans le tableau de bord."""
    owner = make_user("ada@example.org")
    applicant = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Agri-Data")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    body = client_for(owner).get(DASHBOARD).json()

    assert body["pending_join_requests"]["count"] == 1
    assert body["pending_join_requests"]["items"][0]["applicant"]["full_name"] == "Kofi"


def test_i_do_not_see_the_join_requests_of_other_peoples_projects():
    owner = make_user("ada@example.org")
    applicant = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Agri-Data")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    body = client_for(applicant).get(DASHBOARD).json()

    assert body["pending_join_requests"]["count"] == 0


def test_my_projects_are_listed_with_their_pending_requests():
    owner = make_user("ada@example.org")
    applicant = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Agri-Data")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    projects = client_for(owner).get(DASHBOARD).json()["my_projects"]

    assert [item["title"] for item in projects] == ["Agri-Data"]
    assert projects[0]["join_requests_count"] == 1


def test_an_empty_dashboard_is_not_an_error():
    user = User.objects.create_user("vide@example.org", "mot-de-passe-solide-2026")

    response = client_for(user).get(DASHBOARD)

    assert response.status_code == 200
    body = response.json()
    assert body["recommended_matches"] == []
    assert body["my_projects"] == []
    assert body["profile_completeness"] == 0


def test_the_dashboard_query_count_does_not_grow_with_the_data(django_assert_num_queries):
    """Une seule requête HTTP, et un nombre de requêtes SQL stable."""
    ada = make_user("ada@example.org", offered=["React"], wanted=["Python"])
    for index in range(3):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)
    for index in range(3):
        Project.objects.create(owner=ada, title=f"Projet {index}")
    client = client_for(ada)

    with django_assert_num_queries(11) as captured:
        client.get(DASHBOARD)
    baseline = len(captured)

    # Beaucoup plus de données : le nombre de requêtes doit rester le même.
    for index in range(3, 12):
        make_user(f"dev{index}@example.org", offered=["Python"], wanted=["React"])
    recompute_for_user(ada.pk)
    for index in range(3, 10):
        Project.objects.create(owner=ada, title=f"Projet {index}")

    with django_assert_num_queries(baseline):
        client.get(DASHBOARD)
