# Plan de Implementación - Sistema TPV Hostelería SYSME

## Análisis de Estado Actual vs Requisitos

### ✅ Funcionalidades YA Implementadas

#### 1. Base de Datos SQL (Obligatorio)
- ✅ SQLite configurado con knex
- ✅ Sistema de migraciones implementado
- ✅ Tablas principales creadas:
  - users, categories, products, customers
  - restaurant_tables, sales, sale_items
  - kitchen_orders (KDS básico)
  - cash_sessions, cash_movements
  - z_reports (cierres de caja)
  - payment_methods

#### 2. Módulos Adicionales Existentes
- ✅ Sistema de modificadores de productos
- ✅ Pagos mixtos
- ✅ División de cuentas (split sales)
- ✅ Sistema de caja registradora
- ✅ Métodos de pago Chile (Efectivo, Tarjeta, Transferencia)
- ✅ Sistema de cocina básico (KDS)
- ✅ Ventas estacionadas (parked sales)
- ✅ Sistema de facturas
- ✅ Sistema de permisos
- ✅ Bodegas/almacenes
- ✅ Sistema de combos
- ✅ Niveles de precios (pricing tiers)
- ✅ Sistema de propinas
- ✅ Sistema de reservas
- ✅ Proveedores
- ✅ Sistema DTE (Documentos Tributarios Electrónicos)

#### 3. Backend API
- ✅ Express.js + Node.js
- ✅ WebSockets (Socket.io) configurado
- ✅ Sistema de autenticación
- ✅ Middleware de seguridad (helmet, cors, rate-limit)
- ✅ Sistema de logging avanzado

#### 4. Frontend Web
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS para diseño
- ✅ Zustand para state management
- ✅ React Query para data fetching
- ✅ Componentes UI básicos implementados

### ❌ Funcionalidades FALTANTES (Según Documento)

#### 1. **Arquitectura Híbrida Offline/Online** (CRÍTICO)
- ❌ Almacenamiento local en frontend (IndexedDB/LocalStorage)
- ❌ Sistema de sincronización automática
- ❌ Cola de sincronización de transacciones
- ❌ Detección de conectividad
- ❌ Manejo de conflictos de sincronización
- ❌ Campo `estado_sincronizacion` en tablas críticas

#### 2. **Plano de Sala Dinámico** (MVP)
- ⚠️ Vista básica de mesas existe pero falta:
  - ❌ Editor visual drag & drop para configurar mesas
  - ❌ Zonas configurables del restaurante
  - ❌ Estados visuales dinámicos de mesas
  - ❌ Posicionamiento libre de mesas en canvas
  - ❌ Guardado de layout personalizado

#### 3. **Telecomanda (Comandero Móvil)** (MVP)
- ❌ Interfaz móvil optimizada para camareros
- ❌ Navegación rápida por categorías
- ❌ Sistema de notas y modificadores intuitivo
- ❌ Autenticación con PIN rápido
- ❌ Modo offline completo
- ❌ Sincronización automática de comandas

#### 4. **Soporte Multi-Dispositivo** (Hasta 9 simultáneos)
- ⚠️ WebSockets configurado pero falta:
  - ❌ Gestión de sesiones por dispositivo
  - ❌ Sincronización en tiempo real entre dispositivos
  - ❌ Manejo de concurrencia (bloqueos optimistas)
  - ❌ Notificaciones push entre dispositivos
  - ❌ Monitor de dispositivos conectados

#### 5. **Flujo Transaccional Robusto** (MVP)
- ⚠️ Ventas básicas funcionan pero falta:
  - ❌ Registro offline de pedidos
  - ❌ Priorización de sincronización de pagos
  - ❌ Validación de integridad fiscal
  - ❌ Recuperación ante fallos
  - ❌ Logs de auditoría completos

#### 6. **KDS (Kitchen Display System) Mejorado** (Deseable)
- ⚠️ Sistema básico existe pero falta:
  - ❌ Vista por estación de cocina
  - ❌ Control de tiempos de preparación
  - ❌ Alertas de pedidos demorados
  - ❌ Priorización visual de órdenes
  - ❌ Feedback a sala cuando plato está listo

#### 7. **Dashboard de Reportes** (MVP)
- ⚠️ Reportes básicos existen pero falta:
  - ❌ Dashboard gerencial en tiempo real
  - ❌ Rendimiento por empleado
  - ❌ Análisis de ventas por período
  - ❌ Gráficos interactivos
  - ❌ Exportación de reportes (PDF/Excel)

---

## Plan de Desarrollo - Fase 1: Sala y Comanda (MVP)

### Semana 1: Configuración Híbrida Offline/Online

#### Tarea 1.1: Base de Datos Local (Frontend)
**Prioridad:** CRÍTICA
**Estimación:** 2 días

**Subtareas:**
1. Instalar Dexie.js (wrapper para IndexedDB)
2. Crear esquema local replicando tablas críticas:
   ```typescript
   // Tablas locales
   - productos (caché del catálogo)
   - mesas (estado actual)
   - pedidos (con campo sync_status)
   - detalle_pedido (ítems del pedido)
   - sincronizacion_queue (cola de sync)
   ```
3. Implementar servicio de gestión de DB local
4. Crear hooks React para acceso a datos locales

**Archivo:** `frontend/src/services/localdb.ts`

#### Tarea 1.2: Sistema de Sincronización
**Prioridad:** CRÍTICA
**Estimación:** 3 días

**Subtareas:**
1. Implementar detector de conectividad
2. Crear cola de sincronización FIFO
3. Desarrollar servicio de sincronización:
   - Envío de transacciones pendientes
   - Recepción de actualizaciones del servidor
   - Manejo de errores y reintentos
4. Priorizar sincronización de:
   - Pagos (fiscal crítico)
   - Pedidos completados
   - Cambios de estado de mesa

**Archivos:**
- `frontend/src/services/sync-service.ts`
- `frontend/src/hooks/useNetworkStatus.ts`
- `frontend/src/services/sync-queue.ts`

#### Tarea 1.3: Migración de Base de Datos Backend
**Prioridad:** ALTA
**Estimación:** 1 día

**Subtareas:**
1. Crear migración para agregar `sync_status` a tablas:
   ```sql
   ALTER TABLE sales ADD COLUMN sync_status VARCHAR(20) DEFAULT 'SYNCED';
   ALTER TABLE sales ADD COLUMN device_id VARCHAR(50);
   ALTER TABLE sales ADD COLUMN sync_timestamp DATETIME;
   ```
2. Agregar índices para optimizar sincronización
3. Actualizar API endpoints para soportar batch sync

**Archivo:** `backend/src/database/migrations/017_add_sync_support.sql`

---

### Semana 2: Plano de Sala Dinámico

#### Tarea 2.1: Editor de Plano de Sala (Backoffice)
**Prioridad:** ALTA
**Estimación:** 3 días

**Subtareas:**
1. Implementar canvas interactivo con Konva.js o Fabric.js
2. Funcionalidades:
   - Drag & drop de mesas
   - Redimensionar mesas
   - Definir zonas (colores de fondo)
   - Rotación de elementos
   - Guardar layout en JSON
3. API para persistir configuración:
   ```typescript
   POST /api/table-layout
   GET /api/table-layout
   ```

**Archivos:**
- `frontend/src/pages/backoffice/TableLayoutEditor.tsx`
- `backend/src/routes/table-layout.js`

#### Tarea 2.2: Vista Dinámica de Mesas (TPV Principal)
**Prioridad:** ALTA
**Estimación:** 2 días

**Subtareas:**
1. Renderizar layout desde configuración guardada
2. Estados visuales de mesas:
   - Verde: Libre
   - Rojo: Ocupada/Pedido pendiente
   - Amarillo: Pedido listo
   - Azul: Reservada
   - Gris: Mantenimiento
3. Click en mesa abre detalle de pedido
4. Actualización en tiempo real vía WebSocket

**Archivo:** `frontend/src/pages/mesas/MesasPageDynamic.tsx`

---

### Semana 3: Telecomanda (Comandero Móvil)

#### Tarea 3.1: Interfaz Móvil de Comandero
**Prioridad:** CRÍTICA (MVP)
**Estimación:** 4 días

**Subtareas:**
1. Crear layout responsivo mobile-first
2. Autenticación con PIN de 4 dígitos
3. Selección de mesa al inicio
4. Navegación del menú:
   - Grid de categorías con iconos
   - Lista de productos por categoría
   - Búsqueda rápida
   - Favoritos/más vendidos
5. Carrito de pedido flotante
6. Personalización de ítems:
   - Modificadores (sin queso, extra bacon)
   - Notas especiales (texto libre)
   - Cantidad con botones +/-
7. Confirmación y envío a cocina
8. Feedback visual de sincronización

**Archivos:**
- `frontend/src/pages/mobile/ComanderoMobile.tsx`
- `frontend/src/components/mobile/PinAuth.tsx`
- `frontend/src/components/mobile/ProductCatalog.tsx`
- `frontend/src/components/mobile/OrderCart.tsx`

#### Tarea 3.2: Registro de Pedido Offline
**Prioridad:** CRÍTICA
**Estimación:** 2 días

**Subtareas:**
1. Validar datos del pedido antes de guardar
2. Guardar en IndexedDB con `sync_status: 'PENDIENTE'`
3. Generar ID temporal (UUID)
4. Agregar a cola de sincronización
5. Mostrar indicador visual de pedidos no sincronizados
6. Auto-sync cuando recupere conexión

**Archivo:** `frontend/src/services/order-service.ts`

---

### Semana 4: Flujo Transaccional y Cierre de Mesa

#### Tarea 4.1: Cálculo de Cuenta en Tiempo Real
**Prioridad:** ALTA
**Estimación:** 1 día

**Subtareas:**
1. Hook para calcular total del pedido:
   ```typescript
   useOrderTotal(orderItems) => {
     subtotal,
     iva,
     descuentos,
     total
   }
   ```
2. Actualizar en tiempo real al modificar items
3. Aplicar descuentos y promociones

**Archivo:** `frontend/src/hooks/useOrderCalculation.ts`

#### Tarea 4.2: División y Fusión de Cuentas
**Prioridad:** MEDIA
**Estimación:** 2 días

**Subtareas:**
1. Mejorar modal de división de cuenta existente:
   - División por comensal
   - División por ítem
   - División personalizada (montos)
2. Implementar fusión de mesas:
   - Seleccionar múltiples mesas
   - Combinar pedidos
   - Mantener historial
3. API endpoints:
   ```
   POST /api/orders/:id/split
   POST /api/orders/merge
   ```

**Archivos:**
- `frontend/src/components/pos/SplitBillModalV2.tsx`
- `backend/src/routes/orders.js`

#### Tarea 4.3: Registro de Pago Offline
**Prioridad:** CRÍTICA
**Estimación:** 2 días

**Subtareas:**
1. Modal de pago con métodos:
   - Efectivo (calcular cambio)
   - Tarjeta
   - Transferencia
   - Mixto
2. Validación de montos
3. Guardar pago localmente con máxima prioridad de sync
4. Actualizar estado mesa a "Pagada"
5. Generar pre-boleta offline
6. Sincronización prioritaria de pagos
7. Cumplimiento fiscal (validar que no se pierdan pagos)

**Archivos:**
- `frontend/src/components/pos/PaymentModal.tsx`
- `frontend/src/services/payment-service.ts`

---

## Plan de Desarrollo - Fase 2: Backoffice y Reportes

### Semana 5: Dashboard de Reportes

#### Tarea 5.1: Dashboard Gerencial
**Prioridad:** ALTA
**Estimación:** 3 días

**Subtareas:**
1. Página de dashboard con métricas clave:
   - Ventas del día (tiempo real)
   - Ticket promedio
   - Mesas ocupadas/disponibles
   - Productos más vendidos
   - Rendimiento por empleado
2. Gráficos con Recharts:
   - Ventas por hora
   - Ventas por categoría
   - Comparativa períodos
3. Filtros por fecha y sucursal
4. Auto-refresh cada 30 segundos

**Archivo:** `frontend/src/pages/reports/ManagerDashboard.tsx`

#### Tarea 5.2: Reportes Detallados
**Prioridad:** MEDIA
**Estimación:** 2 días

**Subtareas:**
1. Reporte de ventas por empleado
2. Reporte de cierres de caja
3. Reporte de productos (stock, rotación)
4. Exportación a Excel (xlsx)
5. Exportación a PDF (jspdf)
6. Programar reportes automáticos

**Archivos:**
- `frontend/src/pages/reports/SalesReports.tsx`
- `frontend/src/services/export-service.ts`

---

## Plan de Desarrollo - Fase 3: KDS Mejorado (Deseable)

### Semana 6: Kitchen Display System

#### Tarea 6.1: Vista por Estación de Cocina
**Prioridad:** MEDIA
**Estimación:** 3 días

**Subtareas:**
1. Configuración de estaciones:
   - Cocina Caliente
   - Cocina Fría
   - Parrilla
   - Barra
   - Repostería
2. Asignar productos a estaciones
3. Vista KDS filtrada por estación
4. Mostrar solo pedidos de la estación actual
5. Orden por hora de ingreso y prioridad

**Archivos:**
- `frontend/src/pages/cocina/KDSByStation.tsx`
- `backend/src/database/migrations/018_add_kitchen_stations.sql`

#### Tarea 6.2: Control de Tiempos
**Prioridad:** MEDIA
**Estimación:** 2 días

**Subtareas:**
1. Timer visual por pedido
2. Alertas de tiempo:
   - Amarillo: 75% tiempo transcurrido
   - Rojo: Tiempo excedido
3. Estadísticas de tiempo de preparación
4. Notificar a sala cuando plato está listo
5. Audio de alerta configurable

**Archivos:**
- `frontend/src/components/cocina/OrderTimer.tsx`
- `frontend/src/hooks/useKitchenAlerts.ts`

---

## Plan de Desarrollo - Fase 4: Multi-Dispositivo

### Semana 7: Sincronización Multi-Dispositivo

#### Tarea 7.1: Gestión de Sesiones por Dispositivo
**Prioridad:** ALTA
**Estimación:** 2 días

**Subtareas:**
1. Registrar dispositivos al conectar:
   ```typescript
   {
     deviceId: UUID,
     deviceType: 'POS' | 'MOBILE' | 'KDS',
     userId: number,
     connectedAt: timestamp
   }
   ```
2. Monitor de dispositivos conectados (admin)
3. Limitar a 9 dispositivos simultáneos
4. Desconectar dispositivos inactivos

**Archivos:**
- `backend/src/services/device-manager.js`
- `frontend/src/pages/admin/DevicesMonitor.tsx`

#### Tarea 7.2: Sincronización en Tiempo Real
**Prioridad:** CRÍTICA
**Estimación:** 3 días

**Subtareas:**
1. Eventos WebSocket a implementar:
   ```typescript
   // Eventos de mesa
   'table:status_changed'
   'table:order_added'
   'table:order_updated'

   // Eventos de pedido
   'order:created'
   'order:updated'
   'order:completed'
   'order:paid'

   // Eventos de cocina
   'kitchen:order_ready'
   'kitchen:status_changed'
   ```
2. Broadcast a todos los dispositivos
3. Actualización optimista de UI
4. Manejo de conflictos (last-write-wins)

**Archivos:**
- `backend/src/websockets/multi-device-sync.js`
- `frontend/src/services/realtime-service.ts`

---

## Arquitectura Técnica Detallada

### Stack Tecnológico

#### Backend
- **Node.js 18+** + **Express.js**
- **SQLite** (desarrollo) / **PostgreSQL** (producción recomendado)
- **Socket.io** para WebSockets
- **Knex.js** como query builder
- **JWT** para autenticación
- **Winston** para logging

#### Frontend Web (TPV Principal)
- **React 18** + **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **Zustand** para state management
- **React Query** para data fetching
- **Dexie.js** para IndexedDB
- **Recharts** para gráficos
- **Socket.io-client** para WebSockets

#### Frontend Mobile (Telecomanda)
- **React** + **TypeScript** (Progressive Web App)
- **Tailwind CSS** (mobile-first)
- **Dexie.js** para almacenamiento offline
- **Service Worker** para PWA

### Modelo de Datos - Extensiones Necesarias

#### Tabla: `sync_queue` (Nueva)
```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'order', 'payment', 'table'
  entity_id VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  payload TEXT NOT NULL, -- JSON
  priority INTEGER DEFAULT 5, -- 1=max, 10=min (pagos=1)
  retry_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SYNCING', 'SYNCED', 'FAILED'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME
);
```

#### Tabla: `devices` (Nueva)
```sql
CREATE TABLE devices (
  id VARCHAR(50) PRIMARY KEY, -- UUID
  device_type VARCHAR(20) NOT NULL, -- 'POS', 'MOBILE', 'KDS'
  user_id INTEGER NOT NULL,
  device_name VARCHAR(100),
  last_sync DATETIME,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'blocked'
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  disconnected_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Tabla: `table_layouts` (Nueva)
```sql
CREATE TABLE table_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER DEFAULT 1,
  layout_data TEXT NOT NULL, -- JSON con posiciones
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Extensiones a Tablas Existentes

**`sales`:**
```sql
ALTER TABLE sales ADD COLUMN sync_status VARCHAR(20) DEFAULT 'SYNCED';
ALTER TABLE sales ADD COLUMN device_id VARCHAR(50);
ALTER TABLE sales ADD COLUMN sync_timestamp DATETIME;
ALTER TABLE sales ADD COLUMN offline_created BOOLEAN DEFAULT 0;
```

**`restaurant_tables`:**
```sql
ALTER TABLE restaurant_tables ADD COLUMN position_x DECIMAL(8,2);
ALTER TABLE restaurant_tables ADD COLUMN position_y DECIMAL(8,2);
ALTER TABLE restaurant_tables ADD COLUMN width DECIMAL(8,2) DEFAULT 100;
ALTER TABLE restaurant_tables ADD COLUMN height DECIMAL(8,2) DEFAULT 100;
ALTER TABLE restaurant_tables ADD COLUMN zone_id INTEGER;
ALTER TABLE restaurant_tables ADD COLUMN rotation INTEGER DEFAULT 0;
```

**`kitchen_orders`:**
```sql
ALTER TABLE kitchen_orders ADD COLUMN station_id INTEGER;
ALTER TABLE kitchen_orders ADD COLUMN estimated_time INTEGER; -- minutos
ALTER TABLE kitchen_orders ADD COLUMN actual_time INTEGER;
```

**Tabla: `kitchen_stations` (Nueva):**
```sql
CREATE TABLE kitchen_stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL, -- 'Cocina Caliente', 'Barra', etc.
  code VARCHAR(20) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Criterios de Éxito - Fase 1 (MVP)

### Funcionalidad Offline/Online
- ✅ Comandero puede registrar pedidos sin conexión
- ✅ Pedidos offline se sincronizan automáticamente al reconectar
- ✅ Pagos se sincronizan con prioridad máxima
- ✅ Indicador visual de estado de sincronización
- ✅ No se pierden transacciones ante caídas de red

### Gestión de Sala
- ✅ Jefe de sala puede configurar layout de mesas visualmente
- ✅ TPV principal muestra mesas con estados en tiempo real
- ✅ Click en mesa abre detalle de pedido
- ✅ Estados de mesa se actualizan automáticamente

### Telecomanda
- ✅ Camarero puede autenticarse con PIN en < 5 segundos
- ✅ Navegación del menú es rápida e intuitiva
- ✅ Agregar modificadores y notas es fácil
- ✅ Pedido se envía a cocina en < 3 clicks desde confirmar
- ✅ Funciona sin conexión a internet

### Multi-Dispositivo
- ✅ Soporta hasta 9 dispositivos simultáneos
- ✅ Cambios en una mesa se reflejan en todos los dispositivos
- ✅ No hay conflictos al trabajar múltiples camareros
- ✅ Admin puede ver dispositivos conectados

### Reportes
- ✅ Dashboard muestra ventas del día en tiempo real
- ✅ Reporte de rendimiento por empleado
- ✅ Reporte de cierre de caja con detalle de pagos
- ✅ Exportación a Excel funcional

---

## Estimaciones de Tiempo

| Fase | Duración | Prioridad |
|------|----------|-----------|
| **Fase 1: Sala y Comanda (MVP)** | 4 semanas | CRÍTICA |
| - Semana 1: Offline/Online | 6 días | CRÍTICA |
| - Semana 2: Plano de Sala | 5 días | ALTA |
| - Semana 3: Telecomanda | 6 días | CRÍTICA |
| - Semana 4: Flujo Transaccional | 5 días | ALTA |
| **Fase 2: Backoffice y Reportes** | 1 semana | ALTA |
| **Fase 3: KDS Mejorado** | 1 semana | MEDIA |
| **Fase 4: Multi-Dispositivo** | 1 semana | ALTA |
| **Testing y Ajustes** | 1 semana | CRÍTICA |
| **TOTAL** | **8 semanas** | |

---

## Riesgos y Mitigaciones

### Riesgo 1: Pérdida de Datos Offline
**Probabilidad:** MEDIA
**Impacto:** CRÍTICO
**Mitigación:**
- Implementar persistencia local robusta (IndexedDB)
- Sistema de cola con reintentos automáticos
- Logs de auditoría de todas las transacciones
- Backup local diario automático

### Riesgo 2: Conflictos de Sincronización
**Probabilidad:** ALTA
**Impacto:** MEDIO
**Mitigación:**
- Implementar timestamps en todos los registros
- Política last-write-wins para conflictos
- Bloqueos optimistas en mesas (un camarero a la vez)
- Notificaciones de conflictos al usuario

### Riesgo 3: Rendimiento con 9 Dispositivos
**Probabilidad:** MEDIA
**Impacto:** ALTO
**Mitigación:**
- Optimizar queries SQL con índices apropiados
- Limitar broadcast WebSocket solo a eventos relevantes
- Implementar throttling en actualizaciones UI
- Monitorear performance con métricas

### Riesgo 4: Cumplimiento Fiscal
**Probabilidad:** BAJA
**Impacto:** CRÍTICO
**Mitigación:**
- Priorizar sincronización de pagos por sobre todo
- Validar integridad de datos antes de enviar al SII
- No permitir modificar/eliminar ventas pagadas
- Logs de auditoría inmutables
- Backup automático de transacciones fiscales

---

## Próximos Pasos Inmediatos

1. **Aprobación del Plan** ✋
   - Revisar y validar este plan de implementación
   - Ajustar prioridades según necesidades del negocio
   - Confirmar stack tecnológico

2. **Setup Inicial** (Día 1)
   - Crear ramas de desarrollo por fase
   - Configurar entorno de desarrollo
   - Instalar dependencias necesarias:
     - Dexie.js (IndexedDB)
     - Konva.js (editor de plano)
     - Recharts (gráficos)

3. **Comenzar Fase 1 - Tarea 1.1** (Día 2)
   - Implementar base de datos local con Dexie.js
   - Crear esquema replicado
   - Desarrollar servicios de acceso a datos

---

## Notas Técnicas

### IndexedDB vs LocalStorage
**Decisión:** IndexedDB (vía Dexie.js)
**Razones:**
- Soporta transacciones ACID
- No tiene límite de 5MB (puede almacenar GBs)
- APIs asíncronas (no bloquea UI)
- Soporta índices para búsquedas rápidas
- Mejor para datos estructurados

### PWA vs App Nativa
**Decisión:** Progressive Web App (PWA)
**Razones:**
- Single codebase para web y móvil
- No requiere publicación en stores
- Actualizaciones instantáneas
- Service Workers para offline
- Más rápido de desarrollar
- Compatible con Android y iOS

### SQLite vs PostgreSQL
**Recomendación:** Migrar a PostgreSQL en producción
**Razones:**
- SQLite OK para desarrollo y testing
- PostgreSQL necesario para:
  - Concurrencia real (9 dispositivos)
  - Transacciones robustas
  - Mejor rendimiento con múltiples escrituras
  - JSON fields nativos
  - Full-text search

---

## Conclusión

Este plan de implementación cubre todos los requisitos del documento TPV de Hostelería:

✅ **Arquitectura Híbrida de 3 Capas** con persistencia offline
✅ **Módulos Críticos MVP**: Sala, Comanda, Reportes
✅ **KDS Mejorado** (módulo deseable)
✅ **Soporte hasta 9 dispositivos** simultáneos
✅ **Base de datos SQL** con integridad transaccional

El proyecto ya tiene una base sólida implementada. Este plan se enfoca en:
1. Agregar capacidad **offline/online** (la brecha más crítica)
2. Mejorar UX de **plano de sala** y **telecomanda**
3. Fortalecer **sincronización multi-dispositivo**
4. Optimizar **reportes gerenciales**

Con una ejecución disciplinada de **8 semanas**, tendrás un TPV de hostelería completo, robusto y listo para manejar operaciones de cadena mediana/grande.

---

**¿Listo para comenzar? 🚀**
