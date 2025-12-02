# 🇨🇱 OSPOS para Restaurantes Chilenos

## 📋 Resumen del Proyecto

**OSPOS Chile Restaurantes v2.0** es una versión especializada del sistema de punto de venta Open Source POS (OSPOS) completamente adaptada para cumplir con la normativa fiscal chilena y las necesidades específicas de restaurantes locales.

### 🎯 Características Principales

✅ **Cumplimiento Normativo SII 2025**
- Boletas electrónicas obligatorias (Resolución N°12/2025)
- Facturas electrónicas con validación e-RUT (Resolución N°121/2024)
- Cálculo automático de IVA 19%
- Validación de RUT chileno
- Integración con certificados digitales SII

✅ **Configuración Regional Chile**
- Moneda: Pesos chilenos (CLP) sin decimales
- Zona horaria: America/Santiago
- Formato de fechas: DD/MM/YYYY
- Separadores numéricos chilenos (punto miles, coma decimal)

✅ **Productos Típicos Precargados**
- 32 productos chilenos en 11 categorías
- Empanadas, completos, mariscos, vinos
- Precios en pesos chilenos actualizados 2025
- Stock mínimo configurado por producto

✅ **Funcionalidades para Restaurantes**
- Sistema de mesas con códigos QR
- Gestión de propinas (10%, 12%, 15%)
- Tipos de pago locales (Transbank, Sodexo, etc.)
- Horarios típicos chilenos (almuerzo, once, cena)
- Delivery con zonas de reparto

---

## 🚀 Instalación Rápida

### Método 1: Instalación Automática (Recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Soyelijah/pos_ospos.git
cd pos_ospos
git checkout chile-restaurantes-2025

# 2. Ejecutar instalación automática
bash instalar_ospos_chile.sh

# 3. Iniciar el sistema
php -S localhost:8000 -t public
```

### Método 2: Instalación Manual

1. **Descargar y extraer el proyecto**
2. **Verificar requisitos PHP**:
   - PHP 8.1 o superior
   - Extensiones: `intl`, `gd`, `sqlite3`, `openssl`, `curl`, `json`
3. **Configurar permisos**:
   ```bash
   chmod -R 777 writable/
   chmod 777 posventa.db
   ```
4. **Cargar productos chilenos**:
   ```bash
   php data/poblar_productos_chilenos.php
   ```

---

## ⚙️ Configuración Inicial

### 1. Acceso al Sistema

- **URL**: http://localhost:8000
- **Usuario**: `admin`
- **Contraseña**: `pointofsale`

### 2. Configuración del Restaurante

En **Configuración > Información de la Empresa**:

- **Nombre del restaurante**: Ej. "Restaurante Las Empanadas"
- **RUT**: Formato XX.XXX.XXX-X
- **Giro**: "Servicios de restaurant"
- **Dirección**: Dirección completa
- **Comuna**: Seleccionar de la lista precargada
- **Región**: Seleccionar región de Chile

### 3. Configuración SII (Facturación Electrónica)

#### Paso 1: Obtener Certificado Digital
1. Contratar certificado digital con proveedor autorizado SII:
   - E-Cert
   - Acepta
   - WebFactura
   - Otros proveedores certificados

#### Paso 2: Configurar en el Sistema
En **Configuración > SII Chile**:

- **RUT Empresa**: RUT sin puntos ni guión
- **Ambiente**: `testing` (para pruebas) o `production` (producción)
- **Certificado Digital**: Subir archivo .p12
- **Contraseña Certificado**: Contraseña del certificado

#### Paso 3: Validar Configuración
```bash
php verificar_configuracion_sii.php
```

---

## 🧾 Documentos Tributarios

### Boletas Electrónicas

**Cuándo emitir**: Para todas las ventas a consumidor final

**Características**:
- Emisión automática obligatoria
- Cliente: "Cliente Final" (RUT 66.666.666-6)
- Entrega impresa o digital según Resolución N°53/2025

### Facturas Electrónicas

**Cuándo emitir**: Solo para consumos comerciales con:
- e-RUT válido presentado
- Motivo comercial explícito:
  - Almuerzo de negocios
  - Cena de trabajo
  - Evento corporativo
  - Capacitación empresa

**Proceso**:
1. Cliente presenta e-RUT
2. Verificar identidad con cédula
3. Registrar motivo comercial
4. El sistema valida automáticamente
5. Emite factura solo si cumple requisitos

---

## 🍽️ Productos Precargados

### Categorías Incluidas

| Categoría | Productos | Precio Promedio |
|-----------|-----------|----------------|
| **Empanadas** | Pino, Queso, Mariscos | $1.500 |
| **Completos** | Italiano, As, Dinámico | $2.500 |
| **Platos Principales** | Cazuela, Pastel de Choclo, Curanto | $9.000 |
| **Mariscos** | Centolla, Machas, Chupe | $14.000 |
| **Pescados** | Salmón, Congrio | $10.000 |
| **Bebidas** | Mote con Huesillo, Chicha | $1.800 |
| **Cervezas** | Cristal, Escudo, Kunstmann | $2.300 |
| **Vinos** | Carmenère, Sauvignon Blanc | $7.800 |
| **Cócteles** | Pisco Sour, Piscola, Terremoto | $4.000 |
| **Postres** | Sopaipillas Pasadas, Leche Asada | $3.200 |
| **Entradas** | Humitas, Sopaipillas, Pebre | $1.800 |

**Total**: 32 productos típicos chilenos listos para usar

---

## 💳 Tipos de Pago Configurados

### Métodos de Pago Locales

- ✅ **Efectivo**
- ✅ **Tarjeta de Débito** (Redcompra)
- ✅ **Tarjeta de Crédito** (Transbank)
- ✅ **Transferencia Electrónica**
- ✅ **Vale Restaurant** (Sodexo, Ticket Restaurant)
- ✅ **Cheque**

### Configuración Bancos

Bancos principales precargados:
- Banco de Chile
- BancoEstado  
- Santander
- BCI
- Scotiabank
- Itaú

---

## 🏪 Funcionalidades Específicas

### Sistema de Mesas

- **Mesas numeradas**: 1-50 (configurable)
- **Estados**: Libre, Ocupada, Reservada, Limpieza
- **Códigos QR**: Para pedidos desde mesa
- **División de cuentas**: Separar por comensal

### Gestión de Propinas

- **Propinas sugeridas**: 10%, 12%, 15%
- **Cálculo automático**: Sobre total neto
- **Registro contable**: Separado de ventas
- **Distribución**: Por empleado/turno

### Delivery y Reparto

- **Zonas de reparto**: Comunas principales
- **Costo de envío**: Por zona
- **Pedido mínimo**: Configurable por zona
- **Tiempo estimado**: Por distancia

---

## 📊 Reportes Especializados

### Reportes SII

1. **Libro de Ventas Diario**
   - Boletas y facturas emitidas
   - Montos netos e IVA
   - Formato para declaración mensual

2. **Control de Folios**
   - Folios utilizados por tipo de documento
   - Rangos autorizados SII
   - Detección de folios faltantes

3. **Resumen Mensual IVA**
   - IVA débito (ventas)
   - IVA crédito (compras)
   - IVA a pagar/favor

### Reportes Operacionales

- **Ventas por Horario** (almuerzo, once, cena)
- **Productos Más Vendidos** (por categoría chilena)
- **Análisis de Propinas** (por empleado/turno)
- **Eficiencia de Mesas** (rotación/hora)
- **Delivery vs Presencial** (comparativo)

---

## 🔧 Configuración Avanzada

### Variables de Entorno Chile

```env
# Configuración monetaria
CURRENCY_CODE=CLP
CURRENCY_SYMBOL=$
CURRENCY_DECIMALS=0

# Configuración fiscal
DEFAULT_TAX_RATE=19.0
TAX_INCLUDED_IN_PRICE=true

# Configuración SII
SII_ENABLED=true
SII_ENVIRONMENT=testing
SII_RUT_EMPRESA=12345678-9
SII_CERTIFICADO_DIGITAL=/path/to/cert.p12

# Configuración regional
TIMEZONE=America/Santiago
LOCALE=es_CL
```

### Personalización de Productos

```php
// Agregar productos personalizados
$mi_producto = [
    'categoria' => 'Mi Categoría',
    'nombre' => 'Mi Plato Especial',
    'descripcion' => 'Descripción del plato',
    'precio' => 8500,
    'codigo' => 'ESP001',
    'stock_minimo' => 5,
    'unidad' => 'UN'
];
```

---

## 🛠️ Mantenimiento

### Respaldos Automáticos

```bash
# Respaldar base de datos
cp posventa.db backup_$(date +%Y%m%d).db

# Respaldar certificados SII
cp -r certificates/ backup_certificates_$(date +%Y%m%d)/
```

### Actualizaciones

```bash
# Actualizar desde GitHub
git pull origin chile-restaurantes-2025

# Verificar configuración después de actualizar
php verificar_configuracion_chile.php
```

### Logs del Sistema

- **Logs SII**: `logs/sii/facturacion.log`
- **Logs Ventas**: `logs/ventas.log`
- **Logs Errores**: `logs/errores.log`

---

## 🆘 Resolución de Problemas

### Problemas Comunes

#### Error: "No se puede conectar con SII"
**Solución**:
1. Verificar conexión a internet
2. Validar certificado digital
3. Comprobar configuración de ambiente

#### Error: "RUT inválido"
**Solución**:
1. Verificar formato: 12345678-9
2. Usar validador RUT integrado
3. Revisar dígito verificador

#### Error: "Factura rechazada"
**Solución**:
1. Verificar e-RUT del cliente
2. Confirmar motivo comercial válido
3. Revisar datos del emisor

### Soporte Técnico

- **GitHub Issues**: [Crear issue](https://github.com/Soyelijah/pos_ospos/issues)
- **Documentación SII**: [sii.cl](https://www.sii.cl)
- **Community**: Foro de desarrolladores OSPOS

---

## 📚 Recursos Adicionales

### Documentación Oficial

- **Manual de Usuario**: `docs/manual_usuario.pdf`
- **API Reference**: `docs/api_reference.md`
- **Configuración SII**: `docs/sii_setup.md`

### Tutoriales en Video

- **Instalación Paso a Paso**: [YouTube]
- **Configuración SII**: [YouTube]
- **Facturación Electrónica**: [YouTube]

### Normativas de Referencia

- **Resolución SII N°121/2024**: Facturas en restaurantes
- **Resolución SII N°12/2025**: Boletas electrónicas
- **Resolución SII N°53/2025**: Entrega de comprobantes

---

## 🤝 Contribuciones

### Cómo Contribuir

1. **Fork** el repositorio
2. **Crear** branch para nueva funcionalidad
3. **Commit** cambios con mensajes descriptivos
4. **Push** a tu branch
5. **Crear** Pull Request

### Áreas de Contribución

- 🐛 **Bug fixes**
- 🚀 **Nuevas funcionalidades**
- 📖 **Documentación**
- 🧪 **Testing**
- 🌐 **Traducciones**

---

## 📄 Licencia

Este proyecto está licenciado bajo **MIT License** - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙋‍♂️ Créditos

- **OSPOS Original**: [opensourcepos/opensourcepos](https://github.com/opensourcepos/opensourcepos)
- **Fork Base**: [Dysa-Devlmer/pos_ospos](https://github.com/Dysa-Devlmer/pos_ospos)
- **Adaptación Chile**: [Soyelijah](https://github.com/Soyelijah)
- **Colaboradores**: Ver [CONTRIBUTORS.md](CONTRIBUTORS.md)

---

## 🎉 ¡Listo para Usar!

Tu sistema POS está completamente adaptado para restaurantes chilenos con cumplimiento normativo SII 2025. 

**¡Empieza a vender con confianza! 🇨🇱**

---

*Última actualización: Octubre 2025*
*Versión: 2.0.0*
