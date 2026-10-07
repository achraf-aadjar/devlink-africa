# Usage de l'intelligence artificielle

Conformément à l'article 6 du règlement CADEV 2026, tout usage d'un outil d'IA est déclaré ici : une ligne par partie du projet, avec la date, l'outil, le membre qui a lancé la session et l'état de la relecture.

Le jury évalue la **maîtrise du code par l'équipe, y compris du code généré par IA**. Chaque membre doit savoir expliquer sa partie sans aide (tickets DL-52, DL-57, DL-61).

| Date | Outil | Partie du projet | Détail | Membre | Relu par |
|---|---|---|---|---|---|
| 2026-10-06 | Claude Code (Anthropic) | Environnement de développement | Projet Django et ses modèles, application React (Vite, TypeScript, Tailwind), Makefile, CI GitHub Actions, scripts de contrôle des licences, fichiers de déploiement, documentation d'installation. Aucune fonctionnalité métier. | Achraf | à relire en PR |
| 2026-10-06 | Claude Code (Anthropic) | Base de données | Passage de SQLite à PostgreSQL via pg8000 (BSD-3) et django-pg8000 (MIT-0), pour éviter psycopg (LGPL). Correctifs du backend pour les `JSONField` et les requêtes sur clés JSON. | Achraf | à relire en PR |
| 2026-10-07 | Claude Code (Anthropic) | DL-03 · Authentification | Routes `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` ; sérialiseurs, services, vues ; gestionnaire d'exceptions unique ; limitation de débit ; journal d'audit. 28 tests. | Achraf | à relire en PR |
| 2026-10-07 | Claude Code (Anthropic) | DL-04 · Contrat d'API | Rédaction de `docs/api.md` (19 sections, toutes les routes des tickets, exemples JSON, énumérations) et alignement du code sur ce contrat. | Achraf | **à valider par les 3** |
| 2026-10-07 | Claude Code (Anthropic) | DL-07 · Design system | Jetons Tailwind, neuf composants d'interface, navigation responsive, page de démonstration `/design`. | Achraf | à relire par Emmanuel |
| 2026-10-07 | Claude Code (Anthropic) | DL-08 · Inscription et connexion | Contexte de session, client d'API typé avec renouvellement du jeton, garde de routes, formulaires validés. Tests Vitest et Testing Library. | Achraf | à relire par Emmanuel |
| 2026-10-07 | Claude Code (Anthropic) | Conformité des licences | Détection de `axe-core` (MPL-2.0) tiré par `eslint-plugin-jsx-a11y` : plugin retiré, six règles d'accessibilité écrites à la main. Script de scan de secrets. | Achraf | à relire en PR |
| 2026-10-07 | Claude Code (Anthropic) | Documentation | `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/securite.md`, `docs/PROGRESS.md`. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-11 · Moteur de Dev Match | Algorithme de score (six critères pondérés, fonction pure sans Django), service de persistance avec recalcul incrémental. 76 tests. | Achraf | **à relire par Omar, ligne à ligne** |
| 2026-10-08 | Claude Code (Anthropic) | DL-14, DL-15, DL-19, DL-31 · Profil et compétences | API profil privé et public, catalogue, compétences proposées et recherchées, preuves, permissions transversales. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-16, DL-17 · Project Hub | CRUD des projets avec filtres, demandes pour rejoindre avec contrainte conditionnelle en base. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-18 · Échanges | Huit types d'échange, machine à états explicite, clé de paire normalisée pour la contrainte d'unicité. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-24, DL-39 · API Dev Match | Liste et détail expliqué, orientation de l'explication selon le lecteur, retour sur match. | Achraf | à relire par Omar |
| 2026-10-08 | Claude Code (Anthropic) | DL-25, DL-38 · Recherche et pays | Recherche à filtres combinables sans fonction propre à PostgreSQL, exploration par pays. | Achraf | à relire par Omar |
| 2026-10-08 | Claude Code (Anthropic) | DL-12 · Données de démonstration | Commande `seed_demo` idempotente : 20 profils fictifs sur 15 pays, 8 projets. Aucune personne réelle. | Achraf | à relire par Omar |
| 2026-10-08 | Claude Code (Anthropic) | DL-28, DL-32 · Dashboard et signalement | Agrégation en un appel, signalement avec plafond journalier. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-20 à DL-27, DL-33, DL-36, DL-37 · Écrans | Tous les écrans de la boucle produit, dont l'explication du match et la carte de l'Afrique en tuiles. 111 tests. | Achraf | **à relire par Emmanuel** |
| 2026-10-08 | Claude Code (Anthropic) | DL-40 · Données personnelles | Export JSON et suppression de compte confirmée par mot de passe. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-29, DL-30 · Sécurité et surveillance | Durcissement (`check --deploy` propre), tests d'injection et de XSS, health détaillé, scripts de sauvegarde et de surveillance. | Achraf | à relire en PR |
| 2026-10-08 | Claude Code (Anthropic) | DL-54 · Test de bout en bout | Rejoue les huit étapes du parcours de démonstration par l'API. | Achraf | à relire par Emmanuel |
| 2026-10-07 | Claude Code (Anthropic) | DL-41, DL-43 à DL-47 · Fonctions d'IA | Couche d'abstraction avec interrupteur et repli, quatre fonctions (extraction de compétences, recherche naturelle, résumé de projet, explication reformulée), plafond journalier. Appels par `urllib` : aucune dépendance ajoutée. 36 tests. | Achraf | **à relire par Omar** |
| 2026-10-07 | Claude Code (Anthropic) | DL-42 · Interface des fonctions IA | Composants qui ne s'affichent que si le service est actif, et expliquent calmement l'indisponibilité. 11 tests. | Achraf | à relire par Emmanuel |
| 2026-10-07 | Claude Code (Anthropic) | Organisation de l'équipe | `docs/REPARTITION_TACHES.pdf` : répartition des 17 tâches restantes entre les trois membres, calendrier commun, points de vigilance. Document d'organisation, pas de code. | Achraf | à relire par les 3 |
| 2026-10-07 | Claude Code (Anthropic) | Identité visuelle | Logo (deux anneaux qui se recouvrent), favicon, 30 icônes sur grille commune, 3 motifs d'arrière-plan. Tout en SVG écrit à la main : aucune bibliothèque d'icônes, aucune image, aucune police tierce. 27 tests. | Achraf | **à relire par Emmanuel** |
| 2026-10-08 | Claude Code (Anthropic) | Documentation pour le jury | `docs/EXPLICATION_JURY.md`, `docs/demo.md`, `deploy/README.md` complet. | Achraf | **à relire par les 3** |

## Ce que l'équipe doit relire en priorité

Le jury évalue la **maîtrise du code par l'équipe**. Trois fichiers méritent une relecture ligne à ligne, parce qu'ils portent la logique la plus susceptible d'être questionnée :

1. `backend/matching/scoring.py` — l'algorithme de Dev Match (Omar).
2. `backend/matching/services.py` — le recalcul incrémental (Omar).
3. `frontend/src/features/matches/components/MatchExplanation.tsx` — l'affichage de l'explication (Emmanuel).

`docs/EXPLICATION_JURY.md` prépare les réponses aux questions probables.

## Méthode suivie

- Les tests ont été écrits **avant** l'implémentation, à partir des critères d'acceptation des tickets.
- Chaque dépendance a été vérifiée (licence) **avant** installation ; les résultats sont dans `LICENSES.md`.
- Les choix techniques importants sont justifiés dans `docs/DECISIONS.md`, de façon à pouvoir être défendus à l'oral.
- Les tests ont révélé plusieurs défauts réels, corrigés : une requête N+1 sur le profil public, une modale qui volait le focus pendant la saisie, une réponse d'API qui renvoyait l'ancienne valeur après modification, et un contrôle de licences qui ne détectait rien à cause d'une erreur de syntaxe dans ses motifs.

## Code préexistant

Aucun à ce jour. Si un membre réutilise du code écrit avant le concours, il doit être déclaré dans `LICENSES.md`, section « code préexistant » (article 6 et 11).
