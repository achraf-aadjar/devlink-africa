# Journal d'avancement

Une entrée par ticket : état, écarts avec le plan, questions ouvertes.

## Phase 1 · Fondations et accès

### DL-03 · Authentification — **terminé**

Routes `/api/v1/auth/{register,login,refresh,logout}/`. Architecture en couches : vue mince → sérialiseur → service.

Ajouts non prévus au ticket, mais exigés par le cahier des charges :
- gestionnaire d'exceptions unique (`core/exceptions.py`), qui fige le format `detail`/`code`/`errors` ;
- `StrictSerializer` : les champs non déclarés sont refusés ;
- `BearerJWTAuthentication` : sans elle, DRF renvoie `403` au lieu de `401` sur une vue publique ;
- journal d'audit avec empreinte de l'adresse e-mail.

**Écart** : `token_blacklist` ajouté (déjà fourni par simplejwt, aucune nouvelle dépendance), car le cahier exige la liste noire à la déconnexion.

28 tests.

### DL-04 · Contrat d'API v1 — **rédigé, en attente de validation**

`docs/api.md` couvre les 19 sections : toutes les routes des 65 tickets, un exemple JSON par route, le format d'erreur, les énumérations, les poids du matching.

Alignements du code sur le contrat :
- `Skill.category` ajouté (DL-15 parle de « catalogue par catégorie ») ;
- `SkillProof.kind` ajouté (DL-31 énumère les types de preuve) ;
- **niveau `EXPERT` retiré** : DL-15 ne prévoit que trois niveaux. Voir `docs/DECISIONS.md`.

**Question ouverte** : les trois membres doivent cocher la validation en tête de `docs/api.md`. Après quoi le contrat est gelé.

### DL-07 · Design system et navigation — **terminé**

**Écart** : `eslint-plugin-jsx-a11y`, imposé par le cahier, tire `axe-core` (MPL-2.0), interdite par le règlement. Le plugin est retiré et remplacé par six règles maison. Voir `docs/DECISIONS.md`.

Jetons Tailwind (accent terre cuite, gris chauds, polices système), neuf composants dans `components/ui/`, navigation responsive avec menu mobile, lien d'évitement, page de démonstration sur `/design`.

### DL-08 · Pages inscription et connexion — **terminé**

`features/auth/` : contexte de session, client d'API avec renouvellement automatique du jeton, garde de routes, formulaires validés côté client et erreurs serveur affichées champ par champ.

### DL-05 · Fichiers de déploiement — **préparés** (la mise en ligne reste à Achraf)

`backend/Dockerfile`, `frontend/Dockerfile`, `deploy/nginx.conf`, `docker-compose.prod.yml`, `deploy/README.md`.

## Contrôles de fin de Phase 1 (clone propre, `make check`)

| Contrôle | Résultat |
|---|---|
| `make setup` | exit 0 |
| Backend, tests SQLite | 35 passés, 1 ignoré |
| Backend, tests PostgreSQL | 36 passés |
| Couverture backend | 95 % global, 97 % sur accounts, core et matching |
| `ruff check` et `ruff format` | propre |
| `manage.py check` | aucun problème |
| `makemigrations --check` | aucun changement |
| Schéma OpenAPI | 0 avertissement, 0 erreur |
| Frontend, tests | 28 passés |
| Couverture frontend | 94 % |
| ESLint `--max-warnings 0`, Prettier | propre |
| `tsc --noEmit` | propre |
| `vite build` | réussi (90 ko gzip) |
| Licences | 38 Python, 368 Node, 0 problème |
| Scan de secrets | 0 trouvé |

## À faire par l'équipe (hors de ma portée)

- **DL-01** : protéger `main` dans les réglages GitHub.
- **DL-04** : valider le contrat à trois.
- **DL-05** : commander le VPS Datacloud à Dakar, mettre en ligne.
- **DL-09** : maquettes (Emmanuel).
- **DL-10** : courriel à l'organisateur (Omar) — **urgent, échéance du 6 octobre**.
