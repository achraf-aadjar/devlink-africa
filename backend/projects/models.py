from django.conf import settings
from django.db import models


class Project(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Ouvert"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        COMPLETED = "COMPLETED", "Terminé"
        CLOSED = "CLOSED", "Fermé"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    needs = models.ManyToManyField("skills.Skill", blank=True, related_name="projects_needing")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    repo_url = models.URLField(blank=True, help_text="Dépôt du code (https uniquement).")
    demo_url = models.URLField(blank=True, help_text="Démonstration en ligne (https uniquement).")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status"]), models.Index(fields=["-created_at"])]

    def __str__(self):
        return self.title


class ProjectJoinRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        ACCEPTED = "ACCEPTED", "Acceptée"
        DECLINED = "DECLINED", "Refusée"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="join_requests")
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_join_requests"
    )
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Une seule demande *en attente* par personne et par projet : un
            # refus ne doit pas interdire une nouvelle candidature plus tard.
            models.UniqueConstraint(
                fields=["project", "applicant"],
                condition=models.Q(status="PENDING"),
                name="unique_pending_join_request",
            ),
        ]

    def __str__(self):
        return f"{self.applicant_id} -> {self.project_id}"
