"""Sérialiseurs du Dev Match (DL-24, DL-39).

Les réponses sont toujours écrites **du point de vue de l'utilisateur
connecté** : « ce qu'il peut vous apprendre » et « ce que vous pouvez lui
apprendre ». L'explication stockée l'est du point de vue de user_a, et c'est ce
module qui la retourne si besoin.
"""

from __future__ import annotations

from rest_framework import serializers

from core.serializers import StrictSerializer

from .models import Match, MatchFeedback
from .scoring import MatchExplanation, SkillRef, reasons_for

COMMENT_MAX_LENGTH = 500


class MatchPartnerSerializer(serializers.Serializer):
    """L'autre membre de la paire : jamais son adresse e-mail."""

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    country = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    is_demo = serializers.SerializerMethodField()

    def _profile(self, user, field, default):
        profile = getattr(user, "profile", None)
        return getattr(profile, field) if profile else default

    def get_country(self, user) -> str:
        return self._profile(user, "country", "")

    def get_avatar_url(self, user) -> str:
        return self._profile(user, "avatar_url", "")

    def get_is_demo(self, user) -> bool:
        return self._profile(user, "is_demo", False)


def oriented_explanation(match: Match, viewer_id: int) -> dict:
    """Retourne l'explication dans le sens du lecteur.

    En base, `a_can_teach_b` désigne ce que user_a enseigne. Si le lecteur est
    user_b, les deux listes sont échangées pour que « ils peuvent vous
    apprendre » reste vrai.
    """
    stored = dict(match.explanation or {})
    a_teaches = stored.get("a_can_teach_b", [])
    b_teaches = stored.get("b_can_teach_a", [])

    if viewer_id == match.user_a_id:
        they_teach_you, you_teach_them = b_teaches, a_teaches
    else:
        they_teach_you, you_teach_them = a_teaches, b_teaches

    return {
        "breakdown": stored.get("breakdown", []),
        "they_can_teach_you": they_teach_you,
        "you_can_teach_them": you_teach_them,
        "common_skills": stored.get("common_skills", []),
        "capped": stored.get("capped", False),
    }


def build_reasons(match: Match, viewer_id: int, partner_name: str, lang: str = "fr") -> list[str]:
    """Phrases d'explication, reconstruites depuis les données calculées."""
    oriented = oriented_explanation(match, viewer_id)
    explanation = MatchExplanation(
        score=match.score,
        breakdown=[],
        a_can_teach_b=[
            SkillRef(item["name"], item.get("level", "BEGINNER")) for item in oriented["you_can_teach_them"]
        ],
        b_can_teach_a=[
            SkillRef(item["name"], item.get("level", "BEGINNER")) for item in oriented["they_can_teach_you"]
        ],
        common_skills=[SkillRef(item["name"]) for item in oriented["common_skills"]],
        capped=oriented["capped"],
    )
    # `reasons_for` lit le critère de collaboration dans la répartition stockée.
    from .scoring import CriterionScore

    explanation.breakdown = [
        CriterionScore(item["criterion"], item["points"]) for item in oriented["breakdown"]
    ]
    return reasons_for(explanation, "Vous", partner_name, lang)


class MatchListSerializer(serializers.Serializer):
    """Une carte de match : score et raisons courtes (DL-26)."""

    id = serializers.IntegerField(read_only=True)
    score = serializers.FloatField(read_only=True)
    computed_at = serializers.DateTimeField(read_only=True)
    user = serializers.SerializerMethodField()
    reasons = serializers.SerializerMethodField()

    @property
    def viewer_id(self) -> int:
        return self.context["viewer_id"]

    @property
    def lang(self) -> str:
        """Langue des phrases rédigées par le serveur (voir core/i18n.py)."""
        return self.context.get("lang", "fr")

    def _partner_name(self, partner) -> str:
        return partner.full_name or ("This person" if self.lang == "en" else "Cette personne")

    def _partner(self, match: Match):
        return match.user_b if match.user_a_id == self.viewer_id else match.user_a

    def get_user(self, match: Match) -> dict:
        return MatchPartnerSerializer(self._partner(match)).data

    def get_reasons(self, match: Match) -> list[str]:
        partner = self._partner(match)
        return build_reasons(match, self.viewer_id, self._partner_name(partner), self.lang)[:3]


class MatchDetailSerializer(MatchListSerializer):
    """Le détail : répartition par critère et ce que chacun peut apprendre."""

    explanation = serializers.SerializerMethodField()
    my_feedback = serializers.SerializerMethodField()

    def get_explanation(self, match: Match) -> dict:
        partner = self._partner(match)
        payload = oriented_explanation(match, self.viewer_id)
        payload["reasons"] = build_reasons(match, self.viewer_id, self._partner_name(partner), self.lang)
        return payload

    def get_my_feedback(self, match: Match) -> dict | None:
        feedback = next((item for item in match.feedbacks.all() if item.author_id == self.viewer_id), None)
        return MatchFeedbackSerializer(feedback).data if feedback else None


class MatchFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchFeedback
        fields = ("id", "match", "is_relevant", "comment", "created_at")
        read_only_fields = fields


class MatchFeedbackWriteSerializer(StrictSerializer):
    """Entrée de POST /matches/{id}/feedback/ (DL-39)."""

    is_relevant = serializers.BooleanField()
    comment = serializers.CharField(
        max_length=COMMENT_MAX_LENGTH, required=False, allow_blank=True, default=""
    )
