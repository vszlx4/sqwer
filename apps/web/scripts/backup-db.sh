#!/usr/bin/env bash
# Daily database backup: a compressed dump of the database in DATABASE_URL, kept for 14 days.
# Reads apps/web/.env. Requires pg_dump 17 or later (macOS: `brew install libpq`).
# Restore with: pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" <file>
set -euo pipefail

cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
[ -f .env ] && source .env
set +a

: "${DATABASE_URL:?DATABASE_URL is not set in apps/web/.env}"
PG_DUMP="${PG_DUMP:-$(command -v pg_dump || echo /opt/homebrew/opt/libpq/bin/pg_dump)}"
[ -x "$PG_DUMP" ] || { echo "pg_dump not found. On macOS run: brew install libpq" >&2; exit 1; }

BACKUP_DIR="${BACKUP_DIR:-backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Encrypted and verified, as the app itself connects.
if [ -n "${DATABASE_CA_FILE:-}" ]; then
	export PGSSLMODE=verify-full PGSSLROOTCERT="$DATABASE_CA_FILE"
else
	export PGSSLMODE=require
fi

file="$BACKUP_DIR/sqwer-$(date -u +%Y-%m-%dT%H%M%SZ).dump"
"$PG_DUMP" --format=custom --no-owner --no-privileges --schema=public --file="$file.partial" "$DATABASE_URL"
mv "$file.partial" "$file"
chmod 600 "$file"
echo "Backup written: $file ($(du -h "$file" | cut -f1))"

find "$BACKUP_DIR" -name 'sqwer-*.dump' -type f -mtime +"$KEEP_DAYS" -print -delete
