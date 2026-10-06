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

## Méthode suivie

- Les tests ont été écrits **avant** l'implémentation, à partir des critères d'acceptation des tickets.
- Chaque dépendance a été vérifiée (licence) **avant** installation ; les résultats sont dans `LICENSES.md`.
- Les choix techniques importants sont justifiés dans `docs/DECISIONS.md`, de façon à pouvoir être défendus à l'oral.

## Code préexistant

Aucun à ce jour. Si un membre réutilise du code écrit avant le concours, il doit être déclaré dans `LICENSES.md`, section « code préexistant » (article 6 et 11).
