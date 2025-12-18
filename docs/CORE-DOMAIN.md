# CORE DOMAIN - DOMINIOS CRÍTICOS DEL NEGOCIO

**Fecha:** 2025-12-15
**Fase:** Diseño del Nuevo Sistema (Greenfield)
**Objetivo:** Identificar SOLO los dominios que generan ventas en el restaurante

---

## 🎯 PRINCIPIO RECTOR

**Diseñar el sistema nuevo como si el legacy no existiera,
y usar el legacy solo como fuente de datos.**

---

## 📋 CRITERIOS DE INCLUSIÓN

Un dominio es CRÍTICO si:

✅ Genera ventas directamente
✅ Es necesario para operar el restaurante día a día
✅ Bloquea el flujo de caja si falla
✅ Es usado en cada turno operativo

---

## ✅ DOMINIOS CRÍTICOS (CORE)

### 1️⃣ VENTAS / COMANDAS

**Propósito:** Gestionar órdenes de clientes desde la mesa hasta el cobro

**Funcionalidad Core:**
- Crear una comanda/orden
- Agregar productos a la orden
- Modificar cantidades
- Enviar orden a cocina
- Cerrar/finalizar orden
- Anular líneas con justificación

**Entidades Legacy (referencia):**
- `ventadirecta` - Cabecera de órdenes
- `ventadir_comg` - Líneas de productos
- `venta_cocina` - Comandas para cocina
- `notacocina` - Notas especiales
- `lineaseliminadas` - Audit trail

**Volumen de negocio:**
- 36,950+ órdenes de Lomo Saltado
- 19,433+ órdenes de Pisco Sour Catedral
- Datos reales del dump: productos más vendidos

**Reglas de Negocio Críticas:**
- Una orden puede estar abierta (cerrada='N') o cerrada (cerrada='S')
- Las órdenes abiertas pueden modificarse
- Las órdenes cerradas NO se modifican (solo anulación)
- Cada línea eliminada debe tener justificación y trazabilidad
- Las órdenes incluyen número de comensales

---

### 2️⃣ PRODUCTOS & CATEGORÍAS

**Propósito:** Catálogo de productos vendibles (comidas, bebidas, postres)

**Funcionalidad Core:**
- Listar productos por categoría
- Consultar precio según tarifa activa
- Verificar disponibilidad
- Gestionar productos activos/inactivos

**Entidades Legacy (referencia):**
- `complementog` - Productos principales
- `tipo_comg` - Categorías (Piqueos, Ceviches, Bebidas, etc)
- `comg_tarifa` - Precios según tarifa
- `tarifa` - Tarifas (Default, VIP, Happy Hour, etc)

**Categorías Reales (del dump):**
- 0051: Cocteles (Pisco Sour, Mojito, Chilcano, etc)
- 0052: Bebidas sin alcohol (Agua, Coca-Cola, Sprite, etc)
- 0053: Jugos naturales (Mango, Maracuyá, Limonada, Chicha)
- 0054: Cervezas (Corona, Cusqueña, Heineken, etc)
- 0055: Café (Espresso, Americano, Capuchino, etc)
- 0063: Piqueos (Anticucho, Tequeños, Jalea, etc)
- 0064: Ceviches (Mixto, Pescado, Especial, etc)
- 0065: Tiraditos (Ají amarillo, Cilantro, Criollo, etc)
- 0066: Causas (Atún, Pollo, Camarón-Jaiva, etc)
- 0067: Pulpo (Al olivo, Parrilla, etc)
- 0068: Platos de fondo (Lomo Saltado, Ají de Gallina, etc)
- 0069: Arroces (Chaufa, Risotto, Arroz con mariscos, etc)
- 0070: Carnes (Filete Mignon, Mar y Tierra, etc)
- 0071: Pescados (A lo macho, Mistura, Al cilantro, etc)
- 0072: Sopas y caldos (Chupe, Parihuela, Sudado, etc)
- 0073: Pastas (Spaghetti con mariscos, etc)

**Reglas de Negocio Críticas:**
- Un producto pertenece a UNA categoría
- Un producto tiene múltiples precios según tarifa
- El precio DEFAULT es obligatorio
- Productos inactivos no aparecen en el menú pero siguen en BD

---

### 3️⃣ MESAS & SALONES

**Propósito:** Organización física del restaurante y asignación de órdenes

**Funcionalidad Core:**
- Listar mesas disponibles/ocupadas
- Asignar orden a mesa
- Liberar mesa al finalizar orden
- Agrupar mesas por salón/área

**Entidades Legacy (referencia):**
- `mesa` - Mesas del restaurante
- `salon` - Salones/áreas (Terraza, Salón principal, Bar, etc)

**Reglas de Negocio Críticas:**
- Una mesa pertenece a UN salón
- Una mesa puede tener múltiples órdenes abiertas (grupos separados)
- El número de mesa es visible y usado por meseros
- Estado de mesa: libre, ocupada, reservada

---

### 4️⃣ CAJA & PAGOS

**Propósito:** Registro de cobros, apertura/cierre de caja, formas de pago

**Funcionalidad Core:**
- Abrir caja al inicio del turno
- Registrar pago de una orden
- Soportar múltiples formas de pago (split payment)
- Cerrar caja al final del turno
- Registrar entradas/salidas de efectivo

**Entidades Legacy (referencia):**
- `cajas` - Cajas registradoras
- `apcajas` - Aperturas de caja (con monto inicial)
- `pagoscobros` - Pagos/cobros registrados
- `modo_pago` - Formas de pago (Efectivo, Tarjeta, Webpay, etc)
- `registrocajon` - Aperturas del cajón monedero
- `tiquet` - Tickets/boletas emitidos
- `factura` - Facturas emitidas
- `zreport` - Cierres diarios (Reporte Z)

**Formas de Pago Reales:**
- Efectivo
- Tarjeta de crédito
- Tarjeta de débito
- Webpay (integración futura)
- Transferencia
- Cortesía (invitación de la casa)

**Reglas de Negocio Críticas:**
- Una caja debe abrirse antes de registrar ventas
- Apertura de caja registra monto inicial (fondo fijo)
- Un pago está asociado a UNA orden
- Una orden puede tener múltiples pagos (split payment)
- El cierre de caja (Z-report) cuadra: ventas vs efectivo+tarjetas
- No se puede cerrar caja con órdenes abiertas
- Cada apertura de cajón debe justificarse (vuelto, retiro, etc)

---

## ❌ DOMINIOS EXCLUIDOS (FUERA DE SCOPE)

Los siguientes dominios NO son parte del sistema core de restaurante:

### Hotel
- Habitaciones
- Reservas de hotel
- Check-in/check-out
- Centralita telefónica

**Justificación:** El restaurante NO opera como hotel actualmente

---

### Bitcoin / Crypto
**Justificación:** No hay evidencia de uso en el dump real

---

### OpenCart / E-commerce
- Pedidos online
- Carrito de compras
- Categorías web

**Justificación:** Módulo separado, no crítico para operación del restaurante físico

---

### SMS
- Notificaciones SMS
- Campañas SMS

**Justificación:** No es crítico para ventas diarias

---

### Fabricación
- Recetas
- Composición de productos
- Mermas

**Justificación:** Gestión interna, no bloquea ventas

---

### Módulos Auxiliares
- Proveedores y compras
- Inventario avanzado
- Contabilidad
- Nómina
- Peluquería
- Comercio genérico

**Justificación:** Pueden agregarse DESPUÉS del core funcional

---

## 📊 REDUCCIÓN DE COMPLEJIDAD

**Sistema Legacy:** 157 tablas en 19 módulos
**Sistema Nuevo (Core):** ~20-30 tablas en 4 dominios

| Dominio | Tablas Estimadas | Prioridad |
|---------|------------------|-----------|
| Ventas/Comandas | 8-10 tablas | 🔴 Crítica |
| Productos & Categorías | 5-7 tablas | 🔴 Crítica |
| Mesas & Salones | 2-3 tablas | 🔴 Crítica |
| Caja & Pagos | 7-10 tablas | 🔴 Crítica |
| **TOTAL CORE** | **22-30 tablas** | - |

---

## 🎯 OBJETIVO DE ESTA REDUCCIÓN

**Construir un MVP funcional que permita:**

1. Abrir caja
2. Crear orden en una mesa
3. Agregar productos con precios
4. Enviar orden a cocina
5. Cobrar con múltiples formas de pago
6. Emitir ticket/boleta
7. Cerrar caja con cuadre

**Con estos 7 pasos, el restaurante puede operar.**

Todo lo demás es secundario y puede agregarse después.

---

## 🧠 VALIDACIÓN CON DATOS REALES

**Del dump `sysmehotel_full.sql` (34 MB):**

✅ Productos más vendidos identificados
✅ Categorías reales documentadas
✅ Formas de pago en uso confirmadas
✅ Flujo de caja validado (apcajas → pagoscobros → cierre)
✅ Estructura de órdenes confirmada (ventadirecta + ventadir_comg)

---

## 📌 SIGUIENTE PASO

Con el CORE identificado, diseñar el **NEW-DATA-MODEL.md**:

- Entidades modernas y normalizadas
- Nombres en inglés (convención REST API)
- UTF-8 por defecto
- IDs bien definidos (UUID o bigint)
- Relaciones explícitas con Foreign Keys
- Sin copiar diseño legacy

---

**FIN DEL CORE DOMAIN**

Estado: ✅ DOMINIOS CRÍTICOS IDENTIFICADOS
Tablas objetivo: 20-30 (vs 157 legacy)
Enfoque: Restaurante físico con POS moderno
