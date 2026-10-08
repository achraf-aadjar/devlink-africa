# Licences des dépendances

Règle du concours (art. 6) : licences permissives uniquement. Mis à jour le 2026-10-08.

**Contrôle automatique** : `make licenses` (ou `scripts/check_licenses.sh all`) analyse l'arbre complet des dépendances, directes et transitives, côté Python et côté Node. Il échoue avec un code non nul si une licence GPL, AGPL, LGPL ou MPL apparaît. Il tourne en intégration continue sur chaque pull request.

## Résultat

- **Python** : 38 paquets analysés, **0 licence non permissive**.
- **Node** : 433 paquets dans l'arbre complet, **0 licence non permissive** (hors exception justifiée ci-dessous).

## Python (backend/requirements.txt, transitives incluses)

| Paquet | Version | Licence |
|---|---|---|
| argon2-cffi | 25.1.0 | MIT |
| argon2-cffi-bindings | 26.1.0 | MIT |
| asgiref | 3.12.1 | BSD License |
| asn1crypto | 1.5.1 | MIT License |
| attrs | 26.1.0 | MIT |
| cachetools | 6.2.6 | MIT |
| cffi | 2.1.1 | MIT-0 |
| coverage | 7.16.2 | Apache-2.0 |
| Django | 5.2.17 | BSD-3-Clause |
| django-cors-headers | 4.9.0 | MIT |
| django-filter | 26.2 | BSD License |
| django_pg8000 | 0.0.5 | MIT No Attribution License (MIT-0) |
| djangorestframework | 3.18.1 | BSD-3-Clause |
| djangorestframework_simplejwt | 5.5.1 | MIT License |
| drf-spectacular | 0.30.0 | BSD-3-Clause |
| google-auth | 2.41.1 | Apache Software License |
| gunicorn | 26.2.0 | MIT |
| inflection | 0.5.1 | MIT License |
| iniconfig | 2.3.0 | MIT |
| jsonschema | 4.26.0 | MIT |
| jsonschema-specifications | 2025.9.1 | MIT |
| packaging | 26.3 | Apache-2.0 OR BSD-2-Clause |
| pg8000 | 1.31.5 | BSD License |
| pluggy | 1.6.0 | MIT License |
| pyasn1 | 0.6.4 | BSD-2-Clause |
| pyasn1_modules | 0.4.2 | BSD License |
| pycparser | 3.0 | BSD-3-Clause |
| Pygments | 2.21.0 | BSD-2-Clause |
| PyJWT | 2.15.1 | MIT |
| pytest | 9.1.1 | MIT |
| pytest-django | 4.14.0 | BSD License |
| python-dateutil | 2.9.0.post0 | Apache Software License; BSD License |
| pytz | 2026.5 | MIT License |
| PyYAML | 6.0.3 | MIT License |
| referencing | 0.37.0 | MIT |
| rpds-py | 2026.9.1 | MIT |
| rsa | 4.9.1 | Apache Software License |
| ruff | 0.16.10 | MIT |
| scramp | 1.4.17 | MIT No Attribution License (MIT-0) |
| six | 1.17.0 | MIT License |
| sqlparse | 0.6.0 | BSD License |
| uritemplate | 4.2.0 | BSD 3-Clause OR Apache-2.0 |
| whitenoise | 6.12.0 | MIT |

## Node (frontend/package.json, dépendances directes)

| Paquet | Version | Licence |
|---|---|---|
| @eslint/js | 9.39.5 | MIT |
| @testing-library/dom | 10.4.2 | MIT |
| @testing-library/jest-dom | 7.0.1 | MIT |
| @testing-library/react | 16.3.3 | MIT |
| @testing-library/user-event | 14.6.7 | MIT |
| @types/react | 19.3.0 | MIT |
| @types/react-dom | 19.3.0 | MIT |
| @vitejs/plugin-react | 4.7.0 | MIT |
| @vitest/coverage-v8 | 3.2.7 | MIT |
| autoprefixer | 10.6.1 | MIT |
| eslint | 9.39.5 | MIT |
| eslint-plugin-react-hooks | 7.1.1 | MIT |
| eslint-plugin-react-refresh | 0.5.7 | MIT |
| globals | 17.13.0 | MIT |
| jsdom | 30.1.2 | MIT |
| postcss | 8.5.29 | MIT |
| prettier | 3.9.9 | MIT |
| react | 19.3.0 | MIT |
| react-dom | 19.3.0 | MIT |
| react-router-dom | 7.18.4 | MIT |
| tailwindcss | 3.4.19 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| typescript-eslint | 8.71.1 | MIT |
| vite | 6.4.4 | MIT |
| vitest | 3.2.7 | MIT |

## Node (e2e/package.json, test de bout en bout)

Outil de test seulement : il n'entre ni dans le build ni dans le livrable. Analysé par le même contrôle automatique (3 paquets, 0 problème).

| Paquet | Version | Licence |
|---|---|---|
| @playwright/test | 1.56.0 | Apache-2.0 |
| playwright | 1.56.0 | Apache-2.0 |
| playwright-core | 1.56.0 | Apache-2.0 |

Le navigateur Chromium utilisé par ce test est téléchargé au moment de l'exécution (`npx playwright install chromium`), sur la machine de CI ou de développement. Ce n'est pas une dépendance du projet : il n'est ni commité, ni installé par `npm ci`, ni livré, au même titre que le navigateur de l'utilisateur final.

## PostgreSQL : pourquoi pg8000

Les pilotes PostgreSQL habituels de Django, **psycopg** et **psycopg2**, sont sous **LGPL** : les utiliser rendrait le projet irrecevable. Nous utilisons donc :

| Paquet | Licence | Rôle |
|---|---|---|
| pg8000 | BSD-3-Clause | Pilote PostgreSQL en Python pur |
| django-pg8000 | MIT-0 | Backend Django pour ce pilote |
| scramp | MIT-0 | Authentification SCRAM |
| asn1crypto | MIT | Dépendance de scramp |
| python-dateutil | Apache-2.0 / BSD | Types date et heure |
| pytz | MIT | Fuseaux horaires |
| six | MIT | Compatibilité |

Le serveur PostgreSQL lui-même est sous **licence PostgreSQL** (permissive, de type BSD). Il tourne dans un conteneur et n'est pas distribué avec notre code.

## Exceptions justifiées (`licenses-allowlist.txt`)

| Paquet | Licence | Justification |
|---|---|---|
| caniuse-lite | CC-BY-4.0 | Données de compatibilité des navigateurs, utilisées **à la compilation seulement** par Browserslist et autoprefixer. Rien de ce paquet ne se retrouve dans le livrable exécuté. |

## Dépendances écartées pour cause de licence

Ces paquets ont été évalués puis refusés. C'est une part du travail de conformité :

| Paquet | Licence | Décision |
|---|---|---|
| psycopg, psycopg2 | LGPL | Écartés : remplacés par pg8000 (BSD-3) |
| **eslint-plugin-jsx-a11y** | MPL-2.0 via axe-core | **Retiré le 2026-10-07**, alors qu'il était imposé par notre cahier des charges interne. Le contrôle automatique a détecté `axe-core` en dépendance indirecte. Remplacé par six règles d'accessibilité écrites par nous (`frontend/eslint-rules/a11y.js`). |
| vite ≥ 7, tailwindcss ≥ 4 | MPL-2.0 via lightningcss | Versions figées à vite@6 et tailwindcss@3 |
| mysqlclient | GPL | Non utilisé |
| sharp, libvips | LGPL | Aucun traitement d'image côté serveur |
| hypothesis | MPL-2.0 | Non utilisé |
| requests, httpx | MPL-2.0 via certifi | Non utilisés ; un appel sortant passerait par `urllib` |
| Données cartographiques tierces | variable ou absente | Écartées : notre carte de l'Afrique est dessinée par nous (voir `docs/DECISIONS.md`) |

## Polices, icônes et éléments graphiques

**Aucune ressource tierce. Tout a été dessiné pour le concours.**

| Élément | Où | Détail |
|---|---|---|
| Logo | `frontend/src/components/icons/Logo.tsx` | Deux anneaux qui se recouvrent, en SVG. Versions couleur, monochrome et horizontale. |
| Favicon | `frontend/public/favicon.svg` | Même marque, trait épaissi pour rester lisible à 16 px. |
| 30 icônes | `frontend/src/components/icons/paths.ts` | Même grille de 24 unités, trait de 1,75. Aucune bibliothèque d'icônes. |
| 3 motifs de fond | `frontend/src/components/icons/Patterns.tsx` | Anneaux, tissage, points. SVG répétables, opacité de 0,06 à 0,10. |
| Carte de l'Afrique | `frontend/src/features/countries/components/AfricaTileMap.tsx` | Grille de 54 tuiles. Aucune donnée cartographique importée. |
| Drapeaux | `frontend/src/lib/labels.ts` | Emoji du système, construits depuis le code pays. |
| Polices | `frontend/tailwind.config.js` | `system-ui` uniquement : aucune police chargée. |

Aucune licence graphique à déclarer : tous ces éléments sont du code source écrit par l'équipe (art. 6 et 11).

Une photo générée par IA a servi un temps de fond à la bannière d'accueil, retirée pour de bon le 2026-10-08 avec le passage à un thème sombre (voir `docs/DECISIONS.md` et `AI_USAGE.md` pour l'historique complet).

**Bibliothèques d'icônes écartées** : `lucide-react` était autorisé par notre cahier, mais nous ne l'avons pas ajouté. Dessiner nos icônes évite une dépendance à vérifier, allège le build, et donne un jeu propre au produit.

## Code préexistant

**Aucun.** Tout le code de ce dépôt a été écrit pour le concours (art. 6 et 11). Aucun membre n'a réutilisé de code antérieur.
