"""Permissions communes à toutes les applications (DL-19)."""

from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """N'autorise que le propriétaire de l'objet.

    L'attribut qui désigne le propriétaire est lu dans `owner_field` sur la vue
    (par défaut « user »). Les vues qui utilisent cette permission renvoient un
    404 plutôt qu'un 403 sur les objets d'autrui : voir `OwnedQuerysetMixin`.
    """

    message = "Vous n'avez pas accès à cette ressource."

    def has_object_permission(self, request, view, obj):
        field = getattr(view, "owner_field", "user")
        owner_id = getattr(obj, f"{field}_id", None)
        if owner_id is None:
            owner = getattr(obj, field, None)
            owner_id = getattr(owner, "pk", None)
        return owner_id == request.user.pk


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Lecture ouverte, écriture réservée au propriétaire.

    Utilisée pour les ressources publiques mais modifiables par leur seul auteur,
    comme les projets du Project Hub.
    """

    message = "Seul le propriétaire peut modifier cette ressource."

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        field = getattr(view, "owner_field", "owner")
        return getattr(obj, f"{field}_id", None) == request.user.pk
