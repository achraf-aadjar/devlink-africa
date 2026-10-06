#!/usr/bin/env bash
# Recherche de secrets commités (DL-29). Script maison : aucune dépendance,
# donc aucune question de licence.
# Code de sortie non nul si un secret probable est trouvé.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

status=0

# Fichiers suivis par Git uniquement : ce qui n'est pas commité ne nous concerne pas.
files=$(git ls-files 2>/dev/null) || { echo "Pas un dépôt Git : rien à vérifier."; exit 0; }

report() {
  echo "  [$1] $2" >&2
  status=1
}

# 1. Fichiers qui ne doivent jamais être commités.
while IFS= read -r file; do
  case "$file" in
    *.pem|*.key|*.p12|*.pfx|id_rsa|id_ed25519) report "FICHIER DE CLÉ" "$file" ;;
    backend/.env|deploy/.env|.env|frontend/.env|*/.env) report "FICHIER .env" "$file" ;;
  esac
done <<< "$files"

# 2. Motifs de secrets dans le contenu. Les exemples et gabarits sont exclus.
patterns=(
  'SECRET_KEY[[:space:]]*=[[:space:]]*["'"'"'][^"'"'"']{15,}'
  'DB_PASSWORD[[:space:]]*=[[:space:]]*["'"'"'][^"'"'"'{$]{8,}'
  'AWS_SECRET_ACCESS_KEY[[:space:]]*=[[:space:]]*.{10,}'
  'sk-[A-Za-z0-9]{20,}'
  'ghp_[A-Za-z0-9]{30,}'
  'AKIA[0-9A-Z]{16}'
  'BEGIN [A-Z ]*PRIVATE KEY'
)

for pattern in "${patterns[@]}"; do
  while IFS= read -r hit; do
    [ -z "$hit" ] && continue
    file="${hit%%:*}"
    # Exclusions : gabarits, documentation, ce script, valeurs de CI assumées.
    case "$file" in
      *.example|*.md|scripts/check_secrets.sh|.github/workflows/*) continue ;;
    esac
    # Valeurs de développement explicitement non secrètes.
    case "$hit" in
      *insecure-dev-only*|*ci-only*|*test-only*|*build-only*|*devlink*) continue ;;
    esac
    report "SECRET PROBABLE" "$hit"
  done <<< "$(git grep -n -I -E "$pattern" -- . 2>/dev/null || true)"
done

if [ "$status" -eq 0 ]; then
  echo "OK : aucun secret trouvé dans les fichiers suivis."
else
  echo "ÉCHEC : retirez ces secrets, régénérez-les, et purgez l'historique si besoin." >&2
fi
exit "$status"
