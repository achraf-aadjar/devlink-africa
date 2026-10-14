"""Triage des signalements (DL-32).

Aucune donnée d'équipe-écran n'existe pour ça : un signalement n'était vu par
personne après sa création (route POST seule, status jamais relu ni changé).
L'admin Django est la manière la plus légère de combler ce trou pour une
petite équipe, sans inventer un rôle de modérateur ni un nouvel écran.
"""

from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("id", "target_type", "target_id", "reason", "status", "reporter", "created_at")
    list_filter = ("status", "reason", "target_type")
    list_editable = ("status",)
    search_fields = ("reporter__email", "details")
    readonly_fields = ("reporter", "target_type", "target_id", "reason", "details", "created_at")
    ordering = ("-created_at",)
