"""Écritures du Project Hub (DL-16, DL-17)."""

from __future__ import annotations

from django.db import IntegrityError, transaction
from rest_framework import serializers

from core.exceptions import Conflict

from .models import Project, ProjectJoinRequest


@transaction.atomic
def create_project(*, owner, needs=None, **fields) -> Project:
    project = Project.objects.create(owner=owner, **fields)
    if needs:
        project.needs.set(needs)
    return project


@transaction.atomic
def update_project(*, project: Project, needs=None, **fields) -> Project:
    for name, value in fields.items():
        setattr(project, name, value)
    if fields:
        project.save()
    if needs is not None:
        project.needs.set(needs)
    return project


def request_to_join(*, project: Project, applicant, message: str) -> ProjectJoinRequest:
    """Dépose une candidature. Une seule en attente par personne et par projet."""
    if project.owner_id == applicant.pk:
        raise serializers.ValidationError({"detail": ["Vous ne pouvez pas rejoindre votre propre projet."]})

    try:
        with transaction.atomic():
            return ProjectJoinRequest.objects.create(project=project, applicant=applicant, message=message)
    except IntegrityError as error:
        raise Conflict(
            "Vous avez déjà une demande en attente sur ce projet.", code="duplicate_request"
        ) from error


def decide_join_request(*, join_request: ProjectJoinRequest, status: str) -> ProjectJoinRequest:
    """Accepte ou refuse une demande. Seule une demande en attente est décidable."""
    if join_request.status != ProjectJoinRequest.Status.PENDING:
        raise Conflict("Cette demande a déjà été traitée.", code="already_handled")

    join_request.status = status
    join_request.save(update_fields=["status"])
    return join_request
