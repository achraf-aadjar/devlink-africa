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

    #: Clé de la paire, indépendante du sens : « 3-7 » que ce soit 3 vers 7 ou
    #: 7 vers 3. Elle permet d'imposer en base « une seule demande en attente
    #: par paire d'utilisateurs » (DL-18), ce qu'une contrainte sur
    #: (requester, partner) ne saurait pas faire dans les deux sens.
    pair_key = models.CharField(max_length=40, editable=False, db_index=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["requester", "status"]),
            models.Index(fields=["partner", "status"]),
        ]
        constraints = [
            # On ne se propose pas un échange à soi-même.
            models.CheckConstraint(
                condition=~models.Q(requester=models.F("partner")),
                name="exchange_requester_differs_from_partner",
            ),
            # Une seule demande en attente par paire, dans un sens ou l'autre.
            models.UniqueConstraint(
                fields=["pair_key"],
                condition=models.Q(status="PROPOSED"),
                name="unique_pending_exchange_per_pair",
            ),
        ]

    @staticmethod
    def build_pair_key(user_a_id: int, user_b_id: int) -> str:
        """Clé normalisée d'une paire : le plus petit identifiant en premier."""
        low, high = sorted((int(user_a_id), int(user_b_id)))
        return f"{low}-{high}"

    def save(self, *args, **kwargs):
        self.pair_key = self.build_pair_key(self.requester_id, self.partner_id)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type} {self.requester_id}->{self.partner_id}"
