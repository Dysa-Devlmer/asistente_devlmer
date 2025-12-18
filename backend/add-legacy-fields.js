#!/usr/bin/env node
/**
 * Script para agregar campos legacy_id al schema Prisma
 * Uso: node add-legacy-fields.js
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, 'prisma', 'schema.prisma');
const BACKUP_PATH = path.join(__dirname, 'prisma', 'schema.prisma.backup');

// Definición de campos legacy por modelo
const LEGACY_FIELDS = {
  'Order': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])'],
    skip: true // Ya tiene legacyId
  },
  'OrderItem': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  },
  'Product': {
    fields: [
      'legacyId             BigInt?      @map("legacy_id")',
      'legacySku            String?      @map("legacy_sku") @db.VarChar(50)'
    ],
    indices: ['@@index([legacyId])', '@@index([legacySku])']
  },
  'Category': {
    fields: ['legacyCode           String?      @map("legacy_code") @db.VarChar(20)'],
    indices: ['@@index([legacyCode])']
  },
  'PriceTier': {
    fields: ['legacyCode           String?      @map("legacy_code") @db.VarChar(20)'],
    indices: ['@@index([legacyCode])']
  },
  'Table': {
    fields: ['legacyTableNumber    String?      @map("legacy_table_number") @db.VarChar(20)'],
    indices: ['@@index([legacyTableNumber])']
  },
  'Room': {
    fields: ['legacyCode           String?      @map("legacy_code") @db.VarChar(20)'],
    indices: ['@@index([legacyCode])']
  },
  'CashRegister': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  },
  'CashRegisterShift': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  },
  'Payment': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  },
  'PaymentMethod': {
    fields: ['legacyCode           String?      @map("legacy_code") @db.VarChar(20)'],
    indices: ['@@index([legacyCode])']
  },
  'Invoice': {
    fields: [
      'legacyId             BigInt?      @map("legacy_id")',
      'legacySeries         String?      @map("legacy_series") @db.VarChar(10)'
    ],
    indices: ['@@index([legacyId])', '@@index([legacySeries])']
  },
  'Employee': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  },
  'Customer': {
    fields: ['legacyId             BigInt?      @map("legacy_id")'],
    indices: ['@@index([legacyId])']
  }
};

function addLegacyFields() {
  console.log('🔧 Agregando campos legacy al schema Prisma...\n');

  // 1. Leer schema actual
  let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // 2. Crear backup
  fs.writeFileSync(BACKUP_PATH, schema);
  console.log(`✅ Backup creado: ${BACKUP_PATH}\n`);

  let modificado = false;

  // 3. Procesar cada modelo
  for (const [modelName, config] of Object.entries(LEGACY_FIELDS)) {
    if (config.skip) {
      console.log(`⊘ Skip: ${modelName} (ya tiene campos legacy)`);
      continue;
    }

    // Buscar el modelo
    const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?id\\s+BigInt\\s+@id\\s+@default\\(autoincrement\\(\\)\\))([\\s\\S]*?)(@@map\\([^)]+\\)[\\s\\S]*?\\})`, 'g');

    const match = modelRegex.exec(schema);

    if (!match) {
      console.log(`⚠️  Warning: Modelo ${modelName} no encontrado o formato inesperado`);
      continue;
    }

    // Verificar si ya tiene legacyId
    const modelContent = match[0];
    if (modelContent.includes('legacy_id') || modelContent.includes('legacy_code') || modelContent.includes('legacy_sku')) {
      console.log(`⊘ Skip: ${modelName} (ya tiene campos legacy)`);
      continue;
    }

    // Construir el nuevo contenido del modelo
    const idLine = match[1];
    const restOfModel = match[2];
    const closingPart = match[3];

    // Agregar campos después del id
    const legacyFieldsStr = config.fields.map(f => `  ${f}`).join('\n');
    const newIdSection = `${idLine}\n${legacyFieldsStr}`;

    // Agregar índices antes del @@map
    let newClosing = closingPart;
    const lastIndexPos = closingPart.lastIndexOf('@@index');
    if (lastIndexPos !== -1) {
      // Ya hay índices, agregar después del último
      const mapPos = closingPart.indexOf('@@map');
      const beforeMap = closingPart.substring(0, mapPos);
      const mapAndAfter = closingPart.substring(mapPos);

      const indicesStr = config.indices.map(idx => `  ${idx}`).join('\n');
      newClosing = `${beforeMap}${indicesStr}\n  ${mapAndAfter}`;
    } else {
      // No hay índices, agregar antes de @@map
      const mapPos = closingPart.indexOf('@@map');
      const beforeMap = closingPart.substring(0, mapPos);
      const mapAndAfter = closingPart.substring(mapPos);

      const indicesStr = config.indices.map(idx => `  ${idx}`).join('\n');
      newClosing = `${beforeMap}\n${indicesStr}\n  ${mapAndAfter}`;
    }

    // Reemplazar en el schema
    const oldModel = match[0];
    const newModel = `${newIdSection}${restOfModel}${newClosing}`;

    schema = schema.replace(oldModel, newModel);
    modificado = true;

    console.log(`✅ ${modelName}: ${config.fields.length} campo(s) + ${config.indices.length} índice(s)`);
  }

  if (!modificado) {
    console.log('\n⚠️  No se realizaron cambios (todos los modelos ya tienen campos legacy)\n');
    return false;
  }

  // 4. Escribir nuevo schema
  fs.writeFileSync(SCHEMA_PATH, schema);
  console.log(`\n✅ Schema actualizado: ${SCHEMA_PATH}`);
  console.log(`\n📋 Próximos pasos:`);
  console.log(`   1. npx prisma format`);
  console.log(`   2. npx prisma validate`);
  console.log(`   3. npx prisma migrate dev --name add_legacy_traceability`);
  console.log(`   4. npx prisma generate\n`);

  return true;
}

// Ejecutar
try {
  const success = addLegacyFields();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n💡 Restaurar backup:');
  console.error(`   cp ${BACKUP_PATH} ${SCHEMA_PATH}\n`);
  process.exit(1);
}
