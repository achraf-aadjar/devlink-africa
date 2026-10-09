from django.conf import settings
from django.db import models


class Skill(models.Model):
    class Category(models.TextChoices):
        FRONTEND = "FRONTEND", "Front-end"
        BACKEND = "BACKEND", "Back-end"
        MOBILE = "MOBILE", "Mobile"
        DATA = "DATA", "Données"
        DEVOPS = "DEVOPS", "DevOps"
        DESIGN = "DESIGN", "Design"
        AUTRE = "AUTRE", "Autre"

    name = models.CharField(max_length=80, unique=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.AUTRE)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["category"])]

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    class Kind(models.TextChoices):
        OFFERED = "OFFERED", "Proposée"
        WANTED = "WANTED", "Recherchée"

    class Level(models.TextChoices):
        BEGINNER = "BEGINNER", "Débutant"
        INTERMEDIATE = "INTERMEDIATE", "Intermédiaire"
        ADVANCED = "ADVANCED", "Avancé"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="user_skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="user_skills")
    kind = models.CharField(max_length=10, choices=Kind.choices)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BEGINNER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "skill", "kind"], name="unique_user_skill_kind"),
        ]

    def __str__(self):
        return f"{self.user_id} {self.kind} {self.skill_id}"


class SkillProof(models.Model):
    class Kind(models.TextChoices):
        PROJECT = "PROJECT", "Projet"
        GITHUB_REPO = "GITHUB_REPO", "Dépôt GitHub"
        OPEN_SOURCE = "OPEN_SOURCE", "Contribution open source"
        CERTIFICATION = "CERTIFICATION", "Certification"
        CHALLENGE = "CHALLENGE", "Challenge"

    user_skill = models.ForeignKey(UserSkill, on_delete=models.CASCADE, related_name="proofs")
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.PROJECT)
    title = models.CharField(max_length=150)
    url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class SkillEndorsement(models.Model):
    """Une compétence confirmée par quelqu'un qui l'a apprise de son titulaire.

    C'est ce qui transforme une compétence **déclarée** en compétence
    **vérifiée** : seul un partenaire d'échange terminé, ou un membre d'un cercle
    actif qui l'apprend de cette personne, peut la valider (voir
    `endorsements.eligible_skills`). On ne se valide pas soi-même, et l'on ne
    valide qu'une fois une même compétence.
    """

    class Context(models.TextChoices):
        EXCHANGE = "EXCHANGE", "Après un échange"
        CIRCLE = "CIRCLE", "Dans un cercle d'échange"

    user_skill = models.ForeignKey(UserSkill, on_delete=models.CASCADE, related_name="endorsements")
    endorser = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="endorsements_given"
    )
    context = models.CharField(max_length=20, choices=Context.choices)
    comment = models.CharField(max_length=280, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user_skill", "endorser"], name="unique_endorsement"),
        ]

    def __str__(self):
        return f"{self.endorser_id} valide {self.user_skill_id}"
