-- MySQL dump 10.11
--
-- Host: 127.0.0.1    Database: sysmehotel
-- ------------------------------------------------------
-- Server version	5.0.51b-community-nt

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acreedor`
--

DROP TABLE IF EXISTS `acreedor`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `acreedor` (
  `Id_Acreedor` varchar(4) NOT NULL default '',
  `Nif` varchar(9) NOT NULL default '',
  `Razon_Social` varchar(100) NOT NULL default '',
  `Observaciones` varchar(250) default NULL,
  `cp` varchar(5) default NULL,
  `Provincia` varchar(100) default NULL,
  `Poblacion` varchar(100) default NULL,
  `Dirección` varchar(200) default NULL,
  `telefono` varchar(9) default NULL,
  `fax` varchar(9) default NULL,
  `email` varchar(50) default NULL,
  `movil` varchar(9) default NULL,
  `persona_contacto` varchar(100) default NULL,
  `web` varchar(50) default NULL,
  `ctacontable` varchar(20) default '',
  PRIMARY KEY  (`Id_Acreedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `alb_comg`
--

DROP TABLE IF EXISTS `alb_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `alb_comg` (
  `Id_Albaran` varchar(15) NOT NULL default '',
  `Id_Empresa` char(3) NOT NULL default '',
  `Id_Centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `cantidad` float default NULL,
  `Precio` double NOT NULL default '0',
  `Total` double NOT NULL default '0',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_proveedor` varchar(4) default NULL,
  `almacenado` char(1) default NULL,
  `id_almacen` char(2) default NULL,
  `avgiva` float default NULL,
  `descuento` int(11) default NULL,
  `variacion` int(11) NOT NULL default '0',
  `desc_variacion` varchar(100) default '',
  `impuesto2` float default '0',
  `fecha` datetime default NULL,
  PRIMARY KEY  (`Id_Albaran`,`Id_Empresa`,`Id_Centro`,`id_tipo_comg`,`id_complementog`,`variacion`),
  KEY `FK_alb_comg` (`Id_Empresa`,`Id_Centro`,`id_tipo_comg`,`id_complementog`),
  KEY `FK_comg_alb` (`Id_Albaran`),
  KEY `FK_alb_comg_alb` (`Id_Albaran`,`id_proveedor`),
  KEY `fk_almcomg_proveedor` (`id_proveedor`),
  CONSTRAINT `fk_albaran` FOREIGN KEY (`Id_Albaran`) REFERENCES `albaran` (`Id_Albaran`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `albaran`
--

DROP TABLE IF EXISTS `albaran`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `albaran` (
  `Id_Albaran` varchar(15) NOT NULL default '',
  `Id_Proveedor` varchar(100) NOT NULL default '',
  `Fecha_Albaran` date NOT NULL default '0000-00-00',
  `Total` double NOT NULL default '0',
  `Iva` double NOT NULL default '0',
  `AvgIva` smallint(6) NOT NULL default '0',
  `Base_Imponible` double NOT NULL default '0',
  `descuento` int(11) default NULL,
  `dtopp` int(11) default '0',
  `Rec` int(11) default '0',
  `observaciones` varchar(250) default '',
  PRIMARY KEY  (`Id_Albaran`,`Id_Proveedor`),
  KEY `FK_Albaran_Proveedor` (`Id_Proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `albaran_factura`
--

DROP TABLE IF EXISTS `albaran_factura`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `albaran_factura` (
  `id_albaran` varchar(15) NOT NULL,
  `id_factura` varchar(20) NOT NULL,
  `id_proveedor` varchar(4) NOT NULL,
  PRIMARY KEY  (`id_albaran`,`id_factura`,`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `almacen`
--

DROP TABLE IF EXISTS `almacen`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `almacen` (
  `id_empresa` char(3) NOT NULL default '',
  `id_almacen` char(2) NOT NULL default '',
  `ubicacion` varchar(200) default NULL,
  `nom_almacen` varchar(200) default NULL,
  `observaciones` varchar(30) default NULL,
  `stock_real` char(1) NOT NULL default 'Y',
  PRIMARY KEY  (`id_almacen`,`id_empresa`),
  KEY `fk_almacen_empresa` (`id_empresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `almacen_complementg`
--

DROP TABLE IF EXISTS `almacen_complementg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `almacen_complementg` (
  `id_centro` char(2) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_almacen` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float NOT NULL default '0',
  `stock_minimo` float default NULL,
  `precio_ponderado` float default NULL,
  `precio_ultima` float default NULL,
  `complementog` varchar(100) default NULL,
  `variacion` int(11) NOT NULL default '0',
  `desc_variacion` varchar(100) default '',
  PRIMARY KEY  (`id_centro`,`id_empresa`,`id_almacen`,`id_tipo_comg`,`id_complementog`,`variacion`),
  KEY `fk_almacen_complementg_comg` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `fk_almacen_complementg_comg` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `apcajas`
--

DROP TABLE IF EXISTS `apcajas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `apcajas` (
  `id_caja` int(3) NOT NULL default '1',
  `id_camarero` varchar(20) NOT NULL default '1',
  `fecha_apertura` date NOT NULL default '0000-00-00',
  `hora_apertura` time NOT NULL default '00:00:00',
  `cambio_inicial` float NOT NULL default '0',
  `fecha_cierre` date default NULL,
  `hora_cierre` time default NULL,
  `abierta` char(1) NOT NULL default '',
  `cambio_final` float default NULL,
  `cambio_finalreal` float default NULL,
  `id_apcajas` int(11) default '0',
  PRIMARY KEY  (`id_caja`,`id_camarero`,`fecha_apertura`,`hora_apertura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `apcajas2`
--

DROP TABLE IF EXISTS `apcajas2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `apcajas2` (
  `id_caja` int(3) NOT NULL default '1',
  `id_camarero` varchar(20) character set utf8 NOT NULL default '1',
  `fecha_apertura` date NOT NULL default '0000-00-00',
  `hora_apertura` time NOT NULL default '00:00:00',
  `cambio_inicial` float NOT NULL default '0',
  `fecha_cierre` date default NULL,
  `hora_cierre` time default NULL,
  `abierta` char(1) character set utf8 NOT NULL default '',
  `cambio_final` float default NULL,
  `cambio_finalreal` float default NULL,
  `id_apcajas` int(11) default '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `auxiliar`
--

DROP TABLE IF EXISTS `auxiliar`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `auxiliar` (
  `ID` int(11) NOT NULL default '0',
  `campo1` varchar(100) default '',
  `campo2` varchar(100) default '',
  `campo3` varchar(100) default '',
  `campo4` varchar(100) default '',
  `campo5` varchar(100) default '',
  `campo6` varchar(100) default '',
  `campo7` varchar(100) default '',
  `campo8` text,
  `Real1` float default NULL,
  `Real2` float default NULL,
  `Real3` float default NULL,
  `Real4` float default NULL,
  `Real5` float default NULL,
  `Real6` float default NULL,
  `Real7` float default NULL,
  `Real8` float default NULL,
  `foto1` mediumblob,
  `fecha1` date default NULL,
  `fecha2` date default NULL,
  `fecha3` date default NULL,
  PRIMARY KEY  (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `backup`
--

DROP TABLE IF EXISTS `backup`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `backup` (
  `id` int(11) NOT NULL auto_increment,
  `fecha` date default NULL,
  `ruta` varchar(250) default '',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bitchange`
--

DROP TABLE IF EXISTS `bitchange`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `bitchange` (
  `symbol` varchar(15) NOT NULL,
  `currency` varchar(3) default '',
  `close` float default '0',
  `last_trade` float default '0',
  PRIMARY KEY  (`symbol`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bitcoin`
--

DROP TABLE IF EXISTS `bitcoin`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `bitcoin` (
  `active` char(1) NOT NULL default 'N',
  `id_modo_pago` char(2) default '',
  `currency` varchar(5) default '',
  `rpchost` varchar(50) default 'localhost',
  `rpcport` varchar(5) default '8332',
  `rpcuser` varchar(50) default '',
  `rpcpasswd` varchar(50) default '',
  PRIMARY KEY  (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bitcoinlabel`
--

DROP TABLE IF EXISTS `bitcoinlabel`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `bitcoinlabel` (
  `address` varchar(100) NOT NULL,
  `label` varchar(50) default '',
  `amount` float default '0',
  `receibed` char(1) default 'N',
  `confirmations` int(3) default '0',
  `qr` mediumblob,
  PRIMARY KEY  (`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bor_comg`
--

DROP TABLE IF EXISTS `bor_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `bor_comg` (
  `id_borrador` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `precio` float default NULL,
  `cantidad` int(3) default NULL,
  PRIMARY KEY  (`id_borrador`,`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `bor_comg_ibfk_1` FOREIGN KEY (`id_borrador`) REFERENCES `borrador` (`id_borrador`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bor_comg_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `borrador`
--

DROP TABLE IF EXISTS `borrador`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `borrador` (
  `serie` char(1) NOT NULL default 'B',
  `id_borrador` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `dni` varchar(9) default NULL,
  `id_entidad` char(3) default NULL,
  `observaciones` varchar(249) default NULL,
  `fecha_borrador` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `huesped` varchar(9) default NULL,
  `bi` float default NULL,
  `ci` float default NULL,
  `tf` float default NULL,
  `ec` float default NULL,
  `tp` float default NULL,
  PRIMARY KEY  (`id_borrador`),
  KEY `id_empresa` (`id_empresa`,`id_centro`),
  KEY `dni` (`dni`),
  KEY `id_entidad` (`id_entidad`),
  CONSTRAINT `borrador_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON UPDATE CASCADE,
  CONSTRAINT `borrador_ibfk_2` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE,
  CONSTRAINT `borrador_ibfk_3` FOREIGN KEY (`id_entidad`) REFERENCES `sysme`.`entidad` (`id_entidad`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cajas`
--

DROP TABLE IF EXISTS `cajas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cajas` (
  `id_caja` int(2) NOT NULL default '0',
  `Nombre` varchar(20) NOT NULL default '',
  `Descripcion` varchar(50) NOT NULL default '',
  PRIMARY KEY  (`id_caja`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `camarero_priv`
--

DROP TABLE IF EXISTS `camarero_priv`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `camarero_priv` (
  `id_camarero` int(3) NOT NULL,
  `priv` varchar(3) NOT NULL,
  PRIMARY KEY  (`id_camarero`,`priv`),
  CONSTRAINT `camarero_priv_ibfk_1` FOREIGN KEY (`id_camarero`) REFERENCES `camareros` (`id_camarero`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `camareros`
--

DROP TABLE IF EXISTS `camareros`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `camareros` (
  `id_camarero` int(3) NOT NULL default '0',
  `nombre` varchar(40) NOT NULL default '',
  `foto` blob,
  `ClaveCamarero` varchar(20) default NULL,
  `activo` char(1) default 'S',
  `invitacion` char(1) default 'Y',
  `modtiquet` char(1) default 'Y',
  `cancelartiquet` char(1) default 'Y',
  `preciomanual` char(1) default 'Y',
  `abrircajon` char(1) default 'Y',
  `borrarlinea` char(1) default 'Y',
  `modtraspreticket` char(1) default 'S',
  `finrotura` char(1) default 'S',
  `fininvitacion` char(1) default 'S',
  `finautoconsumo` char(1) default 'S',
  `finotros` char(1) default 'S',
  `dividirventa` char(1) default 'S',
  `eliminarimpuestos` char(1) default 'S',
  `aparcarticket` char(1) default 'S',
  `cambiartarifa` char(1) default 'S',
  `recuperarpendientes` char(1) default 'S',
  `anulartickets` char(1) default 'S',
  `anularfacturas` char(1) default 'S',
  `configurarventas` char(1) default 'S',
  `finalizarventas` char(1) default 'Y',
  `preticket` char(1) default 'Y',
  `recuperadeotros` char(1) default 'Y',
  `verpreciocompra` char(1) default 'Y',
  `puedeimprimircierre` char(1) default 'Y',
  `cambiastock` char(1) default 'Y',
  PRIMARY KEY  (`id_camarero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `car_acuenta`
--

DROP TABLE IF EXISTS `car_acuenta`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `car_acuenta` (
  `contador` int(12) NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` char(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `cantidad` float default NULL,
  `fecha` date NOT NULL default '0000-00-00',
  `id_modo_pago` char(2) NOT NULL default '',
  `id_factura` int(7) default NULL,
  `id_borrador` int(7) default NULL,
  `serie_fac` char(10) default NULL,
  PRIMARY KEY  (`contador`,`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `car_acuenta_cardex` (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `car_acuenta_modo_pago` (`id_modo_pago`),
  KEY `fk_car_acuenta_factura` (`id_factura`),
  KEY `dk_car_acuenta_borrador` (`id_borrador`),
  KEY `fk_car_acuenta_fac` (`id_factura`,`serie_fac`),
  CONSTRAINT `car_acuenta_cardex` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `cardex` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON UPDATE CASCADE,
  CONSTRAINT `car_acuenta_modo_pago` FOREIGN KEY (`id_modo_pago`) REFERENCES `modo_pago` (`id_modo_pago`) ON UPDATE CASCADE,
  CONSTRAINT `dk_car_acuenta_borrador` FOREIGN KEY (`id_borrador`) REFERENCES `borrador` (`id_borrador`) ON UPDATE CASCADE,
  CONSTRAINT `fk_car_acuenta_fac` FOREIGN KEY (`id_factura`, `serie_fac`) REFERENCES `factura` (`id_factura`, `serie`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `car_com`
--

DROP TABLE IF EXISTS `car_com`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `car_com` (
  `contador` int(12) NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `id_tipo_habc` char(2) NOT NULL default '',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  `id_factura` int(7) default NULL,
  `id_borrador` int(7) default NULL,
  `precio` float(12,6) default NULL,
  `cantidad` int(6) default NULL,
  `fecha_servicio` date NOT NULL default '0000-00-00',
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `iva` float default NULL,
  `comentario` varchar(45) NOT NULL default '',
  `impuesto2` float default NULL,
  `impuesto3` int(3) default '0',
  `serie_fac` char(10) default NULL,
  `id_pre_reserva` int(10) default '0',
  PRIMARY KEY  (`contador`,`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`,`id_tipo_habc`,`id_tipo_com`,`id_complemento`),
  KEY `id_tipo_habc` (`id_tipo_habc`,`id_tipo_com`,`id_complemento`),
  KEY `id_factura` (`id_factura`),
  KEY `id_borrador` (`id_borrador`),
  KEY `fk_car_com_contrato` (`id_entidad`,`id_contrato`),
  KEY `car_com_ibfk_1` (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `fk_car_com_factura` (`id_factura`,`serie_fac`),
  CONSTRAINT `car_com_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `cardex` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_com_ibfk_2` FOREIGN KEY (`id_tipo_habc`, `id_tipo_com`, `id_complemento`) REFERENCES `complemento` (`id_tipo_hab`, `id_tipo_com`, `id_complemento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_com_ibfk_3` FOREIGN KEY (`id_factura`) REFERENCES `factura` (`id_factura`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_com_ibfk_4` FOREIGN KEY (`id_borrador`) REFERENCES `borrador` (`id_borrador`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_car_com_factura` FOREIGN KEY (`id_factura`, `serie_fac`) REFERENCES `factura` (`id_factura`, `serie`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `car_comg`
--

DROP TABLE IF EXISTS `car_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `car_comg` (
  `contador` int(12) NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_factura` int(7) default NULL,
  `id_borrador` int(7) default NULL,
  `precio` float(12,6) default NULL,
  `cantidad` int(6) default NULL,
  `fecha_servico` date NOT NULL default '0000-00-00',
  `iva` float default NULL,
  `comentario` varchar(45) NOT NULL default '',
  `id_almacen` char(2) default NULL,
  `impuesto2` float default '0',
  `impuesto3` int(3) default '0',
  `serie_fac` char(10) default NULL,
  PRIMARY KEY  (`contador`,`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`,`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_factura` (`id_factura`),
  KEY `id_borrador` (`id_borrador`),
  KEY `car_comg_ibfk_1` (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `fk_car_comg_factura` (`id_factura`,`serie_fac`),
  CONSTRAINT `car_comg_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `cardex` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_comg_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_comg_ibfk_3` FOREIGN KEY (`id_factura`) REFERENCES `factura` (`id_factura`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `car_comg_ibfk_4` FOREIGN KEY (`id_borrador`) REFERENCES `borrador` (`id_borrador`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_car_comg_factura` FOREIGN KEY (`id_factura`, `serie_fac`) REFERENCES `factura` (`id_factura`, `serie`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cardex`
--

DROP TABLE IF EXISTS `cardex`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cardex` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `dni` varchar(15) default NULL,
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `observaciones` text,
  `pax` int(2) NOT NULL default '0',
  `locself` varchar(10) NOT NULL default '',
  `locent` varchar(10) NOT NULL default '',
  `nombre` varchar(100) default NULL,
  `apellidos` varchar(150) default NULL,
  `check_out` char(1) NOT NULL default 'N',
  `adultos` int(2) NOT NULL default '0',
  `ninyos` int(2) NOT NULL default '0',
  `jubilados` int(2) NOT NULL default '0',
  `fantasma` char(1) default 'F',
  `dnifact` varchar(15) default NULL,
  `nombrednifact` varchar(75) default '',
  `apellidosdnifact` varchar(75) default '',
  `id_pre_reserva` int(10) default '0',
  `id_fichapolicia` varchar(10) default NULL,
  `apellido2dnifact` varchar(50) default '',
  `color` varchar(50) default '',
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `id_entidad` (`id_entidad`,`id_contrato`),
  KEY `dni` (`dni`),
  CONSTRAINT `cardex_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`) REFERENCES `habitacion` (`id_tipo_hab`, `id_habitacion`) ON UPDATE CASCADE,
  CONSTRAINT `cardex_ibfk_2` FOREIGN KEY (`id_entidad`, `id_contrato`) REFERENCES `contrato` (`id_entidad`, `id_contrato`) ON UPDATE CASCADE,
  CONSTRAINT `cardex_ibfk_3` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `centralita`
--

DROP TABLE IF EXISTS `centralita`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `centralita` (
  `id_centralita` int(10) unsigned NOT NULL auto_increment,
  `campo` varchar(20) NOT NULL default '',
  `posicion` int(10) unsigned NOT NULL default '0',
  `longitud` int(10) unsigned NOT NULL default '0',
  PRIMARY KEY  (`id_centralita`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `claveadministrador`
--

DROP TABLE IF EXISTS `claveadministrador`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `claveadministrador` (
  `clave` varchar(20) NOT NULL default ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cliente` (
  `dni` varchar(15) NOT NULL default '',
  `nombre` varchar(75) NOT NULL default '',
  `apellidos` varchar(150) NOT NULL default '',
  `id_pais` varchar(5) default NULL,
  `direccion` varchar(249) default NULL,
  `id_tipo_cliente` char(2) default NULL,
  `id_tipo_doc` char(1) default NULL,
  `id_provincia` char(2) default NULL,
  `id_poblacion` varchar(6) default NULL,
  `cp` varchar(10) default NULL,
  `tf1` varchar(20) default NULL,
  `tf2` varchar(20) default NULL,
  `email1` varchar(40) default NULL,
  `email2` varchar(40) default NULL,
  `observaciones` text,
  `poblacion` varchar(249) default NULL,
  `ctacontable` varchar(20) default NULL,
  `sexo` char(1) NOT NULL default 'M',
  `fecha_nacimiento` date default NULL,
  `fecha_expedicion` date default NULL,
  `foto` blob,
  `id_camarero` int(3) default '0',
  `representante` varchar(50) default '',
  `marca` varchar(50) default '',
  `pais` varchar(200) default NULL,
  `provincia` varchar(250) default '',
  `caut` varchar(200) default NULL,
  `apellido2` varchar(250) default '',
  `contador` int(11) NOT NULL auto_increment,
  `contador2` varchar(20) default '',
  `idoc` char(15) default '0',
  `sujetoimp2` char(1) default 'N',
  `boletin` char(1) default 'N',
  PRIMARY KEY  (`dni`),
  KEY `id_tipo_cliente` (`id_tipo_cliente`),
  KEY `id_pais` (`id_pais`),
  KEY `fk_cliente_tipo_doc` (`id_tipo_doc`),
  KEY `contador` (`contador`),
  CONSTRAINT `cliente_ibfk_1` FOREIGN KEY (`id_tipo_cliente`) REFERENCES `tipo_cliente` (`id_tipo_cliente`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cliente_tipo_doc` FOREIGN KEY (`id_tipo_doc`) REFERENCES `tipo_doc` (`id_tipo_doc`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cliente_cardex`
--

DROP TABLE IF EXISTS `cliente_cardex`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cliente_cardex` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `dni` varchar(15) NOT NULL,
  `id_fichapolicia` varchar(10) default NULL,
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`,`dni`),
  KEY `FK_cliente_cardex_2` (`dni`),
  CONSTRAINT `FK_cliente_cardex_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `cardex` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_cliente_cardex_2` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cliente_fan`
--

DROP TABLE IF EXISTS `cliente_fan`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cliente_fan` (
  `dni` varchar(9) NOT NULL default '',
  `nombre` varchar(75) NOT NULL default '',
  `apellidos` varchar(150) NOT NULL default '',
  `id_pais` char(3) NOT NULL default '',
  `direccion` varchar(249) default NULL,
  `id_tipo_cliente` char(2) default NULL,
  `id_tipo_doc` char(1) default NULL,
  `id_provincia` char(2) default NULL,
  `id_poblacion` varchar(6) default NULL,
  `cp` varchar(5) default NULL,
  `tf1` varchar(9) default NULL,
  `tf2` varchar(9) default NULL,
  `email1` varchar(40) default NULL,
  `email2` varchar(40) default NULL,
  `observaciones` text,
  `poblacion` varchar(249) default NULL,
  `ctacontable` varchar(20) default NULL,
  `sexo` char(1) NOT NULL default 'M',
  `fecha_nacimiento` date NOT NULL default '0000-00-00',
  `fecha_expedicion` date NOT NULL default '0000-00-00',
  `foto` blob,
  PRIMARY KEY  (`dni`),
  KEY `id_tipo_cliente` (`id_tipo_cliente`),
  KEY `id_pais` (`id_pais`),
  KEY `fk_cliente_tipo_doc` (`id_tipo_doc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `clientes_docs`
--

DROP TABLE IF EXISTS `clientes_docs`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `clientes_docs` (
  `dni` varchar(15) NOT NULL,
  `id_documento` int(10) NOT NULL auto_increment,
  `observaciones` varchar(45) default NULL,
  `fecha_captura` date default NULL,
  `imagen` mediumblob,
  PRIMARY KEY  (`id_documento`,`dni`),
  KEY `FK_docscliente` (`dni`),
  CONSTRAINT `FK_cli` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `clientes_tarjeta`
--

DROP TABLE IF EXISTS `clientes_tarjeta`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `clientes_tarjeta` (
  `dni` varchar(9) NOT NULL default '',
  `id_tarjeta` int(10) unsigned NOT NULL auto_increment,
  `observaciones` varchar(45) default NULL,
  `fecha_caducidad` date default NULL,
  `imagen` mediumblob,
  `numerotarjeta` varchar(45) default NULL,
  PRIMARY KEY  (`id_tarjeta`,`dni`),
  KEY `FK_client_tarj` (`dni`),
  CONSTRAINT `FK_cli_tarj` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `colores`
--

DROP TABLE IF EXISTS `colores`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `colores` (
  `id_color` varchar(4) NOT NULL default '',
  `nombre` varchar(100) default NULL,
  `imagen` mediumblob,
  PRIMARY KEY  (`id_color`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `combinados`
--

DROP TABLE IF EXISTS `combinados`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `combinados` (
  `id_empresa` char(3) character set latin1 NOT NULL default '',
  `id_centro` char(2) character set latin1 NOT NULL default '',
  `id_tipo_comg` varchar(4) character set latin1 NOT NULL default '',
  `id_complementog` varchar(5) character set latin1 NOT NULL default '',
  `id_empresa1` char(3) character set latin1 NOT NULL default '',
  `id_centro1` char(2) character set latin1 NOT NULL default '',
  `id_tipo_comg1` varchar(4) character set latin1 NOT NULL default '',
  `id_complementog1` varchar(5) character set latin1 NOT NULL default '',
  `pack_generado` varchar(5) character set latin1 NOT NULL default '',
  `precio` float NOT NULL default '0',
  `cocina` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`,`id_empresa1`,`id_centro1`,`id_tipo_comg1`,`id_complementog1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `combinados_hosteleria`
--

DROP TABLE IF EXISTS `combinados_hosteleria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `combinados_hosteleria` (
  `id_empresa` char(3) character set latin1 NOT NULL default '',
  `id_centro` char(2) character set latin1 NOT NULL default '',
  `id_tipo_comg` varchar(4) character set latin1 NOT NULL default '',
  `id_complementog` varchar(5) character set latin1 NOT NULL default '',
  `id_empresa1` char(3) character set latin1 NOT NULL default '',
  `id_centro1` char(2) character set latin1 NOT NULL default '',
  `id_tipo_comg1` varchar(4) character set latin1 NOT NULL default '',
  `id_complementog1` varchar(5) character set latin1 NOT NULL default '',
  `pack_generado` varchar(5) character set latin1 NOT NULL default '',
  `precio` float NOT NULL default '0',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`,`id_empresa1`,`id_centro1`,`id_tipo_comg1`,`id_complementog1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `comg_tarifa`
--

DROP TABLE IF EXISTS `comg_tarifa`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `comg_tarifa` (
  `id_tarifa` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(3) NOT NULL default '',
  `pvptarifa` float NOT NULL default '0',
  `activo` tinyint(1) default '0',
  PRIMARY KEY  (`id_tarifa`,`id_complementog`,`id_tipo_comg`,`id_empresa`,`id_centro`),
  KEY `FK_tarifa_comg` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `FK_comg_tarifa_tarifa` FOREIGN KEY (`id_tarifa`) REFERENCES `tarifa` (`id_tarifa`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complemento`
--

DROP TABLE IF EXISTS `complemento`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complemento` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  `complemento` varchar(100) NOT NULL default '',
  `ctacontable` varchar(20) default NULL,
  `generar_auto` char(1) NOT NULL default 'N',
  `avgiva` float default NULL,
  `impuesto2` float default NULL,
  `impuesto3` int(3) default '0',
  `cocina` char(1) default 'Y',
  PRIMARY KEY  (`id_tipo_hab`,`id_tipo_com`,`id_complemento`),
  KEY `id_tipo_com` (`id_tipo_com`),
  CONSTRAINT `complemento_ibfk_1` FOREIGN KEY (`id_tipo_hab`) REFERENCES `tipo_hab` (`id_tipo_hab`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `complemento_ibfk_2` FOREIGN KEY (`id_tipo_com`) REFERENCES `tipo_com` (`id_tipo_com`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complementog`
--

DROP TABLE IF EXISTS `complementog`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complementog` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `complementog` varchar(100) default NULL,
  `precio` float(12,6) default NULL,
  `precio_coste` float(12,6) default NULL,
  `avgiva` float default NULL,
  `imagen` mediumblob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) NOT NULL default '',
  `PVP` float default NULL,
  `ivainc` char(1) default 'N',
  `codbarras` varchar(20) default '0',
  `Venta` char(1) default NULL,
  `Compra` char(1) default NULL,
  `Inventario` char(1) default NULL,
  `ctacontable` varchar(20) default NULL,
  `idinterno` varchar(20) default NULL,
  `unidad` varchar(30) default NULL,
  `sujetoarecequi` char(1) default 'N',
  `sujetoaretenciones` char(1) default 'N',
  `tipo_comg_depende` varchar(4) default NULL,
  `complementog_depende` varchar(5) default NULL,
  `id_talla` varchar(4) default NULL,
  `id_color` varchar(4) default NULL,
  `descatalogado` char(1) default 'N',
  `visible_escaparate` char(1) default 'N',
  `visible_web` char(1) default 'Y',
  `subido_web` char(1) default 'N',
  `novedad` char(1) default 'N',
  `oferta` char(1) default 'N',
  `precio_pack` float(12,6) default NULL,
  `precio_caja` float(12,6) default NULL,
  `cant_pack` varchar(5) default '0',
  `cant_caja` varchar(5) default '0',
  `precio_compra` float default '0',
  `precio_compra_pack` float default '0',
  `precio_compra_caja` float default '0',
  `descripcion` text,
  `cocina` char(1) default 'N',
  `impuesto2` float default '0',
  `impuesto3` int(3) default '0',
  `observaciones` text,
  `favorito` char(1) default 'N',
  `impresora` varchar(200) default '',
  `sort_order` int(6) default '0',
  `autoadd` char(1) default 'N',
  `permitircambioprecio` char(1) default 'S',
  `solicitaopciones` char(1) default 'N',
  `tipo_combinado` char(1) default '1',
  `opcion_combinado` char(1) default '1',
  `id_fabricante` varchar(10) default NULL,
  `friendly` varchar(200) default NULL,
  `html` text,
  `sincopencart` char(1) default 'N',
  `date_mod` datetime default NULL,
  `date_sinc` datetime default NULL,
  `alias` varchar(100) default NULL,
  `panelcocina` int(2) default '1',
  `peso` float default '0',
  `pvr` float default '0',
  `sinchtml` char(1) default 'Y',
  `impresora2` varchar(200) default '',
  `bloque_cocina` int(1) default '0',
  `fifo` char(1) default 'Y',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_tipo_comg` (`id_tipo_comg`),
  KEY `id_complementog` (`id_complementog`),
  KEY `id_complementog_2` (`id_complementog`),
  KEY `id_complementog_3` (`id_complementog`),
  KEY `id_complementog_4` (`id_complementog`),
  KEY `id_complementog_5` (`id_complementog`),
  KEY `id_complementog_6` (`id_complementog`),
  KEY `id_complementog_7` (`id_complementog`),
  KEY `id_complementog_8` (`id_complementog`),
  KEY `id_complementog_9` (`id_complementog`),
  KEY `id_complementog_10` (`id_complementog`),
  KEY `id_complementog_11` (`id_complementog`),
  KEY `id_complementog_12` (`id_complementog`),
  KEY `id_complementog_13` (`id_complementog`),
  KEY `id_complementog_14` (`id_complementog`),
  KEY `id_complementog_15` (`id_complementog`),
  KEY `id_complementog_16` (`id_complementog`),
  KEY `id_complementog_17` (`id_complementog`),
  KEY `id_complementog_18` (`id_complementog`),
  KEY `id_complementog_19` (`id_complementog`),
  CONSTRAINT `FK_complementog_ibfk1` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_complementog_ibfk2` FOREIGN KEY (`id_tipo_comg`) REFERENCES `tipo_comg` (`id_tipo_comg`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complementog_comercio`
--

DROP TABLE IF EXISTS `complementog_comercio`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complementog_comercio` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `complementog` varchar(100) default NULL,
  `precio` float(12,6) default NULL,
  `precio_coste` float(12,6) default NULL,
  `avgIva` smallint(6) NOT NULL default '7',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) NOT NULL default '',
  `PVP` float default NULL,
  `ivainc` char(1) default 'N',
  `codbarras` varchar(20) default '0',
  `Venta` char(1) default NULL,
  `Compra` char(1) default NULL,
  `Inventario` char(1) default NULL,
  `ctacontable` varchar(20) default NULL,
  `idinterno` varchar(20) default NULL,
  `unidad` varchar(30) default NULL,
  `sujetoarecequi` char(1) default 'N',
  `sujetoaretenciones` char(1) default 'N',
  `tipo_comg_depende` varchar(4) default NULL,
  `complementog_depende` varchar(5) default NULL,
  `id_talla` varchar(4) default NULL,
  `id_color` varchar(4) default NULL,
  `descatalogado` char(1) default 'N',
  `visible_escaparate` char(1) default 'N',
  `visible_web` char(1) default 'Y',
  `subido_web` char(1) default 'N',
  `novedad` char(1) default 'N',
  `oferta` char(1) default 'N',
  `precio_pack` float(12,6) default NULL,
  `precio_caja` float(12,6) default NULL,
  `cant_pack` varchar(5) default '0',
  `cant_caja` varchar(5) default '0',
  `precio_compra` float default '0',
  `precio_compra_pack` float default '0',
  `precio_compra_caja` float default '0',
  `descripcion` varchar(250) default NULL,
  `cocina` char(1) default 'N',
  `impuesto2` int(3) default '0',
  `impuesto3` int(3) default '0',
  `observaciones` text,
  `favorito` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complementog_hosteleria`
--

DROP TABLE IF EXISTS `complementog_hosteleria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complementog_hosteleria` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `complementog` varchar(100) default NULL,
  `precio` float(12,6) default NULL,
  `precio_coste` float(12,6) default NULL,
  `avgIva` smallint(6) NOT NULL default '7',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) NOT NULL default '',
  `PVP` float default NULL,
  `ivainc` char(1) default 'N',
  `codbarras` varchar(20) default '0',
  `Venta` char(1) default NULL,
  `Compra` char(1) default NULL,
  `Inventario` char(1) default NULL,
  `ctacontable` varchar(20) default NULL,
  `idinterno` varchar(20) default NULL,
  `unidad` varchar(30) default NULL,
  `sujetoarecequi` char(1) default 'N',
  `sujetoaretenciones` char(1) default 'N',
  `tipo_comg_depende` varchar(4) default NULL,
  `complementog_depende` varchar(5) default NULL,
  `id_talla` varchar(4) default NULL,
  `id_color` varchar(4) default NULL,
  `descatalogado` char(1) default 'N',
  `visible_escaparate` char(1) default 'N',
  `visible_web` char(1) default 'Y',
  `subido_web` char(1) default 'N',
  `novedad` char(1) default 'N',
  `oferta` char(1) default 'N',
  `precio_pack` float(12,6) default NULL,
  `precio_caja` float(12,6) default NULL,
  `cant_pack` varchar(5) default '0',
  `cant_caja` varchar(5) default '0',
  `precio_compra` float default '0',
  `precio_compra_pack` float default '0',
  `precio_compra_caja` float default '0',
  `descripcion` varchar(250) default NULL,
  `cocina` char(1) default 'N',
  `impuesto2` int(3) default '0',
  `impuesto3` int(3) default '0',
  `observaciones` text,
  `favorito` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complementog_peluqueria`
--

DROP TABLE IF EXISTS `complementog_peluqueria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complementog_peluqueria` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `complementog` varchar(100) default NULL,
  `precio` float(12,6) default NULL,
  `precio_coste` float(12,6) default NULL,
  `avgIva` smallint(6) NOT NULL default '7',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) NOT NULL default '',
  `PVP` float default NULL,
  `ivainc` char(1) default 'N',
  `codbarras` varchar(20) default '0',
  `Venta` char(1) default NULL,
  `Compra` char(1) default NULL,
  `Inventario` char(1) default NULL,
  `ctacontable` varchar(20) default NULL,
  `idinterno` varchar(20) default NULL,
  `unidad` varchar(30) default NULL,
  `sujetoarecequi` char(1) default 'N',
  `sujetoaretenciones` char(1) default 'N',
  `tipo_comg_depende` varchar(4) default NULL,
  `complementog_depende` varchar(5) default NULL,
  `id_talla` varchar(4) default NULL,
  `id_color` varchar(4) default NULL,
  `descatalogado` char(1) default 'N',
  `visible_escaparate` char(1) default 'N',
  `visible_web` char(1) default 'Y',
  `subido_web` char(1) default 'N',
  `novedad` char(1) default 'N',
  `oferta` char(1) default 'N',
  `precio_pack` float(12,6) default NULL,
  `precio_caja` float(12,6) default NULL,
  `cant_pack` varchar(5) default '0',
  `cant_caja` varchar(5) default '0',
  `precio_compra` float default '0',
  `precio_compra_pack` float default '0',
  `precio_compra_caja` float default '0',
  `descripcion` varchar(250) default NULL,
  `cocina` char(1) default 'N',
  `impuesto2` int(3) default '0',
  `impuesto3` int(3) default '0',
  `observaciones` text,
  `favorito` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `complementogimg`
--

DROP TABLE IF EXISTS `complementogimg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `complementogimg` (
  `id_complementog` varchar(5) character set utf8 NOT NULL default '',
  `imagen` mediumblob,
  PRIMARY KEY  (`id_complementog`),
  CONSTRAINT `fk_comg_img` FOREIGN KEY (`id_complementog`) REFERENCES `complementog` (`id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `consultas`
--

DROP TABLE IF EXISTS `consultas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `consultas` (
  `id` int(11) NOT NULL auto_increment,
  `titulo` varchar(250) default '',
  `consulta` text,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `contabilidad`
--

DROP TABLE IF EXISTS `contabilidad`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `contabilidad` (
  `id_contabilidad` char(2) NOT NULL default '',
  `ctaclientes` varchar(20) default NULL,
  `ctacomg_hotel` varchar(20) default NULL,
  `ctacomg_cafeteria` varchar(20) default NULL,
  `ruta_conta_diario` varchar(100) default NULL,
  `ruta_conta_subcuenta` varchar(100) default NULL,
  `ruta_conta_asiento` varchar(100) default NULL,
  `ventas` varchar(20) NOT NULL default '',
  `compras` varchar(20) NOT NULL default '',
  `caja` varchar(20) NOT NULL default '',
  `iva_repercutivo` varchar(20) NOT NULL default '',
  `iva_soportado` varchar(20) NOT NULL default '',
  PRIMARY KEY  (`id_contabilidad`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `contadores`
--

DROP TABLE IF EXISTS `contadores`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `contadores` (
  `factura` varchar(10) character set latin1 NOT NULL default '0',
  `policiagrupo` varchar(10) character set latin1 NOT NULL default '0',
  `policiaindividual` varchar(10) character set latin1 NOT NULL default '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `contrato`
--

DROP TABLE IF EXISTS `contrato`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `contrato` (
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `nombre` varchar(75) NOT NULL default '',
  `descripcion` varchar(249) default NULL,
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `pasante` char(1) NOT NULL default 'N',
  `activo` char(1) default 'S',
  PRIMARY KEY  (`id_entidad`,`id_contrato`),
  CONSTRAINT `contrato_ibfk_1` FOREIGN KEY (`id_entidad`) REFERENCES `sysme`.`entidad` (`id_entidad`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `cupos`
--

DROP TABLE IF EXISTS `cupos`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `cupos` (
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `id_tipo_hab` char(2) NOT NULL default '',
  `cupo` int(3) NOT NULL default '0',
  `release` int(3) NOT NULL default '0',
  `fecha_desde` date NOT NULL default '0000-00-00',
  `fecha_hasta` date NOT NULL default '0000-00-00',
  PRIMARY KEY  (`id_entidad`,`id_contrato`,`id_tipo_hab`,`fecha_hasta`,`fecha_desde`),
  KEY `fk_cupos_tipo_hab` (`id_tipo_hab`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `dia`
--

DROP TABLE IF EXISTS `dia`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `dia` (
  `dia` date NOT NULL default '2004-01-01',
  `id` char(1) NOT NULL default '',
  `hotel` char(1) default NULL,
  `comercio` char(1) default NULL,
  `version` varchar(200) default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `eacuenta`
--

DROP TABLE IF EXISTS `eacuenta`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `eacuenta` (
  `id` int(11) NOT NULL auto_increment,
  `locself` varchar(10) NOT NULL,
  `fecha` date default NULL,
  `hora` time default NULL,
  `importe` float default '0',
  `modo_pago` char(2) default NULL,
  `facturado` char(1) default 'Y',
  `id_factura` int(11) default NULL,
  `serie` char(5) default '',
  PRIMARY KEY  (`id`,`locself`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `entradas`
--

DROP TABLE IF EXISTS `entradas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `entradas` (
  `identificador` int(11) NOT NULL auto_increment,
  `id_complementog` varchar(5) character set latin1 NOT NULL default '',
  `id_venta` int(7) default '0',
  `id_tipo_comg` varchar(4) character set latin1 default '',
  `id_empresa` char(3) character set latin1 default '',
  `id_centro` char(2) character set latin1 default '',
  `PVPTiquet` float default NULL,
  `precio` float(12,6) default NULL,
  `avgiva` smallint(6) default NULL,
  `descuento` float default '0',
  `destino` char(1) character set latin1 default 'V',
  `complementog` varchar(100) character set latin1 default NULL,
  `total` float default NULL,
  PRIMARY KEY  (`identificador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `estado`
--

DROP TABLE IF EXISTS `estado`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `estado` (
  `id_habitacion` varchar(5) NOT NULL default '',
  `id_tipo_hab` char(2) default NULL,
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date default '0000-00-00',
  `motivo` varchar(100) default NULL,
  `disponible` char(2) default NULL,
  `id_estado` char(4) NOT NULL default '',
  `estado` varchar(25) NOT NULL default '',
  PRIMARY KEY  (`id_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `fabricante`
--

DROP TABLE IF EXISTS `fabricante`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `fabricante` (
  `id` varchar(10) NOT NULL,
  `nombre` varchar(200) default '',
  `friendly` varchar(200) default '',
  `imagen` mediumblob,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `fac_comg`
--

DROP TABLE IF EXISTS `fac_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `fac_comg` (
  `id_factura` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `precio` float default NULL,
  `cantidad` int(3) default NULL,
  PRIMARY KEY  (`id_factura`,`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `fac_comg_ibfk_1` FOREIGN KEY (`id_factura`) REFERENCES `factura` (`id_factura`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fac_comg_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `factura`
--

DROP TABLE IF EXISTS `factura`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `factura` (
  `serie` char(5) NOT NULL default 'F',
  `id_factura` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `dni` varchar(15) default NULL,
  `id_entidad` char(3) default NULL,
  `observaciones` varchar(249) default NULL,
  `fecha_factura` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `huesped` varchar(150) default NULL,
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tf` float default NULL,
  `ec` float default NULL,
  `tp` float default NULL,
  `origen` char(1) default NULL,
  `rec` int(2) unsigned NOT NULL default '0',
  `pagada` char(1) default 'N',
  `id_modo_pago` char(2) default NULL,
  `anula` int(7) default NULL,
  `hora` time default NULL,
  `id_apcajas` int(11) default NULL,
  PRIMARY KEY  (`id_factura`,`serie`,`id_empresa`,`id_centro`),
  KEY `id_empresa` (`id_empresa`,`id_centro`),
  KEY `dni` (`dni`),
  KEY `id_entidad` (`id_entidad`),
  CONSTRAINT `factura_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON UPDATE CASCADE,
  CONSTRAINT `factura_ibfk_2` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE,
  CONSTRAINT `factura_ibfk_3` FOREIGN KEY (`id_entidad`) REFERENCES `sysme`.`entidad` (`id_entidad`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `factura2`
--

DROP TABLE IF EXISTS `factura2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `factura2` (
  `serie` char(5) character set utf8 NOT NULL default 'F',
  `id_factura` int(7) NOT NULL default '0',
  `id_empresa` char(3) character set utf8 NOT NULL default '',
  `id_centro` char(2) character set utf8 NOT NULL default '',
  `dni` varchar(15) character set utf8 default NULL,
  `id_entidad` char(3) character set utf8 default NULL,
  `observaciones` varchar(249) character set utf8 default NULL,
  `fecha_factura` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `huesped` varchar(150) character set utf8 default NULL,
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tf` float default NULL,
  `ec` float default NULL,
  `tp` float default NULL,
  `origen` char(1) character set utf8 default NULL,
  `rec` int(2) unsigned NOT NULL default '0',
  `pagada` char(1) character set utf8 default 'N',
  `id_modo_pago` char(2) character set utf8 default NULL,
  `anula` int(7) default NULL,
  `hora` time default NULL,
  `id_apcajas` int(11) default NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `form_textos`
--

DROP TABLE IF EXISTS `form_textos`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `form_textos` (
  `id_idioma` char(2) character set latin1 NOT NULL,
  `form` varchar(50) character set latin1 NOT NULL,
  `nombre` varchar(100) character set latin1 NOT NULL default '',
  `extra` varchar(100) character set latin1 NOT NULL default '',
  `texto` varchar(200) character set latin1 NOT NULL default '',
  `texto_ori` varchar(200) character set latin1 default '',
  PRIMARY KEY  (`id_idioma`,`form`,`nombre`,`extra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `foto_complementog`
--

DROP TABLE IF EXISTS `foto_complementog`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `foto_complementog` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_foto` char(2) NOT NULL default '',
  `foto` mediumblob,
  PRIMARY KEY  (`id_tipo_comg`,`id_complementog`,`id_foto`),
  KEY `id_foto_comg` (`id_tipo_comg`,`id_complementog`,`id_foto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `gasto`
--

DROP TABLE IF EXISTS `gasto`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `gasto` (
  `id_gasto` char(3) NOT NULL default '',
  `nombre` varchar(150) default '',
  `ctacontable` varchar(20) default '',
  PRIMARY KEY  (`id_gasto`),
  KEY `id_gasto` (`id_gasto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `habitacion`
--

DROP TABLE IF EXISTS `habitacion`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `habitacion` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `descripcion` varchar(45) NOT NULL default '',
  `edificio` char(1) NOT NULL default '1',
  `piso` char(1) NOT NULL default '1',
  `centralita` varchar(5) NOT NULL default '0',
  `activa` char(1) NOT NULL default 'T',
  `id_estado` char(1) NOT NULL default '',
  `estado` char(1) default 'L',
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`),
  KEY `id_estado` (`id_estado`),
  CONSTRAINT `fk_habi_tipo_hab` FOREIGN KEY (`id_tipo_hab`) REFERENCES `tipo_hab` (`id_tipo_hab`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='InnoDB free: 7168 kB; (`id_tipo_hab`) REFER `sysmehotel/tipo';
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `habitacion_fotos`
--

DROP TABLE IF EXISTS `habitacion_fotos`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `habitacion_fotos` (
  `id_tipo_hab` char(3) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `id_foto` char(3) NOT NULL default '',
  `orden` int(11) NOT NULL default '0',
  `foto` mediumblob,
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`,`id_foto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `historicoprecios`
--

DROP TABLE IF EXISTS `historicoprecios`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `historicoprecios` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `fecha` date NOT NULL default '0000-00-00',
  `precio` float default NULL,
  PRIMARY KEY  (`id_tipo_comg`,`id_complementog`,`fecha`),
  KEY `id_historico_comg` (`id_tipo_comg`,`id_complementog`,`fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `hora`
--

DROP TABLE IF EXISTS `hora`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `hora` (
  `hora` time NOT NULL default '00:00:00',
  `visible` char(1) character set latin1 NOT NULL default 'Y',
  `posicion` int(11) NOT NULL,
  PRIMARY KEY  (`hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `idioma`
--

DROP TABLE IF EXISTS `idioma`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `idioma` (
  `id_idioma` char(2) character set latin1 NOT NULL,
  `idioma` varchar(200) character set latin1 default NULL,
  PRIMARY KEY  (`id_idioma`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `impresoras`
--

DROP TABLE IF EXISTS `impresoras`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `impresoras` (
  `id_impresora` char(3) NOT NULL default '',
  `nombre` varchar(60) NOT NULL default '',
  `secuencia` varchar(60) NOT NULL default '',
  PRIMARY KEY  (`id_impresora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `inventario` (
  `id_inventario` varchar(12) NOT NULL default '',
  `id_almacen` char(2) NOT NULL default '',
  `fecha_inventario` date default NULL,
  `observaciones` text,
  `hora` time default NULL,
  PRIMARY KEY  (`id_inventario`),
  KEY `fk_almacen` (`id_almacen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `inventario_complementg`
--

DROP TABLE IF EXISTS `inventario_complementg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `inventario_complementg` (
  `id_centro` char(2) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_inventario` varchar(12) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float default NULL,
  `complementog` varchar(100) default NULL,
  `cantidad_anterior` float default '0',
  `variacion` int(11) NOT NULL default '0',
  `desc_variacion` varchar(100) default '',
  PRIMARY KEY  (`id_centro`,`id_empresa`,`id_inventario`,`id_tipo_comg`,`id_complementog`,`variacion`),
  KEY `FK_inv_comg_inventario` (`id_inventario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `lineaseliminadas`
--

DROP TABLE IF EXISTS `lineaseliminadas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `lineaseliminadas` (
  `id_complementog` varchar(5) character set utf8 NOT NULL default '',
  `id_venta` int(7) NOT NULL default '0',
  `cantidad` float NOT NULL default '0',
  `id_tipo_comg` varchar(4) character set utf8 NOT NULL default '',
  `id_empresa` char(3) character set utf8 NOT NULL default '',
  `id_linea` int(11) NOT NULL,
  `id_centro` char(2) character set utf8 NOT NULL default '',
  `PVPTiquet` float default NULL,
  `id_factura` int(7) default NULL,
  `serie` char(5) character set utf8 default NULL,
  `precio` float(12,6) default NULL,
  `avgiva` float default NULL,
  `descuento` float NOT NULL default '0',
  `destino` char(1) character set utf8 default 'V',
  `id_almacen` char(2) character set utf8 default NULL,
  `observaciones` varchar(250) character set utf8 default '',
  `cocina` float default '0',
  `nota` varchar(200) character set utf8 default '',
  `complementog` varchar(100) character set utf8 default NULL,
  `total` float default NULL,
  `servido_cocina` float default '0',
  `bloque_cocina` int(1) default '1',
  `z` int(11) default '0',
  `precio_compra` float default '0',
  `variacion` int(11) default '0',
  `impuesto2` float default '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mensajes` (
  `id_idioma` char(2) character set latin1 NOT NULL,
  `nombre` varchar(200) character set latin1 NOT NULL default '',
  `texto` varchar(200) character set latin1 default NULL,
  PRIMARY KEY  (`id_idioma`,`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mesa`
--

DROP TABLE IF EXISTS `mesa`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mesa` (
  `Num_Mesa` char(3) NOT NULL default '',
  `Num_Comensales` char(2) NOT NULL default '',
  `Disponible` char(1) NOT NULL default '',
  `descripcion` varchar(200) default NULL,
  `izq` varchar(4) default NULL,
  `top` varchar(4) default NULL,
  `imagen` mediumblob,
  `width` int(11) default '0',
  `height` int(11) default '0',
  `id_tarifa` varchar(4) default '',
  `imagenocupada` mediumblob,
  `id_salon` char(2) default '',
  `esbarra` char(1) default 'N',
  PRIMARY KEY  (`Num_Mesa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mesa_comercio`
--

DROP TABLE IF EXISTS `mesa_comercio`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mesa_comercio` (
  `Num_Mesa` char(3) NOT NULL default '',
  `Num_Comensales` char(2) NOT NULL default '',
  `Disponible` char(1) NOT NULL default '',
  `descripcion` varchar(200) default NULL,
  `izq` varchar(4) default NULL,
  `top` varchar(4) default NULL,
  `imagen` mediumblob,
  `width` int(11) default '0',
  `height` int(11) default '0',
  `id_tarifa` varchar(4) default '',
  `imagenocupada` mediumblob,
  `id_salon` char(2) default '',
  `esbarra` char(1) default 'N',
  PRIMARY KEY  (`Num_Mesa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mesa_hosteleria`
--

DROP TABLE IF EXISTS `mesa_hosteleria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mesa_hosteleria` (
  `Num_Mesa` char(3) NOT NULL default '',
  `Num_Comensales` char(2) NOT NULL default '',
  `Disponible` char(1) NOT NULL default '',
  `descripcion` varchar(200) default NULL,
  `izq` varchar(4) default NULL,
  `top` varchar(4) default NULL,
  `imagen` mediumblob,
  `width` int(11) default '0',
  `height` int(11) default '0',
  `id_tarifa` varchar(4) default '',
  `imagenocupada` mediumblob,
  `id_salon` char(2) default '',
  `esbarra` char(1) default 'N',
  PRIMARY KEY  (`Num_Mesa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `mesa_peluqueria`
--

DROP TABLE IF EXISTS `mesa_peluqueria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `mesa_peluqueria` (
  `Num_Mesa` char(3) NOT NULL default '',
  `Num_Comensales` char(2) NOT NULL default '',
  `Disponible` char(1) NOT NULL default '',
  `descripcion` varchar(200) default NULL,
  `izq` varchar(4) default NULL,
  `top` varchar(4) default NULL,
  `imagen` mediumblob,
  `width` int(11) default '0',
  `height` int(11) default '0',
  `id_tarifa` varchar(4) default '',
  `imagenocupada` mediumblob,
  `id_salon` char(2) default '',
  `esbarra` char(1) default 'N',
  PRIMARY KEY  (`Num_Mesa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `modo_pago`
--

DROP TABLE IF EXISTS `modo_pago`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `modo_pago` (
  `id_modo_pago` char(2) NOT NULL default '',
  `modo_pago` varchar(25) NOT NULL default '',
  `ctacontable` varchar(20) NOT NULL default '',
  `activo` char(1) default 'Y',
  `defecto` char(1) default 'N',
  PRIMARY KEY  (`id_modo_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `navigator_images`
--

DROP TABLE IF EXISTS `navigator_images`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `navigator_images` (
  `id_idioma` char(2) character set latin1 NOT NULL,
  `boton` varchar(20) character set latin1 NOT NULL,
  `imagen` mediumblob,
  PRIMARY KEY  (`id_idioma`,`boton`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `notacocina`
--

DROP TABLE IF EXISTS `notacocina`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `notacocina` (
  `id_nota` varchar(4) character set latin1 NOT NULL default '',
  `nota` varchar(200) character set latin1 default NULL,
  `tipo_nota` char(1) character set latin1 default 'c',
  PRIMARY KEY  (`id_nota`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL auto_increment,
  `emisor` varchar(200) default '',
  `receptor` varchar(200) default '',
  `mensaje` varchar(250) default '',
  `leido` char(1) default 'N',
  `fecha` date default NULL,
  `hora` time default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `opencart`
--

DROP TABLE IF EXISTS `opencart`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `opencart` (
  `activo` char(1) NOT NULL default 'N',
  `token` varchar(200) default NULL,
  `ftphost` varchar(250) default NULL,
  `ftpuser` varchar(250) default NULL,
  `ftppasswd` varchar(250) default NULL,
  `ftpport` int(5) default NULL,
  `ftppath` varchar(250) default NULL,
  `opencarturl` varchar(250) default 'www.',
  `version` char(10) default '1.5',
  `txttallas` varchar(200) default 'Options',
  `id_tarifa_oferta` varchar(4) default '',
  `id` int(11) NOT NULL auto_increment,
  `sinctallas` char(1) default 'Y',
  `ftppasivo` char(1) default 'N',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `opencart_comg`
--

DROP TABLE IF EXISTS `opencart_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `opencart_comg` (
  `id_complementog` varchar(5) NOT NULL,
  `id_opencart` int(2) NOT NULL,
  PRIMARY KEY  (`id_complementog`,`id_opencart`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `opencart_log`
--

DROP TABLE IF EXISTS `opencart_log`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `opencart_log` (
  `id` mediumint(9) NOT NULL auto_increment,
  `fecha` datetime default NULL,
  `item` varchar(250) default NULL,
  `resultado` text,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `opencart_remove`
--

DROP TABLE IF EXISTS `opencart_remove`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `opencart_remove` (
  `tipo` varchar(3) default '',
  `item` varchar(10) default ''
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `opencart_tipo_comg`
--

DROP TABLE IF EXISTS `opencart_tipo_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `opencart_tipo_comg` (
  `id_tipo_comg` varchar(4) NOT NULL,
  `id_opencart` int(2) NOT NULL,
  PRIMARY KEY  (`id_tipo_comg`,`id_opencart`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `operaciones`
--

DROP TABLE IF EXISTS `operaciones`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `operaciones` (
  `id_operacion` varchar(5) NOT NULL default '',
  `nombre` varchar(150) default '',
  `fecha_inicio` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `fecha_montaje` date default '0000-00-00',
  `observaciones` varchar(200) default '',
  `dni_cliente` varchar(9) default '',
  `fecha_desmontaje` date NOT NULL default '0000-00-00',
  `tipo_operacion` char(1) default NULL,
  `id_usuario` varchar(20) default NULL,
  PRIMARY KEY  (`id_operacion`),
  KEY `id_operaciones` (`id_operacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `operaciones_complementog`
--

DROP TABLE IF EXISTS `operaciones_complementog`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `operaciones_complementog` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_operacion` varchar(5) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float default NULL,
  `id_almacen` char(2) default NULL,
  `ejecutada` char(1) default 'N',
  `devuelta` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_operacion`,`id_tipo_comg`,`id_complementog`),
  KEY `FK_comg_trasp` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `FK_oper` (`id_operacion`),
  CONSTRAINT `FK_oper` FOREIGN KEY (`id_operacion`) REFERENCES `operaciones` (`id_operacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_oper_comg` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `orden_fabrica`
--

DROP TABLE IF EXISTS `orden_fabrica`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `orden_fabrica` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_orden` varchar(5) NOT NULL default '',
  `id_almacen` char(2) NOT NULL default '',
  `fecha_orden` date NOT NULL default '0000-00-00',
  `fecha_ejecucion` date NOT NULL default '0000-00-00',
  `id_usuario` varchar(20) NOT NULL default '',
  `descripcion` text,
  `ejecutada` char(1) default 'N',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_orden`),
  KEY `id_empresa` (`id_empresa`,`id_almacen`),
  CONSTRAINT `orden_fabrica_ibfk_1` FOREIGN KEY (`id_empresa`, `id_almacen`) REFERENCES `almacen` (`id_empresa`, `id_almacen`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `orden_matprima`
--

DROP TABLE IF EXISTS `orden_matprima`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `orden_matprima` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_orden` varchar(5) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float default '1',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_orden`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `orden_matprima_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`, `id_orden`) REFERENCES `orden_fabrica` (`id_empresa`, `id_centro`, `id_orden`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orden_matprima_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `orden_result`
--

DROP TABLE IF EXISTS `orden_result`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `orden_result` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_orden` varchar(5) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float default '1',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_orden`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `orden_result_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`, `id_orden`) REFERENCES `orden_fabrica` (`id_empresa`, `id_centro`, `id_orden`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `orden_result_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pack`
--

DROP TABLE IF EXISTS `pack`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pack` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_empresa1` char(3) NOT NULL default '',
  `id_centro1` char(2) NOT NULL default '',
  `id_tipo_comg1` varchar(4) NOT NULL default '',
  `id_complementog1` varchar(5) NOT NULL default '',
  `cantidad` float NOT NULL default '0',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`,`id_empresa1`,`id_centro1`,`id_tipo_comg1`,`id_complementog1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pack_hosteleria`
--

DROP TABLE IF EXISTS `pack_hosteleria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pack_hosteleria` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_empresa1` char(3) NOT NULL default '',
  `id_centro1` char(2) NOT NULL default '',
  `id_tipo_comg1` varchar(4) NOT NULL default '',
  `id_complementog1` varchar(5) NOT NULL default '',
  `cantidad` float NOT NULL default '0',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`,`id_empresa1`,`id_centro1`,`id_tipo_comg1`,`id_complementog1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pagoscobros`
--

DROP TABLE IF EXISTS `pagoscobros`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pagoscobros` (
  `id_pagoscobros` int(11) NOT NULL default '1',
  `Tipo` char(1) NOT NULL default '',
  `Fecha` date NOT NULL default '0000-00-00',
  `hora` time NOT NULL default '00:00:00',
  `Descripcion` varchar(100) NOT NULL default '',
  `Importe` float NOT NULL default '0',
  `id_modo_pago` char(2) NOT NULL default '',
  `Documento` varchar(10) default NULL,
  `Contabilizado` char(1) default NULL,
  `fechaconta` date default NULL,
  `CtaContable` varchar(15) default NULL,
  `id_camarero` varchar(20) NOT NULL default '1',
  `Id_caja` int(2) NOT NULL default '1',
  `fecha_real` date NOT NULL default '0000-00-00',
  `id_gasto` char(3) default '',
  `id_proveedor` varchar(4) default '',
  `id_acreedor` varchar(4) default '',
  `saldo` double default '0',
  `nombreacreedor` varchar(100) default '',
  `nombreproveedor` varchar(100) default '',
  `nombregasto` varchar(100) default '',
  `id_factura` int(7) default NULL,
  `id_tiquet` int(7) default NULL,
  `id_apcajas` int(11) default '0',
  `serie_fac` char(10) default NULL,
  `tipo_doc` char(1) default NULL,
  `id_venta` int(11) default '0',
  PRIMARY KEY  (`id_pagoscobros`),
  KEY `FK_pagoscobros_modopago` (`id_modo_pago`),
  KEY `FK_pagoscobros_camarero` (`id_camarero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pagoscobros2`
--

DROP TABLE IF EXISTS `pagoscobros2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pagoscobros2` (
  `id_pagoscobros` int(11) NOT NULL default '1',
  `Tipo` char(1) character set utf8 NOT NULL default '',
  `Fecha` date NOT NULL default '0000-00-00',
  `hora` time NOT NULL default '00:00:00',
  `Descripcion` varchar(100) character set utf8 NOT NULL default '',
  `Importe` float NOT NULL default '0',
  `id_modo_pago` char(2) character set utf8 NOT NULL default '',
  `Documento` varchar(10) character set utf8 default NULL,
  `Contabilizado` char(1) character set utf8 default NULL,
  `fechaconta` date default NULL,
  `CtaContable` varchar(15) character set utf8 default NULL,
  `id_camarero` varchar(20) character set utf8 NOT NULL default '1',
  `Id_caja` int(2) NOT NULL default '1',
  `fecha_real` date NOT NULL default '0000-00-00',
  `id_gasto` char(3) character set utf8 default '',
  `id_proveedor` varchar(4) character set utf8 default '',
  `id_acreedor` varchar(4) character set utf8 default '',
  `saldo` double default '0',
  `nombreacreedor` varchar(100) character set utf8 default '',
  `nombreproveedor` varchar(100) character set utf8 default '',
  `nombregasto` varchar(100) character set utf8 default '',
  `id_factura` int(7) default NULL,
  `id_tiquet` int(7) default NULL,
  `id_apcajas` int(11) default '0',
  `serie_fac` char(10) character set utf8 default NULL,
  `tipo_doc` char(1) character set utf8 default NULL,
  `id_venta` int(11) default '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ped_comg`
--

DROP TABLE IF EXISTS `ped_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `ped_comg` (
  `Id_Pedido` varchar(15) NOT NULL default '',
  `Id_Empresa` char(3) NOT NULL default '',
  `Id_Centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `Cantidad` smallint(6) NOT NULL default '0',
  `Precio` double NOT NULL default '0',
  `Total` double NOT NULL default '0',
  `id_complementog` varchar(5) NOT NULL default '',
  `id_proveedor` varchar(4) default NULL,
  `importado` char(1) NOT NULL default 'N',
  PRIMARY KEY  (`id_complementog`,`id_tipo_comg`,`Id_Centro`,`Id_Empresa`,`Id_Pedido`),
  KEY `FK_ped_comg` (`Id_Empresa`,`Id_Centro`,`id_tipo_comg`,`id_complementog`),
  KEY `FK_comg_ped` (`Id_Pedido`),
  KEY `fk_pedcomg_proveedor` (`id_proveedor`),
  KEY `FK_ped_comg_ped` (`Id_Pedido`,`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pedido`
--

DROP TABLE IF EXISTS `pedido`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pedido` (
  `Id_Pedido` varchar(15) NOT NULL default '',
  `Id_Proveedor` varchar(100) NOT NULL default '',
  `Fecha_Pedido` date NOT NULL default '0000-00-00',
  `Total` double NOT NULL default '0',
  `Iva` double NOT NULL default '0',
  `AvgIva` smallint(6) NOT NULL default '0',
  `Base_Imponible` double NOT NULL default '0',
  `importado` char(1) NOT NULL default 'N',
  `observaciones` text,
  PRIMARY KEY  (`Id_Pedido`,`Id_Proveedor`),
  KEY `FK_Albaran_Proveedor` (`Id_Proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pfactura`
--

DROP TABLE IF EXISTS `pfactura`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pfactura` (
  `id_factura` varchar(20) NOT NULL,
  `id_proveedor` varchar(4) NOT NULL,
  `bi` float default '0',
  `ci` float default '0',
  `ret` float default '0',
  `re` float default '0',
  `tf` float default '0',
  `filename` varchar(250) default '',
  `file` mediumblob,
  `fecha` date default NULL,
  `fecha_pago` date default NULL,
  `pagada` char(1) default 'N',
  PRIMARY KEY  (`id_factura`,`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pnotacocina`
--

DROP TABLE IF EXISTS `pnotacocina`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pnotacocina` (
  `id_complementog` varchar(5) NOT NULL,
  `id_nota` varchar(4) NOT NULL,
  PRIMARY KEY  (`id_complementog`,`id_nota`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pproveedor`
--

DROP TABLE IF EXISTS `pproveedor`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pproveedor` (
  `id_complementog` varchar(5) NOT NULL,
  `id_proveedor` varchar(4) NOT NULL,
  PRIMARY KEY  (`id_complementog`,`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pre_reserva`
--

DROP TABLE IF EXISTS `pre_reserva`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pre_reserva` (
  `locself` int(10) unsigned NOT NULL default '0',
  `id_entidad` char(3) NOT NULL default '1',
  `id_contrato` varchar(4) NOT NULL default '1',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `dni` varchar(9) NOT NULL default '',
  `nombre` varchar(100) NOT NULL default '',
  `apellidos` varchar(150) NOT NULL default '',
  `adultos` int(2) unsigned NOT NULL default '2',
  `ninyos` int(2) unsigned NOT NULL default '0',
  `jubilados` int(2) unsigned NOT NULL default '0',
  `habitaciones` int(2) unsigned NOT NULL default '0',
  `locent` int(10) unsigned NOT NULL default '0',
  `observaciones` varchar(249) NOT NULL default '',
  `consolidada` char(1) NOT NULL default 'N',
  `dnifact` varchar(9) default '',
  `nombrednifact` varchar(75) default '',
  `apellidosdnifact` varchar(75) default '',
  `id_tipo_com` varchar(4) default '',
  `id_complemento` varchar(5) default '',
  `release` int(3) default '0',
  PRIMARY KEY  (`locself`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pre_reserva_com`
--

DROP TABLE IF EXISTS `pre_reserva_com`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pre_reserva_com` (
  `locself` int(11) NOT NULL default '0',
  `id` int(11) NOT NULL default '0',
  `contador` int(10) unsigned NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  `precio` float default NULL,
  `cantidad` int(6) default NULL,
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `fecha_servicio` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '7',
  `comentario` varchar(45) NOT NULL default '',
  PRIMARY KEY  (`contador`,`locself`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='InnoDB free: 58368 kB';
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pre_reserva_hab`
--

DROP TABLE IF EXISTS `pre_reserva_hab`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pre_reserva_hab` (
  `locself` int(10) unsigned NOT NULL auto_increment,
  `id` int(10) unsigned NOT NULL default '1',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `id_tipo_hab` char(2) NOT NULL default '',
  `adultos` int(10) unsigned NOT NULL default '0',
  `ninyos` int(10) unsigned NOT NULL default '0',
  `jubilados` int(10) unsigned NOT NULL default '0',
  `id_tipo_com` varchar(4) NOT NULL default '',
  `id_complemento` varchar(5) NOT NULL default '',
  `consolidada` char(1) NOT NULL default 'N',
  `dni` varchar(9) NOT NULL default '',
  `nombre` varchar(100) NOT NULL default '',
  `apellidos` varchar(150) NOT NULL default '',
  `id_entidad` char(1) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  PRIMARY KEY  (`locself`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pre_reserva_habi`
--

DROP TABLE IF EXISTS `pre_reserva_habi`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pre_reserva_habi` (
  `locself` int(10) NOT NULL default '0',
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `nhabitaciones` int(2) default NULL,
  `id_tipo_com` varchar(4) default '',
  `id_complemento` varchar(5) default '',
  PRIMARY KEY  (`locself`,`id_tipo_hab`,`id_habitacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `precio`
--

DROP TABLE IF EXISTS `precio`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `precio` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `precio` float(12,6) default NULL,
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `cupo` int(10) unsigned NOT NULL default '0',
  `release` int(10) unsigned NOT NULL default '0',
  `dto_1ninyo` float NOT NULL default '0',
  `tipo_dto_1ninyo` char(1) NOT NULL default '%',
  `dto_2ninyo` float NOT NULL default '0',
  `tipo_dto_2ninyo` char(1) NOT NULL default '%',
  `dto_jubilado` float NOT NULL default '0',
  `tipo_dto_jubilado` char(1) NOT NULL default '%',
  `dto_3persona` float NOT NULL default '0',
  `tipo_dto_3persona` char(1) NOT NULL default '%',
  `dto_largaestancia` float NOT NULL default '0',
  `tipo_dto_largaestancia` char(1) NOT NULL default '%',
  `sup_cortaestancia` float NOT NULL default '0',
  `tipo_sup_cortaestancia` char(1) NOT NULL default '%',
  `sup_usoindividual` float NOT NULL default '0',
  `tipo_sup_usoindividual` char(1) NOT NULL default '%',
  `sup_findesemana` float NOT NULL default '0',
  `tipo_sup_findesemana` char(1) NOT NULL default '%',
  `sup_navidad` float NOT NULL default '0',
  `tipo_sup_navidad` char(1) NOT NULL default '%',
  `sup_nochevieja` float NOT NULL default '0',
  `tipo_sup_nochevieja` char(1) NOT NULL default '%',
  `dias_corta_estancia` int(10) unsigned NOT NULL default '0',
  `dias_larga_estancia` int(10) unsigned NOT NULL default '0',
  `preciohabitacion` char(1) default 'N',
  `viernes` char(1) default 'Y',
  `sabado` char(1) default 'Y',
  `domingo` char(1) default 'Y',
  PRIMARY KEY  (`id_tipo_hab`,`id_tipo_com`,`id_complemento`,`id_entidad`,`id_contrato`,`fecha_ini`),
  KEY `id_entidad` (`id_entidad`,`id_contrato`),
  CONSTRAINT `precio_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_tipo_com`, `id_complemento`) REFERENCES `complemento` (`id_tipo_hab`, `id_tipo_com`, `id_complemento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `precio_ibfk_2` FOREIGN KEY (`id_entidad`, `id_contrato`) REFERENCES `contrato` (`id_entidad`, `id_contrato`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `presu_comg`
--

DROP TABLE IF EXISTS `presu_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `presu_comg` (
  `Id_Presupuesto` varchar(15) NOT NULL default '',
  `Id_Empresa` char(3) NOT NULL default '',
  `Id_Centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `Cantidad` smallint(6) NOT NULL default '0',
  `Precio` double NOT NULL default '0',
  `Total` double NOT NULL default '0',
  `id_complementog` varchar(5) NOT NULL default '',
  `observaciones` text,
  PRIMARY KEY  (`id_complementog`,`id_tipo_comg`,`Id_Centro`,`Id_Empresa`,`Id_Presupuesto`),
  KEY `FK_presu_comg` (`Id_Empresa`,`Id_Centro`,`id_tipo_comg`,`id_complementog`),
  KEY `FK_comg_presu` (`Id_Presupuesto`),
  KEY `FK_presu_comg_presupuesto` (`Id_Presupuesto`),
  CONSTRAINT `FK_presu_comg_presupuesto` FOREIGN KEY (`Id_Presupuesto`) REFERENCES `presupuesto` (`Id_Presupuesto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `presupuesto`
--

DROP TABLE IF EXISTS `presupuesto`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `presupuesto` (
  `Id_Presupuesto` varchar(15) NOT NULL default '',
  `Fecha_Presupuesto` date NOT NULL default '0000-00-00',
  `Total` double NOT NULL default '0',
  `Iva` double NOT NULL default '0',
  `AvgIva` smallint(6) NOT NULL default '0',
  `Base_Imponible` double NOT NULL default '0',
  `observaciones` text,
  `dni` varchar(9) default NULL,
  `especial` char(1) default 'N',
  `cuota_iva` float default NULL,
  `pagado` char(1) default 'N',
  `facturado` char(1) default 'N',
  PRIMARY KEY  (`Id_Presupuesto`),
  KEY `presu_cli` (`dni`),
  CONSTRAINT `presu_cli` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `pretiquet`
--

DROP TABLE IF EXISTS `pretiquet`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `pretiquet` (
  `serie` char(1) NOT NULL default 'F',
  `id_pretiquet` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `observaciones` varchar(249) default NULL,
  `fecha_pretiquet` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tt` float default NULL,
  `Total` float default NULL,
  `fechasistema` date default NULL,
  `horapretiquet` time default NULL,
  `id_caja` int(2) default NULL,
  `dto` int(11) default '0',
  `id_modo_pago` char(2) default '',
  PRIMARY KEY  (`id_pretiquet`),
  KEY `id_empresa` (`id_empresa`,`id_centro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `productoimg`
--

DROP TABLE IF EXISTS `productoimg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `productoimg` (
  `id` varchar(5) NOT NULL,
  `imagen` mediumblob,
  `extension` varchar(5) default '',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `productoimgs`
--

DROP TABLE IF EXISTS `productoimgs`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `productoimgs` (
  `id` varchar(3) NOT NULL,
  `id_complementog` varchar(5) NOT NULL,
  `imagen` mediumblob,
  `extension` varchar(5) default '',
  PRIMARY KEY  (`id`,`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `promociones` (
  `id_empresa` char(3) character set latin1 NOT NULL default '',
  `id_centro` char(2) character set latin1 NOT NULL default '',
  `codbarras` varchar(20) character set latin1 NOT NULL default '',
  `nombre` varchar(200) character set latin1 default NULL,
  `dto` float default '0',
  `fecha_inicio` date NOT NULL default '2009-01-01',
  `fecha_fin` date NOT NULL default '2009-01-01',
  `observaciones` text character set latin1,
  `ilimitado` char(1) character set latin1 default 'N',
  `utilizada` char(1) character set latin1 default 'N',
  `tipodto` char(1) default 'P',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`codbarras`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `proveedor`
--

DROP TABLE IF EXISTS `proveedor`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `proveedor` (
  `Id_Proveedor` varchar(4) NOT NULL default '',
  `Nif` varchar(15) default NULL,
  `Razon_Social` varchar(100) NOT NULL default '',
  `Observaciones` varchar(250) default NULL,
  `cp` varchar(5) default NULL,
  `Provincia` varchar(100) default NULL,
  `Poblacion` varchar(100) default NULL,
  `Dirección` varchar(200) default NULL,
  `telefono` varchar(20) default NULL,
  `fax` varchar(20) default NULL,
  `email` varchar(50) default NULL,
  `movil` varchar(20) default NULL,
  `persona_contacto` varchar(100) default NULL,
  `web` varchar(50) default NULL,
  `ctacontable` varchar(20) default '',
  `Direccion` varchar(200) default '',
  PRIMARY KEY  (`Id_Proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `registrocajon`
--

DROP TABLE IF EXISTS `registrocajon`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `registrocajon` (
  `fechasistema` date NOT NULL default '0000-00-00',
  `horasistema` time NOT NULL default '00:00:00',
  `fechatrabajo` date NOT NULL default '0000-00-00',
  `id_camarero` int(3) default '0',
  PRIMARY KEY  (`fechatrabajo`,`horasistema`,`fechasistema`),
  KEY `FK_registrocajon_camarero` (`id_camarero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `registroz`
--

DROP TABLE IF EXISTS `registroz`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `registroz` (
  `fechasistema` date NOT NULL default '0000-00-00',
  `horasistema` time NOT NULL default '00:00:00',
  `fechatrabajoantigua` date NOT NULL default '0000-00-00',
  `fechatrabajonueva` date NOT NULL default '0000-00-00',
  `id_registroz` varchar(5) NOT NULL,
  PRIMARY KEY  (`fechasistema`,`horasistema`,`fechatrabajoantigua`,`fechatrabajonueva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `reports` (
  `Clave` char(200) NOT NULL default '',
  `Descripcion` char(50) NOT NULL default '',
  `SQL` char(250) default '',
  `Mascara` char(100) NOT NULL default '',
  `Orden` int(3) default '0',
  `Impresora` char(150) default NULL,
  `copias` int(2) default '1',
  `impresora2` char(150) default NULL,
  `id_idioma` char(2) default NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `res_acuenta`
--

DROP TABLE IF EXISTS `res_acuenta`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `res_acuenta` (
  `contador` int(12) NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` char(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `cantidad` float default NULL,
  `fecha` date NOT NULL default '0000-00-00',
  `id_modo_pago` char(2) NOT NULL default '',
  PRIMARY KEY  (`contador`,`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `res_acuenta_reserva` (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `res_acuenta_modo_pago` (`id_modo_pago`),
  CONSTRAINT `res_acuenta_modo_pago` FOREIGN KEY (`id_modo_pago`) REFERENCES `modo_pago` (`id_modo_pago`) ON UPDATE CASCADE,
  CONSTRAINT `res_acuenta_reserva` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `reserva` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `res_com`
--

DROP TABLE IF EXISTS `res_com`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `res_com` (
  `contador` int(12) NOT NULL auto_increment,
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `id_tipo_habc` char(2) NOT NULL default '',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  `id_factura` int(7) default NULL,
  `id_borrador` int(7) default NULL,
  `precio` float(12,6) default NULL,
  `cantidad` int(6) default NULL,
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `fecha_servicio` date NOT NULL default '0000-00-00',
  `iva` float default NULL,
  `comentario` varchar(45) NOT NULL default '',
  `id_pre_reserva` int(10) default '0',
  `impuesto2` float default NULL,
  `impuesto3` int(3) default '0',
  `serie_fac` char(10) default NULL,
  PRIMARY KEY  (`contador`,`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`,`id_tipo_habc`,`id_tipo_com`,`id_complemento`),
  KEY `id_tipo_habc` (`id_tipo_habc`,`id_tipo_com`,`id_complemento`),
  KEY `id_factura` (`id_factura`),
  KEY `id_borrador` (`id_borrador`),
  KEY `fk_res_com_contrato` (`id_entidad`,`id_contrato`),
  KEY `res_com_ibfk_1` (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `fk_res_com_factura` (`id_factura`,`serie_fac`),
  CONSTRAINT `fk_res_com_factura` FOREIGN KEY (`id_factura`, `serie_fac`) REFERENCES `factura` (`id_factura`, `serie`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `res_com_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) REFERENCES `reserva` (`id_tipo_hab`, `id_habitacion`, `fecha_ini`, `fecha_fin`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `res_com_ibfk_2` FOREIGN KEY (`id_tipo_habc`, `id_tipo_com`, `id_complemento`) REFERENCES `complemento` (`id_tipo_hab`, `id_tipo_com`, `id_complemento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `res_com_ibfk_4` FOREIGN KEY (`id_borrador`) REFERENCES `borrador` (`id_borrador`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `res_conf_servicios`
--

DROP TABLE IF EXISTS `res_conf_servicios`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `res_conf_servicios` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `fecha` date NOT NULL default '0000-00-00',
  `id_tipo_com` char(2) NOT NULL default '',
  `id_complemento` char(3) NOT NULL default '',
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`,`fecha`,`id_tipo_com`,`id_complemento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `reserva` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `id_habitacion` varchar(5) NOT NULL default '',
  `id_entidad` char(3) NOT NULL default '',
  `id_contrato` varchar(4) NOT NULL default '',
  `dni` varchar(15) default NULL,
  `fecha_ini` date NOT NULL default '0000-00-00',
  `fecha_fin` date NOT NULL default '0000-00-00',
  `observaciones` text,
  `locself` varchar(10) NOT NULL default '0',
  `locent` varchar(10) NOT NULL default '0',
  `pax` int(2) NOT NULL default '0',
  `nombre` varchar(100) default NULL,
  `apellidos` varchar(150) default NULL,
  `check_in` char(1) NOT NULL default 'N',
  `pre_reserva` char(1) NOT NULL default 'N',
  `adultos` int(2) NOT NULL default '0',
  `ninyos` int(2) NOT NULL default '0',
  `jubilados` int(2) NOT NULL default '0',
  `fantasma` char(1) NOT NULL default 'F',
  `dnifact` varchar(15) default NULL,
  `nombrednifact` varchar(75) default '',
  `apellidosdnifact` varchar(75) default '',
  `id_pre_reserva` int(10) default '0',
  `release` int(3) default '0',
  `apellido2` varchar(200) default '',
  `apellido2dnifact` varchar(200) default '',
  `color` varchar(50) default '',
  PRIMARY KEY  (`id_tipo_hab`,`id_habitacion`,`fecha_ini`,`fecha_fin`),
  KEY `id_entidad` (`id_entidad`,`id_contrato`),
  KEY `dni` (`dni`),
  CONSTRAINT `reserva_ibfk_1` FOREIGN KEY (`id_tipo_hab`, `id_habitacion`) REFERENCES `habitacion` (`id_tipo_hab`, `id_habitacion`) ON UPDATE CASCADE,
  CONSTRAINT `reserva_ibfk_2` FOREIGN KEY (`id_entidad`, `id_contrato`) REFERENCES `contrato` (`id_entidad`, `id_contrato`) ON UPDATE CASCADE,
  CONSTRAINT `reserva_ibfk_3` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `reservahora`
--

DROP TABLE IF EXISTS `reservahora`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `reservahora` (
  `id_reserva` varchar(15) character set latin1 NOT NULL,
  `fecha_ini` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `dni_cliente` varchar(15) character set latin1 default NULL,
  `num_mesa` char(3) character set latin1 NOT NULL,
  `personas` int(2) default NULL,
  `observaciones` text character set latin1,
  `presentado` char(1) character set latin1 default NULL,
  `id_camarero` int(3) default NULL,
  `nomcli` varchar(200) character set latin1 default NULL,
  `apecli` varchar(200) character set latin1 default NULL,
  `anombrede` varchar(240) character set latin1 default NULL,
  PRIMARY KEY  (`id_reserva`),
  KEY `fk_mesa` (`num_mesa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `salon`
--

DROP TABLE IF EXISTS `salon`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `salon` (
  `id_salon` char(2) NOT NULL default '',
  `nombre` varchar(150) default '',
  `observaciones` varchar(250) default '',
  `imagen` mediumblob,
  PRIMARY KEY  (`id_salon`),
  KEY `id_salon` (`id_salon`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `scontrato`
--

DROP TABLE IF EXISTS `scontrato`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `scontrato` (
  `id_contrato` varchar(7) NOT NULL default '',
  `fecha` date default NULL,
  `dni` varchar(9) NOT NULL default '',
  `observaciones` text,
  `id_camarero` int(3) NOT NULL default '1',
  `numcontrato` varchar(20) default '',
  PRIMARY KEY  (`id_contrato`),
  KEY `dni` (`dni`),
  KEY `id_camarero` (`id_camarero`),
  CONSTRAINT `scontrato_ibfk_1` FOREIGN KEY (`dni`) REFERENCES `cliente` (`dni`) ON UPDATE CASCADE,
  CONSTRAINT `scontrato_ibfk_2` FOREIGN KEY (`id_camarero`) REFERENCES `camareros` (`id_camarero`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `scontrato_line`
--

DROP TABLE IF EXISTS `scontrato_line`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `scontrato_line` (
  `id_contrato` varchar(6) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `precio` float default '0',
  `cantidad` float default '1',
  `dto` float default NULL,
  `total` float default NULL,
  PRIMARY KEY  (`id_contrato`,`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  KEY `id_empresa` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `scontrato_line_ibfk_1` FOREIGN KEY (`id_contrato`) REFERENCES `scontrato` (`id_contrato`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `scontrato_line_ibfk_2` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `scontrato_line_fecha`
--

DROP TABLE IF EXISTS `scontrato_line_fecha`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `scontrato_line_fecha` (
  `id_contrato` varchar(6) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `fecha` date NOT NULL default '0000-00-00',
  `cantidad` int(7) NOT NULL default '1',
  `servido` char(1) default NULL,
  `precio` float default '0',
  PRIMARY KEY  (`id_contrato`,`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`,`fecha`),
  CONSTRAINT `scontrato_line_fecha_ibfk_1` FOREIGN KEY (`id_contrato`, `id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `scontrato_line` (`id_contrato`, `id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `serie`
--

DROP TABLE IF EXISTS `serie`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `serie` (
  `id_serie` char(2) character set latin1 NOT NULL,
  `serie` varchar(200) character set latin1 default NULL,
  PRIMARY KEY  (`id_serie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `smsenvio`
--

DROP TABLE IF EXISTS `smsenvio`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `smsenvio` (
  `id_sms` int(10) unsigned NOT NULL auto_increment,
  `fecha` date default NULL,
  `hora` time default NULL,
  `mensaje` varchar(160) NOT NULL default '',
  `cantidad` int(11) default NULL,
  `destinatario` varchar(15) NOT NULL default '',
  PRIMARY KEY  (`id_sms`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `smsenvios`
--

DROP TABLE IF EXISTS `smsenvios`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `smsenvios` (
  `id_sms` int(10) NOT NULL auto_increment,
  `fecha` date default '0000-00-00',
  `hora` time default '00:00:00',
  `mensaje` varchar(160) NOT NULL default '',
  `cantidad` int(11) default '0',
  `destinatario` varchar(15) NOT NULL default '',
  PRIMARY KEY  (`id_sms`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tallas`
--

DROP TABLE IF EXISTS `tallas`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tallas` (
  `id_talla` varchar(4) NOT NULL default '',
  `nombre` varchar(100) default NULL,
  PRIMARY KEY  (`id_talla`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tarifa`
--

DROP TABLE IF EXISTS `tarifa`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tarifa` (
  `id_tarifa` varchar(4) NOT NULL default '',
  `nombre` varchar(75) NOT NULL default '',
  `horacomienzo` time default NULL,
  `autoreduce` char(1) default 'N',
  PRIMARY KEY  (`id_tarifa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_cliente`
--

DROP TABLE IF EXISTS `tipo_cliente`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_cliente` (
  `id_tipo_cliente` char(2) NOT NULL default '',
  `tipo_cliente` varchar(50) NOT NULL default '',
  `id_tarifa` varchar(4) default NULL,
  PRIMARY KEY  (`id_tipo_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_com`
--

DROP TABLE IF EXISTS `tipo_com`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_com` (
  `id_tipo_com` char(2) NOT NULL default '',
  `tipo_com` varchar(25) NOT NULL default '',
  `automostrar` char(1) default NULL,
  PRIMARY KEY  (`id_tipo_com`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_comg`
--

DROP TABLE IF EXISTS `tipo_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_comg` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `tipo_comg` varchar(150) default '',
  `imagen` mediumblob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) default NULL,
  `color` varchar(20) default NULL,
  `visibleen` char(1) default '0',
  `sort_order` int(6) default '0',
  `padre` varchar(4) default NULL,
  `friendly` varchar(200) default NULL,
  `html` text,
  `sinc` char(1) default 'N',
  `alias` varchar(100) default NULL,
  `sincopencart` char(1) NOT NULL default 'Y',
  `sinchtml` char(1) default 'Y',
  PRIMARY KEY  (`id_tipo_comg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_comg_comercio`
--

DROP TABLE IF EXISTS `tipo_comg_comercio`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_comg_comercio` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `tipo_comg` varchar(25) NOT NULL default '',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) default NULL,
  `color` varchar(20) default NULL,
  `visibleen` char(1) default '0',
  PRIMARY KEY  (`id_tipo_comg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_comg_comg`
--

DROP TABLE IF EXISTS `tipo_comg_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_comg_comg` (
  `id_tipo_comg` varchar(4) NOT NULL,
  `id_complementog` varchar(5) NOT NULL,
  PRIMARY KEY  (`id_tipo_comg`,`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_comg_hosteleria`
--

DROP TABLE IF EXISTS `tipo_comg_hosteleria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_comg_hosteleria` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `tipo_comg` varchar(25) NOT NULL default '',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) default NULL,
  `color` varchar(20) default NULL,
  `visibleen` char(1) default '0',
  PRIMARY KEY  (`id_tipo_comg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_comg_peluqueria`
--

DROP TABLE IF EXISTS `tipo_comg_peluqueria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_comg_peluqueria` (
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `tipo_comg` varchar(25) NOT NULL default '',
  `imagen` blob,
  `destino` varchar(6) NOT NULL default '',
  `cafeteria` char(1) default NULL,
  `color` varchar(20) default NULL,
  `visibleen` char(1) default '0',
  PRIMARY KEY  (`id_tipo_comg`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_doc`
--

DROP TABLE IF EXISTS `tipo_doc`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_doc` (
  `id_tipo_doc` char(1) NOT NULL default '',
  `tipo_doc` varchar(10) NOT NULL default '',
  PRIMARY KEY  (`id_tipo_doc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tipo_hab`
--

DROP TABLE IF EXISTS `tipo_hab`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tipo_hab` (
  `id_tipo_hab` char(2) NOT NULL default '',
  `tipo_hab` varchar(30) NOT NULL default '',
  `pax_max` int(2) NOT NULL default '0',
  `pax_estandar` int(2) default '0',
  PRIMARY KEY  (`id_tipo_hab`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tiquet`
--

DROP TABLE IF EXISTS `tiquet`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tiquet` (
  `serie` char(5) NOT NULL default '',
  `id_tiquet` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `observaciones` varchar(249) default NULL,
  `fecha_tiquet` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tt` float default NULL,
  `Total` float default NULL,
  `fechasistema` date default NULL,
  `horatiquet` time default NULL,
  `id_caja` int(2) default NULL,
  `dto` int(11) default '0',
  `id_modo_pago` char(2) default '',
  `id_apcajas` int(11) default NULL,
  `dni` varchar(15) default NULL,
  PRIMARY KEY  (`serie`,`id_tiquet`),
  KEY `id_empresa` (`id_empresa`,`id_centro`),
  CONSTRAINT `tiquet_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `tiquet2`
--

DROP TABLE IF EXISTS `tiquet2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `tiquet2` (
  `serie` char(5) character set utf8 NOT NULL default '',
  `id_tiquet` int(7) NOT NULL default '0',
  `id_empresa` char(3) character set utf8 NOT NULL default '',
  `id_centro` char(2) character set utf8 NOT NULL default '',
  `observaciones` varchar(249) character set utf8 default NULL,
  `fecha_tiquet` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tt` float default NULL,
  `Total` float default NULL,
  `fechasistema` date default NULL,
  `horatiquet` time default NULL,
  `id_caja` int(2) default NULL,
  `dto` int(11) default '0',
  `id_modo_pago` char(2) character set utf8 default '',
  `id_apcajas` int(11) default NULL,
  `dni` varchar(15) character set utf8 default NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `traspasos`
--

DROP TABLE IF EXISTS `traspasos`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `traspasos` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_traspaso` varchar(5) NOT NULL default '',
  `fecha` date NOT NULL default '0000-00-00',
  `observaciones` varchar(150) default NULL,
  `id_almacen_proveedor` char(2) NOT NULL default '',
  `id_almacen_destino` char(2) NOT NULL default '',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_traspaso`),
  CONSTRAINT `FK_traspalm_emp` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `traspasos_complementog`
--

DROP TABLE IF EXISTS `traspasos_complementog`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `traspasos_complementog` (
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_traspaso` varchar(5) NOT NULL default '',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_complementog` varchar(5) NOT NULL default '',
  `cantidad` float default NULL,
  `nomproducto` varchar(50) default NULL,
  `tramitado` char(1) default 'N',
  `variacion` int(11) NOT NULL default '0',
  `desc_variacion` varchar(100) default '',
  PRIMARY KEY  (`id_empresa`,`id_centro`,`id_traspaso`,`id_tipo_comg`,`id_complementog`,`variacion`),
  KEY `FK_comg_trasp` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `FK_comg_trasp` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_trasp` FOREIGN KEY (`id_empresa`, `id_centro`, `id_traspaso`) REFERENCES `traspasos` (`id_empresa`, `id_centro`, `id_traspaso`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `variaciones`
--

DROP TABLE IF EXISTS `variaciones`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `variaciones` (
  `id` int(11) NOT NULL auto_increment,
  `codbarras` varchar(50) default NULL,
  `tipo` char(1) default NULL,
  `id_complementog` varchar(5) default NULL,
  `id_color` varchar(4) default NULL,
  `id_talla` varchar(4) default NULL,
  `caducidad` date default NULL,
  `lote` varchar(50) default NULL,
  PRIMARY KEY  (`id`),
  KEY `v_codbarras` (`codbarras`),
  KEY `v_idcomplementog` (`id_complementog`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `venta_cocina`
--

DROP TABLE IF EXISTS `venta_cocina`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `venta_cocina` (
  `id_venta` int(7) NOT NULL,
  `id_caja` int(2) default NULL,
  PRIMARY KEY  (`id_venta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `venta_preticket`
--

DROP TABLE IF EXISTS `venta_preticket`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `venta_preticket` (
  `id_venta` int(7) NOT NULL,
  PRIMARY KEY  (`id_venta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `venta_ticket`
--

DROP TABLE IF EXISTS `venta_ticket`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `venta_ticket` (
  `id_venta` int(7) NOT NULL,
  PRIMARY KEY  (`id_venta`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ventadir_comg`
--

DROP TABLE IF EXISTS `ventadir_comg`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `ventadir_comg` (
  `id_complementog` varchar(5) NOT NULL default '',
  `id_venta` int(7) NOT NULL default '0',
  `cantidad` float NOT NULL default '0',
  `id_tipo_comg` varchar(4) NOT NULL default '',
  `id_empresa` char(3) NOT NULL default '',
  `id_linea` int(11) NOT NULL,
  `id_centro` char(2) NOT NULL default '',
  `PVPTiquet` float default NULL,
  `id_factura` int(7) default NULL,
  `serie` char(5) default NULL,
  `precio` float(12,6) default NULL,
  `avgiva` float default NULL,
  `descuento` float NOT NULL default '0',
  `destino` char(1) default 'V',
  `id_almacen` char(2) default NULL,
  `observaciones` varchar(250) default '',
  `cocina` float default '0',
  `nota` varchar(200) default '',
  `complementog` varchar(100) default NULL,
  `total` float default NULL,
  `servido_cocina` float default '0',
  `bloque_cocina` int(1) default '1',
  `z` int(11) default '0',
  `precio_compra` float default '0',
  `variacion` int(11) default '0',
  `impuesto2` float default '0',
  PRIMARY KEY  (`id_complementog`,`id_venta`,`id_tipo_comg`,`id_empresa`,`id_centro`,`id_linea`),
  KEY `PK_ventadir` (`id_complementog`,`id_venta`),
  KEY `FK_comgventadir` (`id_venta`),
  KEY `FK_ventadircomg` (`id_empresa`,`id_centro`,`id_tipo_comg`,`id_complementog`),
  CONSTRAINT `FK_comgventadir` FOREIGN KEY (`id_venta`) REFERENCES `ventadirecta` (`id_venta`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_ventadircomg` FOREIGN KEY (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) REFERENCES `complementog` (`id_empresa`, `id_centro`, `id_tipo_comg`, `id_complementog`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ventadir_comg2`
--

DROP TABLE IF EXISTS `ventadir_comg2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `ventadir_comg2` (
  `id_complementog` varchar(5) character set utf8 NOT NULL default '',
  `id_venta` int(7) NOT NULL default '0',
  `cantidad` float NOT NULL default '0',
  `id_tipo_comg` varchar(4) character set utf8 NOT NULL default '',
  `id_empresa` char(3) character set utf8 NOT NULL default '',
  `id_linea` int(11) NOT NULL,
  `id_centro` char(2) character set utf8 NOT NULL default '',
  `PVPTiquet` float default NULL,
  `id_factura` int(7) default NULL,
  `serie` char(5) character set utf8 default NULL,
  `precio` float(12,6) default NULL,
  `avgiva` float default NULL,
  `descuento` float NOT NULL default '0',
  `destino` char(1) character set utf8 default 'V',
  `id_almacen` char(2) character set utf8 default NULL,
  `observaciones` varchar(250) character set utf8 default '',
  `cocina` float default '0',
  `nota` varchar(200) character set utf8 default '',
  `complementog` varchar(100) character set utf8 default NULL,
  `total` float default NULL,
  `servido_cocina` float default '0',
  `bloque_cocina` int(1) default '1',
  `z` int(11) default '0',
  `precio_compra` float default '0',
  `variacion` int(11) default '0',
  `impuesto2` float default '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ventadirecta`
--

DROP TABLE IF EXISTS `ventadirecta`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `ventadirecta` (
  `serie` char(5) default NULL,
  `id_tiquet` int(7) default NULL,
  `id_venta` int(7) NOT NULL default '0',
  `id_empresa` char(3) NOT NULL default '',
  `id_centro` char(2) NOT NULL default '',
  `id_entidad` char(3) default NULL,
  `id_camarero` int(4) NOT NULL default '0',
  `observaciones` varchar(249) default NULL,
  `fecha_venta` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tv` float default NULL,
  `cerrada` char(1) default NULL,
  `Num_Mesa` char(3) NOT NULL default '',
  `id_modo_pago` char(2) default '',
  `modo_pago` varchar(25) default '',
  `pagadocliente` double default '0',
  `id_caja` int(2) default '0',
  `codbarras_promocion` varchar(20) default NULL,
  `id_pretiquet` int(7) default NULL,
  `imppretiquet` char(1) default 'N',
  `hora` time default NULL,
  `dni` varchar(15) default NULL,
  `comensales` int(4) default '0',
  `alias` varchar(200) default '',
  `tarifa` varchar(200) default '',
  `turno` int(11) default '0',
  PRIMARY KEY  (`id_venta`),
  KEY `id_empresa` (`id_empresa`,`id_centro`),
  KEY `id_entidad` (`id_entidad`),
  KEY `ventadir_camarero` (`id_camarero`),
  KEY `venta_ibfk_3` (`Num_Mesa`),
  CONSTRAINT `ventadir_camarero` FOREIGN KEY (`id_camarero`) REFERENCES `camareros` (`id_camarero`) ON UPDATE CASCADE,
  CONSTRAINT `venta_ibfk_1` FOREIGN KEY (`id_empresa`, `id_centro`) REFERENCES `sysme`.`centro` (`id_empresa`, `id_centro`) ON UPDATE CASCADE,
  CONSTRAINT `venta_ibfk_2` FOREIGN KEY (`id_entidad`) REFERENCES `sysme`.`entidad` (`id_entidad`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ventadirecta2`
--

DROP TABLE IF EXISTS `ventadirecta2`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `ventadirecta2` (
  `serie` char(5) character set utf8 default NULL,
  `id_tiquet` int(7) default NULL,
  `id_venta` int(7) NOT NULL default '0',
  `id_empresa` char(3) character set utf8 NOT NULL default '',
  `id_centro` char(2) character set utf8 NOT NULL default '',
  `id_entidad` char(3) character set utf8 default NULL,
  `id_camarero` int(4) NOT NULL default '0',
  `observaciones` varchar(249) character set utf8 default NULL,
  `fecha_venta` date NOT NULL default '0000-00-00',
  `iva` int(2) NOT NULL default '0',
  `bi` float(12,6) default NULL,
  `ci` float(12,6) default NULL,
  `tv` float default NULL,
  `cerrada` char(1) character set utf8 default NULL,
  `Num_Mesa` char(3) character set utf8 NOT NULL default '',
  `id_modo_pago` char(2) character set utf8 default '',
  `modo_pago` varchar(25) character set utf8 default '',
  `pagadocliente` double default '0',
  `id_caja` int(2) default '0',
  `codbarras_promocion` varchar(20) character set utf8 default NULL,
  `id_pretiquet` int(7) default NULL,
  `imppretiquet` char(1) character set utf8 default 'N',
  `hora` time default NULL,
  `dni` varchar(15) character set utf8 default NULL,
  `comensales` int(4) default '0',
  `alias` varchar(200) character set utf8 default '',
  `tarifa` varchar(200) character set utf8 default '',
  `turno` int(11) default '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `zreport`
--

DROP TABLE IF EXISTS `zreport`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
CREATE TABLE `zreport` (
  `id` int(11) NOT NULL default '0',
  `fecha` date default NULL,
  `hora` time default NULL,
  `fecha_ini` date default NULL,
  `hora_ini` time default NULL,
  `fecha_fin` date default NULL,
  `hora_fin` time default NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
SET character_set_client = @saved_cs_client;

--
-- Dumping routines for database 'sysmehotel'
--
DELIMITER ;;
DELIMITER ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-16  0:02:59
