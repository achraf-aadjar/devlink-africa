from django.conf import settings
from django.db import models


class Skill(models.Model):
    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]

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
        EXPERT = "EXPERT", "Expert"

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
    user_skill = models.ForeignKey(UserSkill, on_delete=models.CASCADE, related_name="proofs")
    title = models.CharField(max_length=150)
    url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
