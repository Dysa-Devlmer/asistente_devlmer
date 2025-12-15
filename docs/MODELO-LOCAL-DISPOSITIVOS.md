# 📱 Modelo Local SQLite para Dispositivos

**Versión:** 1.0.0-MVP
**Fecha:** 14 Enero 2025
**Propósito:** Definir qué tablas y datos se guardan localmente en cada dispositivo

---

## 🎯 Principio Fundamental

**Cada dispositivo tiene una base de datos SQLite completa pero con datos PARCIALES**

- ✅ Esquema completo (todas las tablas)
- ⚠️ Datos filtrados por sucursal
- ⚠️ Solo datos necesarios para operar offline

**¿Por qué?**
- Reducir tamaño de BD local (más rápido)
- Evitar sincronizar datos innecesarios
- Proteger privacidad entre sucursales

---

## 📊 Tablas Locales - Matriz de Datos

### Leyenda
- 🟢 **COMPLETO:** Todos los registros
- 🟡 **PARCIAL:** Solo registros de la sucursal actual
- 🔴 **CACHE:** Solo datos recientes/activos
- ⚪ **VACÍO:** No se almacena localmente

---

## 📋 Detalle por Tabla

### 1. CONFIGURACIÓN Y MAESTROS

#### 🟡 `sucursal` - PARCIAL (solo sucursal actual)

**¿Qué se guarda?**
```sql
-- Solo la sucursal donde opera este dispositivo
SELECT * FROM sucursal WHERE id = '{sucursal_id_del_dispositivo}'
```

**Razón:**
- Dispositivo solo necesita datos de su sucursal
- Ahorra espacio (no necesita info de otras sucursales)

**Sincronización:**
- Descarga inicial al configurar dispositivo
- Actualización cada 24 horas (cambios son raros)

**Tamaño estimado:** 1 registro (~500 bytes)

---

#### 🟡 `dispositivo` - PARCIAL (solo dispositivos de esta sucursal)

**¿Qué se guarda?**
```sql
-- Todos los dispositivos de esta sucursal
SELECT * FROM dispositivo WHERE sucursal_id = '{sucursal_id_actual}'
```

**Razón:**
- Saber qué otros dispositivos están activos
- Detectar conflictos de sesiones de caja
- Mostrar estado de otros POS en UI admin

**Sincronización:**
- Descarga inicial
- Actualización cada 1 hora

**Tamaño estimado:** 9 registros × 300 bytes = ~2.7 KB

---

#### 🟡 `empleado` - PARCIAL (solo empleados de esta sucursal)

**¿Qué se guarda?**
```sql
-- Solo empleados activos de esta sucursal
SELECT * FROM empleado
WHERE sucursal_id = '{sucursal_id_actual}'
  AND esta_activo = 1
```

**Razón:**
- Login local (PIN/contraseña)
- Asignación de pedidos a meseros
- No necesita empleados de otras sucursales

**Sincronización:**
- Descarga inicial
- Actualización cada 6 horas
- Push inmediato si hay cambios (nuevo empleado, desactivación)

**Tamaño estimado:** 15 empleados × 500 bytes = ~7.5 KB

---

#### 🟡 `zona` - PARCIAL (solo zonas de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM zona
WHERE sucursal_id = '{sucursal_id_actual}'
  AND esta_activa = 1
```

**Razón:**
- Plano de mesas
- Filtrado visual de mesas

**Sincronización:**
- Descarga inicial
- Actualización cada 24 horas (cambios raros)

**Tamaño estimado:** 4 zonas × 200 bytes = ~800 bytes

---

#### 🟡 `mesa` - PARCIAL (solo mesas de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM mesa
WHERE sucursal_id = '{sucursal_id_actual}'
  AND esta_activa = 1
```

**Razón:**
- Gestión de mesas (plano visual)
- Asignación de pedidos
- Estados (libre/ocupada/limpieza)

**Sincronización:**
- Descarga inicial
- Actualización cada 5 minutos (estados cambian frecuentemente)
- Push inmediato via WebSocket cuando otra caja actualiza mesa

**Tamaño estimado:** 30 mesas × 300 bytes = ~9 KB

---

#### 🟡 `categoria` - PARCIAL (solo categorías de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM categoria
WHERE (sucursal_id = '{sucursal_id_actual}' OR sucursal_id IS NULL)
  AND esta_activa = 1
ORDER BY orden
```

**Razón:**
- Organización del menú
- Filtros de productos
- Categorías globales (sucursal_id = NULL) + específicas sucursal

**Sincronización:**
- Descarga inicial
- Actualización cada 24 horas

**Tamaño estimado:** 12 categorías × 200 bytes = ~2.4 KB

---

#### 🟡 `producto` - PARCIAL (solo productos de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM producto
WHERE (sucursal_id = '{sucursal_id_actual}' OR sucursal_id IS NULL)
  AND esta_activo = 1
  AND disponible = 1
ORDER BY nombre
```

**Razón:**
- Menú completo para tomar pedidos
- Precios, descripciones, imágenes
- No necesita productos de otras sucursales

**Sincronización:**
- Descarga inicial (puede ser pesado: 200-500 productos)
- Actualización cada 1 hora (cambios de precio, disponibilidad)
- Push inmediato si producto se agota (disponible = 0)

**Tamaño estimado:** 200 productos × 800 bytes = ~160 KB

**⚠️ Optimización:**
- Imágenes NO se guardan en SQLite
- Solo URL de imagen (se cachean en IndexedDB/FileSystem)

---

#### 🟡 `estacion_cocina` - PARCIAL (solo estaciones de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM estacion_cocina
WHERE sucursal_id = '{sucursal_id_actual}'
  AND esta_activa = 1
```

**Razón:**
- Routing de pedidos a cocina/barra
- KDS (Kitchen Display System)

**Sincronización:**
- Descarga inicial
- Actualización cada 24 horas

**Tamaño estimado:** 5 estaciones × 200 bytes = ~1 KB

---

### 2. TRANSACCIONALES

#### 🔴 `caja` - CACHE (solo cajas de esta sucursal)

**¿Qué se guarda?**
```sql
SELECT * FROM caja
WHERE sucursal_id = '{sucursal_id_actual}'
  AND esta_activa = 1
```

**Razón:**
- Gestión de sesiones de caja
- Apertura/cierre de turno

**Sincronización:**
- Descarga inicial
- Actualización cada 1 hora

**Tamaño estimado:** 3 cajas × 200 bytes = ~600 bytes

---

#### 🔴 `sesion_caja` - CACHE (solo sesión actual + últimas 7)

**¿Qué se guarda?**
```sql
-- Sesión abierta actualmente en ESTE dispositivo
SELECT * FROM sesion_caja
WHERE dispositivo_id = '{dispositivo_id_actual}'
  AND estado = 'ABIERTA'

UNION

-- Últimas 7 sesiones cerradas (para consultas/reportes)
SELECT * FROM sesion_caja
WHERE caja_id IN (SELECT id FROM caja WHERE sucursal_id = '{sucursal_id_actual}')
  AND estado = 'CERRADA'
ORDER BY fecha_apertura DESC
LIMIT 7
```

**Razón:**
- Sesión actual para registrar pagos
- Historial reciente para reportes de turno
- No necesita sesiones antiguas (están en servidor)

**Sincronización:**
- Sesión actual: sincronización continua
- Historial: descarga cada 6 horas

**Tamaño estimado:** 8 sesiones × 400 bytes = ~3.2 KB

**⚠️ Limpieza:**
- Sesiones > 30 días se eliminan del dispositivo
- Se mantienen en servidor (auditoría)

---

#### 🔴 `pedido` - CACHE (solo pedidos activos + últimos 50)

**¿Qué se guarda?**
```sql
-- Pedidos activos (no pagados)
SELECT * FROM pedido
WHERE sucursal_id = '{sucursal_id_actual}'
  AND estado != 'PAGADO'
  AND estado != 'CANCELADO'

UNION

-- Últimos 50 pedidos completados (para consultas rápidas)
SELECT * FROM pedido
WHERE sucursal_id = '{sucursal_id_actual}'
  AND (estado = 'PAGADO' OR estado = 'CANCELADO')
ORDER BY fecha_creacion DESC
LIMIT 50
```

**Razón:**
- Pedidos abiertos: necesarios para operar
- Pedidos recientes: búsquedas, reimprimir tickets
- Pedidos antiguos: no necesarios localmente

**Sincronización:**
- Pedidos activos: sincronización continua (cada 30s)
- Pedidos completados: se sincronizan y eventualmente se eliminan localmente

**Tamaño estimado:**
- 20 pedidos activos × 500 bytes = ~10 KB
- 50 pedidos completados × 500 bytes = ~25 KB
- **Total: ~35 KB**

**⚠️ Limpieza:**
- Pedidos PAGADOS > 7 días: eliminar del dispositivo
- Se mantienen en servidor

---

#### 🔴 `detalle_pedido` - CACHE (solo items de pedidos activos + últimos 50)

**¿Qué se guarda?**
```sql
-- Items de pedidos activos
SELECT dp.* FROM detalle_pedido dp
INNER JOIN pedido p ON dp.pedido_id = p.id
WHERE p.sucursal_id = '{sucursal_id_actual}'
  AND p.estado NOT IN ('PAGADO', 'CANCELADO')

UNION

-- Items de últimos 50 pedidos completados
SELECT dp.* FROM detalle_pedido dp
WHERE dp.pedido_id IN (
  SELECT id FROM pedido
  WHERE sucursal_id = '{sucursal_id_actual}'
    AND estado IN ('PAGADO', 'CANCELADO')
  ORDER BY fecha_creacion DESC
  LIMIT 50
)
```

**Razón:**
- Items activos: necesarios para modificar pedidos, enviar a cocina
- Items recientes: reimprimir tickets, consultas

**Sincronización:**
- Continua para items activos
- Se eliminan junto con pedidos antiguos

**Tamaño estimado:**
- 70 pedidos × 3 items promedio × 300 bytes = ~63 KB

---

#### 🔴 `pago` - CACHE (solo pagos de sesión actual + últimos 100)

**¿Qué se guarda?**
```sql
-- Pagos de la sesión de caja actual
SELECT * FROM pago
WHERE sesion_caja_id IN (
  SELECT id FROM sesion_caja
  WHERE dispositivo_id = '{dispositivo_id_actual}'
    AND estado = 'ABIERTA'
)

UNION

-- Últimos 100 pagos (para reportes)
SELECT * FROM pago
WHERE sucursal_id = '{sucursal_id_actual}'
ORDER BY fecha_pago DESC
LIMIT 100
```

**Razón:**
- Pagos de sesión actual: cierre de caja
- Historial reciente: anulaciones, consultas
- **CRÍTICO:** Pagos pendientes de sincronizar (sync_status = PENDIENTE)

**Sincronización:**
- **PRIORIDAD MÁXIMA** (cada 5 segundos)
- NO se eliminan hasta confirmar sync_status = SINCRONIZADO

**Tamaño estimado:**
- 100 pagos × 400 bytes = ~40 KB

**⚠️ Regla de oro:**
```
NUNCA eliminar pago con sync_status != 'SINCRONIZADO'
```

---

#### 🟢 `sync_event` - COMPLETO (todos los eventos de este dispositivo)

**¿Qué se guarda?**
```sql
-- Todos los eventos generados por ESTE dispositivo
SELECT * FROM sync_event
WHERE dispositivo_id = '{dispositivo_id_actual}'
ORDER BY sync_priority ASC, created_at ASC
```

**Razón:**
- **Cola de sincronización**
- Reintentos de eventos fallidos
- Auditoría local

**Sincronización:**
- Esta tabla ES el mecanismo de sincronización
- Eventos procesados (sync_status = PROCESADO) se eliminan después de 7 días

**Tamaño estimado:**
- 500 eventos promedio × 1 KB = ~500 KB

**⚠️ Limpieza:**
- Eventos PROCESADOS > 7 días: eliminar
- Eventos PENDIENTE: NUNCA eliminar
- Eventos ERROR > 30 días: marcar para intervención manual

---

## 📊 Resumen de Tamaños

| Tabla | Tipo | Registros Aprox. | Tamaño Estimado |
|-------|------|------------------|-----------------|
| sucursal | 🟡 Parcial | 1 | 500 B |
| dispositivo | 🟡 Parcial | 9 | 2.7 KB |
| empleado | 🟡 Parcial | 15 | 7.5 KB |
| zona | 🟡 Parcial | 4 | 800 B |
| mesa | 🟡 Parcial | 30 | 9 KB |
| categoria | 🟡 Parcial | 12 | 2.4 KB |
| producto | 🟡 Parcial | 200 | 160 KB |
| estacion_cocina | 🟡 Parcial | 5 | 1 KB |
| caja | 🔴 Cache | 3 | 600 B |
| sesion_caja | 🔴 Cache | 8 | 3.2 KB |
| pedido | 🔴 Cache | 70 | 35 KB |
| detalle_pedido | 🔴 Cache | 210 | 63 KB |
| pago | 🔴 Cache | 100 | 40 KB |
| sync_event | 🟢 Completo | 500 | 500 KB |
| **TOTAL** | | | **~825 KB** |

**📱 Tamaño total estimado por dispositivo: < 1 MB**

✅ Ligero y rápido para tabletas/móviles
✅ Sincronización inicial < 5 segundos en 4G

---

## 🔄 Estrategia de Sincronización por Tabla

### Descarga Inicial (Primera vez)

```javascript
// Orden de descarga al configurar dispositivo nuevo
async function inicializarDispositivo(dispositivoId, sucursalId) {
  // 1. Configuración (rápido)
  await descargarTabla('sucursal', { id: sucursalId });
  await descargarTabla('dispositivo', { sucursal_id: sucursalId });
  await descargarTabla('caja', { sucursal_id: sucursalId });

  // 2. Empleados (para login)
  await descargarTabla('empleado', { sucursal_id: sucursalId, esta_activo: 1 });

  // 3. Catálogo (más pesado)
  await descargarTabla('categoria', { sucursal_id: [sucursalId, null] });
  await descargarTabla('estacion_cocina', { sucursal_id: sucursalId });
  await descargarTabla('producto', {
    sucursal_id: [sucursalId, null],
    esta_activo: 1
  });

  // 4. Operación (estado actual)
  await descargarTabla('zona', { sucursal_id: sucursalId });
  await descargarTabla('mesa', { sucursal_id: sucursalId });
  await descargarSesionCajaActual(dispositivoId);
  await descargarPedidosActivos(sucursalId);

  console.log('✅ Dispositivo inicializado y listo para operar offline');
}
```

### Sincronización Continua (Intervalos)

```javascript
// Servicio de sincronización en background
const SyncSchedule = {
  // ALTA FRECUENCIA (Datos críticos)
  highFrequency: {
    interval: 30000, // 30 segundos
    tables: [
      { name: 'pedido', filter: { estado: ['ABIERTO', 'ENVIADO_COCINA', 'LISTO'] } },
      { name: 'mesa', filter: { sucursal_id: '{current}' } },
      { name: 'sesion_caja', filter: { estado: 'ABIERTA' } }
    ]
  },

  // MEDIA FRECUENCIA (Configuración)
  mediumFrequency: {
    interval: 3600000, // 1 hora
    tables: [
      { name: 'producto', filter: { disponible: 1 } },
      { name: 'empleado', filter: { esta_activo: 1 } }
    ]
  },

  // BAJA FRECUENCIA (Maestros)
  lowFrequency: {
    interval: 86400000, // 24 horas
    tables: [
      'sucursal',
      'categoria',
      'zona',
      'estacion_cocina'
    ]
  }
};
```

### Push en Tiempo Real (WebSocket)

```javascript
// Eventos que requieren notificación inmediata a otros dispositivos
const RealtimeEvents = {
  'MESA_OCUPADA': (data) => actualizarMesaLocal(data.mesa_id, data.estado),
  'MESA_LIBERADA': (data) => actualizarMesaLocal(data.mesa_id, 'LIBRE'),
  'PRODUCTO_AGOTADO': (data) => actualizarProductoLocal(data.producto_id, { disponible: 0 }),
  'SESION_CAJA_CERRADA': (data) => notificarCierreCaja(data.sesion_id),
  'PEDIDO_ACTUALIZADO': (data) => sincronizarPedido(data.pedido_id)
};

// Conectar WebSocket
websocket.on('event', (event) => {
  const handler = RealtimeEvents[event.type];
  if (handler) handler(event.data);
});
```

---

## 🧹 Estrategia de Limpieza (Garbage Collection)

### Política de Retención

```javascript
// Ejecutar cada 24 horas (a las 3:00 AM)
async function limpiezaBDLocal() {
  const ahora = new Date();

  // 1. Pedidos pagados > 7 días
  await db.query(`
    DELETE FROM detalle_pedido
    WHERE pedido_id IN (
      SELECT id FROM pedido
      WHERE estado = 'PAGADO'
        AND fecha_cierre < datetime('now', '-7 days')
    )
  `);

  await db.query(`
    DELETE FROM pedido
    WHERE estado = 'PAGADO'
      AND fecha_cierre < datetime('now', '-7 days')
  `);

  // 2. Sesiones cerradas > 30 días
  await db.query(`
    DELETE FROM sesion_caja
    WHERE estado = 'CERRADA'
      AND fecha_cierre < datetime('now', '-30 days')
  `);

  // 3. Pagos sincronizados > 30 días
  await db.query(`
    DELETE FROM pago
    WHERE sync_status = 'SINCRONIZADO'
      AND fecha_pago < datetime('now', '-30 days')
  `);

  // 4. Eventos procesados > 7 días
  await db.query(`
    DELETE FROM sync_event
    WHERE sync_status = 'PROCESADO'
      AND created_at < datetime('now', '-7 days')
  `);

  // 5. Vacuum para liberar espacio
  await db.query('VACUUM');

  console.log('✅ Limpieza de BD local completada');
}
```

### ⚠️ Reglas de Seguridad

```
NUNCA eliminar:
- Pagos con sync_status = 'PENDIENTE'
- Eventos con sync_status = 'PENDIENTE' o 'ERROR'
- Sesiones de caja abiertas
- Pedidos activos (estado != 'PAGADO' y != 'CANCELADO')
```

---

## 🔍 Consultas Optimizadas

### Índices Críticos para Performance

```sql
-- Índices para búsquedas frecuentes en dispositivo

-- Pedidos activos (consulta más frecuente)
CREATE INDEX idx_pedido_activos ON pedido(sucursal_id, estado)
WHERE estado NOT IN ('PAGADO', 'CANCELADO');

-- Productos disponibles
CREATE INDEX idx_producto_menu ON producto(sucursal_id, disponible, categoria_id)
WHERE disponible = 1 AND esta_activo = 1;

-- Sync pendiente
CREATE INDEX idx_sync_pendiente ON sync_event(sync_status, sync_priority, created_at)
WHERE sync_status = 'PENDIENTE';

-- Mesas ocupadas
CREATE INDEX idx_mesa_ocupadas ON mesa(sucursal_id, estado)
WHERE estado IN ('OCUPADA', 'RESERVADA');

-- Pagos pendientes de sync
CREATE INDEX idx_pago_pendiente ON pago(sync_status, sync_priority)
WHERE sync_status = 'PENDIENTE';
```

---

## 📦 Tamaño Final y Capacidades

### Capacidad Operativa

Con el modelo propuesto, un dispositivo puede operar **completamente offline** durante:

- ✅ **1 semana** sin problemas (operación normal)
- ⚠️ **1 mes** con limpieza manual (caso extremo)

### Límites Prácticos

| Escenario | Pedidos/Día | Días Offline | Tamaño BD | Estado |
|-----------|-------------|--------------|-----------|--------|
| Normal | 50 | 7 | ~2 MB | ✅ OK |
| Alto volumen | 150 | 7 | ~5 MB | ✅ OK |
| Extremo | 150 | 30 | ~20 MB | ⚠️ Requiere limpieza |

**Conclusión:** El modelo local es **ligero, rápido y resiliente** ✅

---

## 🎯 Checklist de Implementación

### Desarrollo
- [ ] Crear schema SQLite local (usar `schema-mvp-definitivo-sqlite.sql`)
- [ ] Implementar servicio de descarga inicial
- [ ] Implementar sincronización por intervalos
- [ ] Implementar WebSocket para push en tiempo real
- [ ] Implementar limpieza automática (garbage collection)
- [ ] Crear índices optimizados

### Testing
- [ ] Test: Descarga inicial < 10 segundos
- [ ] Test: Operación offline 7 días sin errores
- [ ] Test: Sincronización de 100 pedidos < 30 segundos
- [ ] Test: Limpieza automática no elimina datos críticos
- [ ] Test: Tamaño BD < 5 MB en operación normal

### Monitoreo
- [ ] Dashboard: Tamaño de BD por dispositivo
- [ ] Alerta: BD > 20 MB
- [ ] Alerta: Eventos pendientes > 500
- [ ] Alerta: Pagos pendientes > 50
- [ ] Métrica: Tiempo de sincronización promedio

---

## 📋 Resumen Ejecutivo

### ¿Qué logramos?

✅ **Base de datos local < 1 MB** (operación normal)
✅ **Sincronización inicial < 10 segundos**
✅ **Opera offline durante 1 semana** sin problemas
✅ **Limpieza automática** (no crece indefinidamente)
✅ **Optimizado para tablets/móviles**

### Tablas que SÍ se guardan localmente

1. ✅ Configuración: sucursal, dispositivo, empleado, zona, mesa
2. ✅ Catálogo: categoria, producto, estacion_cocina
3. ✅ Transaccionales: caja, sesion_caja, pedido, detalle_pedido, pago
4. ✅ Sincronización: sync_event

### Filtros aplicados

- 🟡 **Sucursal actual:** Solo datos de la sucursal donde opera
- 🔴 **Cache temporal:** Solo datos activos + historial reciente
- 🧹 **Limpieza automática:** Elimina datos antiguos ya sincronizados

---

**¡Modelo local completo y documentado!** 🚀

