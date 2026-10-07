"""Tests de durcissement (DL-29) et de surveillance (DL-30).

Critères de DL-29 : `check --deploy` sans avertissement, tests d'injection et de
XSS de base, aucun secret dans le dépôt.
Critères de DL-30 : `/health` détaillé.
"""

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIClient

from profiles.models import Profile
from projects.models import Project
from skills.models import Skill, UserSkill

User = get_user_model()
pytestmark = pytest.mark.django_db

PASSWORD = "mot-de-passe-solide-2026"


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(email="ada@example.org"):
    user = User.objects.create_user(email, PASSWORD, full_name="Ada Lovelace")
    Profile.objects.create(user=user, country="SN")
    return user


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# --- Surveillance (DL-30) ---------------------------------------------------


def test_health_reports_the_dependencies_in_detail():
    response = APIClient().get("/api/v1/health/", {"detail": "1"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["checks"]["database"]["ok"] is True
    assert body["checks"]["migrations"]["ok"] is True


def test_health_stays_minimal_without_the_detail_flag():
    body = APIClient().get("/api/v1/health/").json()

    assert set(body) == {"status", "version"}


def test_health_never_exposes_the_database_credentials():
    body = APIClient().get("/api/v1/health/", {"detail": "1"}).json()

    serialised = str(body)
    assert "devlink" not in serialised or "password" not in serialised
    assert PASSWORD not in serialised


def test_health_is_public():
    assert APIClient().get("/api/v1/health/").status_code == 200


# --- Injection SQL ----------------------------------------------------------

INJECTIONS = [
    "'; DROP TABLE accounts_user; --",
    "' OR '1'='1",
    "1; DELETE FROM projects_project",
    "%' UNION SELECT NULL--",
]


@pytest.mark.parametrize("payload", INJECTIONS)
def test_a_search_term_cannot_inject_sql(payload):
    """L'ORM paramètre les requêtes : la chaîne est traitée comme une donnée."""
    make_user()

    response = APIClient().get("/api/v1/search/users/", {"q": payload})

    assert response.status_code == 200
    assert response.json()["count"] == 0
    # Les tables existent toujours.
    assert User.objects.count() == 1


@pytest.mark.parametrize("payload", INJECTIONS)
def test_a_project_filter_cannot_inject_sql(payload):
    owner = make_user()
    Project.objects.create(owner=owner, title="Agri-Data")

    response = APIClient().get("/api/v1/projects/", {"q": payload})

    assert response.status_code == 200
    assert Project.objects.count() == 1


def test_an_injection_in_a_skill_filter_is_harmless():
    make_user()

    response = APIClient().get("/api/v1/search/users/", {"skill": "'; DROP TABLE skills_skill; --"})

    assert response.status_code == 200
    assert Skill.objects.count() == 14


def test_no_raw_sql_is_built_by_concatenation():
    """Vérification statique : aucun appel à .raw() ni à .extra() dans le code."""
    from pathlib import Path

    backend = Path(__file__).resolve().parent.parent
    offenders: list[str] = []

    for path in backend.rglob("*.py"):
        if any(part in {".venv", "migrations", "tests"} for part in path.parts):
            continue
        content = path.read_text(encoding="utf-8")
        if ".raw(" in content or ".extra(" in content:
            offenders.append(str(path.relative_to(backend)))

    assert offenders == [], f"SQL brut trouvé dans : {offenders}"


# --- XSS --------------------------------------------------------------------

SCRIPTS = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "<svg/onload=alert(1)>",
]


@pytest.mark.parametrize("payload", SCRIPTS)
def test_a_script_in_the_bio_is_stored_as_text_and_escaped_in_json(payload):
    """L'API renvoie du JSON : le contenu est une chaîne, jamais du HTML exécuté.

    Côté frontend, React échappe tout texte inséré et nous n'utilisons jamais
    dangerouslySetInnerHTML (règle vérifiée par la revue et par ESLint).
    """
    user = make_user()

    response = client_for(user).patch("/api/v1/me/", {"bio": payload}, format="json")

    assert response.status_code == 200
    # La valeur est conservée telle quelle : c'est une donnée, pas du balisage.
    assert response.json()["profile"]["bio"] == payload
    # La réponse est du JSON, jamais du HTML : un navigateur ne l'exécute pas.
    assert response["Content-Type"].startswith("application/json")


@pytest.mark.parametrize("payload", SCRIPTS)
def test_a_script_in_a_project_title_is_not_executable(payload):
    user = make_user()

    response = client_for(user).post("/api/v1/projects/", {"title": payload}, format="json")

    assert response.status_code == 201
    assert response.json()["title"] == payload
    assert response["Content-Type"].startswith("application/json")


def test_a_javascript_url_is_refused_in_the_avatar():
    """Les URLs doivent être en https : javascript: est donc exclu."""
    user = make_user()

    response = client_for(user).patch("/api/v1/me/", {"avatar_url": "javascript:alert(1)"}, format="json")

    assert response.status_code == 400


def test_a_javascript_url_is_refused_in_a_project_link():
    user = make_user()

    response = client_for(user).post(
        "/api/v1/projects/",
        {"title": "Projet", "repo_url": "javascript:alert(1)"},
        format="json",
    )

    assert response.status_code == 400


# --- En-têtes et réglages de production ------------------------------------


@override_settings(
    DEBUG=False,
    SECURE_SSL_REDIRECT=False,
    SECURE_CONTENT_TYPE_NOSNIFF=True,
    X_FRAME_OPTIONS="DENY",
    SECURE_REFERRER_POLICY="strict-origin-when-cross-origin",
    ALLOWED_HOSTS=["testserver"],
)
def test_the_security_headers_are_sent():
    response = APIClient().get("/api/v1/health/")

    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["X-Frame-Options"] == "DENY"
    assert response["Referrer-Policy"] == "strict-origin-when-cross-origin"


def test_no_default_secret_key_outside_debug(tmp_path, monkeypatch):
    """Critère du cahier : aucune clé par défaut en production.

    On exécute les réglages dans un sous-processus, avec un BASE_DIR vide : le
    fichier backend/.env du poste de développement fournirait sinon une clé.
    """
    import shutil
    import subprocess
    import sys
    from pathlib import Path

    backend = Path(__file__).resolve().parent.parent
    isolated = tmp_path / "backend"
    isolated.mkdir()
    shutil.copytree(backend / "config", isolated / "config")
    # Pas de .env copié : c'est tout l'objet du test.

    result = subprocess.run(
        [sys.executable, "-c", f"import sys; sys.path.insert(0, {str(isolated)!r}); import config.settings"],
        env={"PATH": "/usr/bin:/bin", "DEBUG": "False"},
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0, "Les réglages doivent refuser de démarrer sans SECRET_KEY."
    assert "SECRET_KEY" in result.stderr


def test_a_secret_key_is_tolerated_only_in_debug():
    """En développement, une clé de secours évite une configuration pénible."""
    from config.settings import DEBUG, SECRET_KEY

    assert SECRET_KEY
    if "insecure-dev-only" in SECRET_KEY:
        assert DEBUG is True


def test_cors_never_allows_every_origin():
    from django.conf import settings

    assert settings.CORS_ALLOW_ALL_ORIGINS is False


def test_the_request_size_is_capped():
    from django.conf import settings

    assert settings.DATA_UPLOAD_MAX_MEMORY_SIZE <= 5_242_880  # 5 Mo au maximum


def test_argon2_comes_first_in_the_password_hashers():
    from django.conf import settings

    assert "Argon2" in settings.PASSWORD_HASHERS[0]


# --- Contrôle d'accès transversal (tests IDOR, DL-19 et DL-29) -------------


def test_i_cannot_read_another_users_private_profile():
    owner = make_user("kofi@example.org")
    intruder = make_user("ada@example.org")

    # /me/ renvoie toujours *mon* profil, jamais celui d'un autre.
    body = client_for(intruder).get("/api/v1/me/").json()

    assert body["email"] == "ada@example.org"
    assert body["id"] != owner.pk


def test_i_cannot_modify_another_users_skill():
    owner = make_user("kofi@example.org")
    entry = UserSkill.objects.create(user=owner, skill=Skill.objects.get(name="Python"), kind="OFFERED")
    intruder = make_user("ada@example.org")

    response = client_for(intruder).patch(
        f"/api/v1/me/skills/{entry.pk}/", {"level": "ADVANCED"}, format="json"
    )

    assert response.status_code == 404


def test_i_cannot_delete_another_users_project():
    owner = make_user("kofi@example.org")
    project = Project.objects.create(owner=owner, title="Agri-Data")
    intruder = make_user("ada@example.org")

    assert client_for(intruder).delete(f"/api/v1/projects/{project.pk}/").status_code == 403
    assert Project.objects.filter(pk=project.pk).exists()


def test_the_public_profile_never_contains_an_email():
    owner = make_user("kofi@example.org")

    body = APIClient().get(f"/api/v1/users/{owner.pk}/").json()

    assert "kofi@example.org" not in str(body)
