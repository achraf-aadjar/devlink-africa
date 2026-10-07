"""Fragments de vues réutilisables (DL-19)."""

from __future__ import annotations


class OwnedQuerysetMixin:
    """Restreint le queryset aux objets de l'utilisateur connecté.

    Pourquoi filtrer plutôt que vérifier l'objet : accéder à la ressource d'un
    autre renvoie alors un **404** et non un 403. Un 403 confirmerait que l'objet
    existe, ce qui permettrait d'énumérer les ressources des autres (IDOR).
    """

    owner_field: str = "user"

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(**{self.owner_field: self.request.user})
