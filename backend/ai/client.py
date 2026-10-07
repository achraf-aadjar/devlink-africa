"""Client d'appel à un service d'IA (DL-43).

**Aucune dépendance ajoutée.** On utilise `urllib` de la bibliothèque standard :
les SDK et les bibliothèques HTTP courantes (`requests`, `httpx`) tirent
`certifi`, sous licence MPL-2.0, interdite par le règlement du concours. `urllib`
s'appuie sur le magasin de certificats du système.

**Le produit fonctionne entièrement sans IA.** Avec `AI_ENABLED=false` (le
défaut), chaque fonction lève `AIUnavailable` et l'appelant propose le chemin
classique. Aucune fonction principale n'en dépend.

**Données personnelles** : on n'envoie jamais d'adresse e-mail, d'identifiant ni
de nom. Seuls des textes que l'utilisateur soumet volontairement, ou des listes
de compétences, partent vers le service.
"""

from __future__ import annotations

import json
import logging
import ssl
import urllib.error
import urllib.request
from dataclasses import dataclass

from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("ai.calls")

#: Compteur journalier des appels, pour le plafond de DL-41.
QUOTA_CACHE_KEY = "ai:daily_calls"
QUOTA_WINDOW_SECONDS = 86_400


class AIUnavailable(Exception):
    """L'IA n'est pas disponible : l'appelant doit proposer le chemin classique.

    Ce n'est pas une erreur du produit. Elle couvre l'interrupteur à l'arrêt,
    l'absence de clé, le dépassement de quota, un délai d'attente ou une panne
    du service.
    """

    def __init__(self, reason: str, *, code: str = "ai_unavailable"):
        super().__init__(reason)
        self.reason = reason
        self.code = code


@dataclass(frozen=True)
class AIConfig:
    """Réglages lus depuis l'environnement."""

    enabled: bool
    api_key: str
    base_url: str
    model: str
    timeout: float
    daily_limit: int

    @classmethod
    def from_settings(cls) -> AIConfig:
        return cls(
            enabled=settings.AI_ENABLED,
            api_key=settings.AI_API_KEY,
            base_url=settings.AI_BASE_URL,
            model=settings.AI_MODEL,
            timeout=settings.AI_TIMEOUT,
            daily_limit=settings.AI_DAILY_LIMIT,
        )


def is_available() -> bool:
    """Vrai si un appel a une chance d'aboutir. Sert à l'affichage de l'état."""
    config = AIConfig.from_settings()
    return bool(config.enabled and config.api_key) and calls_today() < config.daily_limit


def calls_today() -> int:
    return cache.get(QUOTA_CACHE_KEY, 0)


def _consume_quota(limit: int) -> None:
    """Incrémente le compteur journalier. Lève AIUnavailable au dépassement."""
    used = calls_today()
    if used >= limit:
        logger.warning("ai_quota_exceeded used=%s limit=%s", used, limit)
        raise AIUnavailable("Le quota d'appels du jour est atteint.", code="ai_quota_exceeded")
    # `add` pose la valeur initiale avec son délai ; `incr` suit ensuite.
    if not cache.add(QUOTA_CACHE_KEY, 1, QUOTA_WINDOW_SECONDS):
        try:
            cache.incr(QUOTA_CACHE_KEY)
        except ValueError:
            # La clé a expiré entre les deux appels : on repart de 1.
            cache.set(QUOTA_CACHE_KEY, 1, QUOTA_WINDOW_SECONDS)


def ask(prompt: str, *, system: str = "", max_tokens: int = 500) -> str:
    """Envoie une requête au service d'IA et renvoie le texte de la réponse.

    Lève `AIUnavailable` dans tous les cas d'indisponibilité : l'appelant n'a
    donc qu'un seul type d'erreur à traiter.
    """
    config = AIConfig.from_settings()

    if not config.enabled:
        raise AIUnavailable("Les fonctions d'IA sont désactivées.")
    if not config.api_key:
        raise AIUnavailable("Aucune clé d'API n'est configurée.")

    _consume_quota(config.daily_limit)

    payload = {
        "model": config.model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        payload["system"] = system

    request = urllib.request.Request(
        f"{config.base_url.rstrip('/')}/v1/messages",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": config.api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        # Magasin de certificats du système : aucun paquet de certificats tiers.
        context = ssl.create_default_context()
        with urllib.request.urlopen(request, timeout=config.timeout, context=context) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        # Le corps d'erreur peut contenir des détails de compte : on ne le
        # journalise pas, et on ne le renvoie jamais au client.
        logger.warning("ai_http_error status=%s", error.code)
        raise AIUnavailable("Le service d'IA a refusé la requête.") from error
    except (urllib.error.URLError, TimeoutError) as error:
        logger.warning("ai_unreachable")
        raise AIUnavailable("Le service d'IA est injoignable.") from error
    except json.JSONDecodeError as error:
        logger.warning("ai_bad_response")
        raise AIUnavailable("Réponse inattendue du service d'IA.") from error

    text = _extract_text(body)
    if not text:
        raise AIUnavailable("Le service d'IA n'a rien répondu.")

    logger.info("ai_call_success tokens=%s", max_tokens)
    return text


def _extract_text(body: dict) -> str:
    """Récupère le texte de la réponse, quelle que soit sa forme exacte."""
    blocks = body.get("content") or []
    parts = [block.get("text", "") for block in blocks if isinstance(block, dict)]
    return "\n".join(part for part in parts if part).strip()


def ask_json(prompt: str, *, system: str = "", max_tokens: int = 500) -> dict | list:
    """Comme `ask`, mais attend du JSON en retour.

    Un modèle de langage encadre souvent son JSON de texte ou de balises de
    code : on extrait donc la première structure complète plutôt que d'analyser
    la réponse entière.
    """
    raw = ask(prompt, system=system, max_tokens=max_tokens)

    for opening, closing in (("{", "}"), ("[", "]")):
        start = raw.find(opening)
        end = raw.rfind(closing)
        if start != -1 and end > start:
            try:
                return json.loads(raw[start : end + 1])
            except json.JSONDecodeError:
                continue

    logger.warning("ai_json_unparseable")
    raise AIUnavailable("La réponse du service d'IA n'était pas exploitable.")
