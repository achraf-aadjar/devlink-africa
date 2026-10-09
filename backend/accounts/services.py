"""Règles métier de l'authentification (DL-03).

Ce module ne connaît ni les requêtes HTTP ni les sérialiseurs : il reçoit des
valeurs simples et lève des exceptions d'API. Les vues restent minces.

Journalisation : on ne journalise jamais un mot de passe, un jeton ni une
adresse e-mail en clair (règle 6 du cahier des charges). Pour l'audit, l'adresse
est remplacée par une empreinte courte et non réversible.
"""

from __future__ import annotations

import hashlib
import logging

from django.contrib.auth import authenticate
from django.db import IntegrityError, models, transaction
from rest_framework import exceptions
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from circles.models import Circle, CircleMember
from core.exceptions import Conflict
from matching.models import Match
from profiles.models import Profile

from .models import User

audit = logging.getLogger("accounts.audit")


def email_fingerprint(email: str) -> str:
    """Empreinte courte d'une adresse, pour l'audit sans donnée personnelle."""
    return hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:12]


def issue_tokens(user: User) -> dict[str, str]:
    """Crée la paire de jetons JWT d'un utilisateur."""
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


@transaction.atomic
def register_user(*, email: str, password: str, full_name: str = "") -> User:
    """Crée un compte et son profil vide. Lève Conflict si l'email existe déjà."""
    if User.objects.filter(email=email).exists():
        raise Conflict("Cette adresse e-mail est déjà utilisée.", code="email_already_used")

    try:
        user = User.objects.create_user(email=email, password=password, full_name=full_name)
    except IntegrityError as error:
        # Course entre deux inscriptions simultanées sur la même adresse.
        raise Conflict("Cette adresse e-mail est déjà utilisée.", code="email_already_used") from error

    Profile.objects.create(user=user)
    audit.info("register_success user=%s", user.pk)
    return user


@transaction.atomic
def login_or_register_with_google(*, google_info: dict) -> User:
    """Connecte ou crée un compte à partir d'un jeton Google déjà vérifié (DL-03).

    L'adresse Google est garantie vérifiée par l'appelant (`email_verified`,
    voir `google_auth.verify_google_token`) : on peut donc l'utiliser pour
    retrouver un compte existant, qu'il ait été créé par mot de passe ou par
    Google la première fois. Un compte créé ici n'a pas de mot de passe
    utilisable (`set_unusable_password`) tant que la personne n'en choisit pas
    un depuis son profil.
    """
    email = User.objects.normalize_email(google_info["email"]).lower()
    full_name = str(google_info.get("name") or "").strip()[:150]

    user = User.objects.filter(email=email).first()
    if user is not None:
        if not user.is_active:
            raise exceptions.AuthenticationFailed("Ce compte est désactivé.", code="invalid_credentials")
        audit.info("google_login_success user=%s", user.pk)
        return user

    user = User.objects.create_user(email=email, password=None, full_name=full_name)
    Profile.objects.create(user=user)
    audit.info("google_register_success user=%s", user.pk)
    return user


def login_user(*, email: str, password: str) -> User:
    """Vérifie les identifiants. Lève AuthenticationFailed si invalides.

    La réponse est volontairement identique qu'il s'agisse d'une adresse
    inconnue, d'un mot de passe faux ou d'un compte désactivé, pour ne pas
    permettre l'énumération des comptes.
    """
    user = authenticate(username=email, password=password)
    if user is None or not user.is_active:
        audit.info("login_failed email_fp=%s", email_fingerprint(email))
        raise exceptions.AuthenticationFailed(
            "Adresse e-mail ou mot de passe incorrect.", code="invalid_credentials"
        )
    audit.info("login_success user=%s", user.pk)
    return user


def logout_user(*, user: User, refresh_token: str) -> None:
    """Révoque le jeton de rafraîchissement (liste noire simplejwt)."""
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as error:
        raise exceptions.ValidationError(
            {"refresh": ["Ce jeton de rafraîchissement est invalide ou déjà révoqué."]}
        ) from error
    audit.info("logout user=%s", user.pk)


def export_user_data(*, user) -> dict:
    """Export complet des données d'un utilisateur (droit d'accès, DL-40).

    Loi sénégalaise n° 2008-12 : la personne doit pouvoir obtenir une copie de
    ses données. On inclut tout ce qui la concerne, sans les données d'autrui.
    """
    from django.utils import timezone

    from exchanges.models import Exchange
    from projects.models import Project, ProjectJoinRequest
    from reports.models import Report
    from skills.models import UserSkill

    profile = getattr(user, "profile", None)

    return {
        "exported_at": timezone.now().isoformat(),
        "user": {
            "id": user.pk,
            "email": user.email,
            "full_name": user.full_name,
            "date_joined": user.date_joined.isoformat(),
        },
        "profile": {
            "country": profile.country if profile else "",
            "bio": profile.bio if profile else "",
            "availability": profile.availability if profile else [],
            "domains": profile.domains if profile else [],
            "avatar_url": profile.avatar_url if profile else "",
            "contact": profile.contact if profile else "",
        },
        "skills": [
            {
                "skill": entry.skill.name,
                "kind": entry.kind,
                "level": entry.level,
                "proofs": [
                    {"kind": proof.kind, "title": proof.title, "url": proof.url}
                    for proof in entry.proofs.all()
                ],
            }
            for entry in UserSkill.objects.filter(user=user)
            .select_related("skill")
            .prefetch_related("proofs")
        ],
        "projects": [
            {
                "title": project.title,
                "description": project.description,
                "status": project.status,
                "needs": [skill.name for skill in project.needs.all()],
            }
            for project in Project.objects.filter(owner=user).prefetch_related("needs")
        ],
        "join_requests": [
            {"project": entry.project.title, "message": entry.message, "status": entry.status}
            for entry in ProjectJoinRequest.objects.filter(applicant=user).select_related("project")
        ],
        "exchanges": [
            {
                "type": entry.type,
                "status": entry.status,
                "message": entry.message,
                "role": "demandeur" if entry.requester_id == user.pk else "destinataire",
                "created_at": entry.created_at.isoformat(),
            }
            for entry in Exchange.objects.filter(models.Q(requester=user) | models.Q(partner=user))
        ],
        # Sans les noms des autres membres : ce sont leurs données, pas les miennes.
        "circles": [
            {
                "status": member.circle.status,
                "my_response": member.response,
                "i_teach": [a["skill"]["name"] for a in member.circle.arrows if a["teacher"] == user.pk],
                "i_learn": [a["skill"]["name"] for a in member.circle.arrows if a["learner"] == user.pk],
                "created_at": member.circle.created_at.isoformat(),
            }
            for member in CircleMember.objects.filter(user=user).select_related("circle")
        ],
        "reports_made": [
            {
                "target_type": entry.target_type,
                "reason": entry.reason,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in Report.objects.filter(reporter=user)
        ],
    }


@transaction.atomic
def delete_account(*, user, password: str) -> None:
    """Supprime le compte et toutes les données liées (droit d'effacement, DL-40).

    Le mot de passe est redemandé : une suppression est irréversible, et un
    jeton volé ne doit pas suffire à détruire un compte.
    """
    if not user.check_password(password):
        raise exceptions.ValidationError({"password": ["Mot de passe incorrect."]})

    user_id = user.pk
    # Les matchs ne sont pas liés par cascade aux deux côtés : on les retire.
    Match.objects.filter(models.Q(user_a_id=user_id) | models.Q(user_b_id=user_id)).delete()
    # Un cercle privé d'un membre ne tient plus : on le retire entier, pour ne
    # pas laisser aux autres une chaîne brisée.
    Circle.objects.filter(members__user_id=user_id).delete()
    user.delete()

    audit.info("account_deleted user=%s", user_id)
