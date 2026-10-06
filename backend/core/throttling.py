"""Limitation de débit propre aux routes d'authentification (DL-03)."""

from rest_framework.throttling import SimpleRateThrottle


class AuthRateThrottle(SimpleRateThrottle):
    """5 tentatives par minute et par adresse IP sur /auth/*.

    On se base sur l'IP (et non sur l'utilisateur) : les tentatives échouées
    concernent justement des requêtes non authentifiées.
    """

    scope = "auth"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
