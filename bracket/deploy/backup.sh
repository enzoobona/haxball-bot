#!/usr/bin/env bash
# Backup de la base de datos (formato comprimido de pg_dump). Se guardan 14 días.
#   ./deploy/backup.sh
# Restaurar:
#   docker compose -f docker-compose.prod.yml exec -T postgres \
#     pg_restore -U bracket -d bracket --clean --if-exists < backups/ARCHIVO.dump
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups

docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U bracket -d bracket -Fc > "backups/bracket-$(date +%F-%H%M).dump"

find backups -name 'bracket-*.dump' -mtime +14 -delete
echo "Backup listo en backups/"
