"""Les quatre fonctions d'IA (DL-44 à DL-47).

Principe commun : **l'IA propose, l'utilisateur valide**. Aucune de ces
fonctions n'écrit en base. Si l'IA est indisponible, l'appelant reçoit
`AIUnavailable` et l'interface propose le chemin classique.

Données envoyées : seulement le texte que l'utilisateur soumet, ou des listes de
compétences. Jamais d'adresse e-mail, d'identifiant ni de nom.
"""

from __future__ import annotations

import logging

from skills.models import Skill

from .client import AIUnavailable, ask, ask_json

logger = logging.getLogger("ai.calls")

MAX_INPUT_LENGTH = 4000


def _catalog_names() -> list[str]:
    """Le catalogue, qui borne ce que l'IA peut proposer."""
    return list(Skill.objects.values_list("name", flat=True))


def extract_skills(text: str) -> dict:
    """Déduit des compétences d'un texte libre (DL-44).

    **Rien n'est enregistré** : on renvoie des suggestions que l'utilisateur
    valide ensuite par les routes habituelles de /me/skills/.

    Les noms proposés sont contraints au catalogue : l'IA ne peut donc pas
    inventer une compétence qui n'existe pas chez nous.
    """
    catalog = _catalog_names()

    suggestions = ask_json(
        f"Texte : « {text[:MAX_INPUT_LENGTH]} »",
        system=(
            "Tu analyses la présentation d'un développeur. Déduis les compétences "
            "qu'il maîtrise et celles qu'il souhaite apprendre.\n"
            f"N'utilise QUE ces noms exacts : {', '.join(catalog)}.\n"
            "Niveaux possibles : BEGINNER, INTERMEDIATE, ADVANCED.\n"
            'Réponds uniquement en JSON : {"offered": [{"name": "...", "level": "..."}], '
            '"wanted": [{"name": "..."}]}'
        ),
        max_tokens=600,
    )

    if not isinstance(suggestions, dict):
        raise AIUnavailable("Réponse inattendue du service d'IA.")

    return {
        "offered": _clean_skills(suggestions.get("offered"), catalog, with_level=True),
        "wanted": _clean_skills(suggestions.get("wanted"), catalog, with_level=False),
    }


def _clean_skills(raw, catalog: list[str], *, with_level: bool) -> list[dict]:
    """Ne garde que les compétences réellement présentes dans le catalogue.

    C'est le garde-fou : une suggestion hors catalogue est écartée en silence,
    plutôt que de produire une erreur à l'enregistrement.
    """
    if not isinstance(raw, list):
        return []

    by_lower = {name.casefold(): name for name in catalog}
    levels = {"BEGINNER", "INTERMEDIATE", "ADVANCED"}
    cleaned: list[dict] = []
    seen: set[str] = set()

    for item in raw:
        if not isinstance(item, dict):
            continue
        name = by_lower.get(str(item.get("name", "")).strip().casefold())
        if not name or name in seen:
            continue
        seen.add(name)

        skill = Skill.objects.filter(name=name).values("id", "name").first()
        if not skill:
            continue

        entry = {"skill": skill["id"], "name": skill["name"]}
        if with_level:
            level = str(item.get("level", "")).strip().upper()
            entry["level"] = level if level in levels else "INTERMEDIATE"
        cleaned.append(entry)

    return cleaned


def parse_search_query(query: str) -> dict:
    """Traduit une phrase en critères de recherche (DL-45).

    Les critères sont renvoyés pour être **affichés et modifiables** : c'est la
    recherche classique qui s'exécute ensuite, avec ces valeurs.
    """
    from core.validators import ALLOWED_COUNTRIES
    from profiles.models import AVAILABILITY_CHOICES, DOMAIN_CHOICES

    catalog = _catalog_names()

    criteria = ask_json(
        f"Demande : « {query[:500]} »",
        system=(
            "Tu traduis une demande en critères de recherche de développeurs.\n"
            f"skill et skill_wanted : uniquement parmi {', '.join(catalog)}.\n"
            f"country : code ISO 3166-1 alpha-2 parmi {', '.join(sorted(ALLOWED_COUNTRIES))}.\n"
            f"availability : parmi {', '.join(AVAILABILITY_CHOICES)}.\n"
            f"domain : parmi {', '.join(DOMAIN_CHOICES)}.\n"
            "level : BEGINNER, INTERMEDIATE ou ADVANCED.\n"
            "Omets toute clé dont la valeur n'est pas certaine. "
            "Réponds uniquement en JSON."
        ),
        max_tokens=300,
    )

    if not isinstance(criteria, dict):
        raise AIUnavailable("Réponse inattendue du service d'IA.")

    allowed = {
        "skill": {name.casefold(): name for name in catalog},
        "skill_wanted": {name.casefold(): name for name in catalog},
        "country": {code.casefold(): code for code in ALLOWED_COUNTRIES},
        "availability": {value.casefold(): value for value in AVAILABILITY_CHOICES},
        "domain": {value.casefold(): value for value in DOMAIN_CHOICES},
        "level": {value.casefold(): value for value in ("BEGINNER", "INTERMEDIATE", "ADVANCED")},
    }

    # Liste blanche stricte : une valeur inventée par l'IA est écartée, sinon
    # elle provoquerait un 400 sur la recherche.
    cleaned = {}
    for key, mapping in allowed.items():
        value = criteria.get(key)
        if value is None:
            continue
        match = mapping.get(str(value).strip().casefold())
        if match:
            cleaned[key] = match

    if isinstance(criteria.get("q"), str) and criteria["q"].strip():
        cleaned["q"] = criteria["q"].strip()[:100]

    return cleaned


def summarize_project(description: str) -> str:
    """Résume une description longue en quelques phrases (DL-46).

    Le propriétaire valide avant tout enregistrement : nous ne faisons que
    renvoyer le texte proposé.
    """
    summary = ask(
        f"Description : « {description[:MAX_INPUT_LENGTH]} »",
        system=(
            "Résume ce projet de développement en deux phrases, en français, "
            "pour une carte de présentation. Va droit au but : le problème résolu "
            "et ce que le projet cherche. N'invente rien."
        ),
        max_tokens=200,
    )
    return summary.strip()


def phrase_match_explanation(*, score: float, they_teach: list[str], you_teach: list[str]) -> str:
    """Reformule une explication de match en une phrase (DL-47).

    **Les raisons calculées restent la source de vérité.** Cette phrase vient
    en plus, jamais à la place : elle est construite à partir des données du
    score, et l'interface affiche toujours la répartition chiffrée.
    """
    if not they_teach and not you_teach:
        raise AIUnavailable("Ce match n'a pas de complémentarité à reformuler.")

    sentence = ask(
        (
            f"Score : {round(score)}/100. "
            f"La personne peut enseigner : {', '.join(they_teach) or 'rien'}. "
            f"Vous pouvez lui enseigner : {', '.join(you_teach) or 'rien'}."
        ),
        system=(
            "Tu rédiges une phrase, en français, qui explique à un développeur "
            "pourquoi cette rencontre est intéressante. Une seule phrase, "
            "chaleureuse et concrète. N'invente aucune compétence, ne cite pas "
            "le score chiffré."
        ),
        max_tokens=150,
    )
    return sentence.strip()
