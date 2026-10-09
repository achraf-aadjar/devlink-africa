"""Sérialiseurs des cercles d'échange."""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictSerializer

from . import finder
from .models import Circle

DECISIONS = ("ACCEPT", "DECLINE")


def _person(user) -> dict:
    profile = getattr(user, "profile", None)
    return {
        "id": user.pk,
        "full_name": user.full_name,
        "country": profile.country if profile else "",
        "is_demo": profile.is_demo if profile else False,
    }


def serialize_circle(circle: Circle) -> dict:
    """Un cercle enregistré, tel que le voit l'un de ses membres.

    Le contact de chacun n'apparaît qu'une fois le cercle actif, c'est-à-dire
    quand **tous** ont accepté : même règle que pour un échange à deux.
    """
    active = circle.status == Circle.Status.ACTIVE
    members = []
    for member in circle.members.all():
        profile = getattr(member.user, "profile", None)
        members.append(
            {
                **_person(member.user),
                "response": member.response,
                "contact": (profile.contact or None) if active and profile else None,
            }
        )
    return {
        "id": circle.pk,
        "key": circle.key,
        "status": circle.status,
        "score": circle.score,
        "members": members,
        "arrows": circle.arrows,
        "created_at": circle.created_at.isoformat(),
        "activated_at": circle.activated_at.isoformat() if circle.activated_at else None,
    }


def serialize_suggestion(circle: finder.Circle, users: dict) -> dict:
    """Une suggestion calculée, pas encore enregistrée : ni identifiant, ni réponse."""
    return {
        "id": None,
        "key": circle.key,
        "status": "SUGGESTED",
        "score": circle.score,
        "members": [
            {**_person(users[member]), "response": None, "contact": None} for member in circle.members
        ],
        "arrows": [
            {
                "teacher": arrow.teacher,
                "learner": arrow.learner,
                "skill": {"name": arrow.skill.name, "level": arrow.skill.level},
            }
            for arrow in circle.arrows
        ],
        "created_at": None,
        "activated_at": None,
    }


class CircleMemberOutSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    country = serializers.CharField()
    is_demo = serializers.BooleanField()
    response = serializers.ChoiceField(choices=["PENDING", "ACCEPTED", "DECLINED"], allow_null=True)
    contact = serializers.CharField(allow_null=True)


class CircleSkillSerializer(serializers.Serializer):
    name = serializers.CharField()
    level = serializers.CharField()


class CircleArrowSerializer(serializers.Serializer):
    teacher = serializers.IntegerField()
    learner = serializers.IntegerField()
    skill = CircleSkillSerializer()


class CircleOutSerializer(serializers.Serializer):
    """Schéma de sortie (documentation OpenAPI) ; la réponse est produite par `serialize_circle`."""

    id = serializers.IntegerField(allow_null=True)
    key = serializers.CharField()
    status = serializers.ChoiceField(choices=["SUGGESTED", *Circle.Status.values])
    score = serializers.FloatField()
    members = CircleMemberOutSerializer(many=True)
    arrows = CircleArrowSerializer(many=True)
    created_at = serializers.DateTimeField(allow_null=True)
    activated_at = serializers.DateTimeField(allow_null=True)


class CircleProposalSerializer(StrictSerializer):
    members = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=finder.MIN_SIZE,
        max_length=finder.MAX_SIZE,
        help_text="Membres dans l'ordre : chacun apprend au suivant, le dernier au premier.",
    )


class CircleDecisionSerializer(StrictSerializer):
    decision = serializers.ChoiceField(choices=DECISIONS)
