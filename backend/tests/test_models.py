import pytest
from django.db import IntegrityError, transaction

from accounts.models import User
from exchanges.models import Exchange
from matching.models import Match, MatchFeedback
from profiles.models import Profile
from projects.models import Project, ProjectJoinRequest
from reports.models import Report
from skills.models import Skill, SkillProof, UserSkill

MODELS = [
    Profile,
    Skill,
    UserSkill,
    SkillProof,
    Project,
    ProjectJoinRequest,
    Exchange,
    Match,
    MatchFeedback,
    Report,
]


def test_models_are_importable():
    assert all(model._meta.app_label for model in MODELS)


@pytest.mark.django_db
def test_user_is_identified_by_email():
    user = User.objects.create_user("Ada@Example.org", "pass-12345-xyz")
    assert User.USERNAME_FIELD == "email"
    assert user.email == "ada@example.org"
    assert user.password.startswith("argon2")


@pytest.mark.django_db
def test_starter_skill_catalog_is_loaded():
    assert Skill.objects.count() == 14
    assert Skill.objects.filter(name="CI/CD").exists()


@pytest.mark.django_db
def test_match_requires_user_a_lower_than_user_b():
    a = User.objects.create_user("a@example.org", "pass-12345-xyz")
    b = User.objects.create_user("b@example.org", "pass-12345-xyz")
    Match.objects.create(user_a=a, user_b=b, score=0.5)
    with pytest.raises(IntegrityError), transaction.atomic():
        Match.objects.create(user_a=b, user_b=a, score=0.5)
