"""Bases de sérialiseurs communes (DL-19)."""

from rest_framework import serializers


class StrictFieldsMixin:
    """Refuse tout champ non déclaré, au lieu de l'ignorer en silence.

    Par défaut, DRF accepte une requête contenant des champs inconnus. Un client
    pourrait alors croire avoir modifié `is_demo` ou `is_staff` sans erreur. Le
    refus explicite documente la surface réelle de l'API.
    """

    def to_internal_value(self, data):
        if isinstance(data, dict):
            unknown = sorted(set(data) - set(self.fields))
            if unknown:
                raise serializers.ValidationError(
                    {field: ["Ce champ n'est pas accepté."] for field in unknown}
                )
        return super().to_internal_value(data)


class StrictSerializer(StrictFieldsMixin, serializers.Serializer):
    pass


class StrictModelSerializer(StrictFieldsMixin, serializers.ModelSerializer):
    pass
