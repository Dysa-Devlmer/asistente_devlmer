/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Agregar columna missing_dependencies a sync_event
  await knex.schema.table('sync_event', (table) => {
    table.text('missing_dependencies').nullable().comment('JSON array de dependencias faltantes cuando status = DEPENDENCIA_PENDIENTE');
  });

  // 2. Actualizar el constraint de sync_status para incluir el nuevo estado
  // Primero eliminar el constraint existente
  await knex.raw(`
    ALTER TABLE sync_event
    DROP CONSTRAINT IF EXISTS sync_event_sync_status_check;
  `);

  // Recrear el constraint con el nuevo valor
  await knex.raw(`
    ALTER TABLE sync_event
    ADD CONSTRAINT sync_event_sync_status_check
    CHECK (sync_status IN ('PENDIENTE', 'PROCESADO', 'ERROR', 'IGNORADO', 'DEPENDENCIA_PENDIENTE'));
  `);

  console.log('✅ Migración completada: missing_dependencies agregado a sync_event');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Revertir constraint
  await knex.raw(`
    ALTER TABLE sync_event
    DROP CONSTRAINT IF EXISTS sync_event_sync_status_check;
  `);

  await knex.raw(`
    ALTER TABLE sync_event
    ADD CONSTRAINT sync_event_sync_status_check
    CHECK (sync_status IN ('PENDIENTE', 'PROCESADO', 'ERROR', 'IGNORADO'));
  `);

  // Eliminar columna
  await knex.schema.table('sync_event', (table) => {
    table.dropColumn('missing_dependencies');
  });

  console.log('✅ Rollback completado: missing_dependencies eliminado de sync_event');
};
