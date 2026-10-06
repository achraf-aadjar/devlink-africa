"""Écritures du profil (DL-14)."""

from __future__ import annotations

from django.db import transaction

from .models import Profile

PROFILE_FIELDS = ("country", "bio", "availability", "domains", "avatar_url")


@transaction.atomic
def update_me(*, user, data: dict):
    """Met à jour le compte et son profil en une transaction.

    Renvoie l'utilisateur, dont le profil est garanti présent.
    """
    profile, _ = Profile.objects.get_or_create(user=user)

    if "full_name" in data:
        user.full_name = data["full_name"]
        user.save(update_fields=["full_name"])

    changed = [field for field in PROFILE_FIELDS if field in data]
    for field in changed:
        setattr(profile, field, data[field])
    if changed:
        profile.save(update_fields=[*changed, "updated_at"])

    return user
