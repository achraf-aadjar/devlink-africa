"""Cercles d'échange : trois ou quatre développeurs qui apprennent en chaîne.

Un cercle n'est enregistré que lorsqu'un membre le **propose**. Les suggestions,
elles, sont recalculées à la demande (`services.suggest_circles`) : inutile de
stocker ce que personne n'a encore choisi.
"""

from django.conf import settings
from django.db import models
from django.db.models import Q


class Circle(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "PROPOSED", "Proposé"
        ACTIVE = "ACTIVE", "Actif"
        DECLINED = "DECLINED", "Refusé"

    #: Clé canonique des membres (voir `finder.circle_key`) : identique quel que
    #: soit le membre par lequel on lit le cercle.
    key = models.CharField(max_length=100, db_index=True)
    #: Flèches figées au moment de la proposition : qui apprend quoi à qui.
    #: Elles ne bougent plus ensuite, même si un membre modifie ses compétences,
    #: pour que tous acceptent exactement la même chose.
    arrows = models.JSONField(default=list)
    score = models.FloatField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PROPOSED)
    proposed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    activated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            # Un même cercle ne peut pas être ouvert deux fois en parallèle.
            models.UniqueConstraint(
                fields=["key"],
                condition=Q(status__in=["PROPOSED", "ACTIVE"]),
                name="unique_open_circle",
            ),
        ]

    def __str__(self):
        return f"Cercle {self.key} ({self.status})"


class CircleMember(models.Model):
    class Response(models.TextChoices):
        PENDING = "PENDING", "En attente"
        ACCEPTED = "ACCEPTED", "Accepté"
        DECLINED = "DECLINED", "Refusé"

    circle = models.ForeignKey(Circle, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="circle_memberships"
    )
    #: Place dans le cercle : le membre n apprend au membre n + 1, le dernier au premier.
    position = models.PositiveSmallIntegerField()
    response = models.CharField(max_length=20, choices=Response.choices, default=Response.PENDING)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["circle", "user"], name="unique_circle_member"),
            models.UniqueConstraint(fields=["circle", "position"], name="unique_circle_position"),
        ]

    def __str__(self):
        return f"{self.user_id}@{self.circle_id} ({self.response})"
