"""Extensions drf-spectacular.

drf-spectacular reconnaît les classes d'authentification par leur chemin exact.
Notre sous-classe (voir `core.authentication`) doit donc être déclarée, sinon le
schéma est généré avec un avertissement et sans le schéma de sécurité Bearer.
"""

from drf_spectacular.extensions import OpenApiAuthenticationExtension


class BearerJWTScheme(OpenApiAuthenticationExtension):
    target_class = "core.authentication.BearerJWTAuthentication"
    name = "jwtAuth"

    def get_security_definition(self, auto_schema):
        return {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
