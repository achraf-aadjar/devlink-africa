from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self) -> None:
        # Enregistre les extensions de schéma (authentification Bearer).
        from . import schema  # noqa: F401
