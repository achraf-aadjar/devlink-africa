"""Tests de la commande seed_demo (DL-12).

Critères du ticket : au moins 8 pays, is_demo à vrai, commande rejouable sans
doublon, 3 paires au-dessus de 75 % et 3 paires partielles, aucune vraie personne.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command

from matching.models import Match
from profiles.models import Profile
from projects.models import Project

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def seeded():
    call_command("seed_demo", verbosity=0)


def test_it_creates_twenty_profiles_and_eight_projects(seeded):
    assert User.objects.count() == 20
    assert Project.objects.count() == 8


def test_every_demo_profile_is_flagged(seeded):
    """Règle 7 du cahier : les données de démonstration sont étiquetées."""
    assert Profile.objects.count() == 20
    assert Profile.objects.filter(is_demo=True).count() == 20


def test_the_profiles_cover_at_least_eight_countries(seeded):
    countries = set(Profile.objects.exclude(country="").values_list("country", flat=True))

    assert len(countries) >= 8


def test_all_emails_use_the_demo_domain(seeded):
    """Aucune adresse réelle : le domaine est réservé à la démonstration."""
    emails = User.objects.values_list("email", flat=True)

    assert all(email.endswith("@demo.devlink.africa") for email in emails)


def test_there_are_at_least_three_strong_matches(seeded):
    assert Match.objects.filter(score__gte=75).count() >= 3


def test_there_are_at_least_three_partial_matches(seeded):
    assert Match.objects.filter(score__gte=30, score__lt=75).count() >= 3


def test_no_score_is_out_of_bounds(seeded):
    for match in Match.objects.all():
        assert 0 <= match.score <= 100


def test_the_command_is_idempotent():
    """Critère du ticket : rejouable sans doublon."""
    call_command("seed_demo", verbosity=0)
    users_after_first = User.objects.count()
    projects_after_first = Project.objects.count()
    matches_after_first = Match.objects.count()

    call_command("seed_demo", verbosity=0)

    assert User.objects.count() == users_after_first
    assert Project.objects.count() == projects_after_first
    assert Match.objects.count() == matches_after_first


def test_skills_are_not_duplicated_on_a_second_run(seeded):
    from skills.models import UserSkill

    before = UserSkill.objects.count()

    call_command("seed_demo", verbosity=0)

    assert UserSkill.objects.count() == before


def test_the_reset_option_clears_the_demo_accounts(seeded):
    call_command("seed_demo", "--reset", verbosity=0)

    # Les comptes sont recréés : le total reste le même, sans accumulation.
    assert User.objects.count() == 20


def test_every_project_has_an_owner_and_needs(seeded):
    for project in Project.objects.all():
        assert project.owner_id is not None
        assert project.needs.exists()


def test_the_demo_users_can_log_in(seeded):
    """Le mot de passe commun doit fonctionner pour la démonstration devant le jury."""
    from rest_framework.test import APIClient

    response = APIClient().post(
        "/api/v1/auth/login/",
        {"email": "aminata@demo.devlink.africa", "password": "demo-devlink-2026-xyz"},
        format="json",
    )

    assert response.status_code == 200


def test_the_demo_pair_has_a_high_and_explained_match(seeded):
    """Le parcours de démonstration repose sur une paire complémentaire."""
    aminata = User.objects.get(email="aminata@demo.devlink.africa")
    mamadou = User.objects.get(email="mamadou@demo.devlink.africa")
    low, high = sorted((aminata.pk, mamadou.pk))

    match = Match.objects.get(user_a_id=low, user_b_id=high)

    assert match.score >= 75
    assert match.explanation["a_can_teach_b"]
    assert match.explanation["b_can_teach_a"]
