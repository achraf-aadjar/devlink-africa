"""Validateurs partagés (DL-14, DL-16, DL-19)."""

from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator, validate_email
from rest_framework import serializers

#: Codes pays ISO 3166-1 alpha-2 des 54 pays d'Afrique, plus quelques pays
#: fréquents dans la diaspora. Liste blanche : toute autre valeur est refusée.
AFRICAN_COUNTRIES = frozenset(
    """DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS
    LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW""".split()
)
OTHER_COUNTRIES = frozenset("FR BE CA CH US GB DE IT ES PT NL".split())
ALLOWED_COUNTRIES = AFRICAN_COUNTRIES | OTHER_COUNTRIES


def validate_country(value: str) -> str:
    """Vérifie et normalise un code pays."""
    if not value:
        return ""
    code = value.strip().upper()
    if code not in ALLOWED_COUNTRIES:
        raise serializers.ValidationError(
            "Code pays inconnu. Utilisez un code ISO 3166-1 alpha-2, par exemple SN."
        )
    return code


def validate_https_url(value: str) -> str:
    """N'accepte qu'une URL en https (règle de sécurité du cahier)."""
    if not value:
        return ""
    url = value.strip()
    if not url.startswith("https://"):
        raise serializers.ValidationError("L'adresse doit commencer par https://.")
    return url


CONTACT_ERROR = "Indiquez une adresse e-mail ou un lien qui commence par https://."


def validate_contact(value: str) -> str:
    """Moyen de contact : une adresse e-mail ou un lien https, rien d'autre.

    Le frontend en fait un lien cliquable (`mailto:` ou `https:`). Refuser tout
    le reste écarte par construction les liens `javascript:` et le texte libre.
    """
    if not value:
        return ""
    contact = value.strip()
    try:
        if contact.startswith("https://"):
            URLValidator(schemes=["https"])(contact)
        else:
            validate_email(contact)
    except DjangoValidationError as error:
        raise serializers.ValidationError(CONTACT_ERROR) from error
    return contact


class EnumListField(serializers.ListField):
    """Liste de valeurs contraintes à une énumération, sans doublon.

    L'ordre de saisie est conservé, ce qui rend l'affichage prévisible.
    """

    def __init__(self, choices, **kwargs):
        self.allowed = frozenset(choices)
        kwargs.setdefault("child", serializers.CharField())
        kwargs.setdefault("required", False)
        kwargs.setdefault("allow_empty", True)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        values = super().to_internal_value(data)
        unknown = [value for value in values if value not in self.allowed]
        if unknown:
            raise serializers.ValidationError(
                f"Valeurs non autorisées : {', '.join(sorted(set(unknown)))}. "
                f"Attendu parmi : {', '.join(sorted(self.allowed))}."
            )
        seen: list[str] = []
        for value in values:
            if value not in seen:
                seen.append(value)
        return seen
