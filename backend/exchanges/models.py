from django.conf import settings
from django.db import models


class Exchange(models.Model):
    class Type(models.TextChoices):
        PAIR_PROGRAMMING = "PAIR_PROGRAMMING", "Pair programming"
        CODE_REVIEW = "CODE_REVIEW", "Revue de code"
        MENTORAT = "MENTORAT", "Mentorat"
        DEBUGGING = "DEBUGGING", "Débogage"
        PROJET_COMMUN = "PROJET_COMMUN", "Projet commun"
        PREPARATION_ENTRETIEN = "PREPARATION_ENTRETIEN", "Préparation d'entretien"
        ECHANGE_COMPETENCES = "ECHANGE_COMPETENCES", "Échange de compétences"
        DISCUSSION = "DISCUSSION", "Discussion"

    class Status(models.TextChoices):
        PROPOSED = "PROPOSED", "Proposé"
        ACCEPTED = "ACCEPTED", "Accepté"
        DECLINED = "DECLINED", "Refusé"
        COMPLETED = "COMPLETED", "Terminé"
        CANCELLED = "CANCELLED", "Annulé"

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="exchanges_requested"
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="exchanges_received"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROPOSED)
    skill = models.ForeignKey(
        "skills.Skill", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    message = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} {self.requester_id}->{self.partner_id}"
