# DevLink Africa

[![CI](https://github.com/achraf-aadjar/devlink-africa/actions/workflows/ci.yml/badge.svg)](https://github.com/achraf-aadjar/devlink-africa/actions/workflows/ci.yml)

Plateforme d'échange de compétences entre développeurs africains : profil → compétences → recherche → Dev Match expliqué → échange → projets.

Projet réalisé pour le concours **CADEV 2026 (Systalink)** par Achraf, Emmanuel et Omar. Clôture de la soumission : **25 octobre 2026, 17 h GMT** (objectif : le 24).

## Pile technique

| Couche | Technologie |
|---|---|
| Backend | Django 5.2 LTS + Django REST framework, JWT, drf-spectacular |
| Base de données | PostgreSQL 17 via pg8000 (BSD-3) + django-pg8000 (MIT-0) ; pas de psycopg (LGPL, interdit) |
| Frontend | React 19 + TypeScript + Vite 6 + Tailwind CSS 3 + React Router |
| Déploiement | Gunicorn + nginx sur un VPS Datacloud (voir [deploy/README.md](deploy/README.md)) |

## Prérequis

- Python 3.13 (voir `.python-version`)
- Node.js 24 (voir `.nvmrc`) et npm
- `make` (macOS/Linux) ; sous Windows, utiliser les commandes PowerShell ci-dessous
- Git
- Docker (pour la base PostgreSQL locale : `make db`)

## Installation

### macOS

```bash
brew install python@3.13 node make git     # ou nvm : nvm install && nvm use
git clone https://github.com/achraf-aadjar/devlink-africa.git && cd devlink-africa
make setup
```

### Linux (Debian/Ubuntu)

```bash
sudo apt install python3.13 python3.13-venv make git
# Node 24 : via nvm (https://github.com/nvm-sh/nvm) → nvm install && nvm use
git clone https://github.com/achraf-aadjar/devlink-africa.git && cd devlink-africa
make setup
```

`make setup` crée l'environnement virtuel, installe les dépendances, génère `backend/.env` (avec une `SECRET_KEY` aléatoire), installe le frontend (`npm ci`), démarre PostgreSQL dans Docker (`docker compose up -d db`) et applique les migrations. Sans Docker, mettez `DB_ENGINE=sqlite` dans `backend/.env` pour un lancement local sans serveur.

### Windows (PowerShell)

```powershell
git clone https://github.com/achraf-aadjar/devlink-africa.git; cd devlink-africa

# Backend
cd backend
py -3.13 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env      # puis renseigner SECRET_KEY (voir commentaire dans le fichier)
docker compose up -d db
python manage.py migrate
cd ..

# Frontend
cd frontend; npm ci; cd ..
```

Équivalents Windows des cibles du Makefile :

| Cible | Commande PowerShell |
|---|---|
| dev-backend | `cd backend; .venv\Scripts\python manage.py runserver` |
| dev-frontend | `cd frontend; npm run dev` |
| test | `cd backend; .venv\Scripts\pytest` puis `cd ..\frontend; npm test` |
| lint | `cd backend; .venv\Scripts\ruff check .; .venv\Scripts\ruff format --check .` puis `cd ..\frontend; npm run lint` |
| licenses | `bash scripts/check_licenses.sh all` (Git Bash ou WSL) |
| build | `cd frontend; npm run build` |

## Lancement

Dans deux terminaux :

```bash
make dev-backend     # http://localhost:8000  (API : /api/v1/health/, docs : /api/docs/)
make dev-frontend    # http://localhost:5173  (proxy /api → localhost:8000)
```

## Tests et qualité

```bash
make test       # pytest (backend, SQLite en mémoire) + vitest (frontend)
make test-pg    # pytest sur PostgreSQL (après make db)
make typecheck  # tsc --noEmit (frontend)
make lint       # ruff + eslint + prettier
make licenses   # contrôle des licences Python et Node
make build      # build de production du frontend + collectstatic
```

Hook pre-commit (optionnel) : `pip install pre-commit && pre-commit install`.

## Structure

```
backend/        Django : config/ (réglages, urls), apps accounts, profiles, skills, projects,
                exchanges, matching, reports, core
                Chaque app : models, serializers, services, selectors, views, urls, tests
frontend/       React + Vite : src/app (routeur, session), src/features/<domaine>,
                src/components/ui, src/lib (client d'API typé)
docs/           Documentation : api.md (contrat gelé), ARCHITECTURE.md, DECISIONS.md,
                securite.md, PROGRESS.md
backlog/        Les 65 tickets (TICKETS.md), planning, tickets.json
scripts/        check_licenses.sh (+ .py, .mjs)
deploy/         nginx, guide de déploiement
.github/        CI et modèle de PR
```

## Règles du concours (art. 6)

- Seules les licences **permissives** sont admises (MIT, Apache-2.0, BSD, ISC, PSF…).
- Toute licence à réciprocité (**GPL, AGPL, LGPL**) rend le projet **irrecevable** ; nous évitons aussi la **MPL-2.0**.
- Chaque dépendance, directe ou transitive, se vérifie **avant** de l'ajouter (`make licenses`, exceptions justifiées dans `licenses-allowlist.txt`).
- Interdits : psycopg/psycopg2 (d'où pg8000 pour PostgreSQL), mysqlclient, vite ≥ 7, tailwindcss ≥ 4, Next.js, sharp.
- Tout usage d'IA est consigné dans [AI_USAGE.md](AI_USAGE.md). Détail des licences : [LICENSES.md](LICENSES.md).

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/api.md](docs/api.md) | Contrat d'API v1 **gelé** : la source de vérité |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Couches, chemin d'une requête, modèle de données, Dev Match expliqué |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Les choix techniques et leurs raisons |
| [docs/securite.md](docs/securite.md) | Ce qui est protégé, comment le vérifier |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Avancement ticket par ticket |
| [backlog/TICKETS.md](backlog/TICKETS.md) | Les 65 tickets et leurs critères d'acceptation |

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour contribuer.
