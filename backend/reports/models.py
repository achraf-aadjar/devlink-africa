from django.conf import settings
from django.db import models


class Report(models.Model):
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
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_received"
    )
    reason = models.CharField(max_length=20, choices=Reason.choices)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report<{self.reporter_id}->{self.reported_user_id}>"
