from django.conf import settings
from rest_framework.test import APIClient


def test_health_is_public_and_reports_version():
    response = APIClient().get("/api/v1/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": settings.API_VERSION}


def test_schema_and_docs_are_served():
    client = APIClient()
    assert client.get("/api/schema/").status_code == 200
    assert client.get("/api/docs/").status_code == 200
