"""Profil d'un développeur (DL-02, DL-14)."""

from django.conf import settings
from django.db import models

#: Disponibilités déclarables. Liste blanche : voir docs/api.md § 19.
AVAILABILITY_CHOICES = ("MENTORING", "COLLABORATION", "OPEN_SOURCE", "FREELANCE")

#: Domaines d'activité.
DOMAIN_CHOICES = ("WEB", "MOBILE", "DATA", "DEVOPS", "DESIGN", "IA", "SECURITE", "EMBARQUE")


class Profile(models.Model):
    """Informations publiques d'un utilisateur, hors identité de connexion.

    `availability` et `domains` sont des JSONField plutôt que des ArrayField :
    les modèles restent portables entre PostgreSQL et SQLite (voir
    docs/DECISIONS.md).
    """

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    country = models.CharField(max_length=2, blank=True, help_text="Code pays ISO 3166-1 alpha-2.")
    bio = models.TextField(blank=True)
    availability = models.JSONField(default=list, blank=True)
    domains = models.JSONField(default=list, blank=True)
    avatar_url = models.URLField(blank=True)
    contact = models.CharField(
        max_length=200,
        blank=True,
        help_text="Adresse e-mail ou lien https. Visible seulement par les partenaires d'un échange accepté.",
    )
    is_demo = models.BooleanField(
        default=False, help_text="Profil de démonstration, étiqueté comme tel dans l'interface."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "profil"
        verbose_name_plural = "profils"
        indexes = [models.Index(fields=["country"])]

    def __str__(self):
        return f"Profil de {self.user_id}"

    def completeness(self) -> int:
        """Pourcentage de complétude, affiché dans le tableau de bord (DL-28).

        Cinq critères de poids égal : pays, biographie, disponibilités, domaines,
        et au moins une compétence déclarée.
        """
        checks = (
            bool(self.country),
            len(self.bio.strip()) >= 10,
            bool(self.availability),
            bool(self.domains),
            self.user.user_skills.exists(),
        )
        return round(100 * sum(checks) / len(checks))
