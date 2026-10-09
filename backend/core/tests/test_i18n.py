"""Messages de l'API en anglais, selon l'en-tête Accept-Language.

Le français reste la langue par défaut (pas d'en-tête, ou une autre langue).
Le premier test lit le code source : un message d'erreur ajouté sans sa
traduction anglaise fait échouer la CI.
"""

import ast
from pathlib import Path
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APIClient

from core.i18n import translate_message

User = get_user_model()
pytestmark = pytest.mark.django_db

BACKEND = Path(__file__).resolve().parents[2]
EXCEPTIONS = {
    "AIUnavailable",
    "AuthenticationFailed",
    "Conflict",
    "NotFound",
    "PermissionDenied",
    "ValidationError",
}
REGISTER = "/api/v1/auth/register/"


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


def _name(node) -> str | None:
    return node.attr if isinstance(node, ast.Attribute) else getattr(node, "id", None)


def _sample(node: ast.JoinedStr) -> str:
    """Un exemple de valeur pour une f-string : chaque `{…}` devient « 8 »."""
    return "".join(part.value if isinstance(part, ast.Constant) else "8" for part in node.values)


def _texts(node):
    """Les textes sous un nœud ; une f-string compte pour un seul texte."""
    if isinstance(node, ast.JoinedStr):
        yield node
        return
    yield node
    for child in ast.iter_child_nodes(node):
        yield from _texts(child)


def _raised_messages():
    """(fichier, message) pour chaque phrase passée à une exception de l'API."""
    for path in sorted(BACKEND.rglob("*.py")):
        relative = path.relative_to(BACKEND)
        if {"tests", "migrations", "management"} & set(relative.parts) or ".venv" in relative.parts:
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"))
        constants = {
            target.id: node.value.value
            for node in tree.body
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Constant)
            for target in node.targets
            if isinstance(target, ast.Name) and isinstance(node.value.value, str)
        }
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and _name(node.func) in EXCEPTIONS:
                roots = node.args
            elif isinstance(node, ast.Assign) and any(
                _name(target) in ("message", "default_detail") for target in node.targets
            ):
                roots = [node.value]
            elif isinstance(node, ast.keyword) and node.arg == "error_messages":
                roots = [node.value]
            else:
                continue
            for root in roots:
                for sub in _texts(root):
                    if isinstance(sub, ast.JoinedStr):
                        yield relative, _sample(sub)
                    elif isinstance(sub, ast.Constant) and isinstance(sub.value, str):
                        yield relative, sub.value
                    elif isinstance(sub, ast.Name) and sub.id in constants:
                        yield relative, constants[sub.id]


def test_every_raised_message_has_an_english_translation():
    messages = {(str(path), text) for path, text in _raised_messages() if " " in text}
    # Garde-fou : le parcours trouve bien les messages (sinon le test passerait à vide).
    assert len(messages) > 40

    untranslated = sorted(
        f"{path} : {text}" for path, text in messages if translate_message(text, "en") == text
    )

    assert untranslated == []


def test_values_inside_a_message_are_kept():
    assert (
        translate_message("Trop de tentatives. Réessayez dans 42 secondes.", "en")
        == "Too many attempts. Try again in 42 seconds."
    )
    assert (
        translate_message("Statut inconnu. Attendu parmi : OPEN, CLOSED.", "en")
        == "Unknown status. Expected one of: OPEN, CLOSED."
    )


def test_french_and_unknown_messages_are_left_untouched():
    assert translate_message("Vous avez déjà répondu.", "fr") == "Vous avez déjà répondu."
    assert translate_message("Un message sans traduction.", "en") == "Un message sans traduction."


# --- Par l'API ----------------------------------------------------------------


def _register(client: APIClient, **headers):
    payload = {
        "email": "ada@example.org",
        "password": "mot-de-passe-solide-2026",
        "full_name": "Ada",
        "consent": True,
    }
    return client.post(REGISTER, payload, format="json", **headers)


def test_a_devlink_message_follows_accept_language():
    client = APIClient()
    _register(client)

    english = _register(client, HTTP_ACCEPT_LANGUAGE="en-US,en;q=0.9")
    french = _register(client)

    assert english.status_code == french.status_code == 409
    assert english.json()["detail"] == "This email address is already in use."
    assert french.json()["detail"] == "Cette adresse e-mail est déjà utilisée."
    assert english.json()["code"] == french.json()["code"] == "email_already_used"


def test_validation_errors_are_translated_field_by_field():
    response = APIClient().post(
        REGISTER,
        {"email": "ada@example.org", "password": "court", "consent": False},
        format="json",
        HTTP_ACCEPT_LANGUAGE="en",
    )

    body = response.json()
    assert response.status_code == 400
    assert body["detail"] == "The submitted data is invalid."
    assert body["errors"]["consent"] == ["You must accept the privacy policy to create an account."]
    assert body["errors"]["password"][0].startswith("The password must contain at least")


def test_django_and_drf_messages_follow_the_language_too():
    english = APIClient().post(REGISTER, {}, format="json", HTTP_ACCEPT_LANGUAGE="en")
    french = APIClient().post(REGISTER, {}, format="json")

    assert english.json()["errors"]["email"] == ["This field is required."]
    assert french.json()["errors"]["email"] == ["Ce champ est obligatoire."]


@override_settings(AI_ENABLED=False)
def test_an_unavailable_ai_feature_explains_itself_in_english():
    user = User.objects.create_user("ada@example.org", "mot-de-passe-solide-2026")
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/v1/ai/summarize-project/",
        {"description": "x" * 60},
        format="json",
        HTTP_ACCEPT_LANGUAGE="en",
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "AI features are turned off."


@override_settings(AI_ENABLED=True, AI_API_KEY="cle-de-test", AI_DAILY_LIMIT=200)
def test_the_copilot_is_asked_to_answer_in_the_interface_language():
    user = User.objects.create_user("ada@example.org", "mot-de-passe-solide-2026")
    client = APIClient()
    client.force_authenticate(user=user)

    with patch("ai.services.ask", return_value="Go to My profile.") as ask:
        client.post(
            "/api/v1/ai/copilot/",
            {"message": "How do I fill in my profile?"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="en",
        )

    assert "Réponds en anglais" in ask.call_args.kwargs["system"]
