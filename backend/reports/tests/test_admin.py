"""Un signalement n'était vu par personne après sa création : ni relu, ni
changé de statut, nulle part. L'admin Django comble ce trou (DL-32).
"""

import pytest
from django.contrib.auth import get_user_model
from django.test import Client

from reports.models import Report

User = get_user_model()
pytestmark = pytest.mark.django_db


def make_staff():
    return User.objects.create_superuser("staff@example.org", "mot-de-passe-solide-2026")


def make_report():
    reporter = User.objects.create_user("ada@example.org", "mot-de-passe-solide-2026")
    return Report.objects.create(
        reporter=reporter, target_type="USER", target_id=99, reason="SPAM", details="Faux profil."
    )


def test_a_report_is_listed_in_the_admin():
    client = Client()
    client.force_login(make_staff())
    report = make_report()

    response = client.get("/admin/reports/report/")

    assert response.status_code == 200
    assert str(report.reason) in response.content.decode()


def test_a_staff_member_can_mark_a_report_reviewed():
    client = Client()
    client.force_login(make_staff())
    report = make_report()

    response = client.post(
        "/admin/reports/report/",
        {
            "action": "",
            "_selected_action": [str(report.pk)],
            "form-TOTAL_FORMS": "1",
            "form-INITIAL_FORMS": "1",
            "form-MIN_NUM_FORMS": "0",
            "form-MAX_NUM_FORMS": "1000",
            "form-0-id": str(report.pk),
            "form-0-status": "REVIEWED",
            "_save": "Enregistrer",
        },
    )

    report.refresh_from_db()
    assert response.status_code in (200, 302)
    assert report.status == "REVIEWED"


def test_an_anonymous_visitor_cannot_see_reports():
    make_report()

    response = Client().get("/admin/reports/report/")

    assert response.status_code in (302, 403)
