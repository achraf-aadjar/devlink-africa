"""Langue d'une requête, et traduction anglaise des messages de l'API.

L'interface est bilingue (français, anglais). L'API renvoie surtout des
données, mais elle rédige quelques textes : les raisons d'un match et les
messages d'erreur. Ils suivent l'en-tête `Accept-Language` envoyé par le
frontend. Français par défaut : c'est la langue du concours.

Les messages propres à DevLink sont écrits en français dans le code et
traduits ici, au même endroit, plutôt qu'avec des fichiers gettext compilés :
une poignée de phrases, et le test `core/tests/test_i18n.py` vérifie qu'aucun
message levé par le code n'est oublié. Les messages de Django et de DRF
(« Ce champ est obligatoire. ») sont traduits par Django lui-même, grâce à
`LocaleMiddleware`.
"""

from __future__ import annotations

import re

LANGUAGES = ("fr", "en")
DEFAULT = "fr"


def request_language(request) -> str:
    """« en » si la première langue demandée est l'anglais, « fr » sinon."""
    if request is None:
        return DEFAULT
    header = request.headers.get("Accept-Language", "")
    first = header.split(",")[0].split(";")[0].strip().lower()
    return "en" if first.startswith("en") else DEFAULT


#: Messages d'erreur, du français vers l'anglais.
EN_MESSAGES: dict[str, str] = {
    # Format commun et permissions (core)
    "Les données envoyées sont invalides.": "The submitted data is invalid.",
    "Conflit avec l'état actuel de la ressource.": "This conflicts with the current state of the resource.",
    "Vous n'avez pas accès à cette ressource.": "You do not have access to this resource.",
    "Seul le propriétaire peut modifier cette ressource.": "Only the owner can modify this resource.",
    "Ce champ n'est pas accepté.": "This field is not accepted.",
    "Code pays inconnu. Utilisez un code ISO 3166-1 alpha-2, par exemple SN.": (
        "Unknown country code. Use an ISO 3166-1 alpha-2 code, for example SN."
    ),
    "Code pays inconnu.": "Unknown country code.",
    "L'adresse doit commencer par https://.": "The address must start with https://.",
    "Indiquez une adresse e-mail ou un lien qui commence par https://.": (
        "Enter an email address or a link that starts with https://."
    ),
    # Comptes
    "Vous devez accepter la politique de confidentialité pour créer un compte.": (
        "You must accept the privacy policy to create an account."
    ),
    "Cette adresse e-mail est déjà utilisée.": "This email address is already in use.",
    "Adresse e-mail ou mot de passe incorrect.": "Incorrect email address or password.",
    "Ce compte est désactivé.": "This account is disabled.",
    "Ce jeton de rafraîchissement est invalide ou déjà révoqué.": (
        "This refresh token is invalid or already revoked."
    ),
    "Mot de passe incorrect.": "Incorrect password.",
    # Compétences et validations
    "Vous avez déjà déclaré cette compétence dans cette catégorie.": (
        "You have already added this skill in this category."
    ),
    "Compétence introuvable.": "Skill not found.",
    "Vous ne pouvez pas valider vos propres compétences.": "You cannot endorse your own skills.",
    (
        "Vous pouvez valider une compétence après un échange terminé avec cette personne, "
        "ou si elle vous l'apprend dans un cercle actif."
    ): (
        "You can endorse a skill after a completed exchange with this person, "
        "or if they teach it to you in an active circle."
    ),
    "Vous avez déjà validé cette compétence.": "You have already endorsed this skill.",
    # Matchs et échanges
    "Vous avez déjà donné votre avis sur ce match.": "You have already given feedback on this match.",
    "Écrivez un mot d'introduction.": "Write a short introduction.",
    "Vous ne pouvez pas vous proposer un échange à vous-même.": "You cannot propose an exchange to yourself.",
    "Une demande est déjà en attente avec cette personne.": (
        "A request is already pending with this person."
    ),
    "Seul le destinataire peut répondre à cette demande.": "Only the recipient can answer this request.",
    "Seul l'auteur de la demande peut l'annuler.": "Only the person who sent the request can cancel it.",
    # Cercles
    "Vous devez faire partie du cercle que vous proposez.": "You must be part of the circle you propose.",
    "Ce cercle n'est plus possible : les compétences des membres ont changé.": (
        "This circle is no longer possible: the members' skills have changed."
    ),
    "Ce cercle est déjà proposé.": "This circle has already been proposed.",
    "Ce cercle n'attend plus de réponse.": "This circle is no longer waiting for answers.",
    "Vous avez déjà répondu.": "You have already answered.",
    # Projets
    "Le titre est obligatoire.": "The title is required.",
    "Expliquez en quelques mots ce que vous apportez.": "Explain in a few words what you bring.",
    "Vous ne pouvez pas rejoindre votre propre projet.": "You cannot join your own project.",
    "Vous avez déjà une demande en attente sur ce projet.": (
        "You already have a pending request on this project."
    ),
    "Cette demande a déjà été traitée.": "This request has already been handled.",
    # Signalements
    "Cette cible n'existe pas.": "This target does not exist.",
    "Vous ne pouvez pas vous signaler vous-même.": "You cannot report yourself.",
    "Vous avez déjà signalé cet élément.": "You have already reported this item.",
    # Fonctions d'IA
    "Écrivez quelques phrases sur votre parcours pour que nous puissions vous aider.": (
        "Write a few sentences about your background so we can help you."
    ),
    "Décrivez ce que vous cherchez.": "Describe what you are looking for.",
    "La description est déjà courte : un résumé n'apporterait rien.": (
        "The description is already short: a summary would not add anything."
    ),
    "Écrivez votre question pour DevLink Copilot.": "Write your question for DevLink Copilot.",
    "Le quota d'appels du jour est atteint.": "Today's request quota has been reached.",
    "Les fonctions d'IA sont désactivées.": "AI features are turned off.",
    "Aucune clé d'API n'est configurée.": "No API key is configured.",
    "Le service d'IA a refusé la requête.": "The AI service refused the request.",
    "Le service d'IA est injoignable.": "The AI service cannot be reached.",
    "Réponse inattendue du service d'IA.": "Unexpected response from the AI service.",
    "Le service d'IA n'a rien répondu.": "The AI service returned nothing.",
    "La réponse du service d'IA n'était pas exploitable.": "The AI service's response could not be used.",
    "Ce match n'a pas de complémentarité à reformuler.": "This match has no complementarity to rephrase.",
}

#: Messages qui contiennent une valeur (liste attendue, nombre de secondes).
EN_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(r"^Trop de tentatives\. Réessayez dans (\d+) secondes\.$"),
        r"Too many attempts. Try again in \1 seconds.",
    ),
    (
        re.compile(r"^Le mot de passe doit contenir au moins (\d+) caractères\.$"),
        r"The password must contain at least \1 characters.",
    ),
    (
        re.compile(r"^Valeurs non autorisées : (.*)\. Attendu parmi : (.*)\.$"),
        r"Values not allowed: \1. Expected one of: \2.",
    ),
    (re.compile(r"^Valeur attendue parmi : (.*)\.$"), r"Expected one of: \1."),
    (re.compile(r"^Valeur inconnue\. Attendu parmi : (.*)\.$"), r"Unknown value. Expected one of: \1."),
    (re.compile(r"^Statut inconnu\. Attendu parmi : (.*)\.$"), r"Unknown status. Expected one of: \1."),
    (
        re.compile(r"^Catégorie inconnue\. Attendu parmi : (.*)\.$"),
        r"Unknown category. Expected one of: \1.",
    ),
    (
        re.compile(r"^Impossible de passer de « (.*) » à « (.*) »\.$"),
        r"Cannot change the status from “\1” to “\2”.",
    ),
)


def translate_message(text: str, lang: str) -> str:
    """Message dans la langue demandée ; tel quel s'il n'a pas de traduction."""
    if lang != "en":
        return text
    if text in EN_MESSAGES:
        return EN_MESSAGES[text]
    for pattern, replacement in EN_PATTERNS:
        if pattern.match(text):
            return pattern.sub(replacement, text)
    return text
