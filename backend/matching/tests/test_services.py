"""Tests de la persistance des matchs (DL-11, DL-24).

Ces tests touchent la base : ils vérifient le chargement par l'ORM, la
convention user_a < user_b, et le caractère incrémental du recalcul.
"""

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings

from matching.models import Match
from matching.services import (
    MIN_SCORE_TO_KEEP,
    recompute_for_user,
    recompute_pair,
    score_users,
)
from profiles.models import Profile
from skills.models import Skill, UserSkill

User = get_user_model()

pytestmark = pytest.mark.django_db


def make_user(email, *, offered=(), wanted=(), availability=("MENTORING",), domains=("WEB",)):
    """Crée un utilisateur avec son profil et ses compétences."""
    user = User.objects.create_user(email, "mot-de-passe-solide-2026")
    Profile.objects.create(user=user, availability=list(availability), domains=list(domains), country="SN")
    for name, level in offered:
        skill, _ = Skill.objects.get_or_create(name=name)
        UserSkill.objects.create(user=user, skill=skill, kind=UserSkill.Kind.OFFERED, level=level)
    for name in wanted:
        skill, _ = Skill.objects.get_or_create(name=name)
        UserSkill.objects.create(user=user, skill=skill, kind=UserSkill.Kind.WANTED)
    return user


# --- Chargement depuis la base ---------------------------------------------


def test_score_users_reads_skills_and_profile_from_the_database():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    result = score_users(ada.pk, kofi.pk)

    assert result.score > 80
    assert [skill.name for skill in result.a_can_teach_b] == ["Python"]
    assert [skill.name for skill in result.b_can_teach_a] == ["React"]


def test_score_users_handles_a_user_without_profile_or_skills():
    bare = User.objects.create_user("bare@example.org", "mot-de-passe-solide-2026")
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    result = score_users(bare.pk, kofi.pk)

    assert result.score == 0.0


# --- Enregistrement d'une paire --------------------------------------------


def test_recompute_pair_stores_the_match_with_the_explanation():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    match = recompute_pair(ada.pk, kofi.pk)

    assert match is not None
    assert match.score > 80
    assert {item["criterion"] for item in match.explanation["breakdown"]} == {
        "complementarity",
        "reciprocity",
        "collaboration",
        "common_tech",
        "availability",
        "domain",
    }


def test_recompute_pair_respects_the_user_a_lower_than_user_b_convention():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    # Appelé dans l'ordre inverse : la contrainte en base doit rester respectée.
    match = recompute_pair(kofi.pk, ada.pk)

    assert match.user_a_id == min(ada.pk, kofi.pk)
    assert match.user_b_id == max(ada.pk, kofi.pk)


def test_recompute_pair_is_idempotent():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    recompute_pair(ada.pk, kofi.pk)
    recompute_pair(ada.pk, kofi.pk)
    recompute_pair(kofi.pk, ada.pk)

    assert Match.objects.count() == 1


def test_recompute_pair_gives_the_same_explanation_in_both_call_orders():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    first = recompute_pair(ada.pk, kofi.pk).explanation
    Match.objects.all().delete()
    second = recompute_pair(kofi.pk, ada.pk).explanation

    assert first == second


def test_recompute_pair_ignores_a_user_paired_with_themselves():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")])

    assert recompute_pair(ada.pk, ada.pk) is None
    assert Match.objects.count() == 0


def test_a_weak_match_is_not_stored():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], availability=(), domains=())
    stranger = make_user("x@example.org", offered=[("Flutter", "ADVANCED")], availability=(), domains=())

    assert recompute_pair(ada.pk, stranger.pk) is None
    assert Match.objects.count() == 0


def test_an_existing_match_is_removed_when_it_becomes_weak():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    recompute_pair(ada.pk, kofi.pk)
    assert Match.objects.count() == 1

    # Ada efface tout : il ne reste plus rien à échanger.
    UserSkill.objects.filter(user=ada).delete()
    Profile.objects.filter(user=ada).update(availability=[], domains=[])

    assert recompute_pair(ada.pk, kofi.pk) is None
    assert Match.objects.count() == 0


# --- Recalcul pour un utilisateur ------------------------------------------


def test_recompute_for_user_creates_matches_with_everyone_relevant():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    make_user("fatou@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    kept = recompute_for_user(ada.pk)

    assert kept == 2
    assert Match.objects.count() == 2


def test_recompute_for_user_only_touches_pairs_of_that_user():
    """Le recalcul est incrémental : les matchs des autres ne bougent pas."""
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    fatou = make_user("fatou@example.org", offered=[("Docker", "ADVANCED")], wanted=["React"])
    recompute_for_user(ada.pk)
    recompute_for_user(fatou.pk)

    untouched = Match.objects.get(user_a_id=min(kofi.pk, fatou.pk), user_b_id=max(kofi.pk, fatou.pk))
    before = untouched.computed_at

    recompute_for_user(ada.pk)

    untouched.refresh_from_db()
    assert untouched.computed_at == before


def test_recompute_for_user_does_not_scale_its_queries_with_the_number_of_users(
    django_assert_num_queries,
):
    """Le nombre de requêtes ne doit pas croître avec la taille de la base.

    Le service lit en lot (utilisateurs, compétences, profils, matchs existants)
    puis écrit en lot : aucune requête par paire. On compare donc le même cas de
    figure — un premier calcul — avec 3 puis 9 partenaires.
    """
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    for index in range(3):
        make_user(f"dev{index}@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])

    with django_assert_num_queries(7):
        recompute_for_user(ada.pk)
    assert Match.objects.count() == 3

    # Trois fois plus de partenaires, et on repart d'une table vide pour mesurer
    # exactement la même séquence de requêtes.
    for index in range(3, 9):
        make_user(f"dev{index}@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    Match.objects.all().delete()

    with django_assert_num_queries(7):
        recompute_for_user(ada.pk)
    assert Match.objects.count() == 9


def test_recompute_for_user_updates_an_existing_match_in_place():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    recompute_for_user(ada.pk)
    first_score = Match.objects.get().score

    # Ada ne cherche plus React : l'échange devient à sens unique.
    UserSkill.objects.filter(user=ada, kind=UserSkill.Kind.WANTED).delete()
    recompute_for_user(ada.pk)

    assert Match.objects.count() == 1
    assert Match.objects.get().score < first_score


def test_recompute_for_user_ignores_inactive_users():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    User.objects.filter(pk=kofi.pk).update(is_active=False)  # noqa: F841 (kofi sert au filtre)

    assert recompute_for_user(ada.pk) == 0
    assert Match.objects.count() == 0


def test_recompute_for_a_lonely_user_returns_zero():
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])

    assert recompute_for_user(ada.pk) == 0


def test_explanation_direction_follows_the_stored_user_order():
    """a_can_teach_b doit décrire ce que user_a enseigne, quel que soit l'appel."""
    ada = make_user("ada@example.org", offered=[("Python", "ADVANCED")], wanted=["React"])
    kofi = make_user("kofi@example.org", offered=[("React", "ADVANCED")], wanted=["Python"])
    recompute_for_user(kofi.pk)

    match = Match.objects.get()
    taught_by_a = {skill["name"] for skill in match.explanation["a_can_teach_b"]}
    expected = {"Python"} if match.user_a_id == ada.pk else {"React"}

    assert taught_by_a == expected


@override_settings(MIN_SCORE_TO_KEEP=MIN_SCORE_TO_KEEP)
def test_min_score_threshold_is_a_documented_constant():
    assert 0 < MIN_SCORE_TO_KEEP < 50
