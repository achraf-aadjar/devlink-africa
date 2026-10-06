# DevLink Africa : commandes de développement (macOS / Linux).
# Équivalents Windows (PowerShell) : voir README.md, section « Windows ».

PYTHON ?= $(shell command -v python3.13 || command -v python3)
VENV := backend/.venv
BIN := $(VENV)/bin

.PHONY: help setup dev-backend dev-frontend test lint licenses build

help:
	@echo "Cibles : setup dev-backend dev-frontend test lint licenses build"

setup:
	$(PYTHON) -m venv $(VENV)
	$(BIN)/pip install --upgrade pip
	$(BIN)/pip install -r backend/requirements.txt
	@test -f backend/.env || { \
		cp backend/.env.example backend/.env; \
		key=$$($(BIN)/python -c "from django.core.management.utils import get_random_secret_key as k; print(k())"); \
		sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$$key|" backend/.env && rm -f backend/.env.bak; \
		echo "backend/.env créé avec une SECRET_KEY aléatoire."; }
	cd backend && .venv/bin/python manage.py migrate
	cd frontend && npm ci

dev-backend:
	cd backend && .venv/bin/python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && .venv/bin/pytest
	cd frontend && npm test

lint:
	cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check .
	cd frontend && npm run lint

licenses:
	scripts/check_licenses.sh all

build:
	cd frontend && npm run build
	cd backend && SECRET_KEY=build-only DEBUG=False .venv/bin/python manage.py collectstatic --noinput
