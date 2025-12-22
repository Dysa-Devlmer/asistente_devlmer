# Análisis de Integración SYSME_MISTURA

## 📋 Resumen Ejecutivo

Este documento analiza el repositorio `Soyelijah/SYSME_MISTURA` (sistema POS original en PHP) y propone un plan para replicar su interfaz y funcionalidad en el nuevo stack moderno (React + Node.js + PostgreSQL).

---

## 🔍 Análisis del Repositorio Original

### Metadata del Repositorio
- **Repositorio**: Soyelijah/SYSME_MISTURA
- **Lenguaje**: PHP (legacy)
- **Stack Tecnológico**: XAMPP, MySQL, jQuery, PHP sessions
- **Tamaño**: ~48 MB
- **Última actualización**: 10 de diciembre 2025
- **Estructura**: Sistema monolítico PHP con separación de concerns limitada

### Arquitectura del Sistema Legacy

```
SGC/xampp/htdocs/pos/pos/  (POS principal)
├── index.php              # Entry point, configuración de sesión
├── conn.php               # Conexión MySQL
├── menu.php               # Menú principal del empleado
├── mapa-mesas.php         # Mapa visual de mesas (interfaz táctil)
├── venta.php              # Interfaz de pedidos/venta
├── abiertas.php           # Lista de ventas abiertas
├── panel.php              # Panel de cocina
├── panelcocina.php        # Panel de cocina ampliado
├── finaliza_venta.php     # Proceso de pago y cierre
├── login.php              # Autenticación de empleados
├── form-login.php         # Formulario de login
├── categorias.php         # Selector de categorías
├── productos.php          # Selector de productos
├── sub_categorias.php     # Sub-categorías
├── add_producto.php       # Agregar producto a venta
├── lineas_venta.php       # Líneas de la venta actual
├── operaciones_venta.php  # Operaciones sobre venta
├── opciones_venta.php     # Opciones de venta (cambiar mesa, etc.)
├── aparcarventa.php       # Aparcar/pausar venta
├── bproductos.php         # Búsqueda de productos
├── marcar_servido.php     # Marcar items como servidos
├── mobile.php             # Vista móvil
├── css/estilo.css         # Estilos principales
├── js/jquery.js           # jQuery
├── js/cargomedia.js       # Funciones de carga dinámica
├── images/                # Assets visuales
└── venta/
    ├── borralinea.php     # Eliminar línea de venta
    ├── cancelaventa.php   # Cancelar venta
    └── finalizaventa.php  # Finalizar venta
```

---

## 🎯 Componentes Clave Identificados

### 1. **Sistema de Sesiones y Autenticación**
- **Login de empleados** (camareros)
- Configuración desde archivo INI (`sysmetpv.ini`)
- Variables de sesión PHP:
  - `id_camarero`, `almacen`, `tpv`, `idioma`, `hosteleria`
  - `anchotpv`, `altotpv` (dimensiones para cálculos de mapa)
  - `id_caja`, `id_almacen`, `moneda`

### 2. **Interfaz de Mapa de Mesas** (`mapa-mesas.php`)
- **Representación visual táctil** de mesas en salón
- Posicionamiento absoluto basado en coordenadas (`top`, `left`, `width`, `height`)
- Escalado responsivo según `anchotpv`
- Estados de mesa:
  - **Vacía**: botón verde (`botonmesa`)
  - **Ocupada**: botón naranja (`botonmesa2`) con `id_venta` asociado
- Al tocar mesa vacía → abre nueva venta
- Al tocar mesa ocupada → abre venta existente

### 3. **Interfaz de Venta/Pedido** (`venta.php`)
- **Selector de categorías** → sub-categorías → productos
- **Carrito de pedido** (líneas de venta)
- Operaciones:
  - Agregar productos con cantidad
  - Modificar líneas (cantidad, precio, observaciones)
  - Eliminar líneas
  - Cambiar mesa
  - Cambiar tarifa (pricing)
  - Aparcar venta (guardar sin finalizar)
  - Marcar items como servidos
  - Agregar observaciones generales
- **Cálculo automático** de subtotal, IVA, total
- Soporte para **complementos** y **combos**

### 4. **Panel de Cocina** (`panel.php`, `panelcocina.php`)
- Vista en tiempo real de pedidos pendientes
- Listado por mesa/venta
- Indicador de items NO servidos
- Botón para marcar como servido

### 5. **Proceso de Finalización** (`finaliza_venta.php`)
- Selección de forma de pago (efectivo, tarjeta, mixto)
- Cálculo de cambio
- Generación de factura/ticket
- Cierre de sesión de mesa
- Actualización de stock (si aplica)

### 6. **Sistema de Tarifas**
- Tarifas por mesa (mesa VIP, terraza, etc.)
- Override de precios según tarifa
- Recalculo automático al cambiar mesa

### 7. **Internacionalización**
- Archivos de idioma: `es.php`, `en.php`, `nl.php`
- Variables tipo `$txtappname`, `$txtemployee`, etc.

---

## 🏗️ Arquitectura Actual del Proyecto (Estado Post-Migraciones)

```
D:\pos_venta/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── sessions.ts      # Sesiones de caja
│   │   │   ├── sales.ts         # Ventas
│   │   │   ├── products.ts      # Productos
│   │   │   ├── categories.ts    # Categorías
│   │   │   ├── tables.ts        # Mesas
│   │   │   └── employees.ts     # Empleados/camareros
│   │   ├── database.ts          # Cliente PostgreSQL
│   │   └── server.ts            # Express server
│   └── package.json
├── dashboard-web/               # Frontend React actual
│   ├── src/
│   │   ├── components/
│   │   │   ├── pos/             # Componentes POS actuales (básicos)
│   │   │   └── jarvis/          # JARVIS modal
│   │   ├── pages/
│   │   │   ├── POS.tsx          # Página POS principal
│   │   │   └── ...
│   │   └── App.tsx
│   └── package.json
├── runtime/
│   ├── postgres/                # PostgreSQL embebido
│   ├── data/
│   └── logs/
└── scripts/
    ├── start-pos.bat            # Inicia todo el stack
    └── stop-pos.bat             # Detiene todo
```

### Base de Datos PostgreSQL (migrada)
- Tablas principales:
  - `apcajas` (sesiones de caja)
  - `ventadirecta` (ventas/pedidos)
  - `ventadir_comg` (líneas de venta)
  - `mesa` (mesas con coordenadas)
  - `complementog` (productos)
  - `categorias`, `subcategorias`
  - `camareros` (empleados)
  - `tarifa`, `comg_tarifa` (precios por tarifa)

---

## 🎨 Plan de Integración: MISTURA → React/Node.js

### Fase 1: Componentes React Básicos (Semana 1)

#### 1.1 Componente `TableMap.tsx`
```tsx
// Mapa visual de mesas con estado en tiempo real
- Renderiza mesas desde DB con posiciones absolutas
- Escalado responsivo según viewport
- Indicadores de estado (vacía, ocupada, reservada)
- onClick → abrir venta existente o crear nueva
```

#### 1.2 Componente `SaleView.tsx`
```tsx
// Vista principal de pedido/venta
- Selector de categorías/productos (grid táctil)
- Carrito de líneas de venta
- Operaciones: agregar, editar, eliminar líneas
- Footer con total y botones de acción
```

#### 1.3 Componente `CategoryGrid.tsx`
```tsx
// Grid de categorías estilo touch
- Botones grandes con imágenes
- Navegación: categorías → subcategorías → productos
- Breadcrumb para volver atrás
```

#### 1.4 Componente `ProductGrid.tsx`
```tsx
// Grid de productos estilo touch
- Cards de producto con imagen, nombre, precio
- Modal de cantidad y observaciones
- Agregar al carrito con animación
```

#### 1.5 Componente `CartPanel.tsx`
```tsx
// Panel de líneas de venta
- Lista de items con cantidad, precio, total
- Botones para editar cantidad, eliminar
- Subtotal, IVA, total general
```

#### 1.6 Componente `KitchenPanel.tsx`
```tsx
// Panel de cocina
- Listado de pedidos pendientes por mesa
- Checkbox para marcar servido
- Auto-refresh cada 10s
```

#### 1.7 Componente `CheckoutModal.tsx`
```tsx
// Modal de finalización de venta
- Formas de pago (efectivo, tarjeta, mixto)
- Cálculo de cambio
- Botón de imprimir ticket
- Cierre de venta
```

### Fase 2: Backend API Endpoints (Semana 1-2)

#### Endpoints necesarios:

```typescript
// Mesas
GET    /api/tables                    # Lista de mesas con estado
GET    /api/tables/:id                # Detalle de mesa
PATCH  /api/tables/:id/status         # Actualizar estado

// Ventas
GET    /api/sales                     # Ventas abiertas
POST   /api/sales                     # Crear nueva venta
GET    /api/sales/:id                 # Detalle de venta
PATCH  /api/sales/:id                 # Actualizar venta (cambiar mesa, tarifa)
POST   /api/sales/:id/finalize        # Finalizar venta
POST   /api/sales/:id/park            # Aparcar venta
DELETE /api/sales/:id                 # Cancelar venta

// Líneas de venta
POST   /api/sales/:id/lines           # Agregar línea
PATCH  /api/sales/:id/lines/:lineId   # Actualizar línea
DELETE /api/sales/:id/lines/:lineId   # Eliminar línea
PATCH  /api/sales/:id/lines/:lineId/served  # Marcar servido

// Productos
GET    /api/products                  # Productos con filtros
GET    /api/products/:id              # Detalle de producto
GET    /api/categories                # Categorías con jerarquía
GET    /api/categories/:id/products   # Productos de categoría

// Tarifas
GET    /api/rates                     # Lista de tarifas
GET    /api/rates/:id/prices          # Precios por tarifa

// Cocina
GET    /api/kitchen/pending           # Pedidos pendientes de servir
```

### Fase 3: Estado Global y Lógica de Negocio (Semana 2)

#### Context API / Zustand para:
- Estado de venta actual
- Carrito de líneas
- Usuario logueado (camarero)
- Configuración de sesión (caja, almacén, idioma)

#### Lógica de negocio:
- Cálculo de precios según tarifa
- Recalculo de IVA y totales
- Validaciones de stock (opcional)
- Generación de ticket/factura

### Fase 4: Estilos y UX (Semana 2-3)

#### Migración de estilos CSS → TailwindCSS:
```css
.botonmesa   → bg-green-500 active:scale-95 transition
.botonmesa2  → bg-orange-500 animate-pulse
.botonpro    → bg-yellow-100 hover:bg-yellow-200
```

#### Componentes de UI reutilizables:
- `Button.tsx` (táctil, grande)
- `Card.tsx` (producto, mesa)
- `Modal.tsx` (genérico)
- `NumericKeypad.tsx` (para cantidad, precio)

### Fase 5: Características Avanzadas (Semana 3-4)

#### WebSocket para tiempo real:
- Actualización automática de mesas ocupadas
- Notificaciones de cocina
- Sincronización multi-dispositivo

#### Impresión de Tickets:
- Integración con impresora térmica (ESC/POS)
- Generación de PDF como fallback

#### Modo Offline:
- Service Worker para caché
- Queue de operaciones pendientes
- Sincronización al recuperar conexión

---

## 📦 Estructura de Archivos Propuesta

```
dashboard-web/src/
├── components/
│   ├── pos/
│   │   ├── TableMap/
│   │   │   ├── TableMap.tsx
│   │   │   ├── TableButton.tsx
│   │   │   └── TableMap.module.css
│   │   ├── SaleView/
│   │   │   ├── SaleView.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CartPanel.tsx
│   │   │   └── SaleView.module.css
│   │   ├── KitchenPanel/
│   │   │   ├── KitchenPanel.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   └── KitchenPanel.module.css
│   │   ├── Checkout/
│   │   │   ├── CheckoutModal.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── Checkout.module.css
│   │   └── common/
│   │       ├── NumericKeypad.tsx
│   │       ├── TouchButton.tsx
│   │       └── POSCard.tsx
│   └── jarvis/                # Mantener como modal
│       └── JarvisModal.tsx
├── pages/
│   ├── POSMain.tsx            # Reemplaza POS.tsx
│   ├── POSLogin.tsx           # Login de empleados
│   ├── POSMenu.tsx            # Menú principal
│   ├── POSKitchen.tsx         # Panel de cocina
│   └── POSAdmin.tsx           # Configuración
├── hooks/
│   ├── useSale.ts             # Hook para venta actual
│   ├── useTables.ts           # Hook para mesas
│   ├── useProducts.ts         # Hook para productos
│   └── useKitchen.ts          # Hook para cocina
├── store/
│   ├── saleStore.ts           # Zustand store para ventas
│   ├── authStore.ts           # Zustand store para auth
│   └── configStore.ts         # Configuración de sesión
├── services/
│   ├── api/
│   │   ├── sales.ts
│   │   ├── tables.ts
│   │   ├── products.ts
│   │   └── employees.ts
│   └── printer.ts             # Servicio de impresión
└── types/
    ├── sale.ts
    ├── product.ts
    ├── table.ts
    └── employee.ts
```

---

## 🔌 Endpoints Backend a Implementar

### `backend/src/routes/sales.ts` (expandir)

```typescript
import { Router } from 'express';
import { pool } from '../database';

const router = Router();

// Crear nueva venta
router.post('/', async (req, res) => {
  const { mesa, id_camarero, id_caja } = req.body;

  // 1. Obtener tarifa de la mesa
  const tarifaResult = await pool.query(
    'SELECT id_tarifa, nombre FROM tarifa WHERE id_tarifa IN (SELECT id_tarifa FROM mesa WHERE "Num_Mesa" = $1)',
    [mesa]
  );
  const tarifa = tarifaResult.rows[0]?.nombre || 'Default';

  // 2. Insertar venta
  const result = await pool.query(
    `INSERT INTO ventadirecta
     ("Num_Mesa", id_camarero, id_caja, cerrada, tarifa, fecha_venta)
     VALUES ($1, $2, $3, 'N', $4, NOW())
     RETURNING id_venta`,
    [mesa, id_camarero, id_caja, tarifa]
  );

  res.json({ id_venta: result.rows[0].id_venta });
});

// Agregar línea de venta
router.post('/:id/lines', async (req, res) => {
  const { id_venta } = req.params;
  const { id_complementog, cantidad, observaciones } = req.body;

  // 1. Obtener precio según tarifa de la venta
  const ventaResult = await pool.query(
    'SELECT tarifa FROM ventadirecta WHERE id_venta = $1',
    [id_venta]
  );
  const tarifa = ventaResult.rows[0].tarifa;

  // 2. Buscar precio en comg_tarifa o usar PVP default
  const precioResult = await pool.query(
    `SELECT COALESCE(
       (SELECT pvptarifa FROM comg_tarifa WHERE id_complementog = $1 AND id_tarifa = (SELECT id_tarifa FROM tarifa WHERE nombre = $2)),
       (SELECT pvp FROM complementog WHERE id_complementog = $1)
     ) as pvp`,
    [id_complementog, tarifa]
  );
  const pvp = precioResult.rows[0].pvp;

  // 3. Obtener IVA del producto
  const ivaResult = await pool.query(
    'SELECT avgiva FROM complementog WHERE id_complementog = $1',
    [id_complementog]
  );
  const avgiva = ivaResult.rows[0].avgiva;

  // 4. Calcular precio sin IVA
  const precio = pvp / (1 + (avgiva / 100));
  const total = pvp * cantidad;

  // 5. Insertar línea
  const result = await pool.query(
    `INSERT INTO ventadir_comg
     (id_venta, id_complementog, cantidad, precio, total, avgiva, servido, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6, 'N', $7)
     RETURNING id_linea`,
    [id_venta, id_complementog, cantidad, precio, total, avgiva, observaciones]
  );

  res.json({ id_linea: result.rows[0].id_linea });
});

// Finalizar venta
router.post('/:id/finalize', async (req, res) => {
  const { id_venta } = req.params;
  const { forma_pago, importe_pagado } = req.body;

  // 1. Calcular total de la venta
  const totalResult = await pool.query(
    'SELECT SUM(total) as total FROM ventadir_comg WHERE id_venta = $1',
    [id_venta]
  );
  const total = totalResult.rows[0].total;

  // 2. Cerrar venta
  await pool.query(
    `UPDATE ventadirecta
     SET cerrada = 'S', fecha_cierre = NOW(), total = $1, forma_pago = $2, importe_pagado = $3
     WHERE id_venta = $4`,
    [total, forma_pago, importe_pagado, id_venta]
  );

  // 3. Liberar mesa
  await pool.query(
    'UPDATE mesa SET estado = \'libre\' WHERE "Num_Mesa" = (SELECT "Num_Mesa" FROM ventadirecta WHERE id_venta = $1)',
    [id_venta]
  );

  res.json({ success: true, total, cambio: importe_pagado - total });
});

export default router;
```

---

## 🎯 Tareas Prioritarias (Siguiente Sprint)

### ✅ Completadas
1. ✅ Migración de datos legacy
2. ✅ Configuración de runtime embebido
3. ✅ Scripts de arranque/parada
4. ✅ UI básica de POS
5. ✅ JARVIS relegado a modal

### 🔨 En Progreso
6. 🔨 Análisis de repositorio SYSME_MISTURA

### 📋 Pendientes (Próximos Pasos)
7. **Crear componente `TableMap`** con renderizado de mesas desde DB
8. **Implementar endpoint `GET /api/tables`** con estado en tiempo real
9. **Crear componente `SaleView`** con selector de productos
10. **Implementar endpoints de ventas** (crear, agregar líneas, finalizar)
11. **Migrar estilos CSS** de MISTURA a TailwindCSS
12. **Configurar estado global** con Zustand
13. **Integrar WebSocket** para actualizaciones en tiempo real
14. **Probar flujo completo**: login → mapa → venta → pago → ticket

---

## 📊 Estimación de Esfuerzo

| Fase | Componentes | Backend | Testing | Total |
|------|-------------|---------|---------|-------|
| 1. Componentes Básicos | 40h | - | 8h | 48h |
| 2. Backend API | - | 32h | 8h | 40h |
| 3. Estado Global | 16h | - | 4h | 20h |
| 4. Estilos y UX | 24h | - | 4h | 28h |
| 5. Features Avanzadas | 16h | 16h | 8h | 40h |
| **TOTAL** | **96h** | **48h** | **32h** | **176h** |

**Estimación**: ~4-5 semanas con 1 desarrollador full-time

---

## 🚀 Quick Start para Desarrolladores

### 1. Clonar archivos de referencia desde MISTURA (lectura, NO modificar repo)

```bash
# Descargar archivos PHP como referencia
mkdir -p docs/mistura-reference
cd docs/mistura-reference

# Usar gh CLI para descargar archivos clave
gh api repos/Soyelijah/SYSME_MISTURA/contents/SGC/xampp/htdocs/pos/pos/index.php --jq '.content' | base64 -d > index.php
gh api repos/Soyelijah/SYSME_MISTURA/contents/SGC/xampp/htdocs/pos/pos/mapa-mesas.php --jq '.content' | base64 -d > mapa-mesas.php
gh api repos/Soyelijah/SYSME_MISTURA/contents/SGC/xampp/htdocs/pos/pos/venta.php --jq '.content' | base64 -d > venta.php
gh api repos/Soyelijah/SYSME_MISTURA/contents/SGC/xampp/htdocs/pos/pos/css/estilo.css --jq '.content' | base64 -d > estilo.css
# ... etc
```

### 2. Crear primer componente React (TableMap)

```bash
cd dashboard-web
mkdir -p src/components/pos/TableMap
touch src/components/pos/TableMap/TableMap.tsx
touch src/components/pos/TableMap/TableButton.tsx
```

### 3. Implementar endpoint de mesas

```bash
cd backend
# Editar src/routes/tables.ts
# Agregar lógica de estado de mesas
```

### 4. Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd dashboard-web && npm run test

# E2E
npm run test:e2e
```

---

## 📝 Notas Importantes

1. **NO modificar repositorio SYSME_MISTURA**: Solo lectura para referencia
2. **Mantener compatibilidad de datos**: La base de datos ya migrada debe funcionar sin cambios de schema
3. **JARVIS como asistente secundario**: No interferir con flujo principal de POS
4. **Priorizar UX táctil**: Botones grandes, gestos intuitivos
5. **Testing exhaustivo**: Cada operación de venta debe tener tests unitarios y E2E

---

## 🔗 Referencias

- Repositorio original: https://github.com/Soyelijah/SYSME_MISTURA
- Documentación de base de datos: `docs/ETL_MIGRATION_SUMMARY.md`
- Guía de configuración: `docs/RUNTIME_SETUP_GUIDE.md`
- Scripts de arranque: `scripts/start-pos.bat`, `scripts/stop-pos.bat`

---

**Última actualización**: 22 de diciembre 2025
**Autor**: Análisis realizado por Claude Code
**Estado**: ✅ Análisis completado, listo para implementación
