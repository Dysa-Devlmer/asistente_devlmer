# 🛡️ JARVIS Anti-Crash System - Guía Completa

## Problema Identificado

JARVIS se cerraba inesperadamente debido a:

1. **Alto uso de memoria del sistema (~88%)**
2. **Carga simultánea de 16 módulos pesados** en `main-ultimate.js`
3. **Sin gestión de memoria ni auto-recovery**
4. **Sin protección contra errores no capturados**

## Solución Implementada

### 1. Process Guardian (`core/process-guardian.js`)

Sistema de protección que:
- ✅ Monitorea uso de memoria cada 5 segundos
- ✅ Ejecuta Garbage Collection automático cada 20 segundos
- ✅ Captura errores no manejados sin cerrar el proceso
- ✅ Alerta cuando la memoria supera el 85%
- ✅ Limpia caches automáticamente
- ✅ Logs detallados de salud del sistema

### 2. JARVIS Safe Mode (`jarvis-safe.js`)

Versión optimizada con:
- ✅ **Lazy Loading**: Módulos se cargan solo cuando se usan
- ✅ Protección anti-cierre integrada
- ✅ Gestión inteligente de memoria
- ✅ Apagado controlado y seguro
- ✅ Menor consumo inicial de RAM

### 3. Watchdog Auto-Restart (`start-protected.js`)

Protección externa:
- ✅ Reinicia JARVIS si se cierra inesperadamente
- ✅ Límite de 10 reinicios automáticos
- ✅ Reset del contador cada 5 minutos
- ✅ Logs detallados de cada reinicio
- ✅ Habilita GC manual con `--expose-gc`

## Cómo Usar

### Opción 1: Modo Seguro (Recomendado)

```bash
npm run safe
```

**Características:**
- Carga rápida (<1 segundo)
- Bajo uso de memoria inicial
- Protección contra cierres
- GC automático cada 20 segundos
- Lazy loading de módulos

### Opción 2: Modo Protegido con Auto-Restart

```bash
npm run protected
```

**Características:**
- Todo lo del modo seguro
- **+ Auto-restart si se cierra**
- Máximo 10 reinicios
- Logs en `logs/watchdog.log`

### Opción 3: Modo Manual con GC

```bash
node --expose-gc jarvis-safe.js
```

## Comandos Disponibles

### Comandos de Sistema
```
status      - Ver estado del sistema y memoria
memory      - Ver uso detallado de memoria
gc          - Forzar limpieza de memoria
salir/exit  - Salir de forma segura
```

### Comandos de JARVIS
```
[cualquier mensaje]        - Hablar con JARVIS
recuerda [texto]          - Guardar en memoria
busca en memoria [query]  - Buscar en memoria
busca en web [query]      - Búsqueda web
resumen de [url]          - Resumir página
status voz                - Estado del motor de voz
di [texto]                - JARVIS habla texto
modo proactivo            - Análisis proactivo
```

## Monitoreo de Salud

### Ver Estado del Sistema
```
🎩 Señor Solier > status
```

Muestra:
- Nombre del proceso
- Uptime (segundos)
- Número de reinicios
- Salud del sistema
- Uso de memoria (sistema y proceso)

### Ver Memoria
```
🎩 Señor Solier > memory
```

Muestra:
- % de uso del sistema
- RAM usada vs total
- Heap usado del proceso
- RSS del proceso

### Forzar Limpieza
```
🎩 Señor Solier > gc
```

Ejecuta:
1. Garbage Collection manual
2. Limpieza de caches
3. Muestra memoria después de limpiar

## Logs

### Guardian Log
`logs/guardian.log`
- Alertas de memoria alta
- Eventos del sistema
- Errores capturados

### Watchdog Log
`logs/watchdog.log`
- Inicios y reinicios
- PIDs de procesos
- Razones de cierre

## Arquitectura de Protección

```
┌─────────────────────────────────────┐
│   start-protected.js (Watchdog)     │
│   - Auto-restart si falla           │
│   - Límite de reinicios            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   jarvis-safe.js (Safe Mode)        │
│   - Lazy loading                    │
│   - Apagado seguro                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Process Guardian                  │
│   - Monitoreo de memoria           │
│   - GC automático                   │
│   - Captura de errores             │
│   - Logs de salud                   │
└─────────────────────────────────────┘
```

## Comparación de Modos

| Característica | normal | safe | protected |
|---------------|--------|------|-----------|
| Carga inicial | Lenta | Rápida | Rápida |
| Uso memoria | Alto | Bajo | Bajo |
| GC automático | ❌ | ✅ | ✅ |
| Anti-crash | ❌ | ✅ | ✅ |
| Auto-restart | ❌ | ❌ | ✅ |
| Monitoreo | ❌ | ✅ | ✅ |

## Solución de Problemas

### JARVIS se sigue cerrando

1. Verificar logs: `cat logs/guardian.log`
2. Verificar uso de memoria del sistema
3. Cerrar otras aplicaciones que consuman RAM
4. Usar `npm run protected` para auto-restart

### Uso alto de memoria

1. Ejecutar comando `gc` para limpiar
2. No cargar todos los módulos a la vez
3. Verificar que no haya memory leaks en módulos custom

### Reinicios frecuentes

1. Revisar `logs/watchdog.log`
2. Identificar el patrón de cierre
3. Reportar el error con el stack trace

## Mejores Prácticas

1. **Usa siempre `npm run protected`** para operación 24/7
2. **Monitorea regularmente** con el comando `status`
3. **Ejecuta `gc`** si notas lentitud
4. **Revisa los logs** diariamente
5. **Cierra correctamente** con `salir` o `exit`

## Ventajas del Sistema

✅ **Prevención de cierres**: Captura errores que antes cerraban JARVIS
✅ **Recuperación automática**: Auto-restart inteligente
✅ **Optimización de memoria**: GC automático y limpieza
✅ **Monitoreo proactivo**: Alertas antes de problemas
✅ **Carga eficiente**: Lazy loading reduce uso inicial
✅ **Logs completos**: Debugging fácil
✅ **Apagado seguro**: Guarda estado antes de cerrar

## Siguiente Nivel

Para optimización adicional:
1. Considerar usar PM2 para gestión de procesos
2. Implementar clustering para balanceo de carga
3. Añadir metrics a Prometheus/Grafana
4. Configurar alertas por email/Slack

---

🎩 **Como siempre, Señor Solier. Sistema protegido y listo.** ⚡
