"""Données de démonstration (DL-12).

**Toutes les données sont fictives.** Noms inventés, adresses en @demo.devlink.africa
(domaine réservé à la démonstration), aucun vrai nom d'entreprise. Chaque profil
porte `is_demo=True` et l'interface l'étiquette « Profil de démonstration »,
conformément à la règle 7 du cahier des charges.

La commande est **idempotente** : on peut la rejouer sans créer de doublon.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from matching.services import recompute_for_user
from profiles.models import Profile
from projects.models import Project
from skills.models import Skill, UserSkill

User = get_user_model()

DEMO_DOMAIN = "demo.devlink.africa"
DEMO_PASSWORD = "demo-devlink-2026-xyz"

#: 20 profils fictifs répartis sur 10 pays d'Afrique francophone.
#: (identifiant, nom, pays, domaines, disponibilités, proposé, recherché, bio)
PROFILES: list[tuple] = [
    # --- Trois paires à fort score (complémentarité réciproque parfaite) -----
    (
        "aminata",
        "Aminata Diallo",
        "SN",
        ["WEB"],
        ["MENTORING", "COLLABORATION"],
        [("React", "ADVANCED"), ("TypeScript", "ADVANCED")],
        ["Python", "Docker"],
        "Développeuse front-end à Dakar. J'aime transmettre et apprendre le back-end.",
    ),
    (
        "mamadou",
        "Mamadou Bâ",
        "SN",
        ["WEB", "DEVOPS"],
        ["MENTORING", "COLLABORATION"],
        [("Python", "ADVANCED"), ("Docker", "ADVANCED")],
        ["React", "TypeScript"],
        "Back-end Python et conteneurs. Je cherche à progresser côté interface.",
    ),
    (
        "fatou",
        "Fatou Kone",
        "CI",
        ["MOBILE"],
        ["MENTORING", "OPEN_SOURCE"],
        [("Flutter", "ADVANCED")],
        ["Node.js", "CI/CD"],
        "Développeuse mobile à Abidjan, passionnée d'applications hors ligne.",
    ),
    (
        "ibrahim",
        "Ibrahim Traoré",
        "CI",
        ["MOBILE", "DEVOPS"],
        ["MENTORING", "OPEN_SOURCE"],
        [("Node.js", "ADVANCED"), ("CI/CD", "ADVANCED")],
        ["Flutter"],
        "Back-end Node.js et intégration continue. Curieux du mobile.",
    ),
    (
        "awa",
        "Awa Nguessan",
        "CM",
        ["DATA"],
        ["COLLABORATION", "MENTORING"],
        [("Machine Learning", "ADVANCED"), ("Python", "ADVANCED")],
        ["Kubernetes", "Linux"],
        "Science des données à Douala. Je veux industrialiser mes modèles.",
    ),
    (
        "jean",
        "Jean Mbarga",
        "CM",
        ["DEVOPS", "DATA"],
        ["COLLABORATION", "MENTORING"],
        [("Kubernetes", "ADVANCED"), ("Linux", "ADVANCED")],
        ["Machine Learning"],
        "Infrastructure et orchestration. J'aimerais comprendre l'apprentissage automatique.",
    ),
    # --- Trois paires à score partiel (échange dans un seul sens, ou partiel) -
    (
        "salimata",
        "Salimata Ouédraogo",
        "BF",
        ["WEB"],
        ["MENTORING"],
        [("Python", "INTERMEDIATE")],
        ["React", "Flutter", "Kubernetes"],
        "Développeuse à Ouagadougou. Je débute et je cherche un mentor.",
    ),
    (
        "cheikh",
        "Cheikh Sow",
        "ML",
        ["WEB"],
        ["MENTORING"],
        [("React", "ADVANCED")],
        ["Python"],
        "Front-end à Bamako. Je propose du mentorat le week-end.",
    ),
    (
        "nadia",
        "Nadia Benali",
        "TN",
        ["DESIGN", "WEB"],
        ["FREELANCE", "COLLABORATION"],
        [("UI/UX Design", "ADVANCED")],
        ["TypeScript"],
        "Designer d'interfaces à Tunis, je travaille avec des équipes produit.",
    ),
    (
        "youssef",
        "Youssef El Amrani",
        "MA",
        ["WEB"],
        ["FREELANCE", "COLLABORATION"],
        [("TypeScript", "INTERMEDIATE"), ("Next.js", "ADVANCED")],
        ["UI/UX Design"],
        "Développeur à Casablanca. Je veux soigner mes interfaces.",
    ),
    (
        "esperance",
        "Espérance Uwimana",
        "RW",
        ["DATA"],
        ["OPEN_SOURCE"],
        [("PostgreSQL", "ADVANCED")],
        ["Python", "Machine Learning"],
        "Administratrice de bases de données à Kigali.",
    ),
    (
        "patrick",
        "Patrick Kabila",
        "CD",
        ["WEB", "DATA"],
        ["OPEN_SOURCE"],
        [("Python", "INTERMEDIATE")],
        ["PostgreSQL"],
        "Développeur à Kinshasa, j'aime les projets open source.",
    ),
    # --- Profils variés, pour peupler la recherche et les pays --------------
    (
        "halima",
        "Halima Abdoulaye",
        "NE",
        ["WEB"],
        ["MENTORING"],
        [("Linux", "INTERMEDIATE")],
        ["Docker"],
        "Administratrice système à Niamey.",
    ),
    (
        "serge",
        "Serge Bokassa",
        "TG",
        ["MOBILE"],
        ["COLLABORATION"],
        [("Flutter", "INTERMEDIATE")],
        ["Node.js"],
        "Développeur mobile à Lomé.",
    ),
    (
        "mariam",
        "Mariam Cissé",
        "ML",
        ["DATA"],
        ["MENTORING", "OPEN_SOURCE"],
        [("Python", "ADVANCED"), ("PostgreSQL", "INTERMEDIATE")],
        ["Machine Learning"],
        "Analyste de données à Bamako.",
    ),
    (
        "oumar",
        "Oumar Sidibé",
        "SN",
        ["DEVOPS"],
        ["FREELANCE"],
        [("Docker", "INTERMEDIATE"), ("CI/CD", "INTERMEDIATE")],
        ["Kubernetes"],
        "Automatisation de déploiements, basé à Thiès.",
    ),
    (
        "clarisse",
        "Clarisse Nkunda",
        "BI",
        ["WEB", "DESIGN"],
        ["COLLABORATION"],
        [("UI/UX Design", "INTERMEDIATE"), ("React", "BEGINNER")],
        ["TypeScript"],
        "Designer et développeuse junior à Bujumbura.",
    ),
    (
        "abdoulaye",
        "Abdoulaye Barry",
        "GN",
        ["WEB"],
        ["MENTORING"],
        [("Node.js", "INTERMEDIATE")],
        ["React", "Docker"],
        "Développeur back-end à Conakry.",
    ),
    (
        "zeinab",
        "Zeinab Haidara",
        "MR",
        ["DATA", "IA"],
        ["OPEN_SOURCE", "COLLABORATION"],
        [("Machine Learning", "INTERMEDIATE"), ("Python", "INTERMEDIATE")],
        ["PostgreSQL", "Linux"],
        "Apprentissage automatique appliqué à l'agriculture, à Nouakchott.",
    ),
    (
        "thierry",
        "Thierry Agbo",
        "BJ",
        ["DEVOPS", "WEB"],
        ["MENTORING", "FREELANCE"],
        [("Kubernetes", "INTERMEDIATE"), ("Linux", "ADVANCED")],
        ["Next.js"],
        "Ingénieur plateforme à Cotonou.",
    ),
]

#: 8 projets fictifs qui cherchent des contributeurs.
#: (identifiant du porteur, titre, description, besoins, statut)
PROJECTS: list[tuple] = [
    (
        "mamadou",
        "Agri-Collecte",
        "Application de collecte de données agricoles fonctionnant hors ligne, "
        "pour les coopératives rurales. Synchronisation dès que le réseau revient.",
        ["Flutter", "Python", "PostgreSQL"],
        "OPEN",
    ),
    (
        "awa",
        "Diagnostic-Sol",
        "Modèle d'analyse de la qualité des sols à partir de photographies, destiné aux petits exploitants.",
        ["Machine Learning", "Python"],
        "OPEN",
    ),
    (
        "fatou",
        "Carnet de santé mobile",
        "Carnet de vaccination numérique consultable sans connexion, pensé pour "
        "les centres de santé de quartier.",
        ["Flutter", "Node.js"],
        "IN_PROGRESS",
    ),
    (
        "ibrahim",
        "Transport-Partage",
        "Plateforme de covoiturage entre quartiers, avec paiement différé et validation par code.",
        ["Node.js", "React", "PostgreSQL"],
        "OPEN",
    ),
    (
        "nadia",
        "Design-Système Sahel",
        "Bibliothèque de composants d'interface adaptée aux connexions lentes et aux petits écrans.",
        ["UI/UX Design", "TypeScript", "React"],
        "OPEN",
    ),
    (
        "jean",
        "Déploie-Facile",
        "Outil en ligne de commande pour déployer une application Django sur un "
        "serveur simple, sans orchestrateur.",
        ["Python", "Docker", "Linux"],
        "IN_PROGRESS",
    ),
    (
        "mariam",
        "Observatoire des prix",
        "Suivi des prix des denrées sur les marchés, avec alertes par SMS.",
        ["Python", "PostgreSQL", "CI/CD"],
        "OPEN",
    ),
    (
        "thierry",
        "Classe-Connectée",
        "Plateforme de cours hors ligne pour les lycées, synchronisée par clé USB.",
        ["Next.js", "Kubernetes", "Linux"],
        "COMPLETED",
    ),
]


class Command(BaseCommand):
    help = "Crée (ou met à jour) les profils et projets de démonstration. Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime d'abord les comptes de démonstration existants.",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            deleted, _ = User.objects.filter(email__endswith=f"@{DEMO_DOMAIN}").delete()
            self.stdout.write(f"Comptes de démonstration supprimés : {deleted} objets.")

        with transaction.atomic():
            users = self._create_users()
            self._create_projects(users)

        # Hors transaction : le recalcul écrit beaucoup, mieux vaut des
        # transactions courtes (recommandation du cahier pour la base).
        for user in users.values():
            recompute_for_user(user.pk)

        self._report(users)

    def _create_users(self) -> dict:
        users: dict[str, User] = {}

        for handle, name, country, domains, availability, offered, wanted, bio in PROFILES:
            email = f"{handle}@{DEMO_DOMAIN}"
            user, created = User.objects.get_or_create(email=email, defaults={"full_name": name})
            if created:
                user.set_password(DEMO_PASSWORD)
                user.full_name = name
                user.save()

            Profile.objects.update_or_create(
                user=user,
                defaults={
                    "country": country,
                    "bio": bio,
                    "domains": domains,
                    "availability": availability,
                    # Adresse du domaine de démonstration : jamais une vraie personne.
                    "contact": email,
                    "is_demo": True,
                },
            )

            # update_or_create : rejouer la commande ne duplique rien.
            for skill_name, level in offered:
                UserSkill.objects.update_or_create(
                    user=user,
                    skill=Skill.objects.get(name=skill_name),
                    kind=UserSkill.Kind.OFFERED,
                    defaults={"level": level},
                )
            for skill_name in wanted:
                UserSkill.objects.update_or_create(
                    user=user,
                    skill=Skill.objects.get(name=skill_name),
                    kind=UserSkill.Kind.WANTED,
                    defaults={"level": UserSkill.Level.BEGINNER},
                )

            users[handle] = user

        return users

    def _create_projects(self, users: dict) -> None:
        for handle, title, description, needs, status in PROJECTS:
            project, _ = Project.objects.update_or_create(
                owner=users[handle],
                title=title,
                defaults={"description": description, "status": status},
            )
            project.needs.set(Skill.objects.filter(name__in=needs))

    def _report(self, users: dict) -> None:
        from matching.models import Match

        demo_ids = [user.pk for user in users.values()]
        strong = Match.objects.filter(user_a_id__in=demo_ids, user_b_id__in=demo_ids, score__gte=75).count()
        total = Match.objects.filter(user_a_id__in=demo_ids, user_b_id__in=demo_ids).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"{len(users)} profils de démonstration, "
                f"{Project.objects.filter(owner_id__in=demo_ids).count()} projets, "
                f"{total} matchs dont {strong} au-dessus de 75 %."
            )
        )
        self.stdout.write(f"Mot de passe commun à ces comptes de démonstration : {DEMO_PASSWORD}")
