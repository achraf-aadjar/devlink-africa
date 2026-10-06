"""Authentification JWT par en-tête Bearer.

Cette sous-classe existe pour une raison précise : sur une vue publique sans
classe d'authentification, DRF ne connaît aucun schéma et répond 403 à une
requête refusée, au lieu du 401 attendu par le contrat d'API. En déclarant la
classe, l'en-tête `WWW-Authenticate` est renvoyé et le statut devient 401.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication


class BearerJWTAuthentication(JWTAuthentication):
    def authenticate_header(self, request) -> str:
        return 'Bearer realm="api"'
