"""Agrégation du tableau de bord (DL-28).

Objectif : **une seule requête côté client**, et une réponse sous 300 ms. On
assemble donc ici tout ce qu'affiche l'écran d'accueil connecté, en quelques
requêtes groupées plutôt qu'un appel par bloc.
"""

from __future__ import annotations

from django.db.models import Count, Q

from exchanges.models import Exchange
from matching.selectors import list_matches
from profiles.models import Profile
from projects.models import Project, ProjectJoinRequest
from skills.models import UserSkill

#: Nombre d'éléments par bloc : ce sont des aperçus, chaque carte renvoyant
#: vers la page complète.
PREVIEW_SIZE = 5


def dashboard_for(user) -> dict:
    """Rassemble les données du tableau de bord d'un utilisateur."""
    profile, _ = Profile.objects.get_or_create(user=user)

    matches = list(list_matches(user=user)[:PREVIEW_SIZE])
    exchanges = list(
        Exchange.objects.filter(
            Q(requester=user) | Q(partner=user), status=Exchange.Status.PROPOSED
        ).select_related("requester", "partner", "skill")[:PREVIEW_SIZE]
    )
    join_requests = list(
        ProjectJoinRequest.objects.filter(
            project__owner=user, status=ProjectJoinRequest.Status.PENDING
        ).select_related("applicant", "project")[:PREVIEW_SIZE]
    )
    projects = list(
        Project.objects.filter(owner=user)
        .annotate(
            pending_requests=Count(
                "join_requests",
                filter=Q(join_requests__status=ProjectJoinRequest.Status.PENDING),
                distinct=True,
            )
        )
        .select_related("owner", "owner__profile")
        .prefetch_related("needs")[:PREVIEW_SIZE]
    )

    # Comptés en base, pas sur l'aperçu : au-delà de PREVIEW_SIZE demandes en
    # attente, compter les éléments affichés donnerait un total faux.
    exchange_counts = Exchange.objects.filter(Q(requester=user) | Q(partner=user)).aggregate(
        received=Count("id", filter=Q(partner=user, status=Exchange.Status.PROPOSED)),
        sent=Count("id", filter=Q(requester=user, status=Exchange.Status.PROPOSED)),
        total=Count("id"),
    )

    skills = UserSkill.objects.filter(user=user).aggregate(
        offered=Count("id", filter=Q(kind=UserSkill.Kind.OFFERED)),
        wanted=Count("id", filter=Q(kind=UserSkill.Kind.WANTED)),
    )

    return {
        "profile_completeness": profile.completeness(),
        "matches": matches,
        "exchanges": exchanges,
        "exchanges_received": exchange_counts["received"] or 0,
        "exchanges_sent": exchange_counts["sent"] or 0,
        "has_contact": bool(profile.contact),
        "join_requests": join_requests,
        "join_requests_count": ProjectJoinRequest.objects.filter(
            project__owner=user, status=ProjectJoinRequest.Status.PENDING
        ).count(),
        "projects": projects,
        "counters": {
            "offered_skills": skills["offered"] or 0,
            "wanted_skills": skills["wanted"] or 0,
            "matches": list_matches(user=user).count(),
            "exchanges": exchange_counts["total"] or 0,
        },
    }
