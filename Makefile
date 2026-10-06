# DevLink Africa : commandes de développement (macOS / Linux).
# Équivalents Windows (PowerShell) : voir README.md, section « Windows ».

PYTHON ?= $(shell command -v python3.13 || command -v python3)
VENV := backend/.venv
BIN := $(VENV)/bin

.PHONY: help setup db wait-db dev-backend dev-frontend test test-pg lint typecheck licenses build check

help:
	@echo "Cibles : setup db dev-backend dev-frontend test test-pg lint typecheck licenses build check"

db:
	docker compose up -d db

# Attend que la base accepte les connexions *depuis l'hôte* : pg_isready dans le
# conteneur répond avant que le port soit publié, d'où l'essai sur 127.0.0.1.
wait-db:
	@echo "Attente de PostgreSQL sur $${DB_HOST:-127.0.0.1}:$${DB_PORT:-5432}..."
	@for i in $$(seq 1 60); do \
		if $(BIN)/python -c "import socket; s=socket.create_connection(('127.0.0.1',5432),1); s.close()" 2>/dev/null; then \
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
check: lint typecheck test licenses
	cd backend && .venv/bin/python manage.py check && .venv/bin/python manage.py makemigrations --check --dry-run
	cd frontend && npm run build

licenses:
	scripts/check_licenses.sh all

build:
	cd frontend && npm run build
	cd backend && SECRET_KEY=build-only DEBUG=False .venv/bin/python manage.py collectstatic --noinput
