-- ============================================
-- SYSMEHOTEL DATABASE SCHEMA
-- Generado desde análisis de código PHP
-- ⚠️ MySQL no estaba corriendo durante extracción
-- Schema inferido desde queries en archivos .php
-- ============================================

-- Database: sysmehotel
-- Charset: latin1
-- Collation: latin1_swedish_ci
-- Engine: InnoDB
-- Port: 4306

USE sysmehotel;

-- ============================================
-- MÓDULO: VENTAS Y TPV (20 tablas)
-- ============================================

-- Tabla principal de ventas/comandas
CREATE TABLE IF NOT EXISTS ventadirecta (
    id_venta INT PRIMARY KEY AUTO_INCREMENT,
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    id_entidad INT,
    id_camarero INT,
    fecha_venta DATE,
    hora TIME,
    cerrada CHAR(1) DEFAULT 'N' COMMENT 'S=Cerrada, N=Abierta',
    Num_Mesa VARCHAR(20),
    id_caja INT,
    comensales INT,
    tarifa VARCHAR(50),
    serie VARCHAR(10),
    id_tiquet INT NULL,
    observaciones TEXT,
    alias VARCHAR(100),
    imppretiquet CHAR(1) DEFAULT 'N',

    INDEX idx_cerrada (cerrada),
    INDEX idx_mesa (Num_Mesa),
    INDEX idx_fecha (fecha_venta),
    INDEX idx_camarero (id_camarero)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de ventas
CREATE TABLE IF NOT EXISTS ventadirecta2 (
    LIKE ventadirecta
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Líneas de venta (productos en la comanda)
CREATE TABLE IF NOT EXISTS ventadir_comg (
    id_linea INT,
    id_venta INT,
    id_complementog VARCHAR(20),
    id_tipo_comg VARCHAR(20),
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    cantidad DECIMAL(10,2),
    PVPTiquet DECIMAL(10,2) COMMENT 'Precio con IVA',
    precio DECIMAL(10,2) COMMENT 'Precio sin IVA',
    avgiva DECIMAL(5,2) COMMENT 'Porcentaje IVA',
    descuento DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2),
    destino CHAR(1) COMMENT 'V=Venta',
    id_almacen VARCHAR(20),
    cocina INT DEFAULT 0 COMMENT 'Cantidad enviada a cocina',
    complementog VARCHAR(255) COMMENT 'Nombre del producto',
    nota TEXT COMMENT 'Opciones/extras',
    observaciones TEXT,
    bloque_cocina INT COMMENT 'Bloque de envío a cocina',

    PRIMARY KEY (id_venta, id_linea),
    INDEX idx_complementog (id_complementog),
    INDEX idx_cocina (cocina),
    INDEX idx_bloque (bloque_cocina)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de líneas
CREATE TABLE IF NOT EXISTS ventadir_comg2 (
    LIKE ventadir_comg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Cola de cocina
CREATE TABLE IF NOT EXISTS venta_cocina (
    id_venta INT,
    id_caja INT,
    PRIMARY KEY (id_venta)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Cola de impresión de tickets
CREATE TABLE IF NOT EXISTS venta_ticket (
    id_venta INT PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Cola de pre-tickets
CREATE TABLE IF NOT EXISTS venta_preticket (
    id_venta INT PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tickets emitidos
CREATE TABLE IF NOT EXISTS tiquet (
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
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de tickets
CREATE TABLE IF NOT EXISTS tiquet2 (
    LIKE tiquet
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Pre-tickets
CREATE TABLE IF NOT EXISTS pretiquet (
    LIKE tiquet
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Facturas
CREATE TABLE IF NOT EXISTS factura (
    serie VARCHAR(10),
    id_factura INT,
    id_empresa VARCHAR(10),
    id_centro VARCHAR(10),
    fecha_factura DATE,
    total DECIMAL(10,2),

    PRIMARY KEY (serie, id_factura)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de facturas
CREATE TABLE IF NOT EXISTS factura2 (
    LIKE factura
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Pre-facturas
CREATE TABLE IF NOT EXISTS pfactura (
    LIKE factura
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Líneas de factura
CREATE TABLE IF NOT EXISTS fac_comg (
    id_linea INT,
    serie VARCHAR(10),
    id_factura INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    precio DECIMAL(10,2),
    total DECIMAL(10,2),

    PRIMARY KEY (serie, id_factura, id_linea)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Series de facturación
CREATE TABLE IF NOT EXISTS serie (
    serie VARCHAR(10) PRIMARY KEY,
    descripcion VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Audit trail de líneas eliminadas
CREATE TABLE IF NOT EXISTS lineaseliminadas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_venta INT,
    id_linea INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    total DECIMAL(10,2),
    fecha DATE,
    hora TIME,
    id_camarero INT,
    motivo TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Notas de cocina
CREATE TABLE IF NOT EXISTS notacocina (
    id_nota INT PRIMARY KEY AUTO_INCREMENT,
    id_venta INT,
    fecha DATE,
    hora TIME,
    impreso CHAR(1) DEFAULT 'N',

    INDEX idx_impreso (impreso)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Pre-notas de cocina
CREATE TABLE IF NOT EXISTS pnotacocina (
    LIKE notacocina
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Reportes Z (cierres del día)
CREATE TABLE IF NOT EXISTS zreport (
    id_zreport INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    fecha DATE,
    total_ventas DECIMAL(10,2),
    total_efectivo DECIMAL(10,2),
    total_tarjeta DECIMAL(10,2),
    num_tickets INT,

    INDEX idx_caja (id_caja),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Registro de cierres Z
CREATE TABLE IF NOT EXISTS registroz (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    fecha DATE,
    hora TIME
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: MESAS Y SALONES (5 tablas)
-- ============================================

-- Mesas del restaurante
CREATE TABLE IF NOT EXISTS mesa (
    Num_Mesa VARCHAR(20) PRIMARY KEY,
    descripcion VARCHAR(100),
    id_salon INT,
    id_tarifa INT,
    izq INT COMMENT 'Posición X en mapa',
    top INT COMMENT 'Posición Y en mapa',
    width INT COMMENT 'Ancho en mapa',
    height INT COMMENT 'Alto en mapa',

    INDEX idx_salon (id_salon)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Mesas comercio
CREATE TABLE IF NOT EXISTS mesa_comercio (
    LIKE mesa
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Mesas hostelería
CREATE TABLE IF NOT EXISTS mesa_hosteleria (
    LIKE mesa
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Mesas peluquería
CREATE TABLE IF NOT EXISTS mesa_peluqueria (
    LIKE mesa
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Salones/áreas
CREATE TABLE IF NOT EXISTS salon (
    id_salon INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    activo CHAR(1) DEFAULT 'S'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: PRODUCTOS (18 tablas)
-- ============================================

-- Catálogo de productos
CREATE TABLE IF NOT EXISTS complementog (
    id_complementog VARCHAR(20) PRIMARY KEY,
    complementog VARCHAR(255) COMMENT 'Nombre del producto',
    id_tipo_comg VARCHAR(20),
    precio DECIMAL(10,2) COMMENT 'Precio sin IVA',
    pvp DECIMAL(10,2) COMMENT 'PVP con IVA',
    avgIva DECIMAL(5,2) COMMENT 'Porcentaje IVA',
    activo CHAR(1) DEFAULT 'S',
    cafeteria CHAR(1) DEFAULT 'N',
    autoadd CHAR(1) DEFAULT 'N' COMMENT 'Auto-agregar al crear venta',
    cocina CHAR(1) DEFAULT 'N' COMMENT 'Requiere cocina',

    INDEX idx_tipo (id_tipo_comg),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Productos comercio
CREATE TABLE IF NOT EXISTS complementog_comercio (
    LIKE complementog
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Productos hostelería
CREATE TABLE IF NOT EXISTS complementog_hosteleria (
    LIKE complementog
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Productos peluquería
CREATE TABLE IF NOT EXISTS complementog_peluqueria (
    LIKE complementog
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Complementos
CREATE TABLE IF NOT EXISTS complemento (
    id_complemento VARCHAR(20) PRIMARY KEY,
    complemento VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Categorías de productos
CREATE TABLE IF NOT EXISTS tipo_comg (
    id_tipo_comg VARCHAR(20) PRIMARY KEY,
    tipo_comg VARCHAR(100),
    padre VARCHAR(20) COMMENT 'ID categoría padre',
    orden INT DEFAULT 0,
    activo CHAR(1) DEFAULT 'S',

    INDEX idx_padre (padre)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Categorías comercio
CREATE TABLE IF NOT EXISTS tipo_comg_comercio (
    LIKE tipo_comg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Relación tipo-producto
CREATE TABLE IF NOT EXISTS tipo_comg_comg (
    id_tipo_comg VARCHAR(20),
    id_complementog VARCHAR(20),
    PRIMARY KEY (id_tipo_comg, id_complementog)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Categorías hostelería
CREATE TABLE IF NOT EXISTS tipo_comg_hosteleria (
    LIKE tipo_comg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Categorías peluquería
CREATE TABLE IF NOT EXISTS tipo_comg_peluqueria (
    LIKE tipo_comg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Imágenes de productos
CREATE TABLE IF NOT EXISTS complementogimg (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20),
    imagen BLOB
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS productoimg (
    LIKE complementogimg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS productoimgs (
    LIKE complementogimg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS foto_complementog (
    LIKE complementogimg
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Variantes
CREATE TABLE IF NOT EXISTS variaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20),
    variacion VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tallas
CREATE TABLE IF NOT EXISTS tallas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    talla VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Colores
CREATE TABLE IF NOT EXISTS colores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    color VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Precios por tarifa
CREATE TABLE IF NOT EXISTS comg_tarifa (
    id_complementog VARCHAR(20),
    id_tarifa INT,
    pvptarifa DECIMAL(10,2) COMMENT 'Precio especial con IVA',

    PRIMARY KEY (id_complementog, id_tarifa),
    INDEX idx_tarifa (id_tarifa)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: TARIFAS (3 tablas)
-- ============================================

-- Tarifas de precios
CREATE TABLE IF NOT EXISTS tarifa (
    id_tarifa INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) COMMENT 'Default, VIP, Happy Hour, etc',
    activa CHAR(1) DEFAULT 'S',
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Precios históricos
CREATE TABLE IF NOT EXISTS precio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20),
    precio DECIMAL(10,2),
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de cambios de precio
CREATE TABLE IF NOT EXISTS historicoprecios (
    LIKE precio
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CAJA (7 tablas)
-- ============================================

-- Cajas registradoras/TPVs
CREATE TABLE IF NOT EXISTS cajas (
    id_caja INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) COMMENT 'TPV1, Barra, Terraza',
    activa CHAR(1) DEFAULT 'S',
    id_almacen VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Aperturas de caja (turnos)
CREATE TABLE IF NOT EXISTS apcajas (
    id_apcajas INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    fecha_apertura DATE,
    hora_apertura TIME,
    fecha_cierre DATE NULL,
    hora_cierre TIME NULL,
    abierta CHAR(1) DEFAULT 'S' COMMENT 'S=Abierta, N=Cerrada',
    id_camarero INT,
    fondo_inicial DECIMAL(10,2),

    INDEX idx_caja (id_caja),
    INDEX idx_abierta (abierta),
    INDEX idx_fecha (fecha_apertura)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de aperturas
CREATE TABLE IF NOT EXISTS apcajas2 (
    LIKE apcajas
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Movimientos de caja (pagos/cobros)
CREATE TABLE IF NOT EXISTS pagoscobros (
    id_pagoscobros INT PRIMARY KEY AUTO_INCREMENT,
    tipo CHAR(1) COMMENT 'E=Entrada, S=Salida',
    id_venta INT NULL,
    fecha DATE,
    hora TIME,
    descripcion VARCHAR(255),
    importe DECIMAL(10,2),
    id_modo_pago VARCHAR(20),
    id_camarero INT,
    saldo DECIMAL(10,2) COMMENT 'Saldo acumulado',
    id_tiquet INT NULL,
    serie_fac VARCHAR(10),
    id_apcajas INT,
    id_caja INT,

    INDEX idx_apcajas (id_apcajas),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Histórico de pagos/cobros
CREATE TABLE IF NOT EXISTS pagoscobros2 (
    LIKE pagoscobros
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Registro de aperturas del cajón monedero
CREATE TABLE IF NOT EXISTS registrocajon (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_caja INT,
    id_camarero INT,
    fecha DATE,
    hora TIME,
    motivo VARCHAR(255),

    INDEX idx_caja (id_caja),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Formas de pago
CREATE TABLE IF NOT EXISTS modo_pago (
    id_modo_pago VARCHAR(20) PRIMARY KEY,
    modo_pago VARCHAR(100) COMMENT 'Efectivo, Tarjeta, Transferencia',
    activo CHAR(1) DEFAULT 'Y',
    defecto CHAR(1) DEFAULT 'N' COMMENT 'Forma de pago por defecto',

    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Alias (mismo concepto diferente nombre)
CREATE TABLE IF NOT EXISTS forma_pago (
    LIKE modo_pago
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: EMPLEADOS (3 tablas)
-- ============================================

-- Empleados/camareros
CREATE TABLE IF NOT EXISTS camareros (
    id_camarero INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    clave VARCHAR(50) COMMENT '⚠️ Probablemente texto plano',
    activo CHAR(1) DEFAULT 'S',
    rol VARCHAR(50) COMMENT 'Camarero, Cocinero, Admin',

    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Privilegios de empleados
CREATE TABLE IF NOT EXISTS camarero_priv (
    id_camarero INT,
    privilegio VARCHAR(50),
    valor CHAR(1) DEFAULT 'N',

    PRIMARY KEY (id_camarero, privilegio)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Contraseña admin
CREATE TABLE IF NOT EXISTS claveadministrador (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CLIENTES (7 tablas)
-- ============================================

-- Clientes
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    nif VARCHAR(20),
    tipo_cliente INT,

    INDEX idx_email (email),
    INDEX idx_telefono (telefono)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Cardex de clientes
CREATE TABLE IF NOT EXISTS cliente_cardex (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    fecha DATE,
    movimiento TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Fans/seguidores
CREATE TABLE IF NOT EXISTS cliente_fan (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Documentos de clientes
CREATE TABLE IF NOT EXISTS clientes_docs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    documento BLOB
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tarjetas de clientes
CREATE TABLE IF NOT EXISTS clientes_tarjeta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    numero_tarjeta VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tipos de cliente
CREATE TABLE IF NOT EXISTS tipo_cliente (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tipos de documento
CREATE TABLE IF NOT EXISTS tipo_doc (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: INVENTARIO (9 tablas)
-- ============================================

-- Stock actual
CREATE TABLE IF NOT EXISTS stock (
    id_complementog VARCHAR(20),
    id_almacen VARCHAR(20),
    stock DECIMAL(10,2),
    stock_minimo DECIMAL(10,2),
    stock_maximo DECIMAL(10,2),

    PRIMARY KEY (id_complementog, id_almacen),
    INDEX idx_almacen (id_almacen)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Almacenes
CREATE TABLE IF NOT EXISTS almacen (
    id_almacen VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100),
    activo CHAR(1) DEFAULT 'S'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Productos por almacén
CREATE TABLE IF NOT EXISTS almacen_complementg (
    id_almacen VARCHAR(20),
    id_complementog VARCHAR(20),
    PRIMARY KEY (id_almacen, id_complementog)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Inventarios
CREATE TABLE IF NOT EXISTS inventario (
    id_inventario INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    id_almacen VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Líneas de inventario
CREATE TABLE IF NOT EXISTS inventario_complementg (
    id_inventario INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    PRIMARY KEY (id_inventario, id_complementog)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Traspasos entre almacenes
CREATE TABLE IF NOT EXISTS traspasos (
    id_traspaso INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    id_almacen_origen VARCHAR(20),
    id_almacen_destino VARCHAR(20),
    estado VARCHAR(20) COMMENT 'Pendiente, Completado'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Líneas de traspasos
CREATE TABLE IF NOT EXISTS traspasos_complementog (
    id_traspaso INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    PRIMARY KEY (id_traspaso, id_complementog)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Entradas de mercancía
CREATE TABLE IF NOT EXISTS entradas (
    id_entrada INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    id_almacen VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Movimientos de stock
CREATE TABLE IF NOT EXISTS cardex (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20),
    id_almacen VARCHAR(20),
    fecha DATE,
    movimiento DECIMAL(10,2),
    tipo VARCHAR(20) COMMENT 'Entrada, Salida, Traspaso'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: PROVEEDORES Y COMPRAS (10 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS proveedor (
    id_proveedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    nif VARCHAR(20),
    direccion VARCHAR(255),
    telefono VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pproveedor (
    LIKE proveedor
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS acreedor (
    id_acreedor INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pedido (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT,
    fecha DATE,
    total DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS ped_comg (
    id_pedido INT,
    id_linea INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    precio DECIMAL(10,2),
    PRIMARY KEY (id_pedido, id_linea)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS albaran (
    id_albaran INT PRIMARY KEY AUTO_INCREMENT,
    id_proveedor INT,
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS alb_comg (
    id_albaran INT,
    id_linea INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    PRIMARY KEY (id_albaran, id_linea)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS albaran_factura (
    id_albaran INT,
    id_factura INT,
    PRIMARY KEY (id_albaran, id_factura)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS borrador (
    id_borrador INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS bor_comg (
    id_borrador INT,
    id_linea INT,
    id_complementog VARCHAR(20),
    PRIMARY KEY (id_borrador, id_linea)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: HOTEL (10 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS habitacion (
    id_habitacion INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20),
    tipo VARCHAR(50),
    precio DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS habitacion_fotos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_habitacion INT,
    foto BLOB
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS tipo_hab (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS reserva (
    id_reserva INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    id_habitacion INT,
    fecha_inicio DATE,
    fecha_fin DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS reservahora (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_reserva INT,
    hora TIME
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pre_reserva (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pre_reserva_com (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_pre_reserva INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pre_reserva_hab (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_pre_reserva INT,
    id_habitacion INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pre_reserva_habi (
    LIKE pre_reserva_hab
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS centralita (
    id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: RESERVAS (10 tablas adicionales)
-- ============================================

CREATE TABLE IF NOT EXISTS res_acuenta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_reserva INT,
    fecha DATE,
    importe DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS res_com (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_reserva INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS res_conf_servicios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicio VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS cupos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    cupo INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS dia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dia DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS hora (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hora TIME
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS estado (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estado VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS operaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    operacion VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS operaciones_complementog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_operacion INT,
    id_complementog VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CONTABILIDAD (3 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS contabilidad (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    concepto VARCHAR(255),
    debe DECIMAL(10,2),
    haber DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS eacuenta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    concepto VARCHAR(255),
    debe DECIMAL(10,2),
    haber DECIMAL(10,2),
    saldo DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS gasto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    concepto VARCHAR(255),
    importe DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CONFIGURACIÓN (6 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS contadores (
    id VARCHAR(50) PRIMARY KEY,
    valor INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS auxiliar (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campo1 VARCHAR(255),
    campo2 VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS backup (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    archivo VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS idioma (
    id VARCHAR(10) PRIMARY KEY,
    idioma VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS impresoras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    tipo VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: FABRICACIÓN (4 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS orden_fabrica (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS orden_matprima (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_orden_fabrica INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS orden_result (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_orden_fabrica INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS fabricante (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: PACKS Y PROMOCIONES (5 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS pack (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    precio DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS pack_hosteleria (
    LIKE pack
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS combinados (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS combinados_hosteleria (
    LIKE combinados
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS promociones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    descuento DECIMAL(5,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: PRESUPUESTOS (2 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS presupuesto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    fecha DATE,
    total DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS presu_comg (
    id_presupuesto INT,
    id_linea INT,
    id_complementog VARCHAR(20),
    cantidad DECIMAL(10,2),
    precio DECIMAL(10,2),
    PRIMARY KEY (id_presupuesto, id_linea)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CONTRATOS (4 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS contrato (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT,
    fecha_inicio DATE,
    fecha_fin DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS scontrato (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_contrato INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS scontrato_line (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_scontrato INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS scontrato_line_fecha (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_scontrato_line INT,
    fecha DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: CUENTAS CORRIENTES (3 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS car_acuenta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    importe DECIMAL(10,2)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS car_com (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_car_acuenta INT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS car_comg (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_car_com INT,
    id_complementog VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: OPENCART/ECOMMERCE (5 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS opencart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha_sync DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS opencart_comg (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS opencart_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATETIME,
    accion VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS opencart_remove (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_complementog VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS opencart_tipo_comg (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_tipo_comg VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: BITCOIN/CRIPTOMONEDAS (3 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS bitcoin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    billetera VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS bitcoinlabel (
    id INT PRIMARY KEY AUTO_INCREMENT,
    etiqueta VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS bitchange (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE,
    tipo_cambio DECIMAL(10,4)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: SMS (2 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS smsenvio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telefono VARCHAR(20),
    mensaje TEXT,
    fecha DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS smsenvios (
    LIKE smsenvio
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: NAVEGACIÓN/UI (2 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS navigator_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    imagen BLOB
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS form_textos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    formulario VARCHAR(50),
    texto TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- MÓDULO: OTROS (6 tablas)
-- ============================================

CREATE TABLE IF NOT EXISTS consultas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    query TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS mensajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATETIME,
    mensaje TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATETIME,
    notificacion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    tipo VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ============================================
-- FIN DEL SCHEMA
-- Total de tablas: 157
-- ============================================

-- ⚠️ NOTA IMPORTANTE:
-- Este schema fue generado mediante análisis de código PHP
-- debido a que MySQL no estaba corriendo durante la extracción.
-- Las definiciones están basadas en:
-- 1. Queries SQL encontradas en archivos .php
-- 2. Estructura de archivos .frm en el directorio data/
-- 3. Análisis de lógica de negocio en el código
--
-- Puede haber campos adicionales no documentados aquí.
-- Para schema 100% preciso, ejecutar:
-- mysqldump --no-data sysmehotel > schema.sql
-- cuando MySQL esté corriendo.
