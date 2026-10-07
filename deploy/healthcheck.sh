#!/usr/bin/env bash
# Surveillance externe (DL-30) : alerte si le site ne répond plus.
#
# À installer sur une machine *différente* du serveur (sinon une panne du
# serveur emporte aussi la surveillance) :
#   */5 * * * * /chemin/healthcheck.sh https://votre-domaine
#
# Sans service tiers : l'alerte part par courriel via `mail`, disponible
# partout, plutôt que par une dépendance externe à vérifier.
set -uo pipefail

URL="${1:-https://example.org}"
ALERT_TO="${ALERT_TO:-}"
STATE_FILE="${STATE_FILE:-/tmp/devlink-health.state}"

response=$(curl -sS -m 10 -o /tmp/devlink-health.body -w '%{http_code}' "$URL/api/v1/health/?detail=1" 2>/tmp/devlink-health.err || echo "000")

if [ "$response" = "200" ]; then
  if [ -f "$STATE_FILE" ]; then
    echo "$(date -Iseconds) RÉTABLI ($URL)"
    [ -n "$ALERT_TO" ] && echo "DevLink Africa répond de nouveau : $URL" | mail -s "DevLink Africa rétabli" "$ALERT_TO"
    rm -f "$STATE_FILE"
  fi
  exit 0
fi

echo "$(date -Iseconds) PANNE code=$response ($URL)"
cat /tmp/devlink-health.body 2>/dev/null

# Une seule alerte par panne, pas une toutes les cinq minutes.
if [ ! -f "$STATE_FILE" ]; then
  touch "$STATE_FILE"
  if [ -n "$ALERT_TO" ]; then
    {
      echo "DevLink Africa ne répond plus."
      echo "URL : $URL"
      echo "Code HTTP : $response"
      echo "Réponse : $(cat /tmp/devlink-health.body 2>/dev/null)"
    } | mail -s "ALERTE DevLink Africa indisponible" "$ALERT_TO"
  fi
fi
exit 1
