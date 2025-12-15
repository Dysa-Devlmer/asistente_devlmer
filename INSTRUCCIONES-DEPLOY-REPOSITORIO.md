# ⚠️ INSTRUCCIONES PARA DEPLOY A NUEVO REPOSITORIO

**IMPORTANTE:** Este proyecto POS no debe mezclarse con el repositorio `asistente_devlmer.git`

## 🎯 Situación Actual

- ✅ Todo el código está guardado **LOCALMENTE** en la rama `release/fase1-fix`
- ✅ Tag creado: `v0.9.0-fase1`
- ✅ PR creado (pero en repo incorrecto): https://github.com/Dysa-Devlmer/asistente_devlmer/pull/2
- ⚠️ NO se debe hacer push adicional al repo actual

## 📦 Contenido Completo Guardado Localmente

### Commits locales en `release/fase1-fix`:
1. `3e4dda1` - feat: Implementar correcciones Fase 1 del sistema de sincronización
2. `42375bd` - docs: Agregar documentación NestJS y configuración del stack
3. `4e11b38` - docs: Agregar resumen completo de sesión 14 Enero 2025
4. `1bad2ed` - feat(sync): Fase1 fixes - dependencias, idempotencia en transacción, row-level locks
5. `947641d` - chore(db): Add migration for missing_dependencies column in sync_event

### Archivos importantes:
```
backend/
├── src/modules/sync/              # Módulo de sincronización completo
├── database/migrations/           # Migraciones DB
├── scripts/backup-pre-migration.sh # Script de backup
├── README-NESTJS.md               # Documentación NestJS
├── STACK-BACKEND.md               # Decisiones técnicas
├── jest.config.js                 # Configuración tests
├── tsconfig.json                  # Configuración TypeScript
└── nest-cli.json                  # Configuración NestJS CLI

docs/
├── FASE1-CORRECCIONES-IMPLEMENTADAS.md
├── AUDITORIA-SYNC.md
├── AUDITORIA-SYNC-POST-FIX.md
├── RESUMEN-SESION-14-ENE-2025.md
└── PLAN-IMPLEMENTACION-TPV.md
```

## 🚀 Pasos para Migrar a Nuevo Repositorio

### 1. Crear nuevo repositorio
```bash
# En GitHub, crear repo: pos-venta-sysme
# NO inicializar con README (para poder pushear commits existentes)
```

### 2. Agregar nuevo remote
```bash
cd D:\pos_venta
git remote add pos-origin https://github.com/USUARIO/pos-venta-sysme.git
```

### 3. Push rama y tags al nuevo repo
```bash
# Push rama de release
git push pos-origin release/fase1-fix

# Push tag
git push pos-origin v0.9.0-fase1

# Push master (si existe)
git push pos-origin master
```

### 4. Crear PR en el nuevo repositorio
```bash
# Si el nuevo repo tiene rama develop:
gh pr create --repo USUARIO/pos-venta-sysme --base develop --head release/fase1-fix \
  --title "Fase1: Correcciones críticas Sync" \
  --body "Correcciones: validateDependencies, idempotency en transacción (SELECT FOR UPDATE), row-level locking. Tests unitarios: 9/9. Docs añadidos: FASE1-CORRECCIONES-IMPLEMENTADAS.md, AUDITORIA-SYNC-POST-FIX.md."

# Si solo tiene master:
gh pr create --repo USUARIO/pos-venta-sysme --base master --head release/fase1-fix \
  --title "Fase1: Correcciones críticas Sync" \
  --body "Correcciones: validateDependencies, idempotency en transacción (SELECT FOR UPDATE), row-level locking. Tests unitarios: 9/9. Docs añadidos: FASE1-CORRECCIONES-IMPLEMENTADAS.md, AUDITORIA-SYNC-POST-FIX.md."
```

### 5. Cerrar PR incorrecto
```bash
# Cerrar el PR en asistente_devlmer
gh pr close 2 --repo Dysa-Devlmer/asistente_devlmer
```

## 📋 Verificación Pre-Push

Antes de pushear al nuevo repo, verificar:
```bash
# Ver todos los commits locales
git log --oneline release/fase1-fix

# Ver archivos modificados
git diff master..release/fase1-fix --name-status

# Ver tags
git tag -l

# Verificar que NO hay archivos del otro sistema
git ls-files | grep -E "(asistente|devlmer)" || echo "OK - No hay archivos del otro sistema"
```

## 🔧 Alternativa: Export/Import con Bundle

Si prefieres exportar todo y luego importar en repo limpio:

```bash
# 1. Crear bundle con toda la historia
git bundle create fase1-complete.bundle release/fase1-fix

# 2. En el nuevo repositorio clonado:
git fetch /path/to/fase1-complete.bundle release/fase1-fix:release/fase1-fix
git checkout release/fase1-fix
```

## 📝 Notas Importantes

1. **NO eliminar** los commits locales hasta confirmar que están en el nuevo repo
2. **Verificar** que todos los archivos importantes están commiteados
3. **Probar** que los tests pasan antes de hacer PR en nuevo repo
4. **Backup** del directorio D:\pos_venta antes de cualquier operación de limpieza

## ✅ Checklist de Migración

- [ ] Nuevo repositorio creado
- [ ] Remote `pos-origin` agregado
- [ ] Branch `release/fase1-fix` pusheada
- [ ] Tag `v0.9.0-fase1` pusheado
- [ ] PR creado en nuevo repo
- [ ] PR incorrecto cerrado en asistente_devlmer
- [ ] Tests ejecutados en nuevo repo
- [ ] CI/CD configurado (si aplica)
- [ ] Documentación actualizada con nuevo repo URL

---

**Fecha:** 14 Enero 2025
**Status:** READY TO MIGRATE ✅
