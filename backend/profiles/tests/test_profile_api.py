"""Tests de l'API profil (DL-14) et de ses permissions (DL-19).

Critères du ticket : pays valide, disponibilités dans l'énumération, bio limitée
en taille, un utilisateur ne modifie que son profil, le profil public n'expose
jamais l'adresse e-mail.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

ME = "/api/v1/me/"


def make_user(email="ada@example.org", **profile_fields):
    user = User.objects.create_user(email, "mot-de-passe-solide-2026", full_name="Ada Lovelace")
    Profile.objects.create(user=user, **profile_fields)
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# --- Lecture de son propre profil ------------------------------------------


def test_me_returns_the_private_profile_with_the_email():
    user = make_user(country="SN", bio="Développeuse web.", availability=["MENTORING"], domains=["WEB"])

    response = client_for(user).get(ME)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "ada@example.org"
    assert body["full_name"] == "Ada Lovelace"
    assert body["profile"]["country"] == "SN"
    assert body["profile"]["availability"] == ["MENTORING"]
    assert "completeness" in body["profile"]


def test_me_requires_authentication():
    assert APIClient().get(ME).status_code == 401


def test_me_creates_the_profile_if_it_is_missing():
    """Un compte créé avant l'ajout du modèle Profile ne doit pas casser l'API."""
    user = User.objects.create_user("bare@example.org", "mot-de-passe-solide-2026")

    response = client_for(user).get(ME)

    assert response.status_code == 200
    assert Profile.objects.filter(user=user).exists()


def test_completeness_grows_with_a_filled_profile():
    empty = make_user("empty@example.org")
    filled = make_user(
        "filled@example.org",
        country="SN",
        bio="Une vraie biographie.",
        availability=["MENTORING"],
        domains=["WEB"],
        avatar_url="https://example.org/a.png",
    )
    skill = Skill.objects.get(name="Python")
    UserSkill.objects.create(user=filled, skill=skill, kind=UserSkill.Kind.OFFERED)

    empty_score = client_for(empty).get(ME).json()["profile"]["completeness"]
    filled_score = client_for(filled).get(ME).json()["profile"]["completeness"]

    assert empty_score < filled_score
    assert 0 <= empty_score <= 100
    assert filled_score == 100


# --- Modification de son profil --------------------------------------------


def test_patch_me_updates_the_profile():
    user = make_user(country="SN")

    response = client_for(user).patch(
        ME,
        {
            "country": "CI",
            "bio": "Développeuse mobile.",
            "availability": ["FREELANCE"],
            "domains": ["MOBILE"],
        },
        format="json",
    )

    assert response.status_code == 200
    user.profile.refresh_from_db()
    assert user.profile.country == "CI"
    assert user.profile.availability == ["FREELANCE"]


def test_patch_me_updates_the_full_name():
    user = make_user()

    response = client_for(user).patch(ME, {"full_name": "Ada L."}, format="json")

    assert response.status_code == 200
    user.refresh_from_db()
    assert user.full_name == "Ada L."


def test_patch_me_is_partial():
    user = make_user(country="SN", bio="Texte initial.")

    client_for(user).patch(ME, {"country": "CI"}, format="json")

    user.profile.refresh_from_db()
    assert user.profile.bio == "Texte initial."


def test_patch_me_normalises_the_country_to_uppercase():
    user = make_user()

    client_for(user).patch(ME, {"country": "sn"}, format="json")

    user.profile.refresh_from_db()
    assert user.profile.country == "SN"


@pytest.mark.parametrize("country", ["XX", "ZZ", "FRA", "S", "123", "11"])
def test_patch_me_rejects_an_invalid_country(country):
    user = make_user()

    response = client_for(user).patch(ME, {"country": country}, format="json")

    assert response.status_code == 400
    assert "country" in response.json()["errors"]


@pytest.mark.parametrize("availability", [["INCONNU"], ["MENTORING", "INCONNU"], "MENTORING", [123]])
def test_patch_me_rejects_an_availability_outside_the_enumeration(availability):
    user = make_user()

    response = client_for(user).patch(ME, {"availability": availability}, format="json")

    assert response.status_code == 400
    assert "availability" in response.json()["errors"]


def test_patch_me_accepts_the_four_documented_availabilities():
    user = make_user()

    response = client_for(user).patch(
        ME,
        {"availability": ["MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE"]},
        format="json",
    )

    assert response.status_code == 200


def test_patch_me_removes_duplicate_availabilities():
    user = make_user()

    client_for(user).patch(ME, {"availability": ["MENTORING", "MENTORING"]}, format="json")

    user.profile.refresh_from_db()
    assert user.profile.availability == ["MENTORING"]


def test_patch_me_rejects_a_domain_outside_the_enumeration():
    user = make_user()

    response = client_for(user).patch(ME, {"domains": ["COBOL"]}, format="json")

    assert response.status_code == 400
    assert "domains" in response.json()["errors"]


def test_patch_me_rejects_a_bio_that_is_too_long():
    user = make_user()

    response = client_for(user).patch(ME, {"bio": "x" * 1001}, format="json")

    assert response.status_code == 400
    assert "bio" in response.json()["errors"]


def test_patch_me_accepts_a_bio_at_the_limit():
    user = make_user()

    assert client_for(user).patch(ME, {"bio": "x" * 1000}, format="json").status_code == 200


@pytest.mark.parametrize("url", ["http://example.org/a.png", "ftp://example.org/a.png", "pas-une-url"])
def test_patch_me_requires_an_https_avatar_url(url):
    user = make_user()

    response = client_for(user).patch(ME, {"avatar_url": url}, format="json")

    assert response.status_code == 400
    assert "avatar_url" in response.json()["errors"]


def test_patch_me_accepts_an_https_avatar_url():
    user = make_user()

    response = client_for(user).patch(ME, {"avatar_url": "https://example.org/a.png"}, format="json")

    assert response.status_code == 200


def test_patch_me_refuses_unknown_fields():
    user = make_user()

    response = client_for(user).patch(ME, {"is_demo": True, "unknown": 1}, format="json")

    assert response.status_code == 400
    user.profile.refresh_from_db()
    assert user.profile.is_demo is False


def test_patch_me_cannot_change_the_email():
    user = make_user()

    response = client_for(user).patch(ME, {"email": "autre@example.org"}, format="json")

    assert response.status_code == 400
    user.refresh_from_db()
    assert user.email == "ada@example.org"


def test_patch_me_requires_authentication():
    assert APIClient().patch(ME, {"country": "SN"}, format="json").status_code == 401


# --- Profil public ----------------------------------------------------------


def test_public_profile_never_exposes_the_email():
    owner = make_user("kofi@example.org", country="GH", bio="Backend.")
    viewer = make_user("ada@example.org")

    response = client_for(viewer).get(f"/api/v1/users/{owner.pk}/")

    assert response.status_code == 200
    body = response.json()
    assert "email" not in body
    assert body["full_name"] == "Ada Lovelace"
    assert body["country"] == "GH"


def test_public_profile_lists_offered_and_wanted_skills():
    owner = make_user("kofi@example.org")
    python = Skill.objects.get(name="Python")
    react = Skill.objects.get(name="React")
    UserSkill.objects.create(user=owner, skill=python, kind=UserSkill.Kind.OFFERED, level="ADVANCED")
    UserSkill.objects.create(user=owner, skill=react, kind=UserSkill.Kind.WANTED)
    viewer = make_user("ada@example.org")

    body = client_for(viewer).get(f"/api/v1/users/{owner.pk}/").json()

    assert [s["skill"]["name"] for s in body["skills"]["offered"]] == ["Python"]
    assert body["skills"]["offered"][0]["level"] == "ADVANCED"
    assert [s["skill"]["name"] for s in body["skills"]["wanted"]] == ["React"]


def test_public_profile_shows_the_demo_flag():
    owner = make_user("demo@example.org", is_demo=True)
    viewer = make_user("ada@example.org")

    body = client_for(viewer).get(f"/api/v1/users/{owner.pk}/").json()

    assert body["is_demo"] is True


def test_public_profile_of_an_unknown_user_is_404():
    viewer = make_user("ada@example.org")

    assert client_for(viewer).get("/api/v1/users/999999/").status_code == 404


def test_public_profile_of_an_inactive_user_is_404():
    owner = make_user("kofi@example.org")
    User.objects.filter(pk=owner.pk).update(is_active=False)
    viewer = make_user("ada@example.org")

    assert client_for(viewer).get(f"/api/v1/users/{owner.pk}/").status_code == 404


def test_public_profile_is_readable_without_authentication():
    """Le contrat annonce cette route comme publique (exploration par pays)."""
    owner = make_user("kofi@example.org", country="GH")

    response = APIClient().get(f"/api/v1/users/{owner.pk}/")

    assert response.status_code == 200
    assert "email" not in response.json()


def test_public_profile_cannot_be_modified():
    owner = make_user("kofi@example.org")
    viewer = make_user("ada@example.org")

    response = client_for(viewer).patch(f"/api/v1/users/{owner.pk}/", {"bio": "piraté"}, format="json")

    assert response.status_code in (404, 405)
    owner.profile.refresh_from_db()
    assert owner.profile.bio == ""


def test_public_profile_avoids_n_plus_one_queries(django_assert_num_queries):
    owner = make_user("kofi@example.org")
    for index in range(5):
        skill = Skill.objects.create(name=f"Techno {index}")
        UserSkill.objects.create(user=owner, skill=skill, kind=UserSkill.Kind.OFFERED)
    viewer = make_user("ada@example.org")
    client = client_for(viewer)

    # 4 requêtes constantes : l'utilisateur avec son profil, les compétences
    # (avec le compte de preuves annoté), leurs validations par les pairs, les
    # projets. Aucune par compétence.
    with django_assert_num_queries(4):
        client.get(f"/api/v1/users/{owner.pk}/")

    # Deux fois plus de compétences : le nombre de requêtes ne change pas.
    for index in range(5, 15):
        extra = Skill.objects.create(name=f"Techno {index}")
        UserSkill.objects.create(user=owner, skill=extra, kind=UserSkill.Kind.OFFERED)

    with django_assert_num_queries(4):
        client.get(f"/api/v1/users/{owner.pk}/")


# --- Moyen de contact -------------------------------------------------------


@pytest.mark.parametrize(
    "contact", ["ada@example.org", "https://github.com/ada", "https://www.linkedin.com/in/ada"]
)
def test_patch_me_accepts_an_email_or_an_https_link_as_contact(contact):
    user = make_user()

    response = client_for(user).patch(ME, {"contact": f"  {contact} "}, format="json")

    assert response.status_code == 200
    assert response.json()["profile"]["contact"] == contact


@pytest.mark.parametrize(
    "contact",
    ["javascript:alert(1)", "http://github.com/ada", "Telegram @ada", "ada@", "https://"],
)
def test_patch_me_rejects_any_other_contact(contact):
    user = make_user()

    response = client_for(user).patch(ME, {"contact": contact}, format="json")

    assert response.status_code == 400
    assert "contact" in response.json()["errors"]


def test_the_contact_can_be_cleared():
    user = make_user(contact="ada@example.org")

    response = client_for(user).patch(ME, {"contact": ""}, format="json")

    assert response.json()["profile"]["contact"] == ""


def test_public_profile_never_exposes_the_contact():
    """Le contact n'est révélé que dans un échange accepté, jamais sur le profil public."""
    owner = make_user("kofi@example.org", contact="kofi@example.org")
    viewer = make_user("ada@example.org")

    body = client_for(viewer).get(f"/api/v1/users/{owner.pk}/").json()

    assert "contact" not in body
    assert "kofi@example.org" not in str(body)
