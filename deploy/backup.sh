#!/usr/bin/env bash
# Sauvegarde quotidienne de la base PostgreSQL (DL-30).
#
# À installer dans la crontab du serveur :
#   0 3 * * * /chemin/vers/devlink-africa/deploy/backup.sh >> /var/log/devlink-backup.log 2>&1
#
# Conserve 14 jours de sauvegardes. Teste la restauration au moins une fois
# avant de s'y fier : voir la procédure dans deploy/README.md.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/devlink}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
COMPOSE="docker compose -f $ROOT/docker-compose.prod.yml"
STAMP="$(date +%Y-%m-%d_%H%M)"
TARGET="$BACKUP_DIR/devlink-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] Sauvegarde vers $TARGET"

# --clean : le fichier peut être rejoué sur une base existante.
$COMPOSE exec -T db pg_dump --clean --if-exists -U "${DB_USER:-devlink}" "${DB_NAME:-devlink}" \
  | gzip > "$TARGET"

size=$(du -h "$TARGET" | cut -f1)
echo "[$(date -Iseconds)] Terminé ($size)"

# Une sauvegarde vide ou minuscule signale un échec silencieux.
if [ "$(stat -f%z "$TARGET" 2>/dev/null || stat -c%s "$TARGET")" -lt 1024 ]; then
  echo "ERREUR : la sauvegarde est anormalement petite. Vérifiez la base." >&2
  exit 1
fi

find "$BACKUP_DIR" -name 'devlink-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
echo "[$(date -Iseconds)] Sauvegardes de plus de $RETENTION_DAYS jours supprimées."
