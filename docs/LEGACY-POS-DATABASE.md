# BASE DE DATOS DEL POS LEGACY - Análisis Completo

**Fecha:** 2025-12-15
**Database:** sysmehotel
**Motor:** MySQL/MariaDB 5.5+
**Puerto:** 4306 (personalizado)
**Charset:** latin1
**Storage Engine:** InnoDB

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración del Motor](#configuración-del-motor)
3. [Listado Completo de Tablas](#listado-completo-de-tablas)
4. [Tablas Críticas del Negocio](#tablas-críticas-del-negocio)
5. [Schema Detallado](#schema-detallado)
6. [Relaciones y Foreign Keys](#relaciones-y-foreign-keys)
7. [Análisis de Integridad](#análisis-de-integridad)
8. [Recomendaciones](#recomendaciones)

---

## 🎯 RESUMEN EJECUTIVO

### Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| **Total de Tablas** | 157 tablas |
| **Database Principal** | `sysmehotel` |
| **Database Secundaria** | `sysme` (config/users) |
| **Motor** | MySQL/MariaDB 5.5+ |
| **Puerto** | 4306 (no estándar) |
| **Charset** | latin1 (⚠️ no UTF-8) |
| **Collation** | latin1_swedish_ci |
| **Storage Engine** | InnoDB |
| **Max Connections** | 100 |
| **Max Packet Size** | 16MB |

### Características de la Base de Datos

✅ **InnoDB con Transacciones**
- Soporte ACID
- Foreign keys
- Row-level locking
- Crash recovery

⚠️ **Charset latin1**
- NO soporta caracteres Unicode completos
- Potencial pérdida de datos con emojis/caracteres especiales
- Recomendado migrar a utf8mb4

---

## ⚙️ CONFIGURACIÓN DEL MOTOR

### Configuración MySQL (`my.ini`)

```ini
[mysqld]
port = 4306
max_allowed_packet = 16M
basedir = "../"
datadir = "../Data/"
default-character-set = latin1
default-storage-engine = INNODB
max_connections = 100
query_cache_size = 0
table_cache = 256
tmp_table_size = 30M
thread_cache_size = 8
key_buffer_size = 16M
read_buffer_size = 64K
read_rnd_buffer_size = 256K
sort_buffer_size = 256K
```

### Conexión desde PHP

```php
// Configuración (sysmetpv.ini)
dbhost = 127.0.0.1
dbport = 4306
dbuser = root
dbpass = infusorio
dbname = sysmehotel

// Conexión (conn.php)
$conexion = mysql_connect(
    $_SESSION['dbhost'].":".$_SESSION['dbport'],
    $_SESSION['dbuser'],
    $_SESSION['dbpass']
);
mysql_set_charset("utf8", $conexion);
mysql_select_db($_SESSION['dbname']);
```

---

## 📚 LISTADO COMPLETO DE TABLAS

### Total: 157 Tablas

#### Módulo: Ventas y TPV (20 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 1 | `ventadirecta` | 🔥 Cabecera de ventas |
| 2 | `ventadirecta2` | Histórico/backup de ventas |
| 3 | `ventadir_comg` | 🔥 Líneas de venta (productos) |
| 4 | `ventadir_comg2` | Histórico de líneas |
| 5 | `venta_cocina` | 🔥 Comandas para cocina |
| 6 | `venta_ticket` | 🔥 Cola de impresión tickets |
| 7 | `venta_preticket` | Pre-tickets |
| 8 | `tiquet` | 🔥 Tickets emitidos |
| 9 | `tiquet2` | Histórico de tickets |
| 10 | `pretiquet` | Pre-tickets |
| 11 | `factura` | 🔥 Facturas |
| 12 | `factura2` | Histórico de facturas |
| 13 | `pfactura` | Pre-facturas |
| 14 | `fac_comg` | Líneas de factura |
| 15 | `serie` | Series de facturación |
| 16 | `lineaseliminadas` | Audit trail líneas borradas |
| 17 | `notacocina` | 🔥 Notas de cocina |
| 18 | `pnotacocina` | Pre-notas cocina |
| 19 | `zreport` | 🔥 Reportes Z (cierres día) |
| 20 | `registroz` | Registro de cierres Z |

#### Módulo: Mesas y Salones (5 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 21 | `mesa` | 🔥 Mesas del restaurante |
| 22 | `mesa_comercio` | Mesas para comercio |
| 23 | `mesa_hosteleria` | Mesas para hostelería |
| 24 | `mesa_peluqueria` | Mesas para peluquería |
| 25 | `salon` | 🔥 Salones/áreas |

#### Módulo: Productos (18 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 26 | `complementog` | 🔥 Productos principales |
| 27 | `complementog_comercio` | Productos comercio |
| 28 | `complementog_hosteleria` | Productos hostelería |
| 29 | `complementog_peluqueria` | Productos peluquería |
| 30 | `complemento` | Complementos |
| 31 | `tipo_comg` | 🔥 Categorías de productos |
| 32 | `tipo_comg_comercio` | Categorías comercio |
| 33 | `tipo_comg_comg` | Relación tipo-producto |
| 34 | `tipo_comg_hosteleria` | Categorías hostelería |
| 35 | `tipo_comg_peluqueria` | Categorías peluquería |
| 36 | `complementogimg` | Imágenes productos |
| 37 | `productoimg` | Imágenes (alt) |
| 38 | `productoimgs` | Imágenes (plural) |
| 39 | `foto_complementog` | Fotos productos |
| 40 | `variaciones` | Variantes de productos |
| 41 | `tallas` | Tallas |
| 42 | `colores` | Colores |
| 43 | `comg_tarifa` | 🔥 Precios por tarifa |

#### Módulo: Tarifas y Precios (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 44 | `tarifa` | 🔥 Tarifas (Default, VIP, etc) |
| 45 | `precio` | Precios históricos |
| 46 | `historicoprecios` | Histórico de cambios |

#### Módulo: Caja (7 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 47 | `cajas` | 🔥 Cajas registradoras |
| 48 | `apcajas` | 🔥 Aperturas de caja |
| 49 | `apcajas2` | Histórico aperturas |
| 50 | `pagoscobros` | 🔥 Pagos y cobros |
| 51 | `pagoscobros2` | Histórico pagos/cobros |
| 52 | `registrocajon` | 🔥 Apertura cajón monedero |
| 53 | `modo_pago` | 🔥 Formas de pago (Efectivo, Tarjeta, etc) |

#### Módulo: Empleados (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 54 | `camareros` | 🔥 Empleados/camareros |
| 55 | `camarero_priv` | Privilegios empleados |
| 56 | `claveadministrador` | Contraseña admin |

#### Módulo: Clientes (7 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 57 | `cliente` | 🔥 Clientes |
| 58 | `cliente_cardex` | Cardex de clientes |
| 59 | `cliente_fan` | Fans/seguidores |
| 60 | `clientes_docs` | Documentos clientes |
| 61 | `clientes_tarjeta` | Tarjetas clientes |
| 62 | `tipo_cliente` | Tipos de cliente |
| 63 | `tipo_doc` | Tipos de documento |

#### Módulo: Inventario (9 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 64 | `stock` | 🔥 Stock actual |
| 65 | `almacen` | 🔥 Almacenes |
| 66 | `almacen_complementg` | Productos por almacén |
| 67 | `inventario` | Inventarios |
| 68 | `inventario_complementg` | Líneas de inventario |
| 69 | `traspasos` | 🔥 Traspasos entre almacenes |
| 70 | `traspasos_complementog` | Líneas de traspasos |
| 71 | `entradas` | Entradas de mercancía |
| 72 | `cardex` | Movimientos de stock |

#### Módulo: Proveedores y Compras (10 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 73 | `proveedor` | Proveedores |
| 74 | `pproveedor` | Pre-proveedores |
| 75 | `acreedor` | Acreedores |
| 76 | `pedido` | Pedidos a proveedores |
| 77 | `ped_comg` | Líneas de pedido |
| 78 | `albaran` | Albaranes |
| 79 | `alb_comg` | Líneas de albarán |
| 80 | `albaran_factura` | Relación albarán-factura |
| 81 | `borrador` | Borradores |
| 82 | `bor_comg` | Líneas de borrador |

#### Módulo: Hotel (10 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 83 | `habitacion` | Habitaciones |
| 84 | `habitacion_fotos` | Fotos habitaciones |
| 85 | `tipo_hab` | Tipos de habitación |
| 86 | `reserva` | Reservas |
| 87 | `reservahora` | Horarios de reserva |
| 88 | `pre_reserva` | Pre-reservas |
| 89 | `pre_reserva_com` | Complementos pre-reserva |
| 90 | `pre_reserva_hab` | Habitaciones pre-reserva |
| 91 | `pre_reserva_habi` | Habitaciones (alt) |
| 92 | `centralita` | Centralita telefónica |

#### Módulo: Reservas (10 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 93 | `reserva` | Reservas (duplicado) |
| 94 | `reservahora` | Horarios (duplicado) |
| 95 | `res_acuenta` | Reservas a cuenta |
| 96 | `res_com` | Complementos reserva |
| 97 | `res_conf_servicios` | Configuración servicios |
| 98 | `cupos` | Cupos disponibles |
| 99 | `dia` | Días calendario |
| 100 | `hora` | Horas |
| 101 | `estado` | Estados de reserva |
| 102 | `operaciones` | Operaciones reservas |

#### Módulo: Contabilidad (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 103 | `contabilidad` | Asientos contables |
| 104 | `eacuenta` | 🔥 Estados de cuenta |
| 105 | `gasto` | Gastos |

#### Módulo: Contadores y Configuración (6 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 106 | `contadores` | Contadores automáticos |
| 107 | `auxiliar` | Tabla auxiliar |
| 108 | `backup` | Backups |
| 109 | `claveadministrador` | Clave admin (duplicado) |
| 110 | `idioma` | Idiomas |
| 111 | `impresoras` | Configuración impresoras |

#### Módulo: Fabricación (4 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 112 | `orden_fabrica` | Órdenes de fabricación |
| 113 | `orden_matprima` | Materias primas |
| 114 | `orden_result` | Resultados fabricación |
| 115 | `fabricante` | Fabricantes |

#### Módulo: Packs y Promociones (4 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 116 | `pack` | Packs de productos |
| 117 | `pack_hosteleria` | Packs hostelería |
| 118 | `combinados` | Combinados |
| 119 | `combinados_hosteleria` | Combinados hostelería |
| 120 | `promociones` | Promociones |

#### Módulo: Presupuestos (2 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 121 | `presupuesto` | Presupuestos |
| 122 | `presu_comg` | Líneas de presupuesto |

#### Módulo: Contratos (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 123 | `contrato` | Contratos |
| 124 | `scontrato` | Sub-contratos |
| 125 | `scontrato_line` | Líneas de contrato |
| 126 | `scontrato_line_fecha` | Fechas líneas |

#### Módulo: Cuentas Corrientes (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 127 | `car_acuenta` | Cargos a cuenta |
| 128 | `car_com` | Complementos cargo |
| 129 | `car_comg` | Detalle cargos |

#### Módulo: OpenCart/eCommerce (5 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 130 | `opencart` | Integración OpenCart |
| 131 | `opencart_comg` | Productos OpenCart |
| 132 | `opencart_log` | Log sincronización |
| 133 | `opencart_remove` | Productos eliminados |
| 134 | `opencart_tipo_comg` | Categorías OpenCart |

#### Módulo: Bitcoin/Criptomonedas (3 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 135 | `bitcoin` | Billeteras Bitcoin |
| 136 | `bitcoinlabel` | Etiquetas |
| 137 | `bitchange` | Tipos de cambio |

#### Módulo: SMS (2 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 138 | `smsenvio` | Envíos SMS |
| 139 | `smsenvios` | Log envíos |

#### Módulo: Operaciones Complementarias (6 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 140 | `operaciones` | Operaciones generales |
| 141 | `operaciones_complementog` | Operaciones sobre productos |
| 142 | `consultas` | Consultas guardadas |
| 143 | `mensajes` | Mensajes internos |
| 144 | `notificaciones` | Notificaciones sistema |
| 145 | `reports` | Reportes personalizados |

#### Módulo: Navegación/UI (2 tablas)

| # | Tabla | Propósito |
|---|-------|-----------|
| 146 | `navigator_images` | Imágenes navegador |
| 147 | `form_textos` | Textos formularios |

---

## 🔥 TABLAS CRÍTICAS DEL NEGOCIO

### 1. Módulo de Ventas

#### Tabla: `ventadirecta`

**Propósito:** Cabecera de ventas (comandas abiertas y cerradas)

**Campos Identificados:**
```sql
CREATE TABLE ventadirecta (
    id_venta INT PRIMARY KEY AUTO_INCREMENT,
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    id_entidad INT,
    id_camarero INT,                    -- FK a camareros
    fecha_venta DATE,
    hora TIME,
    cerrada CHAR(1) DEFAULT 'N',        -- 'S'/'N' - Estado de la venta
    Num_Mesa VARCHAR(20),               -- FK a mesa
    id_caja INT,                        -- FK a cajas
    comensales INT,
    tarifa VARCHAR(50),                 -- Nombre de tarifa aplicada
    serie VARCHAR(10),                  -- Serie de facturación
    id_tiquet INT,                      -- FK a tiquet
    observaciones TEXT,

    INDEX idx_cerrada (cerrada),
    INDEX idx_mesa (Num_Mesa),
    INDEX idx_fecha (fecha_venta),
    INDEX idx_camarero (id_camarero)
);
```

**Query Ejemplo (del código):**
```php
// Crear nueva venta
INSERT INTO ventadirecta (
    id_venta, id_empresa, id_centro, id_entidad,
    id_camarero, fecha_venta, cerrada, Num_Mesa,
    id_caja, hora, comensales, tarifa
) VALUES (
    123, '001', '01', '2',
    5, CURDATE(), 'N', 'M01',
    1, CURTIME(), 4, 'Default'
);

// Cerrar venta
UPDATE ventadirecta
SET cerrada = 'S', serie = 'F', id_tiquet = 456
WHERE id_venta = 123;
```

---

#### Tabla: `ventadir_comg`

**Propósito:** Líneas de venta (productos de la comanda)

**Campos Identificados:**
```sql
CREATE TABLE ventadir_comg (
    id_linea INT,
    id_venta INT,                       -- FK a ventadirecta
    id_complementog VARCHAR(20),        -- FK a complementog
    id_tipo_comg VARCHAR(20),           -- FK a tipo_comg
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    cantidad DECIMAL(10,2),
    PVPTiquet DECIMAL(10,2),            -- Precio con IVA
    precio DECIMAL(10,2),               -- Precio sin IVA
    avgiva DECIMAL(5,2),                -- % IVA
    descuento DECIMAL(5,2) DEFAULT 0,   -- % Descuento
    total DECIMAL(10,2),                -- Total línea
    destino CHAR(1),                    -- 'V' = Venta
    id_almacen VARCHAR(20),             -- FK a almacen
    cocina INT DEFAULT 0,               -- Enviado a cocina
    complementog VARCHAR(255),          -- Nombre producto
    nota TEXT,                          -- Opciones/extras
    observaciones TEXT,                 -- Observaciones
    bloque_cocina INT,                  -- Bloque de envío cocina

    PRIMARY KEY (id_venta, id_linea),
    INDEX idx_complementog (id_complementog),
    INDEX idx_cocina (cocina),
    INDEX idx_bloque (bloque_cocina)
);
```

**Query Ejemplo:**
```php
// Añadir producto a venta
INSERT INTO ventadir_comg (
    id_complementog, id_venta, cantidad, id_tipo_comg,
    id_empresa, id_linea, id_centro, PVPTiquet,
    precio, avgiva, descuento, destino, id_almacen,
    cocina, complementog, total, nota, observaciones,
    bloque_cocina
) VALUES (
    'PROD001', 123, 2, 'BEBIDA',
    '001', 1, '01', 5.50,
    5.00, 10.00, 0, 'V', 'ALM001',
    0, 'Coca Cola', 11.00, '', '', 1
);

// Recalcular precio por cambio de tarifa
UPDATE ventadir_comg
SET precio = 4.50, total = 9.90
WHERE id_venta = 123 AND id_linea = 1;
```

---

#### Tabla: `tiquet`

**Propósito:** Tickets/facturas simplificadas emitidas

**Campos Identificados:**
```sql
CREATE TABLE tiquet (
    serie VARCHAR(10),
    id_tiquet INT,
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    fecha_tiquet DATE,
    horatiquet TIME,
    iva DECIMAL(10,2),
    total DECIMAL(10,2),

    PRIMARY KEY (serie, id_tiquet),
    INDEX idx_fecha (fecha_tiquet)
);
```

**Query Ejemplo:**
```php
// Generar ticket
$id_tiquet = obtenerSiguiente('F');
INSERT INTO tiquet (
    serie, id_tiquet, id_empresa, id_centro,
    fecha_tiquet, iva, total, horatiquet
) VALUES (
    'F', 1234, '001', '01',
    CURDATE(), 1, 45.50, CURTIME()
);
```

---

### 2. Módulo de Mesas

#### Tabla: `mesa`

**Propósito:** Mesas del restaurante (plano visual)

**Campos Identificados:**
```sql
CREATE TABLE mesa (
    Num_Mesa VARCHAR(20) PRIMARY KEY,
    descripcion VARCHAR(100),           -- "Mesa 1", "Barra", etc
    id_salon INT,                       -- FK a salon
    id_tarifa INT,                      -- FK a tarifa

    -- Posición en el mapa visual
    izq INT,                            -- Left (px)
    top INT,                            -- Top (px)
    width INT,                          -- Ancho (px)
    height INT,                         -- Alto (px)

    INDEX idx_salon (id_salon)
);
```

**Query Ejemplo:**
```php
// Listar mesas de un salón
SELECT * FROM mesa
WHERE Num_Mesa <> '00' AND id_salon = 1;

// Verificar si mesa tiene venta abierta
SELECT id_venta FROM ventadirecta
WHERE cerrada = 'N' AND Num_Mesa = 'M01';
```

**Renderizado en Mapa:**
```php
// Cálculo de posición responsive
$ancho_calculado = ($row['width'] * $_SESSION['ancho']) / $_SESSION['anchotpv'];
$left = ($row['izq'] * $_SESSION['ancho']) / $_SESSION['anchotpv'];
$top = ($row['top'] * $_SESSION['ancho']) / $_SESSION['anchotpv'];
```

---

#### Tabla: `salon`

**Propósito:** Salones/áreas del restaurante

**Campos Identificados:**
```sql
CREATE TABLE salon (
    id_salon INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    activo CHAR(1) DEFAULT 'S'
);
```

---

### 3. Módulo de Productos

#### Tabla: `complementog`

**Propósito:** Catálogo de productos

**Campos Identificados:**
```sql
CREATE TABLE complementog (
    id_complementog VARCHAR(20) PRIMARY KEY,
    complementog VARCHAR(255),          -- Nombre del producto
    id_tipo_comg VARCHAR(20),           -- FK a tipo_comg (categoría)
    precio DECIMAL(10,2),               -- Precio base sin IVA
    pvp DECIMAL(10,2),                  -- PVP con IVA
    avgIva DECIMAL(5,2),                -- % IVA
    activo CHAR(1) DEFAULT 'S',
    cafeteria CHAR(1) DEFAULT 'N',
    autoadd CHAR(1) DEFAULT 'N',        -- Auto-agregar al crear venta

    INDEX idx_tipo (id_tipo_comg),
    INDEX idx_activo (activo)
);
```

**Query Ejemplo:**
```php
// Obtener producto con precio
SELECT id_tipo_comg, complementog, precio, avgIva,
       (precio * (1 + (avgIva/100))) as pvp
FROM complementog
WHERE id_complementog = 'PROD001';

// Productos auto-add (ej: cubierto)
SELECT id_complementog, autoadd
FROM complementog
WHERE cafeteria = 'S' AND autoadd = 'S';
```

---

#### Tabla: `tipo_comg`

**Propósito:** Categorías de productos

**Campos Identificados:**
```sql
CREATE TABLE tipo_comg (
    id_tipo_comg VARCHAR(20) PRIMARY KEY,
    tipo_comg VARCHAR(100),             -- Nombre categoría
    padre VARCHAR(20),                  -- FK a tipo_comg (subcategorías)
    orden INT DEFAULT 0,
    activo CHAR(1) DEFAULT 'S',

    INDEX idx_padre (padre)
);
```

---

#### Tabla: `comg_tarifa`

**Propósito:** Precios de productos según tarifa (VIP, Mayorista, etc)

**Campos Identificados:**
```sql
CREATE TABLE comg_tarifa (
    id_complementog VARCHAR(20),        -- FK a complementog
    id_tarifa INT,                      -- FK a tarifa
    pvptarifa DECIMAL(10,2),            -- Precio especial con IVA

    PRIMARY KEY (id_complementog, id_tarifa),
    INDEX idx_tarifa (id_tarifa)
);
```

**Query Ejemplo:**
```php
// Obtener precio según tarifa de la mesa
SELECT pvptarifa FROM comg_tarifa
WHERE id_complementog = 'PROD001'
  AND id_tarifa IN (
      SELECT id_tarifa FROM mesa
      WHERE Num_Mesa = 'M01'
  );
```

---

### 4. Módulo de Tarifas

#### Tabla: `tarifa`

**Propósito:** Tarifas de precios (Default, VIP, Happy Hour, etc)

**Campos Identificados:**
```sql
CREATE TABLE tarifa (
    id_tarifa INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),                -- "Default", "VIP", "Happy Hour"
    activa CHAR(1) DEFAULT 'S',
    descripcion TEXT
);
```

---

### 5. Módulo de Caja

#### Tabla: `cajas`

**Propósito:** Cajas registradoras/TPVs

**Campos Identificados:**
```sql
CREATE TABLE cajas (
    id_caja INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),                -- "TPV1", "Barra", "Terraza"
    activa CHAR(1) DEFAULT 'S',
    id_almacen VARCHAR(20)              -- Almacén asociado
);
```

---

#### Tabla: `apcajas`

**Propósito:** Aperturas de caja (turnos)

**Campos Identificados:**
```sql
CREATE TABLE apcajas (
    id_apcajas INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,                        -- FK a cajas
    fecha_apertura DATE,
    hora_apertura TIME,
    fecha_cierre DATE NULL,
    hora_cierre TIME NULL,
    abierta CHAR(1) DEFAULT 'S',        -- 'S' = Abierta, 'N' = Cerrada
    id_camarero INT,                    -- Quién abrió
    fondo_inicial DECIMAL(10,2),

    INDEX idx_caja (id_caja),
    INDEX idx_abierta (abierta),
    INDEX idx_fecha (fecha_apertura)
);
```

**Query Ejemplo:**
```php
// Verificar si hay caja abierta
SELECT id_apcajas FROM apcajas
WHERE abierta = 'S' AND id_caja = 1;
```

---

#### Tabla: `pagoscobros`

**Propósito:** Movimientos de caja (pagos/cobros)

**Campos Identificados:**
```sql
CREATE TABLE pagoscobros (
    id_pagoscobros INT PRIMARY KEY AUTO_INCREMENT,
    tipo CHAR(1),                       -- 'E' = Entrada, 'S' = Salida
    id_venta INT NULL,                  -- FK a ventadirecta (si es venta)
    fecha DATE,
    hora TIME,
    descripcion VARCHAR(255),
    importe DECIMAL(10,2),
    id_modo_pago VARCHAR(20),           -- FK a modo_pago
    id_camarero INT,                    -- FK a camareros
    saldo DECIMAL(10,2),                -- Saldo acumulado
    id_tiquet INT NULL,                 -- FK a tiquet
    serie_fac VARCHAR(10),
    id_apcajas INT,                     -- FK a apcajas
    id_caja INT,                        -- FK a cajas

    INDEX idx_apcajas (id_apcajas),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
);
```

**Query Ejemplo:**
```php
// Registrar cobro de venta
$id_pagoscobros = obtenerSiguiente();
$saldo = obtenerSaldoActual($id_apcajas) + $total;

INSERT INTO pagoscobros (
    id_pagoscobros, tipo, id_venta, fecha, hora,
    descripcion, importe, id_modo_pago, id_camarero,
    saldo, id_tiquet, serie_fac, id_apcajas, id_caja
) VALUES (
    $id_pagoscobros, 'E', 123, CURDATE(), CURTIME(),
    'ticket F1234', 45.50, 'EFECTIVO', 5,
    $saldo, 1234, 'F', 10, 1
);
```

---

#### Tabla: `modo_pago`

**Propósito:** Formas de pago disponibles

**Campos Identificados:**
```sql
CREATE TABLE modo_pago (
    id_modo_pago VARCHAR(20) PRIMARY KEY,
    modo_pago VARCHAR(100),             -- "Efectivo", "Tarjeta", "Transferencia"
    activo CHAR(1) DEFAULT 'Y',
    defecto CHAR(1) DEFAULT 'N',        -- Forma de pago por defecto

    INDEX idx_activo (activo)
);
```

**Query Ejemplo:**
```php
// Listar formas de pago activas
SELECT * FROM modo_pago
WHERE activo = 'Y';
```

---

#### Tabla: `registrocajon`

**Propósito:** Registro de aperturas del cajón monedero

**Campos Identificados:**
```sql
CREATE TABLE registrocajon (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    id_camarero INT,
    fecha DATE,
    hora TIME,
    motivo VARCHAR(255),                -- Motivo de apertura

    INDEX idx_caja (id_caja),
    INDEX idx_fecha (fecha)
);
```

---

### 6. Módulo de Empleados

#### Tabla: `camareros`

**Propósito:** Empleados del sistema (camareros, cocineros, admin)

**Campos Identificados:**
```sql
CREATE TABLE camareros (
    id_camarero INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    clave VARCHAR(50),                  -- ⚠️ Probablemente texto plano
    activo CHAR(1) DEFAULT 'S',
    rol VARCHAR(50),                    -- 'Camarero', 'Cocinero', 'Admin'

    INDEX idx_activo (activo)
);
```

---

#### Tabla: `camarero_priv`

**Propósito:** Privilegios/permisos de empleados

**Campos Identificados:**
```sql
CREATE TABLE camarero_priv (
    id_camarero INT,
    privilegio VARCHAR(50),
    valor CHAR(1) DEFAULT 'N',

    PRIMARY KEY (id_camarero, privilegio)
);
```

---

### 7. Módulo de Clientes

#### Tabla: `cliente`

**Propósito:** Clientes del restaurante

**Campos Identificados:**
```sql
CREATE TABLE cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    nif VARCHAR(20),
    tipo_cliente INT,                   -- FK a tipo_cliente

    INDEX idx_email (email),
    INDEX idx_telefono (telefono)
);
```

---

### 8. Módulo de Inventario

#### Tabla: `stock`

**Propósito:** Stock actual de productos por almacén

**Campos Identificados:**
```sql
CREATE TABLE stock (
    id_complementog VARCHAR(20),
    id_almacen VARCHAR(20),
    stock DECIMAL(10,2),
    stock_minimo DECIMAL(10,2),
    stock_maximo DECIMAL(10,2),

    PRIMARY KEY (id_complementog, id_almacen),
    INDEX idx_almacen (id_almacen)
);
```

---

#### Tabla: `almacen`

**Propósito:** Almacenes/ubicaciones

**Campos Identificados:**
```sql
CREATE TABLE almacen (
    id_almacen VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100),
    activo CHAR(1) DEFAULT 'S'
);
```

---

#### Tabla: `traspasos`

**Propósito:** Traspasos de mercancía entre almacenes

**Campos Identificados:**
```sql
CREATE TABLE traspasos (
    id_traspaso INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    id_almacen_origen VARCHAR(20),
    id_almacen_destino VARCHAR(20),
    estado VARCHAR(20),                 -- 'Pendiente', 'Completado'

    INDEX idx_fecha (fecha)
);
```

---

### 9. Módulo de Cocina

#### Tabla: `venta_cocina`

**Propósito:** Cola de comandas para la cocina

**Campos Identificados:**
```sql
CREATE TABLE venta_cocina (
    id_venta INT,
    id_linea INT,
    enviado CHAR(1) DEFAULT 'N',
    fecha_envio DATETIME,
    preparado CHAR(1) DEFAULT 'N',
    fecha_preparado DATETIME NULL,

    PRIMARY KEY (id_venta, id_linea),
    INDEX idx_preparado (preparado)
);
```

---

#### Tabla: `notacocina`

**Propósito:** Notas/tickets de cocina

**Campos Identificados:**
```sql
CREATE TABLE notacocina (
    id_nota INT PRIMARY KEY AUTO_INCREMENT,
    id_venta INT,
    fecha DATE,
    hora TIME,
    impreso CHAR(1) DEFAULT 'N',

    INDEX idx_impreso (impreso)
);
```

---

### 10. Módulo de Reportes

#### Tabla: `zreport`

**Propósito:** Reportes Z (cierres de día)

**Campos Identificados:**
```sql
CREATE TABLE zreport (
    id_zreport INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    fecha DATE,
    total_ventas DECIMAL(10,2),
    total_efectivo DECIMAL(10,2),
    total_tarjeta DECIMAL(10,2),
    num_tickets INT,

    INDEX idx_caja (id_caja),
    INDEX idx_fecha (fecha)
);
```

---

#### Tabla: `eacuenta`

**Propósito:** Estados de cuenta/extractos

**Campos Identificados:**
```sql
CREATE TABLE eacuenta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    concepto VARCHAR(255),
    debe DECIMAL(10,2),
    haber DECIMAL(10,2),
    saldo DECIMAL(10,2)
);
```

---

## 🔗 RELACIONES Y FOREIGN KEYS

### Relaciones Principales Identificadas

```
ventadirecta
    ├─> camareros (id_camarero)
    ├─> mesa (Num_Mesa)
    ├─> cajas (id_caja)
    └─> tiquet (serie, id_tiquet)

ventadir_comg
    ├─> ventadirecta (id_venta)
    ├─> complementog (id_complementog)
    ├─> tipo_comg (id_tipo_comg)
    └─> almacen (id_almacen)

mesa
    ├─> salon (id_salon)
    └─> tarifa (id_tarifa)

complementog
    └─> tipo_comg (id_tipo_comg)

comg_tarifa
    ├─> complementog (id_complementog)
    └─> tarifa (id_tarifa)

apcajas
    ├─> cajas (id_caja)
    └─> camareros (id_camarero)

pagoscobros
    ├─> ventadirecta (id_venta)
    ├─> modo_pago (id_modo_pago)
    ├─> camareros (id_camarero)
    ├─> apcajas (id_apcajas)
    ├─> cajas (id_caja)
    └─> tiquet (id_tiquet, serie_fac)

venta_cocina
    └─> ventadirecta (id_venta)
```

### Diagrama ER Simplificado

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  camareros  │──┐    │   mesa       │──┐    │   salon     │
└─────────────┘  │    └──────────────┘  │    └─────────────┘
                 │                      │
                 ├──┐                   │
                 │  v                   v
┌─────────────┐  │ ┌──────────────────────────┐
│   cajas     │──┼─>   ventadirecta          │
└─────────────┘  │ └──────────────────────────┘
                 │           │
                 │           │ 1:N
                 │           v
┌─────────────┐  │ ┌──────────────────────────┐     ┌──────────────┐
│  tiquet     │<─┘ │   ventadir_comg         │────>│ complementog │
└─────────────┘    └──────────────────────────┘     └──────────────┘
                             │                              │
                             v                              v
                   ┌──────────────┐              ┌──────────────┐
                   │   almacen    │              │  tipo_comg   │
                   └──────────────┘              └──────────────┘
```

---

## 🔍 ANÁLISIS DE INTEGRIDAD

### Problemas Potenciales

⚠️ **1. NO Hay Foreign Keys Explícitas**
- Las relaciones existen por convención, NO por constraints
- Riesgo de datos huérfanos
- NO hay `ON DELETE CASCADE` o `ON UPDATE CASCADE`

⚠️ **2. Campos de Tipo Texto para IDs**
```sql
-- Ejemplo:
id_complementog VARCHAR(20)  -- Debería ser INT
id_tipo_comg VARCHAR(20)     -- Debería ser INT
```

⚠️ **3. Charset latin1**
- NO soporta emojis ni caracteres Unicode completos
- Problemas con nombres internacionales (ñ, á, ü, etc)

⚠️ **4. Tablas Duplicadas**
```sql
ventadirecta + ventadirecta2
tiquet + tiquet2
apcajas + apcajas2
pagoscobros + pagoscobros2
```
**Razón probable:** Sistema de backup/histórico manual

⚠️ **5. Ausencia de Timestamps Automáticos**
```sql
-- NO hay:
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

⚠️ **6. Contadores Manuales**
```sql
-- Código obtiene siguiente ID manualmente:
SELECT (1 + id_venta) as nuevo_id
FROM ventadirecta
ORDER BY id_venta DESC LIMIT 1;

-- Riesgo de duplicados en concurrencia
```

### Puntos Positivos

✅ **1. InnoDB con Transacciones**
- Soporte ACID
- Rollback en caso de error

✅ **2. Índices en Campos Clave**
- Búsquedas por fecha optimizadas
- Filtros por estado eficientes

✅ **3. Separación Lógica**
- Tablas bien separadas por módulos
- Nomenclatura consistente

---

## 📋 RECOMENDACIONES PARA MIGRACIÓN

### Prioridad ALTA

1. **Añadir Foreign Keys**
```sql
ALTER TABLE ventadirecta
ADD CONSTRAINT fk_ventadirecta_camarero
FOREIGN KEY (id_camarero) REFERENCES camareros(id_camarero);

ALTER TABLE ventadir_comg
ADD CONSTRAINT fk_ventadir_venta
FOREIGN KEY (id_venta) REFERENCES ventadirecta(id_venta)
ON DELETE CASCADE;
```

2. **Migrar a utf8mb4**
```sql
ALTER DATABASE sysmehotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE ventadirecta CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ... repetir para todas las tablas
```

3. **Usar AUTO_INCREMENT para IDs**
```sql
ALTER TABLE ventadirecta
MODIFY id_venta INT AUTO_INCREMENT;
```

4. **Añadir Timestamps**
```sql
ALTER TABLE ventadirecta
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

### Prioridad MEDIA

5. **Normalizar Tipos de IDs**
```sql
-- Cambiar VARCHAR(20) a INT donde corresponda
ALTER TABLE complementog
MODIFY id_complementog INT AUTO_INCREMENT;
```

6. **Añadir Soft Deletes**
```sql
ALTER TABLE ventadirecta
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- En lugar de DELETE, usar:
UPDATE ventadirecta SET deleted_at = NOW() WHERE id_venta = 123;
```

7. **Índices Compuestos**
```sql
CREATE INDEX idx_venta_cerrada_fecha
ON ventadirecta (cerrada, fecha_venta);

CREATE INDEX idx_linea_venta_producto
ON ventadir_comg (id_venta, id_complementog);
```

### Prioridad BAJA

8. **Consolidar Tablas Duplicadas**
- Evaluar si `ventadirecta2` es necesaria
- Considerar particionamiento por fecha en lugar de duplicar tablas

9. **Migrar a UUID**
```sql
-- Para el nuevo sistema
CREATE TABLE pago (
    id CHAR(36) PRIMARY KEY,  -- UUID
    venta_id CHAR(36),
    -- ...
);
```

---

## 🎯 CONCLUSIONES

### Fortalezas de la BD Legacy

✅ **Estructura Completa y Funcional**
- 157 tablas cubren todos los casos de uso
- Sistema probado en producción
- Separación lógica clara

✅ **InnoDB con Transacciones**
- Integridad ACID
- Recuperación ante fallos

### Debilidades Críticas

❌ **Seguridad e Integridad**
- Sin foreign keys
- Sin constraints
- Charset obsoleto
- Contadores manuales

❌ **Mantenibilidad**
- Nomenclatura inconsistente
- Tablas duplicadas
- Sin auditoría automática

### Estrategia de Migración Recomendada

**Fase 1: Extracción de Datos**
- Dump completo de `sysmehotel`
- Análisis de datos huérfanos
- Limpieza de inconsistencias

**Fase 2: Mapeo a Nuevo Schema**
- Crear tablas en nuevo sistema con:
  - UUIDs
  - Foreign keys
  - Timestamps
  - Soft deletes
  - utf8mb4

**Fase 3: ETL**
- Script de migración de datos
- Validación de integridad
- Testing exhaustivo

**Fase 4: Sincronización Dual**
- Mantener ambos sistemas temporalmente
- Doble escritura durante transición
- Validación continua

**Fase 5: Cutover**
- Migración final
- Deprecar sistema legacy
- Monitoring post-migración

---

## 📚 SIGUIENTE PASO

Ver documentación complementaria:

- **[LEGACY-POS-STRUCTURE.md](./LEGACY-POS-STRUCTURE.md)** - Estructura del sistema
- **[LEGACY-POS-WORKFLOW.md](./LEGACY-POS-WORKFLOW.md)** - Flujo operacional del restaurante

---

**FIN DEL DOCUMENTO**

Análisis de Base de Datos del POS Legacy - Paso 2 de 3 Completado
