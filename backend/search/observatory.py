"""Observatoire des compétences : ce que le continent sait, et ce qu'il cherche.

Uniquement des **comptes**. Aucun nom, aucun identifiant n'en sort : on dit
« 3 développeurs proposent Docker au Kenya », jamais lesquels. Les compétences
et le pays de chacun sont de toute façon déjà publics sur son profil ;
l'observatoire ne fait que les additionner.
"""

from __future__ import annotations

from collections import defaultdict

from django.contrib.auth import get_user_model
from django.db.models import Count

from skills.models import UserSkill

from .selectors import country_flag, country_name

User = get_user_model()

#: Nombre de lignes des palmarès (manques, savoirs à partager, ponts).
TOP = 5
BRIDGES = 8


def _country(code: str) -> dict:
    return {"code": code, "name": country_name(code), "flag": country_flag(code)}


def observatory() -> dict:
    """Agrégats publics de l'offre et de la demande de compétences. Trois requêtes."""
    rows = (
        UserSkill.objects.filter(user__is_active=True)
        .values("skill__name", "skill__category", "kind", "user__profile__country")
        .annotate(total=Count("user", distinct=True))
    )

    offered: dict[str, int] = defaultdict(int)
    wanted: dict[str, int] = defaultdict(int)
    category: dict[str, str] = {}
    # Par compétence : pays qui la proposent, pays qui la cherchent.
    offered_in: dict[str, set[str]] = defaultdict(set)
    wanted_in: dict[str, set[str]] = defaultdict(set)

    for row in rows:
        name = row["skill__name"]
        country = row["user__profile__country"] or ""
        category[name] = row["skill__category"]
        if row["kind"] == UserSkill.Kind.OFFERED:
            offered[name] += row["total"]
            if country:
                offered_in[name].add(country)
        else:
            wanted[name] += row["total"]
            if country:
                wanted_in[name].add(country)

    skills = sorted(
        (
            {"name": name, "category": category[name], "offered": offered[name], "wanted": wanted[name]}
            for name in category
        ),
        key=lambda item: (-(item["offered"] + item["wanted"]), item["name"]),
    )

    shortages = sorted(
        (item for item in skills if item["wanted"] > item["offered"]),
        key=lambda item: (item["offered"] - item["wanted"], -item["wanted"], item["name"]),
    )[:TOP]
    surpluses = sorted(
        (item for item in skills if item["offered"] > item["wanted"]),
        key=lambda item: (item["wanted"] - item["offered"], -item["offered"], item["name"]),
    )[:TOP]

    # Un pont : une compétence cherchée dans un pays, proposée dans d'autres.
    bridges = []
    for name in sorted(wanted_in):
        for country in sorted(wanted_in[name], key=country_name):
            sources = sorted(offered_in[name] - {country}, key=country_name)
            if sources:
                bridges.append(
                    {
                        "skill": name,
                        "wanted_in": _country(country),
                        "offered_in": [_country(c) for c in sources],
                    }
                )
    bridges.sort(key=lambda item: (-len(item["offered_in"]), item["skill"], item["wanted_in"]["name"]))

    active = User.objects.filter(is_active=True)
    return {
        "totals": {
            "developers": active.count(),
            "countries": active.exclude(profile__country="")
            .exclude(profile__country__isnull=True)
            .values("profile__country")
            .distinct()
            .count(),
            "offered": sum(offered.values()),
            "wanted": sum(wanted.values()),
        },
        "skills": skills,
        "shortages": shortages,
        "surpluses": surpluses,
        "bridges": bridges[:BRIDGES],
    }
