"""Parcours de démonstration de bout en bout (DL-54).

Rejoue par l'API les huit étapes présentées au jury. Ce test est le garde-fou du
jalon de la Phase 2 : si la boucle complète cesse de fonctionner, il échoue.

Étapes : 1 le problème, 2 création de profil, 3 compétences (je sais React / je
veux apprendre Docker), 4 Dev Match propose un développeur complémentaire,
5 explication du match, 6 demande d'échange, 7 Project Hub, 8 la vision.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from rest_framework.test import APIClient

from skills.models import Skill

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Le parcours enchaîne les appels : on isole le compteur de débit."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def demo_data():
    """Les données de démonstration, comme devant le jury."""
    call_command("seed_demo", verbosity=0)


def test_le_parcours_de_demonstration_fonctionne_de_bout_en_bout(demo_data):
    client = APIClient()

    # --- Étape 1 : la plateforme est accessible --------------------------
    health = client.get("/api/v1/health/")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    # --- Étape 2 : création d'un profil ----------------------------------
    registration = client.post(
        "/api/v1/auth/register/",
        {
            "email": "jury@example.org",
            "password": "mot-de-passe-du-jury-2026",
            "full_name": "Membre du jury",
            "consent": True,
        },
        format="json",
    )
    assert registration.status_code == 201
    token = registration.json()["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    profile = client.patch(
        "/api/v1/me/",
        {
            "country": "SN",
            "bio": "Je découvre la plateforme pour le concours.",
            "availability": ["MENTORING", "COLLABORATION"],
            "domains": ["WEB"],
        },
        format="json",
    )
    assert profile.status_code == 200
    assert profile.json()["profile"]["country"] == "SN"

    # --- Étape 3 : « je sais React, je veux apprendre Docker » -----------
    react = Skill.objects.get(name="React")
    docker = Skill.objects.get(name="Docker")

    offered = client.post(
        "/api/v1/me/skills/",
        {"skill": react.pk, "kind": "OFFERED", "level": "ADVANCED"},
        format="json",
    )
    assert offered.status_code == 201

    wanted = client.post("/api/v1/me/skills/", {"skill": docker.pk, "kind": "WANTED"}, format="json")
    assert wanted.status_code == 201

    mine = client.get("/api/v1/me/skills/").json()
    assert [entry["skill"]["name"] for entry in mine["offered"]] == ["React"]
    assert [entry["skill"]["name"] for entry in mine["wanted"]] == ["Docker"]

    # --- Étape 4 : Dev Match propose un développeur complémentaire -------
    matches = client.get("/api/v1/matches/").json()
    assert matches["count"] > 0, "Le recalcul doit avoir eu lieu à l'ajout des compétences."

    best = matches["results"][0]
    assert best["score"] > 0
    assert best["reasons"], "Chaque match doit être accompagné de ses raisons."

    # Le meilleur match doit savoir Docker, puisque c'est ce que l'on cherche.
    detail = client.get(f"/api/v1/matches/{best['id']}/").json()
    enseignables = {skill["name"] for skill in detail["explanation"]["they_can_teach_you"]}
    assert "Docker" in enseignables

    # --- Étape 5 : l'explication du match --------------------------------
    explanation = detail["explanation"]
    assert len(explanation["breakdown"]) == 6, "Les six critères doivent être détaillés."

    total = sum(item["points"] for item in explanation["breakdown"])
    assert total == pytest.approx(detail["score"], abs=0.05), (
        "La somme des points doit égaler le score : c'est ce qui rend "
        "l'explication vérifiable par l'utilisateur."
    )
    for item in explanation["breakdown"]:
        assert 0 <= item["points"] <= item["weight"] + 0.01

    assert explanation["reasons"]
    # React est ce que nous savons faire : nous pouvons l'enseigner.
    assert {skill["name"] for skill in explanation["you_can_teach_them"]} <= {
        "React",
        "TypeScript",
    }

    # --- Étape 6 : demande d'échange -------------------------------------
    request = client.post(
        f"/api/v1/matches/{best['id']}/request/",
        {
            "type": "MENTORAT",
            "message": "Bonjour, pouvez-vous m'accompagner sur Docker ?",
            "skill": docker.pk,
        },
        format="json",
    )
    assert request.status_code == 201
    assert request.json()["status"] == "PROPOSED"

    sent = client.get("/api/v1/exchanges/", {"direction": "sent"}).json()
    assert sent["count"] == 1

    # L'autre personne voit la demande et peut l'accepter.
    partner = User.objects.get(pk=best["user"]["id"])
    partner_client = APIClient()
    partner_client.force_authenticate(user=partner)

    received = partner_client.get("/api/v1/exchanges/", {"direction": "received"}).json()
    assert received["count"] == 1

    accepted = partner_client.patch(
        f"/api/v1/exchanges/{received['results'][0]['id']}/",
        {"status": "ACCEPTED"},
        format="json",
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "ACCEPTED"

    # --- Étape 7 : Project Hub -------------------------------------------
    projects = client.get("/api/v1/projects/", {"status": "OPEN"}).json()
    assert projects["count"] > 0, "La démonstration montre des projets ouverts."

    project = projects["results"][0]
    assert project["needs"], "Un projet affiche les compétences qu'il recherche."

    join = client.post(
        f"/api/v1/projects/{project['id']}/join/",
        {"message": "Je peux contribuer sur la partie front-end."},
        format="json",
    )
    assert join.status_code == 201
    assert join.json()["status"] == "PENDING"

    # --- Étape 8 : le tableau de bord résume la vision -------------------
    dashboard = client.get("/api/v1/dashboard/").json()
    assert dashboard["counters"]["matches"] > 0
    assert dashboard["counters"]["offered_skills"] == 1
    assert dashboard["counters"]["wanted_skills"] == 1
    assert dashboard["profile_completeness"] == 100
    assert dashboard["recommended_matches"]


def test_le_parcours_public_fonctionne_sans_compte(demo_data):
    """Avant l'inscription, le jury doit pouvoir explorer la plateforme."""
    client = APIClient()

    assert client.get("/api/v1/health/").status_code == 200
    assert client.get("/api/v1/skills/").json()["count"] == 14

    users = client.get("/api/v1/search/users/").json()
    assert users["count"] == 22
    assert "email" not in users["results"][0], "Aucune adresse e-mail en public."

    projects = client.get("/api/v1/search/projects/").json()
    assert projects["count"] == 8

    countries = client.get("/api/v1/countries/").json()["results"]
    assert len(countries) >= 8
    assert all(country["flag"] for country in countries)

    # Les routes privées restent fermées.
    assert client.get("/api/v1/me/").status_code == 401
    assert client.get("/api/v1/matches/").status_code == 401
    assert client.get("/api/v1/dashboard/").status_code == 401


def test_les_profils_de_demonstration_sont_tous_etiquetes(demo_data):
    """Règle 7 du règlement : aucune confusion possible avec un vrai profil."""
    client = APIClient()

    results = client.get("/api/v1/search/users/", {"page_size": 100}).json()["results"]

    assert len(results) == 22
    assert all(person["is_demo"] for person in results)


def test_un_match_fort_existe_pour_la_demonstration(demo_data):
    """Le parcours s'appuie sur une paire complémentaire bien notée."""
    aminata = User.objects.get(email="aminata@demo.devlink.africa")
    client = APIClient()
    client.force_authenticate(user=aminata)

    matches = client.get("/api/v1/matches/").json()

    assert matches["count"] > 0
    assert matches["results"][0]["score"] >= 75


def test_le_cercle_de_demonstration_se_forme_et_debloque_les_contacts(demo_data):
    """Le cercle Dakar → Accra → Nairobi : suggéré, proposé, accepté par tous."""
    User = get_user_model()
    aminata, kwame, imani = (
        User.objects.get(email=f"{handle}@demo.devlink.africa") for handle in ("aminata", "kwame", "imani")
    )

    def client_for(user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    # Aucune paire réciproque entre eux : seul le cercle les réunit.
    [suggestion] = [
        circle
        for circle in client_for(aminata).get("/api/v1/circles/suggestions/").json()["results"]
        if {member["id"] for member in circle["members"]} == {aminata.pk, kwame.pk, imani.pk}
    ]
    assert suggestion["score"] == 100.0

    order = [arrow["teacher"] for arrow in suggestion["arrows"]]
    proposed = client_for(aminata).post("/api/v1/circles/", {"members": order}, format="json")
    assert proposed.status_code == 201
    circle_id = proposed.json()["id"]

    for member in (kwame, imani):
        answer = client_for(member).patch(
            f"/api/v1/circles/{circle_id}/", {"decision": "ACCEPT"}, format="json"
        )
        assert answer.status_code == 200

    active = client_for(kwame).get(f"/api/v1/circles/{circle_id}/").json()
    assert active["status"] == "ACTIVE"
    assert all(member["contact"] for member in active["members"])
