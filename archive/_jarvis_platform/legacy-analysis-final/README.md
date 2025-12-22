# LEGACY ANALYSIS - FINAL FROZEN STATE

**Fecha de congelación:** 2025-12-15
**Estado:** READ ONLY - NO MODIFICAR

---

## 🔒 ARTEFACTOS CONGELADOS

Esta carpeta contiene la referencia final del análisis del sistema legacy.
**NO se deben regenerar dumps ni ejecutar comandos contra el sistema legacy.**

### Archivos de Referencia

**Dumps de Base de Datos:**
- `../artifacts/sysmehotel_full.sql` (34 MB) - Dump completo con datos
- `../artifacts/sysmehotel_schema_real.sql` (133 KB) - Schema real

**Documentación Técnica:**
- `../REPORTE-TECNICO-LEGACY-POS.md` (150 KB) - Reporte principal
- `../docs/LEGACY-POS-ANALYSIS.md` (40 KB) - Resumen ejecutivo
- `../docs/LEGACY-POS-STRUCTURE.md` (48 KB) - Estructura del proyecto
- `../docs/LEGACY-POS-DATABASE.md` (60 KB) - Schema de 157 tablas
- `../docs/LEGACY-POS-WORKFLOW.md` (75 KB) - Flujos operacionales

**Código Fuente:**
- `../artifacts/pos_www.zip` (296 KB) - Código PHP completo

**Reports:**
- `../reports/listing_root.txt` (1.7 KB)
- `../reports/pos_files_tree.txt` (8.7 KB)
- `../reports/php_vulnerabilities.txt` (73 KB)

**Configuraciones:**
- `../artifacts/conn.php.SANITIZED.txt`
- `../artifacts/sysmetpv.ini.SANITIZED.txt`
- `../artifacts/tpv.ini.txt`

---

## 📊 RESUMEN DEL SISTEMA LEGACY

**Arquitectura:** Monolito Dual (Desktop + Web)
**Backend:** PHP 5.x/7.x Procedural
**Base de Datos:** MySQL 5.0.51b-community-nt
**Puerto MySQL:** 4306
**Charset:** latin1
**Tablas:** 157 tablas en 19 módulos

**Deuda Técnica:** 9/10 CRÍTICO

---

## ⚠️ USO DE ESTOS ARTEFACTOS

**Para diseño del nuevo sistema:**
1. Leer documentación para entender el dominio
2. Consultar schema para extraer estructura de datos
3. Analizar dumps para validar datos reales
4. **NO copiar** diseño legacy
5. **NO ejecutar** comandos contra MySQL legacy

**Para migración de datos (futura):**
1. Usar `sysmehotel_full.sql` como fuente de datos
2. Aplicar transformaciones definidas en mapping
3. Validar integridad antes de importar

---

## 🎯 PRÓXIMA FASE

**Fase 2:** Diseño del Nuevo Sistema (Greenfield)

Documentos a crear:
- `CORE-DOMAIN.md` - Dominios críticos del negocio
- `NEW-DATA-MODEL.md` - Modelo moderno diseñado desde cero
- `LEGACY-TO-NEW-MAPPING.md` - Mapeo de transformaciones
- `MIGRATION-STRATEGY.md` - Estrategia de migración

---

**FIN DE ANÁLISIS LEGACY**

Estado: ✅ CONGELADO - SOLO LECTURA
