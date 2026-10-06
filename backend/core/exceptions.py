"""Gestionnaire d'exceptions unique : un seul format d'erreur pour toute l'API.

Format (contrat figé par DL-04) :
    {"detail": "message lisible", "code": "machine_readable", "errors": {"champ": ["..."]}}
`errors` n'est présent que pour les erreurs de validation (400).
"""

from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class Conflict(exceptions.APIException):
    """409 : la requête est valide mais entre en conflit avec l'état courant."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "Conflit avec l'état actuel de la ressource."
    default_code = "conflict"


def _flatten(detail: Any) -> dict[str, list[str]]:
    """Transforme le détail d'une ValidationError DRF en {champ: [messages]}."""
    if isinstance(detail, dict):
        return {field: _as_messages(value) for field, value in detail.items()}
    return {"detail": _as_messages(detail)}


def _as_messages(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value]
    if isinstance(value, dict):
        return [f"{key}: {' '.join(_as_messages(sub))}" for key, sub in value.items()]
    return [str(value)]


def api_exception_handler(exc, context):
    """Point d'entrée déclaré dans REST_FRAMEWORK['EXCEPTION_HANDLER']."""
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, PermissionDenied):
        exc = exceptions.PermissionDenied()

    response = drf_exception_handler(exc, context)
    if response is None:
        # Erreur non gérée : on laisse Django la remonter (500, journalisée).
        return None

    body: dict[str, Any] = {"detail": "", "code": _code_of(exc)}

    if isinstance(exc, exceptions.ValidationError):
        errors = _flatten(exc.detail)
        body["detail"] = "Les données envoyées sont invalides."
        body["code"] = "invalid"
        body["errors"] = errors
    else:
        detail = exc.detail if hasattr(exc, "detail") else str(exc)
        body["detail"] = str(detail)
        if isinstance(detail, (list, dict)):
            body["detail"] = " ".join(_as_messages(detail))

    if isinstance(exc, exceptions.Throttled) and exc.wait:
        body["detail"] = f"Trop de tentatives. Réessayez dans {int(exc.wait)} secondes."
        response["Retry-After"] = str(int(exc.wait))

    response.data = body
    return Response(body, status=response.status_code, headers=_safe_headers(response))


def _code_of(exc) -> str:
    """Code machine de l'erreur : celui passé à l'exception, sinon son défaut."""
    detail = getattr(exc, "detail", None)
    code = getattr(detail, "code", None)  # ErrorDetail porte le code réel
    return str(code or getattr(exc, "default_code", "error"))


def _safe_headers(response) -> dict[str, str]:
    keep = ("Retry-After", "WWW-Authenticate")
    return {name: response[name] for name in keep if name in response}
