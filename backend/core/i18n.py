"""Langue d'une requête, pour les rares textes que l'API rédige elle-même.

L'interface est bilingue (français, anglais) ; l'API renvoie surtout des
données, mais quelques phrases sont construites côté serveur, comme les
raisons d'un match. Elles suivent l'en-tête `Accept-Language` envoyé par le
frontend. Français par défaut : c'est la langue du concours.
"""

from __future__ import annotations

LANGUAGES = ("fr", "en")
DEFAULT = "fr"


def request_language(request) -> str:
    """« en » si la première langue demandée est l'anglais, « fr » sinon."""
    if request is None:
        return DEFAULT
    header = request.headers.get("Accept-Language", "")
    first = header.split(",")[0].split(";")[0].strip().lower()
    return "en" if first.startswith("en") else DEFAULT
