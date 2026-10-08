#!/usr/bin/env bash
# Démarre le backend pour les tests de bout en bout : base SQLite jetable,
# migrations, données de démonstration, puis serveur sur le port 8000.
# Appelé par e2e/playwright.config.ts ; jamais utilisé en production.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# PYTHON peut être un chemin (venv local) ou un nom de commande (CI : "python").
PYTHON="${PYTHON:-$ROOT/backend/.venv/bin/python}"
[ -x "$PYTHON" ] || PYTHON="$(command -v "$PYTHON" || command -v python3)"

export DB_ENGINE=sqlite
export DATABASE_PATH="${E2E_DATABASE_PATH:-${TMPDIR:-/tmp}/devlink-e2e.sqlite3}"
# Clé aléatoire à chaque lancement : rien à protéger, rien à commiter.
[ -n "${SECRET_KEY:-}" ] || SECRET_KEY="$("$PYTHON" -c 'import secrets; print(secrets.token_urlsafe(50))')"
export SECRET_KEY
export DEBUG=True

rm -f "$DATABASE_PATH"
cd "$ROOT/backend"
"$PYTHON" manage.py migrate --verbosity 0
"$PYTHON" manage.py seed_demo > /dev/null
exec "$PYTHON" manage.py runserver 8000 --noreload
