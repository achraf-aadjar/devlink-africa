import pytest
from django.db import connection

from accounts.models import User
from matching.models import Match
from profiles.models import Profile


@pytest.mark.django_db
def test_json_fields_round_trip():
    a = User.objects.create_user("a@example.org", "pass-12345-xyz")
    b = User.objects.create_user("b@example.org", "pass-12345-xyz")
    Profile.objects.create(user=a, domains=["web", "ia"], availability=["soir", "week-end"])
    explanation = {"common": ["Python"], "score_parts": {"skills": 0.7}, "ok": True, "note": "é"}
    Match.objects.create(user_a=a, user_b=b, score=0.8, explanation=explanation)

    assert Profile.objects.get(user=a).domains == ["web", "ia"]
    assert Match.objects.get(user_a=a).explanation == explanation
    assert Match.objects.filter(explanation__ok=True).count() == 1


@pytest.mark.skipif(connection.vendor != "postgresql", reason="JSON contains requires PostgreSQL")
@pytest.mark.django_db
def test_json_contains_and_index_lookups():
    a = User.objects.create_user("a@example.org", "pass-12345-xyz")
    Profile.objects.create(user=a, domains=["web", "ia"])
    assert Profile.objects.filter(domains__contains=["web"]).count() == 1
    assert Profile.objects.filter(domains__0="web").count() == 1
    assert Profile.objects.filter(domains__contains=["mobile"]).count() == 0
