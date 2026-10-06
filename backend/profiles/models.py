from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    country = models.CharField(max_length=2, blank=True, help_text="Code pays ISO 3166-1 alpha-2.")
    bio = models.TextField(blank=True)
    availability = models.JSONField(default=list, blank=True)
    domains = models.JSONField(default=list, blank=True)
    avatar_url = models.URLField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile<{self.user_id}>"
