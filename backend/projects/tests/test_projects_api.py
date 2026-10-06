"""Tests de l'API projets (DL-16) et des demandes pour rejoindre (DL-17).

Critères de DL-16 : seul le propriétaire modifie ou supprime, filtres pays,
technologie et statut, URLs en https.
Critères de DL-17 : une seule demande en attente par personne et par projet, le
propriétaire ne voit que les demandes de ses projets.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from profiles.models import Profile
from projects.models import Project, ProjectJoinRequest
from skills.models import Skill

User = get_user_model()
pytestmark = pytest.mark.django_db

PROJECTS = "/api/v1/projects/"


def make_user(email="ada@example.org", country="SN"):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name="Ada")
    Profile.objects.create(user=user, country=country)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_project(owner, title="Agri-Data", status="OPEN", needs=()):
    project = Project.objects.create(owner=owner, title=title, status=status, description="Texte.")
    if needs:
        project.needs.set(Skill.objects.filter(name__in=needs))
    return project


# --- Lecture ----------------------------------------------------------------


def test_the_project_list_is_public_and_paginated():
    make_project(make_user())

    response = APIClient().get(PROJECTS)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert {"id", "title", "status", "needs", "owner"} <= set(body["results"][0])


def test_the_list_exposes_the_owner_without_their_email():
    make_project(make_user("kofi@example.org"))

    owner = APIClient().get(PROJECTS).json()["results"][0]["owner"]

    assert "email" not in owner
    assert owner["full_name"] == "Ada"


def test_a_project_detail_is_public():
    project = make_project(make_user())

    response = APIClient().get(f"{PROJECTS}{project.pk}/")

    assert response.status_code == 200
    assert response.json()["title"] == "Agri-Data"


def test_an_unknown_project_is_404():
    assert APIClient().get(f"{PROJECTS}999999/").status_code == 404


def test_the_list_avoids_n_plus_one_queries(django_assert_num_queries):
    owner = make_user()
    for index in range(5):
        make_project(owner, title=f"Projet {index}", needs=["Python", "Docker"])

    # 3 requêtes constantes : le compte total, la page de projets (propriétaire
    # et profil joints, demandes en attente annotées), puis les compétences
    # préchargées. Aucune requête par projet.
    with django_assert_num_queries(3):
        APIClient().get(PROJECTS)

    # Trois fois plus de projets : le nombre de requêtes ne change pas.
    for index in range(5, 15):
        make_project(owner, title=f"Projet {index}", needs=["Python", "Docker"])

    with django_assert_num_queries(3):
        APIClient().get(PROJECTS)


# --- Filtres ----------------------------------------------------------------


def test_projects_can_be_filtered_by_status():
    owner = make_user()
    make_project(owner, title="Ouvert", status="OPEN")
    make_project(owner, title="Fermé", status="CLOSED")

    body = APIClient().get(PROJECTS, {"status": "OPEN"}).json()

    assert [item["title"] for item in body["results"]] == ["Ouvert"]


def test_projects_can_be_filtered_by_skill_name():
    owner = make_user()
    make_project(owner, title="Avec Python", needs=["Python"])
    make_project(owner, title="Avec Flutter", needs=["Flutter"])

    body = APIClient().get(PROJECTS, {"skill": "Python"}).json()

    assert [item["title"] for item in body["results"]] == ["Avec Python"]


def test_projects_can_be_filtered_by_owner_country():
    make_project(make_user("sn@example.org", country="SN"), title="Sénégal")
    make_project(make_user("ci@example.org", country="CI"), title="Côte d'Ivoire")

    body = APIClient().get(PROJECTS, {"country": "SN"}).json()

    assert [item["title"] for item in body["results"]] == ["Sénégal"]


def test_projects_can_be_searched_by_text():
    owner = make_user()
    Project.objects.create(owner=owner, title="Agri-Data", description="Collecte agricole.")
    Project.objects.create(owner=owner, title="Santé", description="Suivi médical.")

    body = APIClient().get(PROJECTS, {"q": "agricole"}).json()

    assert [item["title"] for item in body["results"]] == ["Agri-Data"]


def test_filters_can_be_combined():
    owner = make_user("sn@example.org", country="SN")
    make_project(owner, title="Bon", status="OPEN", needs=["Python"])
    make_project(owner, title="Fermé", status="CLOSED", needs=["Python"])

    body = APIClient().get(PROJECTS, {"status": "OPEN", "skill": "Python", "country": "SN"}).json()

    assert [item["title"] for item in body["results"]] == ["Bon"]


def test_an_unknown_status_filter_is_refused():
    assert APIClient().get(PROJECTS, {"status": "INCONNU"}).status_code == 400


# --- Création ---------------------------------------------------------------


def test_a_project_can_be_created():
    user = make_user()
    python = Skill.objects.get(name="Python")

    response = client_for(user).post(
        PROJECTS,
        {
            "title": "Agri-Data",
            "description": "Collecte de données agricoles.",
            "needs": [python.pk],
            "status": "OPEN",
            "repo_url": "https://example.org/depot",
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Agri-Data"
    assert [need["name"] for need in body["needs"]] == ["Python"]
    assert Project.objects.get().owner == user


def test_creating_a_project_requires_authentication():
    assert APIClient().post(PROJECTS, {"title": "X"}, format="json").status_code == 401


def test_the_owner_cannot_be_forced_in_the_payload():
    user = make_user()
    other = make_user("kofi@example.org")

    response = client_for(user).post(PROJECTS, {"title": "Agri-Data", "owner": other.pk}, format="json")

    assert response.status_code == 400


@pytest.mark.parametrize("title", ["", "   ", "x" * 151])
def test_an_invalid_title_is_refused(title):
    user = make_user()

    response = client_for(user).post(PROJECTS, {"title": title}, format="json")

    assert response.status_code == 400
    assert "title" in response.json()["errors"]


def test_a_description_that_is_too_long_is_refused():
    user = make_user()

    response = client_for(user).post(
        PROJECTS, {"title": "Agri-Data", "description": "x" * 5001}, format="json"
    )

    assert response.status_code == 400
    assert "description" in response.json()["errors"]


@pytest.mark.parametrize("field", ["repo_url", "demo_url"])
def test_a_project_url_must_be_https(field):
    user = make_user()

    response = client_for(user).post(
        PROJECTS, {"title": "Agri-Data", field: "http://example.org"}, format="json"
    )

    assert response.status_code == 400
    assert field in response.json()["errors"]


# --- Modification et suppression -------------------------------------------


def test_the_owner_can_update_their_project():
    user = make_user()
    project = make_project(user)

    response = client_for(user).patch(f"{PROJECTS}{project.pk}/", {"status": "IN_PROGRESS"}, format="json")

    assert response.status_code == 200
    project.refresh_from_db()
    assert project.status == "IN_PROGRESS"


def test_another_user_cannot_update_a_project():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    intruder = make_user("ada@example.org")

    response = client_for(intruder).patch(f"{PROJECTS}{project.pk}/", {"title": "Piraté"}, format="json")

    assert response.status_code == 403
    project.refresh_from_db()
    assert project.title == "Agri-Data"


def test_the_owner_can_delete_their_project():
    user = make_user()
    project = make_project(user)

    assert client_for(user).delete(f"{PROJECTS}{project.pk}/").status_code == 204
    assert not Project.objects.filter(pk=project.pk).exists()


def test_another_user_cannot_delete_a_project():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    intruder = make_user("ada@example.org")

    assert client_for(intruder).delete(f"{PROJECTS}{project.pk}/").status_code == 403
    assert Project.objects.filter(pk=project.pk).exists()


def test_an_anonymous_user_cannot_modify_a_project():
    project = make_project(make_user())

    assert APIClient().patch(f"{PROJECTS}{project.pk}/", {"title": "X"}, format="json").status_code == 401


# --- Demandes pour rejoindre (DL-17) ---------------------------------------


def test_a_user_can_request_to_join():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")

    response = client_for(applicant).post(
        f"{PROJECTS}{project.pk}/join/", {"message": "Je peux aider sur Docker."}, format="json"
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PENDING"
    assert body["applicant"]["full_name"] == "Ada"


def test_a_second_pending_request_is_a_conflict():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    client = client_for(applicant)
    client.post(f"{PROJECTS}{project.pk}/join/", {"message": "Première."}, format="json")

    response = client.post(f"{PROJECTS}{project.pk}/join/", {"message": "Deuxième."}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_request"
    assert ProjectJoinRequest.objects.count() == 1


def test_a_new_request_is_possible_after_a_refusal():
    """Un refus ne doit pas interdire une candidature ultérieure."""
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    client = client_for(applicant)
    client.post(f"{PROJECTS}{project.pk}/join/", {"message": "Première."}, format="json")
    ProjectJoinRequest.objects.update(status="DECLINED")

    response = client.post(f"{PROJECTS}{project.pk}/join/", {"message": "Je réessaie."}, format="json")

    assert response.status_code == 201


def test_the_owner_cannot_join_their_own_project():
    owner = make_user()
    project = make_project(owner)

    response = client_for(owner).post(
        f"{PROJECTS}{project.pk}/join/", {"message": "Moi-même."}, format="json"
    )

    assert response.status_code == 400
    assert ProjectJoinRequest.objects.count() == 0


def test_the_join_message_is_required():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")

    response = client_for(applicant).post(f"{PROJECTS}{project.pk}/join/", {}, format="json")

    assert response.status_code == 400
    assert "message" in response.json()["errors"]


def test_the_owner_sees_the_requests_of_their_project():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    response = client_for(owner).get(f"{PROJECTS}{project.pk}/join-requests/")

    assert response.status_code == 200
    assert response.json()["count"] == 1


def test_a_non_owner_cannot_list_the_requests():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    intruder = make_user("ada@example.org")

    assert client_for(intruder).get(f"{PROJECTS}{project.pk}/join-requests/").status_code == 404


def test_the_owner_can_accept_a_request():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    request = ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    response = client_for(owner).patch(
        f"/api/v1/join-requests/{request.pk}/", {"status": "ACCEPTED"}, format="json"
    )

    assert response.status_code == 200
    request.refresh_from_db()
    assert request.status == "ACCEPTED"


def test_the_applicant_cannot_accept_their_own_request():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    request = ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    response = client_for(applicant).patch(
        f"/api/v1/join-requests/{request.pk}/", {"status": "ACCEPTED"}, format="json"
    )

    assert response.status_code == 404
    request.refresh_from_db()
    assert request.status == "PENDING"


def test_an_already_handled_request_cannot_be_changed_again():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    request = ProjectJoinRequest.objects.create(
        project=project, applicant=applicant, message="Bonjour.", status="ACCEPTED"
    )

    response = client_for(owner).patch(
        f"/api/v1/join-requests/{request.pk}/", {"status": "DECLINED"}, format="json"
    )

    assert response.status_code == 409


@pytest.mark.parametrize("status_value", ["PENDING", "INCONNU", ""])
def test_only_accepted_or_declined_are_allowed(status_value):
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    request = ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    response = client_for(owner).patch(
        f"/api/v1/join-requests/{request.pk}/", {"status": status_value}, format="json"
    )

    assert response.status_code == 400


def test_the_project_detail_shows_the_requests_only_to_its_owner():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    owner_view = client_for(owner).get(f"{PROJECTS}{project.pk}/").json()
    other_view = client_for(applicant).get(f"{PROJECTS}{project.pk}/").json()

    assert len(owner_view["join_requests"]) == 1
    assert "join_requests" not in other_view


def test_the_list_shows_the_number_of_requests():
    owner = make_user("kofi@example.org")
    project = make_project(owner)
    applicant = make_user("ada@example.org")
    ProjectJoinRequest.objects.create(project=project, applicant=applicant, message="Bonjour.")

    body = APIClient().get(PROJECTS).json()

    assert body["results"][0]["join_requests_count"] == 1
