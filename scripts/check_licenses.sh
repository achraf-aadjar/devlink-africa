#!/usr/bin/env bash
# Vérifie les licences des dépendances Python et Node (règle du concours, art. 6).
# Usage : scripts/check_licenses.sh [python|node|all]   (défaut : all)
# Code de sortie non nul si une licence à réciprocité (GPL, AGPL, LGPL, MPL) ou
# inconnue/non reconnue est trouvée, hors exceptions de licenses-allowlist.txt.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-all}"
ALLOWLIST="$ROOT/licenses-allowlist.txt"
status=0

check_python() {
  local py="${PYTHON:-$ROOT/backend/.venv/bin/python}"
  [ -x "$py" ] || py="$(command -v python3)"
  echo "== Licences Python ($py) =="
  "$py" "$ROOT/scripts/check_licenses.py" "$ALLOWLIST" || status=1
}

check_node() {
  echo "== Licences Node (frontend/node_modules) =="
  if [ ! -d "$ROOT/frontend/node_modules" ]; then
    echo "frontend/node_modules absent : lancez d'abord 'npm ci' dans frontend/." >&2
    status=1
    return
  fi
  node "$ROOT/scripts/check_licenses.mjs" "$ROOT/frontend/node_modules" "$ALLOWLIST" || status=1

  # Outils de test de bout en bout : jamais livrés, mais vérifiés de la même façon.
  if [ -d "$ROOT/e2e/node_modules" ]; then
    echo "== Licences Node (e2e/node_modules) =="
    node "$ROOT/scripts/check_licenses.mjs" "$ROOT/e2e/node_modules" "$ALLOWLIST" || status=1
  fi
}

case "$TARGET" in
  python) check_python ;;
  node) check_node ;;
  all) check_python; check_node ;;
  *) echo "Usage: $0 [python|node|all]" >&2; exit 2 ;;
esac

if [ "$status" -eq 0 ]; then echo "OK : aucune licence non permissive."; else echo "ÉCHEC : voir ci-dessus." >&2; fi
exit "$status"
