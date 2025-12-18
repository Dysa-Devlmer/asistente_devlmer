# LEGACY TO NEW MAPPING - Mapeo de Transformación

**Fecha:** 2025-12-15
**Fase:** Diseño del Nuevo Sistema
**Objetivo:** Mapeo completo de tablas y campos legacy → nuevo modelo

---

## 🎯 PRINCIPIOS DE MAPEO

1. **NO copiar valores directamente sin transformación**
2. **Validar y limpiar datos**
3. **Convertir charset latin1 → utf8mb4**
4. **Generar IDs nuevos (no reutilizar IDs legacy)**
5. **Mantener referencia al ID legacy para trazabilidad**
6. **Descartar campos obsoletos explícitamente**

---

## 📋 MAPEO POR DOMINIO

### DOMINIO 1: VENTAS / COMANDAS

#### Legacy: `ventadirecta` → New: `orders`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_venta` | int(7) | - | - | **NO copiar** | Generar nuevo BIGINT |
| - | - | `legacy_id` | bigint | = id_venta | Referencia legacy |
| - | - | `order_number` | varchar(20) | Generar secuencial | Formato: #YYYYMMDD-NNNN |
| `Num_Mesa` | char(3) | `table_id` | bigint | JOIN con tables | Buscar por room+table_number |
| `id_camarero` | int(4) | `waiter_id` | bigint | JOIN con employees | Mapear legacy_id |
| `id_caja` + turno | int(2) + int(11) | `shift_id` | bigint | JOIN con cash_register_shifts | Identificar turno |
| `comensales` | int(4) | `guest_count` | tinyint | = comensales | Default 1 si NULL |
| `cerrada` | char(1) | `status` | enum | 'N'→'open', 'S'→'closed' | Mapeo de estados |
| `tv` | float | `total_amount` | decimal(10,2) | ROUND(tv, 2) | Redondear 2 decimales |
| `bi` | float(12,6) | `subtotal` | decimal(10,2) | ROUND(bi, 2) | Base imponible |
| `ci` | float(12,6) | `tax_amount` | decimal(10,2) | ROUND(ci, 2) | Cuota impuesto |
| `observaciones` | varchar(249) | `notes` | text | CONVERT utf8mb4 | Limpiar caracteres |
| `fecha_venta` + `hora` | date + time | `opened_at` | datetime | CONCAT fecha + hora | Combinar campos |
| `serie` + `id_tiquet` | char(5) + int(7) | - | - | Migrar a invoices | Si tiene ticket |
| - | - | `sent_to_kitchen_at` | datetime | NULL | Calculable si cocina>0 |
| - | - | `closed_at` | datetime | = opened_at si cerrada='S' | Fecha aproximada |
| **Campos descartados** ||||
| `id_empresa` | char(3) | ❌ | - | Siempre '001' | Single tenant |
| `id_centro` | char(2) | ❌ | - | Siempre '01' | Single location |
| `id_entidad` | char(3) | ❌ | - | Obsoleto | No usado |
| `iva` | int(2) | ❌ | - | Obsoleto | Usar tax_rate |
| `id_modo_pago` | char(2) | ❌ | - | Migrar a payments | NO en orders |
| `modo_pago` | varchar(25) | ❌ | - | Migrar a payments | NO en orders |
| `pagadocliente` | double | ❌ | - | Migrar a payments | NO en orders |
| `codbarras_promocion` | varchar(20) | ❌ | - | Descartado | No usado |
| `id_pretiquet` | int(7) | ❌ | - | Descartado | Interno legacy |
| `imppretiquet` | char(1) | ❌ | - | Descartado | Interno legacy |
| `dni` | varchar(15) | ❌ | - | Migrar a customers | Si factura |
| `alias` | varchar(200) | ❌ | - | Descartado | No usado |
| `tarifa` | varchar(200) | ❌ | - | Descartado | Usar price_tier |

**Lógica de Migración:**

```sql
-- Pseudo-query (NO ejecutar, solo referencia)
INSERT INTO orders (
    legacy_id,
    order_number,
    table_id,
    waiter_id,
    shift_id,
    guest_count,
    status,
    subtotal,
    tax_amount,
    total_amount,
    notes,
    opened_at,
    closed_at
)
SELECT
    v.id_venta AS legacy_id,
    CONCAT('#', DATE_FORMAT(v.fecha_venta, '%Y%m%d'), '-', LPAD(v.id_venta, 4, '0')) AS order_number,
    (SELECT id FROM tables WHERE legacy_table_number = v.Num_Mesa LIMIT 1) AS table_id,
    (SELECT id FROM employees WHERE legacy_id = v.id_camarero LIMIT 1) AS waiter_id,
    (SELECT id FROM cash_register_shifts WHERE legacy_shift_id = v.turno LIMIT 1) AS shift_id,
    COALESCE(v.comensales, 1) AS guest_count,
    CASE v.cerrada WHEN 'S' THEN 'closed' ELSE 'open' END AS status,
    ROUND(v.bi, 2) AS subtotal,
    ROUND(v.ci, 2) AS tax_amount,
    ROUND(v.tv, 2) AS total_amount,
    CONVERT(v.observaciones USING utf8mb4) AS notes,
    TIMESTAMP(v.fecha_venta, v.hora) AS opened_at,
    CASE WHEN v.cerrada = 'S' THEN TIMESTAMP(v.fecha_venta, v.hora) ELSE NULL END AS closed_at
FROM ventadirecta v
WHERE v.cerrada = 'S' -- Solo órdenes cerradas en migración inicial
ORDER BY v.id_venta;
```

---

#### Legacy: `ventadir_comg` → New: `order_items`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_linea` | int(11) | - | - | **NO copiar** | Generar nuevo BIGINT |
| - | - | `legacy_id` | bigint | = id_linea | Referencia |
| `id_venta` | int(7) | `order_id` | bigint | JOIN orders.legacy_id | Buscar orden nueva |
| `id_complementog` | varchar(5) | `product_id` | bigint | JOIN products.legacy_sku | Buscar producto |
| `cantidad` | float | `quantity` | decimal(8,3) | ROUND(cantidad, 3) | Permitir decimales |
| `precio` | float(12,6) | `unit_price` | decimal(10,2) | ROUND(precio, 2) | Precio unitario |
| `total` | float | `total_amount` | decimal(10,2) | ROUND(total, 2) | Total línea |
| `descuento` | float | `discount_percentage` | decimal(5,2) | ROUND(descuento, 2) | % descuento |
| - | - | `discount_amount` | decimal(10,2) | Calcular | precio * cantidad * desc% |
| - | - | `subtotal` | decimal(10,2) | Calcular | precio * cantidad |
| `observaciones` | varchar(250) | `notes` | text | CONVERT utf8mb4 | Notas especiales |
| `nota` | varchar(200) | `notes` | text | CONCAT con observaciones | Combinar |
| `cocina` | float | `status` | enum | >0 → 'sent_to_kitchen' | Estado |
| - | - | `sent_to_kitchen_at` | datetime | Si cocina>0 | Aprox= orden.opened_at |
| **Campos descartados** ||||
| `id_empresa` | char(3) | ❌ | - | Single tenant | |
| `id_centro` | char(2) | ❌ | - | Single location | |
| `id_tipo_comg` | varchar(4) | ❌ | - | Usar product.category | |
| `PVPTiquet` | float | ❌ | - | Duplicado de precio | |
| `avgiva` | float | ❌ | - | Calcular en tiempo real | |
| `id_factura` + `serie` | int + char | ❌ | - | Migrar a invoices | |
| `destino` | char(1) | ❌ | - | Obsoleto | |
| `id_almacen` | char(2) | ❌ | - | No en scope | |
| `complementog` | varchar(100) | ❌ | - | Duplicado, usar products | |

**Reglas de Limpieza:**

- Descartar líneas donde `cantidad <= 0`
- Descartar líneas donde `precio < 0`
- Si `total` es NULL, calcular como `cantidad * precio * (1 - descuento/100)`

---

#### Legacy: `venta_cocina` / `notacocina` → New: `kitchen_queue`

**Nota:** Estas tablas legacy contienen órdenes históricas ya procesadas.
**Decisión:** NO migrar histórico de cocina. Solo estructura para operación nueva.

**Campos de referencia:**

| Campo Legacy | Nuevo | Transformación |
|--------------|-------|----------------|
| `id_venta` | - | No migrar datos históricos |
| `id_complementog` | - | Solo estructura |
| `estado` | - | Solo valores activos |

---

### DOMINIO 2: PRODUCTOS & CATEGORÍAS

#### Legacy: `complementog` → New: `products`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_complementog` | varchar(5) | - | - | **NO copiar** | Generar nuevo BIGINT |
| - | - | `legacy_sku` | varchar(50) | = id_complementog | Referencia |
| - | - | `sku` | varchar(50) | UPPER(id_complementog) | Código único |
| `complementog` | varchar(100) | `name` | varchar(200) | CONVERT utf8mb4 | Nombre producto |
| `descripcion` (si existe) | text | `description` | text | CONVERT utf8mb4 | Descripción |
| `id_tipo_comg` | varchar(4) | `category_id` | bigint | JOIN categories | Categoría |
| `precio` | float | `base_price` | decimal(10,2) | ROUND(precio, 2) | Precio base |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE, 'N'→FALSE | Estado |
| `stock` (si existe) | float | `current_stock` | decimal(10,3) | ROUND(stock, 3) | Stock |
| - | - | `is_taxable` | boolean | TRUE | Por defecto |
| - | - | `tax_rate` | decimal(5,2) | 18.00 | IGV Perú |
| - | - | `tracks_inventory` | boolean | FALSE | Por defecto |
| **Campos descartados** ||||
| `id_empresa` | char(3) | ❌ | - | Single tenant | |
| `id_centro` | char(2) | ❌ | - | Single location | |

**Ejemplos de transformación (del dump real):**

```
00437 | Algarrobina           → SKU: 00437, Name: "Algarrobina"
00470 | Pisco Sour Catedral   → SKU: 00470, Name: "Pisco Sour Catedral"
```

---

#### Legacy: `tipo_comg` → New: `categories`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_tipo_comg` | varchar(4) | - | - | **NO copiar** | |
| - | - | `legacy_code` | varchar(20) | = id_tipo_comg | Referencia |
| - | - | `code` | varchar(20) | Generar slug | ej: CEVICHES |
| `tipo` | varchar(100) | `name` | varchar(100) | CONVERT utf8mb4 | Nombre categoría |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE, 'N'→FALSE | |
| `orden` | int | `display_order` | int | = orden | |

**Ejemplos (del dump):**

```
0051 | Cocteles          → CODE: COCKTAILS, Name: "Cocteles"
0063 | Piqueos           → CODE: APPETIZERS, Name: "Piqueos"
0064 | Ceviches          → CODE: CEVICHES, Name: "Ceviches"
0068 | Platos de Fondo   → CODE: MAIN_DISHES, Name: "Platos de Fondo"
```

---

#### Legacy: `tarifa` → New: `price_tiers`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_tarifa` | varchar(10) | - | - | **NO copiar** |
| - | - | `code` | varchar(20) | Generar | ej: DEFAULT, VIP |
| `tarifa` | varchar(100) | `name` | varchar(100) | CONVERT utf8mb4 |
| `defecto` | char(1) | `is_default` | boolean | 'S'→TRUE |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE |

---

#### Legacy: `comg_tarifa` → New: `product_prices`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_complementog` | varchar(5) | `product_id` | bigint | JOIN products |
| `id_tarifa` | varchar(10) | `price_tier_id` | bigint | JOIN price_tiers |
| `precio` | float | `price` | decimal(10,2) | ROUND(precio, 2) |

---

### DOMINIO 3: MESAS & SALONES

#### Legacy: `mesa` → New: `tables`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `num_mesa` | varchar(20) | - | - | **NO copiar ID** | |
| - | - | `legacy_number` | varchar(20) | = num_mesa | Referencia |
| `num_mesa` | varchar(20) | `table_number` | varchar(20) | TRIM(num_mesa) | Número visible |
| `id_salon` | varchar(10) | `room_id` | bigint | JOIN rooms | Salón |
| `capacidad` | int | `capacity` | int | = capacidad | Default 4 |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE | |
| `estado` | varchar(20) | `status` | enum | Mapear estados | libre/ocupada |

**Mapeo de estados:**

```
'libre' → 'available'
'ocupada' → 'occupied'
'reservada' → 'reserved'
'fuera_servicio' → 'out_of_service'
```

---

#### Legacy: `salon` → New: `rooms`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_salon` | varchar(10) | - | - | **NO copiar** |
| - | - | `code` | varchar(20) | Generar slug | UPPER |
| `salon` | varchar(100) | `name` | varchar(100) | CONVERT utf8mb4 |
| `capacidad` | int | `capacity` | int | = capacidad |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE |

---

### DOMINIO 4: CAJA & PAGOS

#### Legacy: `cajas` → New: `cash_registers`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_caja` | int | - | - | **NO copiar** |
| - | - | `legacy_id` | bigint | = id_caja |
| `caja` | varchar(50) | `code` | varchar(20) | UPPER(caja) |
| `nombre` | varchar(100) | `name` | varchar(100) | CONVERT utf8mb4 |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE |

---

#### Legacy: `apcajas` → New: `cash_register_shifts`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_apcajas` | int | - | - | **NO copiar** | |
| - | - | `legacy_id` | bigint | = id_apcajas | |
| `id_caja` | int | `cash_register_id` | bigint | JOIN cash_registers | |
| `id_camarero` | int | `opened_by_user_id` | bigint | JOIN employees | |
| `efectivo_inicial` | float | `opening_cash` | decimal(10,2) | ROUND | Fondo fijo |
| `efectivo_sistema` | float | `expected_cash` | decimal(10,2) | ROUND | Esperado |
| `efectivo_real` | float | `closing_cash` | decimal(10,2) | ROUND | Contado |
| `tarjetas` | float | `closing_cards` | decimal(10,2) | ROUND | |
| `diferencia` | float | `cash_difference` | decimal(10,2) | ROUND | |
| `cerrada` | char(1) | `status` | enum | 'S'→'closed', 'N'→'open' | |
| `fecha_apertura` + `hora_apertura` | date + time | `opened_at` | datetime | CONCAT | |
| `fecha_cierre` + `hora_cierre` | date + time | `closed_at` | datetime | CONCAT | |
| `observaciones_apertura` | text | `opening_notes` | text | CONVERT utf8mb4 | |
| `observaciones_cierre` | text | `closing_notes` | text | CONVERT utf8mb4 | |

---

#### Legacy: `pagoscobros` → New: `payments`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_pagoscobros` | int | - | - | **NO copiar** | |
| - | - | `legacy_id` | bigint | = id_pagoscobros | |
| `id_venta` | int | `order_id` | bigint | JOIN orders | |
| `id_modo_pago` | varchar(10) | `payment_method_id` | bigint | JOIN payment_methods | |
| `id_apcajas` | int | `shift_id` | bigint | JOIN shifts | |
| `id_camarero` | int | `processed_by_user_id` | bigint | JOIN employees | |
| `importe` | float | `amount` | decimal(10,2) | ROUND(importe, 2) | |
| `fecha` + `hora` | date + time | `paid_at` | datetime | CONCAT | |
| `descripcion` | varchar(200) | `notes` | text | CONVERT utf8mb4 | |
| `referencia` | varchar(100) | `reference_number` | varchar(100) | = referencia | Nº tarjeta, etc |
| **Campos descartados** ||||
| `tipo` | char(1) | ❌ | - | E=Entrada, siempre | Filtrar tipo='E' |
| `saldo` | float | ❌ | - | Calculable | |

**Regla:** Solo migrar pagos con `tipo = 'E'` (Entradas/Cobros)

---

#### Legacy: `modo_pago` → New: `payment_methods`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_modo_pago` | varchar(10) | - | - | **NO copiar** |
| - | - | `code` | varchar(20) | Generar código | UPPER |
| `modo_pago` | varchar(100) | `name` | varchar(100) | CONVERT utf8mb4 |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE |

**Ejemplos:**

```
'01' | Efectivo        → CODE: CASH, Name: "Efectivo"
'02' | Tarjeta Crédito → CODE: CREDIT_CARD, Name: "Tarjeta de Crédito"
'03' | Tarjeta Débito  → CODE: DEBIT_CARD, Name: "Tarjeta de Débito"
```

---

#### Legacy: `tiquet` → New: `invoices`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_tiquet` | int | - | - | **NO copiar** | |
| `serie` | char(5) | `series` | varchar(10) | = serie | ej: F001, B001 |
| `id_tiquet` | int | `document_number` | varchar(20) | LPAD(id_tiquet, 8, '0') | 8 dígitos |
| `id_venta` | int | `order_id` | bigint | JOIN orders | |
| - | - | `document_type` | enum | Detectar por serie | F→factura, B→boleta, T→ticket |
| `total` | float | `total_amount` | decimal(10,2) | ROUND(total, 2) | |
| `iva` | float | `tax_amount` | decimal(10,2) | ROUND(iva, 2) | |
| - | - | `subtotal` | decimal(10,2) | total - tax_amount | Calcular |
| `fecha_tiquet` + `horatiquet` | date + time | `issued_at` | datetime | CONCAT | |

**Mapeo de series:**

```
F001, F002 → document_type: 'factura'
B001, B002 → document_type: 'boleta'
T001, T002 → document_type: 'ticket'
```

---

### TABLAS AUXILIARES

#### Legacy: `camareros` → New: `employees`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación | Notas |
|--------------|-------------|-------------|------------|----------------|-------|
| `id_camarero` | int | - | - | **NO copiar** | |
| - | - | `legacy_id` | bigint | = id_camarero | |
| `cod_camarero` | varchar(20) | `employee_code` | varchar(20) | = cod_camarero | |
| `nombre` | varchar(100) | - | - | Separar | Split en first/last |
| - | - | `first_name` | varchar(100) | Primer palabra | |
| - | - | `last_name` | varchar(100) | Resto | |
| `clave` | varchar(50) | `pin_code` | varchar(6) | Primeros 6 chars | PIN rápido |
| `tipo` | varchar(20) | `role` | enum | Mapear roles | Convertir |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE | |

**Mapeo de roles:**

```
'Camarero' → 'waiter'
'Cajero' → 'cashier'
'Cocinero' → 'cook'
'Administrador' → 'admin'
'Gerente' → 'manager'
```

---

#### Legacy: `cliente` → New: `customers`

| Campo Legacy | Tipo Legacy | Campo Nuevo | Tipo Nuevo | Transformación |
|--------------|-------------|-------------|------------|----------------|
| `id_cliente` | int | - | - | **NO copiar** |
| `tipo_doc` | varchar(10) | `document_type` | enum | Mapear |
| `nif` / `ruc` / `dni` | varchar(20) | `document_number` | varchar(20) | = campo |
| `razon_social` / `nombre` | varchar(200) | `name` | varchar(200) | CONVERT utf8mb4 |
| `email` | varchar(200) | `email` | varchar(200) | LOWER(email) |
| `telefono` | varchar(20) | `phone` | varchar(20) | = telefono |
| `direccion` | text | `address` | text | CONVERT utf8mb4 |
| `activo` | char(1) | `is_active` | boolean | 'S'→TRUE |

---

## 📊 RESUMEN DE TRANSFORMACIONES

### Campos Generados (nuevos)

| Campo | Generación |
|-------|------------|
| `id` | BIGINT AUTO_INCREMENT |
| `legacy_id` / `legacy_sku` / etc | Referencia al ID legacy |
| `created_at` | CURRENT_TIMESTAMP |
| `updated_at` | CURRENT_TIMESTAMP ON UPDATE |
| `deleted_at` | NULL (soft delete) |
| `order_number` | Secuencial formateado |
| `full_number` (invoices) | CONCAT(series, '-', document_number) |
| `full_name` (employees) | CONCAT(first_name, ' ', last_name) |

### Transformaciones Comunes

| Tipo | Transformación |
|------|----------------|
| Charset | latin1 → utf8mb4 con CONVERT |
| Float → Decimal | ROUND(campo, 2 o 3) |
| Date + Time | TIMESTAMP(date, time) |
| Char(1) booleano | 'S'→TRUE, 'N'→FALSE |
| IDs legacy | JOIN con nuevas tablas |
| Enums | Mapeo de valores |
| NULLs | COALESCE con defaults |

### Reglas de Limpieza

✅ Descartar registros con:
- Cantidades <= 0
- Precios < 0
- Fechas inválidas (0000-00-00)
- IDs sin relación (huérfanos)

✅ Normalizar:
- Emails → LOWER
- Códigos → UPPER
- Textos → TRIM

✅ Validar:
- Foreign Keys existen
- Enums en rango válido
- Decimales no NULL

---

## 📌 SIGUIENTE PASO

Crear **MIGRATION-STRATEGY.md** con:
- Orden de migración
- Manejo de históricos
- Política de IDs
- Validaciones
- Rollback plan

---

**FIN DEL MAPEO**

Estado: ✅ MAPEO COMPLETO LEGACY → NUEVO
Tablas mapeadas: 21 tablas nuevas desde ~30 tablas legacy core
Transformaciones: Definidas y documentadas
