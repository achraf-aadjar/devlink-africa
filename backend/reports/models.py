"""Signalements (DL-32)."""

from django.conf import settings
from django.db import models


class Report(models.Model):
    """Signalement d'un profil ou d'un projet.

    La cible est désignée par un couple (type, identifiant) plutôt que par deux
    clés étrangères nullables : le contrat d'API expose `target_type` et
    `target_id`, et cela reste portable entre bases.
    """

    class TargetType(models.TextChoices):
        USER = "USER", "Profil"
        PROJECT = "PROJECT", "Projet"

    class Reason(models.TextChoices):
        SPAM = "SPAM", "Spam"
        HARASSMENT = "HARASSMENT", "Harcèlement"
        FAKE_PROFILE = "FAKE_PROFILE", "Faux profil"
        INAPPROPRIATE = "INAPPROPRIATE", "Contenu inapproprié"
        OTHER = "OTHER", "Autre"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Ouvert"
        REVIEWED = "REVIEWED", "Traité"
        DISMISSED = "DISMISSED", "Rejeté"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_made"
    )
    target_type = models.CharField(max_length=10, choices=TargetType.choices)
    target_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "signalement"
        ordering = ["-created_at"]
        constraints = [
            # Un seul signalement par personne et par cible (critère de DL-32).
            models.UniqueConstraint(
                fields=["reporter", "target_type", "target_id"], name="unique_report_per_target"
            ),
        ]
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self):
        return f"Signalement {self.target_type}#{self.target_id} par {self.reporter_id}"
