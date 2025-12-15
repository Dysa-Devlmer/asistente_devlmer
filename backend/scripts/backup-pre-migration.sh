#!/bin/bash
# Script de backup pre-migración Fase 1
# Ejecutar ANTES de aplicar migraciones en staging/producción

set -e

# Cargar variables de entorno
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Variables requeridas
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-sysme_tpv}
DB_PASSWORD=${DB_PASSWORD}

# Timestamp para el backup
TIMESTAMP=$(date +%Y%m%dT%H%M%SZ)
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/backup_pre_fase1_${TIMESTAMP}.dump"

# Crear directorio de backups si no existe
mkdir -p ${BACKUP_DIR}

echo "🔒 Iniciando backup pre-migración Fase 1..."
echo "📍 Base de datos: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"
echo "📁 Archivo: ${BACKUP_FILE}"
echo ""

# Exportar password para pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Ejecutar pg_dump en formato custom (mejor compresión + restauración selectiva)
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -Fc ${DB_NAME} > ${BACKUP_FILE}

# Verificar que el backup se creó correctamente
if [ -f "${BACKUP_FILE}" ]; then
  SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
  echo ""
  echo "✅ Backup completado exitosamente"
  echo "📦 Tamaño: ${SIZE}"
  echo "📁 Ubicación: ${BACKUP_FILE}"
  echo ""
  echo "Para restaurar este backup:"
  echo "  pg_restore -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME ${BACKUP_FILE}"
  echo ""
  echo "⚠️  IMPORTANTE: Guarda este backup en un lugar seguro antes de ejecutar las migraciones"
else
  echo "❌ Error: El backup no se creó correctamente"
  exit 1
fi

# Limpiar password del entorno
unset PGPASSWORD
