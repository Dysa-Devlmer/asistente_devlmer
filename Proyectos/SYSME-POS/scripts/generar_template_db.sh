#!/usr/bin/env bash
# Generar posventa-template.db (requiere sqlite3 CLI disponible)
set -euo pipefail

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 CLI no encontrado. Instala sqlite3 o usa la plantilla ya incluida." >&2
  exit 0
fi

DB="posventa-template.db"
rm -f "$DB"
sqlite3 "$DB" <<'SQL'
-- Aquí iría el esquema mínimo y datos base (omitir por brevedad)
-- Este script es opcional. La plantilla se versiona como archivo binario cuando esté lista.
SQL

echo "Plantilla creada: $DB"
