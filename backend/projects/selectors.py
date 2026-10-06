"""Lectures du Project Hub (DL-16). Requêtes optimisées, aucune écriture."""

from __future__ import annotations

from django.db.models import Count, Q, QuerySet

from .models import Project, ProjectJoinRequest


def list_projects(
    *,
    status: str | None = None,
    skill: str | None = None,
    country: str | None = None,
    search: str | None = None,
    owner_id: int | None = None,
) -> QuerySet[Project]:
    """Projets filtrés. Les relations sont préchargées pour éviter les N+1."""
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

    if status:
        queryset = queryset.filter(status=status)
    if skill:
        # Par identifiant ou par nom, comme l'annonce le contrat d'API.
        if str(skill).isdigit():
            queryset = queryset.filter(needs__id=int(skill))
        else:
            queryset = queryset.filter(needs__name__iexact=skill)
    if country:
        queryset = queryset.filter(owner__profile__country=country.upper())
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
    if owner_id:
        queryset = queryset.filter(owner_id=owner_id)

    # L'ordre explicite évite un avertissement de pagination instable.
    return queryset.distinct().order_by("-created_at", "-id")


def list_join_requests(*, project: Project) -> QuerySet[ProjectJoinRequest]:
    return project.join_requests.select_related("applicant").all()
