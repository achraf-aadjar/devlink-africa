"""Validation des compétences par les pairs.

Qui peut valider une compétence de qui :
- après un échange **terminé**, chacun peut valider n'importe quelle compétence
  proposée par l'autre : ils ont travaillé ensemble ;
- dans un cercle **actif**, on peut valider la compétence que l'on apprend de
  son professeur dans ce cercle, et seulement celle-là.
"""

from __future__ import annotations

from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import exceptions

from circles.models import Circle, CircleMember
from core.exceptions import Conflict
from exchanges.models import Exchange
from matching.scoring import normalise

from .models import SkillEndorsement, UserSkill

#: Toutes les compétences proposées par la personne sont validables.
ANY_SKILL = None


def eligible_skills(endorser) -> dict[int, dict]:
    """Pour chaque personne que `endorser` peut valider : le contexte, et les
    compétences permises (`ANY_SKILL` ou un ensemble de noms normalisés)."""
    result: dict[int, dict] = {}

    for exchange in Exchange.objects.filter(
        Q(requester=endorser) | Q(partner=endorser), status=Exchange.Status.COMPLETED
    ).only("requester_id", "partner_id"):
        other = exchange.partner_id if exchange.requester_id == endorser.pk else exchange.requester_id
        result[other] = {"context": SkillEndorsement.Context.EXCHANGE, "skills": ANY_SKILL}

    memberships = CircleMember.objects.filter(
        user=endorser, circle__status=Circle.Status.ACTIVE
    ).select_related("circle")
    for membership in memberships:
        for arrow in membership.circle.arrows:
            if arrow["learner"] != endorser.pk or arrow["teacher"] in result:
                continue
            entry = result.setdefault(
                arrow["teacher"], {"context": SkillEndorsement.Context.CIRCLE, "skills": set()}
            )
            if entry["skills"] is not ANY_SKILL:
                entry["skills"].add(normalise(arrow["skill"]["name"]))

    return result


def _allowed(rule: dict | None, user_skill: UserSkill) -> bool:
    if rule is None:
        return False
    return rule["skills"] is ANY_SKILL or normalise(user_skill.skill.name) in rule["skills"]


def endorse(*, endorser, user_skill_id: int, comment: str = "") -> SkillEndorsement:
    user_skill = (
        UserSkill.objects.select_related("skill", "user")
        .filter(pk=user_skill_id, kind=UserSkill.Kind.OFFERED, user__is_active=True)
        .first()
    )
    if user_skill is None:
        raise exceptions.NotFound("Compétence introuvable.")
    if user_skill.user_id == endorser.pk:
        raise exceptions.ValidationError(
            {"user_skill": ["Vous ne pouvez pas valider vos propres compétences."]}
        )

    rule = eligible_skills(endorser).get(user_skill.user_id)
    if not _allowed(rule, user_skill):
        raise exceptions.PermissionDenied(
            "Vous pouvez valider une compétence après un échange terminé avec cette personne, "
            "ou si elle vous l'apprend dans un cercle actif."
        )

    try:
        with transaction.atomic():
            return SkillEndorsement.objects.create(
                user_skill=user_skill, endorser=endorser, context=rule["context"], comment=comment.strip()
            )
    except IntegrityError as error:
        raise Conflict("Vous avez déjà validé cette compétence.", code="already_endorsed") from error


def withdraw(*, endorser, endorsement_id: int) -> None:
    deleted, _ = SkillEndorsement.objects.filter(pk=endorsement_id, endorser=endorser).delete()
    if not deleted:
        raise exceptions.NotFound()


def candidates(endorser) -> list[dict]:
    """Les personnes que l'utilisateur peut valider, avec leurs compétences permises
    et, pour chacune, la validation déjà donnée s'il y en a une."""
    rules = eligible_skills(endorser)
    if not rules:
        return []

    given = dict(
        SkillEndorsement.objects.filter(endorser=endorser, user_skill__user_id__in=rules).values_list(
            "user_skill_id", "pk"
        )
    )
    skills = (
        UserSkill.objects.filter(user_id__in=rules, kind=UserSkill.Kind.OFFERED, user__is_active=True)
        .select_related("skill", "user", "user__profile")
        .order_by("user__full_name", "skill__name")
    )

    people: dict[int, dict] = {}
    for user_skill in skills:
        rule = rules[user_skill.user_id]
        if not _allowed(rule, user_skill):
            continue
        person = people.setdefault(
            user_skill.user_id,
            {
                "user": {
                    "id": user_skill.user_id,
                    "full_name": user_skill.user.full_name,
                    "country": getattr(getattr(user_skill.user, "profile", None), "country", ""),
                },
                "context": rule["context"],
                "skills": [],
            },
        )
        person["skills"].append(
            {
                "user_skill": user_skill.pk,
                "name": user_skill.skill.name,
                "level": user_skill.level,
                "endorsement": given.get(user_skill.pk),
            }
        )
    return list(people.values())
