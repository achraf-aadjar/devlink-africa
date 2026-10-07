"""Recherche d'utilisateurs et de projets (DL-25) et statistiques par pays (DL-38).

**Aucune fonction propre à PostgreSQL** : pas de SearchVector ni de trigramme.
La recherche textuelle utilise `icontains`, qui fonctionne aussi sur SQLite. Le
projet reste donc portable (voir docs/DECISIONS.md).
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Prefetch, Q, QuerySet

from profiles.models import AVAILABILITY_CHOICES, DOMAIN_CHOICES
from projects.models import Project, ProjectJoinRequest
from skills.models import Skill, UserSkill

User = get_user_model()


def search_users(
    *,
    q: str | None = None,
    country: str | None = None,
    skill: str | None = None,
    skill_wanted: str | None = None,
    level: str | None = None,
    availability: str | None = None,
    domain: str | None = None,
    is_demo: bool | None = None,
) -> QuerySet:
    """Développeurs correspondant aux critères. Tous les filtres se combinent."""
    queryset = (
        User.objects.filter(is_active=True)
        .select_related("profile")
        .prefetch_related(
            Prefetch(
                "user_skills",
                queryset=UserSkill.objects.select_related("skill").order_by("skill__name"),
            )
        )
    )

    if q:
        queryset = queryset.filter(Q(full_name__icontains=q) | Q(profile__bio__icontains=q))
    if country:
        queryset = queryset.filter(profile__country=country.upper())
    if skill:
        queryset = queryset.filter(user_skills__kind=UserSkill.Kind.OFFERED, **_skill_lookup(skill))
    if skill_wanted:
        queryset = queryset.filter(user_skills__kind=UserSkill.Kind.WANTED, **_skill_lookup(skill_wanted))
    if level:
        queryset = queryset.filter(user_skills__kind=UserSkill.Kind.OFFERED, user_skills__level=level)
    if availability:
        # JSONField : on cherche la valeur dans la liste, sans fonction PostgreSQL.
        queryset = queryset.filter(profile__availability__icontains=availability)
    if domain:
        queryset = queryset.filter(profile__domains__icontains=domain)
    if is_demo is not None:
        queryset = queryset.filter(profile__is_demo=is_demo)

    return queryset.distinct().order_by("full_name", "id")


def _skill_lookup(value: str) -> dict:
    """Filtre par identifiant si c'est un nombre, sinon par nom exact."""
    if str(value).isdigit():
        return {"user_skills__skill_id": int(value)}
    return {"user_skills__skill__name__iexact": value}


def search_projects(
    *,
    q: str | None = None,
    country: str | None = None,
    skill: str | None = None,
    status: str | None = None,
) -> QuerySet[Project]:
    """Projets correspondant aux critères."""
    queryset = (
        Project.objects.select_related("owner", "owner__profile")
        .prefetch_related("needs")
        .annotate(
            pending_requests=Count(
                "join_requests",
                filter=Q(join_requests__status=ProjectJoinRequest.Status.PENDING),
                distinct=True,
            )
        )
    )

    if q:
        queryset = queryset.filter(Q(title__icontains=q) | Q(description__icontains=q))
    if country:
        queryset = queryset.filter(owner__profile__country=country.upper())
    if skill:
        if str(skill).isdigit():
            queryset = queryset.filter(needs__id=int(skill))
        else:
            queryset = queryset.filter(needs__name__iexact=skill)
    if status:
        queryset = queryset.filter(status=status)

    return queryset.distinct().order_by("-created_at", "-id")


# --- Exploration par pays (DL-38) ------------------------------------------

#: Noms et drapeaux des pays, pour l'affichage. Les drapeaux sont des emoji :
#: aucune image ni police tierce, donc aucune question de licence.
COUNTRY_NAMES: dict[str, str] = {
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "BJ": "Bénin",
    "CD": "République démocratique du Congo",
    "CG": "Congo",
    "CI": "Côte d'Ivoire",
    "CM": "Cameroun",
    "DJ": "Djibouti",
    "DZ": "Algérie",
    "GA": "Gabon",
    "GN": "Guinée",
    "GQ": "Guinée équatoriale",
    "KM": "Comores",
    "MA": "Maroc",
    "MG": "Madagascar",
    "ML": "Mali",
    "MR": "Mauritanie",
    "NE": "Niger",
    "RW": "Rwanda",
    "SN": "Sénégal",
    "TD": "Tchad",
    "TG": "Togo",
    "TN": "Tunisie",
    "GH": "Ghana",
    "NG": "Nigeria",
    "KE": "Kenya",
    "ZA": "Afrique du Sud",
    "ET": "Éthiopie",
    "EG": "Égypte",
    "TZ": "Tanzanie",
    "UG": "Ouganda",
    "AO": "Angola",
    "MZ": "Mozambique",
    "ZM": "Zambie",
    "ZW": "Zimbabwe",
    "BW": "Botswana",
    "NA": "Namibie",
    "MW": "Malawi",
    "MU": "Maurice",
    "CV": "Cap-Vert",
    "GM": "Gambie",
    "GW": "Guinée-Bissau",
    "LR": "Liberia",
    "SL": "Sierra Leone",
    "SO": "Somalie",
    "SS": "Soudan du Sud",
    "SD": "Soudan",
    "LY": "Libye",
    "ER": "Érythrée",
    "SC": "Seychelles",
    "ST": "Sao Tomé-et-Principe",
    "LS": "Lesotho",
    "SZ": "Eswatini",
    "CF": "République centrafricaine",
}


def country_name(code: str) -> str:
    return COUNTRY_NAMES.get(code.upper(), code.upper())


def country_flag(code: str) -> str:
    """Drapeau en emoji, construit depuis le code pays (indicateurs régionaux)."""
    code = code.upper()
    if len(code) != 2 or not code.isalpha():
        return ""
    return "".join(chr(0x1F1E6 + ord(letter) - ord("A")) for letter in code)


def list_countries() -> list[dict]:
    """Pays qui comptent au moins un développeur ou un projet (DL-38)."""
    developers = {
        row["profile__country"]: row["total"]
        for row in User.objects.filter(is_active=True)
        .exclude(profile__country="")
        .values("profile__country")
        .annotate(total=Count("id"))
    }
    projects = {
        row["owner__profile__country"]: row["total"]
        for row in Project.objects.exclude(owner__profile__country="")
        .values("owner__profile__country")
        .annotate(total=Count("id"))
    }

    codes = sorted(set(developers) | set(projects), key=lambda code: country_name(code))
    return [
        {
            "code": code,
            "name": country_name(code),
            "flag": country_flag(code),
            "developers_count": developers.get(code, 0),
            "projects_count": projects.get(code, 0),
        }
        for code in codes
    ]


def all_countries() -> list[dict]:
    """Tous les pays autorisés, pour les listes de choix d'un formulaire.

    À distinguer de `list_countries`, qui ne renvoie que les pays réellement
    représentés sur la plateforme (page d'exploration).
    """
    from core.validators import ALLOWED_COUNTRIES

    return sorted(
        (
            {"code": code, "name": country_name(code), "flag": country_flag(code)}
            for code in ALLOWED_COUNTRIES
        ),
        key=lambda item: item["name"],
    )


def country_detail(code: str) -> dict:
    """Détail d'un pays. Un pays sans donnée renvoie des compteurs à zéro."""
    code = code.upper()
    developers = list(search_users(country=code)[:20])
    projects = list(search_projects(country=code)[:20])

    top_skills = list(
        Skill.objects.filter(
            user_skills__kind=UserSkill.Kind.OFFERED,
            user_skills__user__profile__country=code,
            user_skills__user__is_active=True,
        )
        .annotate(count=Count("user_skills", distinct=True))
        .order_by("-count", "name")
        .values("id", "name", "count")[:8]
    )

    return {
        "code": code,
        "name": country_name(code),
        "flag": country_flag(code),
        "developers_count": search_users(country=code).count(),
        "projects_count": search_projects(country=code).count(),
        "top_skills": top_skills,
        "developers": developers,
        "projects": projects,
    }


ALLOWED_AVAILABILITY = frozenset(AVAILABILITY_CHOICES)
ALLOWED_DOMAINS = frozenset(DOMAIN_CHOICES)
