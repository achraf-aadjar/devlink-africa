# DevLink Africa : commandes de développement (macOS / Linux).
# Équivalents Windows (PowerShell) : voir README.md, section « Windows ».

PYTHON ?= $(shell command -v python3.13 || command -v python3)
VENV := backend/.venv
BIN := $(VENV)/bin

.PHONY: help setup db wait-db dev-backend dev-frontend test test-pg e2e lint typecheck licenses build check

help:
	@echo "Cibles : setup db dev-backend dev-frontend test test-pg e2e lint typecheck licenses build check"

db:
	docker compose up -d db

# Attend que la base accepte une vraie requête.
#
# Deux pièges évités ici : `pg_isready` dans le conteneur répond avant que le
# port soit publié vers l'hôte, et le port peut accepter une connexion TCP alors
# que PostgreSQL termine encore son initialisation et refuse les requêtes. On
# teste donc un vrai SELECT depuis l'hôte, avec le pilote du projet.
wait-db:
	@echo "Attente de PostgreSQL sur $${DB_HOST:-127.0.0.1}:$${DB_PORT:-5432}..."
	@for i in $$(seq 1 60); do \
		if $(BIN)/python -c "import os, pg8000.dbapi as d; c=d.connect(host=os.environ.get('DB_HOST','127.0.0.1'), port=int(os.environ.get('DB_PORT','5432')), user=os.environ.get('DB_USER','devlink'), password=os.environ.get('DB_PASSWORD','devlink'), database=os.environ.get('DB_NAME','devlink')); cur=c.cursor(); cur.execute('SELECT 1'); cur.fetchone(); c.close()" 2>/dev/null; then \
			echo "PostgreSQL est prêt."; \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "PostgreSQL ne répond pas après 60 s. Lancez 'docker compose logs db'." >&2; exit 1

setup:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r backend/requirements.txt
	@test -f backend/.env || { \
		cp backend/.env.example backend/.env; \
		key=$$($(BIN)/python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"); \
		sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$$key|" backend/.env && rm -f backend/.env.bak; \
		echo "backend/.env créé avec une SECRET_KEY aléatoire."; }
	cd frontend && npm ci
	$(MAKE) db
	$(MAKE) wait-db
	cd backend && .venv/bin/python manage.py migrate

dev-backend:
	cd backend && .venv/bin/python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && .venv/bin/pytest
	cd frontend && npm test

# Tests backend sur PostgreSQL (nécessite 'make db' et DB_PASSWORD dans backend/.env ou l'environnement)
test-pg: wait-db
	cd backend && DB_ENGINE=postgresql DB_PASSWORD=$${DB_PASSWORD:-devlink} .venv/bin/pytest

lint:
	cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .
	cd frontend && npm run lint

typecheck:
	cd frontend && npm run typecheck

# Tous les contrôles de la définition de « terminé » (voir CONTRIBUTING.md).
# Parcours de démonstration dans Chromium (démarre lui-même backend et frontend)
e2e:
	cd e2e && npm ci && npx playwright install chromium && npx playwright test

check: lint typecheck test licenses
	cd backend && .venv/bin/python manage.py check && .venv/bin/python manage.py makemigrations --check --dry-run
	cd frontend && npm run build

licenses:
	scripts/check_licenses.sh all

build:
	cd frontend && npm run build
	cd backend && SECRET_KEY=build-only DEBUG=False .venv/bin/python manage.py collectstatic --noinput
