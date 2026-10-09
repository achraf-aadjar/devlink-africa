"""Vérification des jetons d'identité Google (connexion « Continuer avec Google »).

**Aucune dépendance à `requests`.** La bibliothèque `google-auth` sait vérifier
un jeton, mais a besoin qu'on lui fournisse un petit adaptateur HTTP : la
plupart des exemples utilisent `google.auth.transport.requests`, qui tire
`requests` puis `certifi` (licence MPL-2.0, interdite par le règlement du
concours — voir LICENSES.md). `UrllibRequest` ci-dessous fournit la même
interface avec `urllib` de la bibliothèque standard, exactement comme
`ai/client.py` le fait déjà pour les appels au service d'IA.

**Ce module ne connaît ni les requêtes HTTP ni les sérialiseurs** (architecture
en couches) : il expose uniquement `verify_google_token`, qui renvoie les
informations du compte Google ou lève `GoogleAuthUnavailable`.
"""

from __future__ import annotations

import ssl
import urllib.error
import urllib.request

from django.conf import settings
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import Request as GoogleTransportRequest
from google.auth.transport import Response as GoogleTransportResponse
from google.oauth2 import id_token as google_id_token


class GoogleAuthUnavailable(Exception):
    """La connexion avec Google n'est pas configurée, ou le jeton est invalide."""

    def __init__(self, reason: str, *, code: str = "google_auth_unavailable"):
        super().__init__(reason)
        self.reason = reason
        self.code = code


class _UrllibResponse(GoogleTransportResponse):
    def __init__(self, status: int, headers: dict, data: bytes):
        self._status = status
        self._headers = headers
        self._data = data

    @property
    def status(self) -> int:
        return self._status

    @property
    def headers(self) -> dict:
        return self._headers

    @property
    def data(self) -> bytes:
        return self._data


class UrllibRequest(GoogleTransportRequest):
    """Transport minimal pour google-auth, basé sur `urllib` (voir ai/client.py)."""

    def __call__(self, url, method="GET", body=None, headers=None, timeout=None, **kwargs):
        request = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
        context = ssl.create_default_context()
        try:
            with urllib.request.urlopen(request, timeout=timeout, context=context) as response:
                return _UrllibResponse(response.status, dict(response.headers), response.read())
        except urllib.error.HTTPError as error:
            return _UrllibResponse(error.code, dict(error.headers or {}), error.read())


def is_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID)


def verify_google_token(credential: str) -> dict:
    """Vérifie un jeton d'identité Google et renvoie son contenu.

    Vérifie la signature, l'émetteur et l'audience (notre identifiant client) :
    un jeton destiné à une autre application est donc rejeté. N'exige PAS que
    l'adresse soit déjà vérifiée par nous — c'est Google qui en garantit la
    propriété, via `email_verified`.
    """
    if not is_configured():
        raise GoogleAuthUnavailable(
            "La connexion avec Google n'est pas configurée.", code="google_not_configured"
        )

    try:
        info = google_id_token.verify_oauth2_token(credential, UrllibRequest(), settings.GOOGLE_CLIENT_ID)
    except (GoogleAuthError, ValueError) as error:
        raise GoogleAuthUnavailable(
            "Ce jeton Google n'a pas pu être vérifié.", code="google_token_invalid"
        ) from error

    if not info.get("email_verified"):
        raise GoogleAuthUnavailable(
            "Votre adresse Google n'est pas vérifiée.", code="google_email_unverified"
        )

    return info
