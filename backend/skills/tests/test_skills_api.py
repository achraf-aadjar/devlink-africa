"""Tests de l'API compétences (DL-15) et des preuves (DL-31).

Critères de DL-15 : catalogue par catégorie, unicité (utilisateur, compétence,
type), niveaux BEGINNER/INTERMEDIATE/ADVANCED, recalcul des matchs déclenché.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from matching.models import Match
from profiles.models import Profile
from skills.models import Skill, SkillProof, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

CATALOG = "/api/v1/skills/"
MY_SKILLS = "/api/v1/me/skills/"


def make_user(email="ada@example.org", **profile_fields):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name="Ada")
    Profile.objects.create(user=user, **profile_fields)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# --- Catalogue --------------------------------------------------------------


def test_catalog_is_public_and_paginated():
    response = APIClient().get(CATALOG)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 14
    assert {"id", "name", "category"} <= set(body["results"][0])


def test_catalog_can_be_filtered_by_category():
    response = APIClient().get(CATALOG, {"category": "DEVOPS"})

    names = {item["name"] for item in response.json()["results"]}
    assert names == {"Docker", "Kubernetes", "CI/CD", "Linux"}


def test_catalog_can_be_searched_by_name():
    response = APIClient().get(CATALOG, {"search": "script"})

    assert [item["name"] for item in response.json()["results"]] == ["TypeScript"]


def test_catalog_search_ignores_case():
    assert APIClient().get(CATALOG, {"search": "PYTHON"}).json()["count"] == 1


def test_catalog_rejects_an_unknown_category():
    response = APIClient().get(CATALOG, {"category": "COBOL"})

    assert response.status_code == 400


# --- Mes compétences --------------------------------------------------------


def test_my_skills_are_split_between_offered_and_wanted():
    user = make_user()
    python = Skill.objects.get(name="Python")
    react = Skill.objects.get(name="React")
    UserSkill.objects.create(user=user, skill=python, kind="OFFERED", level="ADVANCED")
    UserSkill.objects.create(user=user, skill=react, kind="WANTED")

    body = client_for(user).get(MY_SKILLS).json()

    assert [item["skill"]["name"] for item in body["offered"]] == ["Python"]
    assert [item["skill"]["name"] for item in body["wanted"]] == ["React"]


def test_my_skills_requires_authentication():
    assert APIClient().get(MY_SKILLS).status_code == 401


def test_my_skills_only_shows_my_own():
    mine = make_user("ada@example.org")
    other = make_user("kofi@example.org")
    UserSkill.objects.create(user=other, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    body = client_for(mine).get(MY_SKILLS).json()

    assert body["offered"] == []


def test_add_an_offered_skill():
    user = make_user()
    python = Skill.objects.get(name="Python")

    response = client_for(user).post(
        MY_SKILLS, {"skill": python.pk, "kind": "OFFERED", "level": "ADVANCED"}, format="json"
    )

    assert response.status_code == 201
    body = response.json()
    assert body["skill"]["name"] == "Python"
    assert body["level"] == "ADVANCED"
    assert body["proofs"] == []


def test_add_a_wanted_skill_defaults_to_beginner():
    user = make_user()

    response = client_for(user).post(
        MY_SKILLS, {"skill": Skill.objects.get(name="Docker").pk, "kind": "WANTED"}, format="json"
    )

    assert response.status_code == 201
    assert response.json()["level"] == "BEGINNER"


def test_the_same_skill_can_be_offered_and_wanted_by_different_users():
    ada = make_user("ada@example.org")
    kofi = make_user("kofi@example.org")
    python = Skill.objects.get(name="Python")

    assert (
        client_for(ada).post(MY_SKILLS, {"skill": python.pk, "kind": "OFFERED"}, format="json").status_code
        == 201
    )
    assert (
        client_for(kofi).post(MY_SKILLS, {"skill": python.pk, "kind": "WANTED"}, format="json").status_code
        == 201
    )


def test_adding_the_same_skill_and_kind_twice_is_a_conflict():
    user = make_user()
    python = Skill.objects.get(name="Python")
    client = client_for(user)
    client.post(MY_SKILLS, {"skill": python.pk, "kind": "OFFERED"}, format="json")

    response = client.post(MY_SKILLS, {"skill": python.pk, "kind": "OFFERED"}, format="json")

    assert response.status_code == 409
    assert response.json()["code"] == "duplicate_skill"
    assert UserSkill.objects.filter(user=user, skill=python, kind="OFFERED").count() == 1


def test_the_same_skill_can_be_offered_then_wanted_by_one_user():
    """L'unicité porte sur le triplet : OFFERED et WANTED coexistent."""
    user = make_user()
    python = Skill.objects.get(name="Python")
    client = client_for(user)

    assert client.post(MY_SKILLS, {"skill": python.pk, "kind": "OFFERED"}, format="json").status_code == 201
    assert client.post(MY_SKILLS, {"skill": python.pk, "kind": "WANTED"}, format="json").status_code == 201


@pytest.mark.parametrize("level", ["EXPERT", "expert", "GURU", "", 1])
def test_an_invalid_level_is_refused(level):
    user = make_user()

    response = client_for(user).post(
        MY_SKILLS,
        {"skill": Skill.objects.get(name="Python").pk, "kind": "OFFERED", "level": level},
        format="json",
    )

    assert response.status_code == 400
    assert "level" in response.json()["errors"]


@pytest.mark.parametrize("level", ["BEGINNER", "INTERMEDIATE", "ADVANCED"])
def test_the_three_documented_levels_are_accepted(level):
    user = make_user()

    response = client_for(user).post(
        MY_SKILLS,
        {"skill": Skill.objects.get(name="Python").pk, "kind": "OFFERED", "level": level},
        format="json",
    )

    assert response.status_code == 201


def test_an_invalid_kind_is_refused():
    user = make_user()

    response = client_for(user).post(
        MY_SKILLS, {"skill": Skill.objects.get(name="Python").pk, "kind": "MAYBE"}, format="json"
    )

    assert response.status_code == 400
    assert "kind" in response.json()["errors"]


def test_an_unknown_skill_is_refused():
    user = make_user()

    response = client_for(user).post(MY_SKILLS, {"skill": 999999, "kind": "OFFERED"}, format="json")

    assert response.status_code == 400
    assert "skill" in response.json()["errors"]


def test_unknown_fields_are_refused():
    user = make_user()

    response = client_for(user).post(
        MY_SKILLS,
        {"skill": Skill.objects.get(name="Python").pk, "kind": "OFFERED", "user": 42},
        format="json",
    )

    assert response.status_code == 400


def test_the_level_can_be_updated():
    user = make_user()
    entry = UserSkill.objects.create(
        user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED", level="BEGINNER"
    )

    response = client_for(user).patch(f"{MY_SKILLS}{entry.pk}/", {"level": "ADVANCED"}, format="json")

    assert response.status_code == 200
    entry.refresh_from_db()
    assert entry.level == "ADVANCED"


def test_updating_the_kind_is_refused():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    response = client_for(user).patch(f"{MY_SKILLS}{entry.pk}/", {"kind": "WANTED"}, format="json")

    assert response.status_code == 400
    entry.refresh_from_db()
    assert entry.kind == "OFFERED"


def test_a_skill_can_be_deleted():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    response = client_for(user).delete(f"{MY_SKILLS}{entry.pk}/")

    assert response.status_code == 204
    assert not UserSkill.objects.filter(pk=entry.pk).exists()


# --- Permissions (DL-19) ----------------------------------------------------


def test_another_users_skill_is_not_visible():
    owner = make_user("kofi@example.org")
    entry = UserSkill.objects.create(user=owner, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    intruder = make_user("ada@example.org")

    response = client_for(intruder).patch(f"{MY_SKILLS}{entry.pk}/", {"level": "ADVANCED"}, format="json")

    # 404 et non 403 : un 403 confirmerait que la ressource existe.
    assert response.status_code == 404
    entry.refresh_from_db()
    assert entry.level == "BEGINNER"


def test_another_users_skill_cannot_be_deleted():
    owner = make_user("kofi@example.org")
    entry = UserSkill.objects.create(user=owner, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    intruder = make_user("ada@example.org")

    assert client_for(intruder).delete(f"{MY_SKILLS}{entry.pk}/").status_code == 404
    assert UserSkill.objects.filter(pk=entry.pk).exists()


# --- Recalcul des matchs ----------------------------------------------------


def test_adding_a_skill_recomputes_the_matches():
    """Critère de DL-15 : la modification déclenche le recalcul (ticket Omar)."""
    ada = make_user("ada@example.org", availability=["MENTORING"], domains=["WEB"])
    kofi = make_user("kofi@example.org", availability=["MENTORING"], domains=["WEB"])
    python = Skill.objects.get(name="Python")
    react = Skill.objects.get(name="React")
    UserSkill.objects.create(user=kofi, skill=python, kind="OFFERED", level="ADVANCED")
    UserSkill.objects.create(user=kofi, skill=react, kind="WANTED")
    assert Match.objects.count() == 0

    client = client_for(ada)
    client.post(MY_SKILLS, {"skill": react.pk, "kind": "OFFERED", "level": "ADVANCED"}, format="json")
    client.post(MY_SKILLS, {"skill": python.pk, "kind": "WANTED"}, format="json")

    assert Match.objects.count() == 1
    assert Match.objects.get().score > 80


def test_deleting_a_skill_recomputes_the_matches():
    ada = make_user("ada@example.org", availability=["MENTORING"], domains=["WEB"])
    kofi = make_user("kofi@example.org", availability=["MENTORING"], domains=["WEB"])
    python = Skill.objects.get(name="Python")
    react = Skill.objects.get(name="React")
    UserSkill.objects.create(user=kofi, skill=python, kind="OFFERED", level="ADVANCED")
    UserSkill.objects.create(user=kofi, skill=react, kind="WANTED")
    offered = UserSkill.objects.create(user=ada, skill=react, kind="OFFERED", level="ADVANCED")
    UserSkill.objects.create(user=ada, skill=python, kind="WANTED")
    client = client_for(ada)
    client.patch(f"{MY_SKILLS}{offered.pk}/", {"level": "ADVANCED"}, format="json")
    before = Match.objects.get().score

    client.delete(f"{MY_SKILLS}{offered.pk}/")

    assert Match.objects.get().score < before


# --- Preuves de compétence (DL-31) -----------------------------------------


def test_a_proof_can_be_added_to_my_skill():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    response = client_for(user).post(
        f"{MY_SKILLS}{entry.pk}/proofs/",
        {
            "kind": "GITHUB_REPO",
            "title": "API de collecte",
            "url": "https://example.org/depot",
            "description": "Auteur principal.",
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["title"] == "API de collecte"


def test_several_proofs_per_skill_are_allowed():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    client = client_for(user)

    for index in range(3):
        response = client.post(
            f"{MY_SKILLS}{entry.pk}/proofs/",
            {"kind": "PROJECT", "title": f"Projet {index}", "url": "https://example.org/p"},
            format="json",
        )
        assert response.status_code == 201

    assert SkillProof.objects.filter(user_skill=entry).count() == 3


def test_a_proof_url_must_be_https():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")

    response = client_for(user).post(
        f"{MY_SKILLS}{entry.pk}/proofs/",
        {"kind": "PROJECT", "title": "Projet", "url": "http://example.org/p"},
        format="json",
    )

    assert response.status_code == 400
    assert "url" in response.json()["errors"]


def test_a_proof_cannot_be_added_to_another_users_skill():
    owner = make_user("kofi@example.org")
    entry = UserSkill.objects.create(user=owner, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    intruder = make_user("ada@example.org")

    response = client_for(intruder).post(
        f"{MY_SKILLS}{entry.pk}/proofs/",
        {"kind": "PROJECT", "title": "Faux", "url": "https://example.org/p"},
        format="json",
    )

    assert response.status_code == 404
    assert SkillProof.objects.count() == 0


def test_a_proof_can_be_deleted_by_its_owner():
    user = make_user()
    entry = UserSkill.objects.create(user=user, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    proof = SkillProof.objects.create(user_skill=entry, title="Projet", url="https://example.org/p")

    response = client_for(user).delete(f"{MY_SKILLS}{entry.pk}/proofs/{proof.pk}/")

    assert response.status_code == 204
    assert not SkillProof.objects.filter(pk=proof.pk).exists()


def test_the_public_profile_shows_the_number_of_proofs():
    owner = make_user("kofi@example.org")
    entry = UserSkill.objects.create(user=owner, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    SkillProof.objects.create(user_skill=entry, title="Projet", url="https://example.org/p")
    viewer = make_user("ada@example.org")

    body = client_for(viewer).get(f"/api/v1/users/{owner.pk}/").json()

    assert body["skills"]["offered"][0]["proofs_count"] == 1
