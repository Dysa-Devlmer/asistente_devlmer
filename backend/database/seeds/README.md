# Seeds - Datos de Prueba para POS Restaurant

Este directorio contiene scripts SQL para inicializar la base de datos con datos de prueba para desarrollo y testing.

## 📦 Archivos de Seeds

| Archivo | Descripción | Registros |
|---------|-------------|-----------|
| `01_employees.sql` | Empleados de prueba (meseros, cajeros, admin) | 13 empleados |
| `02_salons_tables.sql` | Salones y mesas del restaurante | 4 salones, 30 mesas |
| `03_rates.sql` | Tarifas de precios | 4 tarifas |
| `04_categories.sql` | Categorías de productos | 17 categorías |
| `05_products.sql` | Productos y precios por tarifa | 52 productos, 208 precios |
| `run-all-seeds.sql` | **Script maestro** que ejecuta todos los anteriores | - |

## 🚀 Uso Rápido

### Opción 1: Script Automatizado (Windows)

```bash
cd D:\pos_venta\scripts
load-seeds.bat
```

### Opción 2: Manual con psql

```bash
cd D:\pos_venta\backend\database\seeds

# Ejecutar el script maestro
psql -h 127.0.0.1 -p 4306 -U root -d sysmehotel -f run-all-seeds.sql
```

## 📊 Datos Incluidos

### 👥 Empleados (13)

| Tipo | ID | Nombre | PIN |
|------|----|----|------|
| Admin | ADM001 | Administrador | 1234 |
| Gerente | GER001 | Gerente Principal | 5678 |
| Mesero | MES001 | Juan Pérez | 1111 |
| Mesero | MES002 | María García | 2222 |
| Cajera | CAJ001 | Laura Rodríguez | 5555 |
| Chef | COC001 | Chef Principal | 7777 |
| Bartender | BAR001 | Bartender Principal | 1010 |

### 🪑 Mesas (30)

- **Salón Principal** (SALON1): Mesas 01-12
- **Terraza** (TERRAZA): Mesas 13-20
- **Área VIP** (VIP): Mesas 21-24 (Tarifa especial +10%)
- **Barra** (BAR): Posiciones B1-B6

### 💰 Tarifas (4)

1. **General** - Precio estándar
2. **VIP** - Precio base +10%
3. **Happy Hour** - Precio base -15%
4. **Delivery** - Igual a General

### 📂 Categorías (17)

**Estación Parrilla (bloque_cocina=1):**
- Carnes a la Parrilla
- Pollo y Aves
- Pescados y Mariscos
- Hamburguesas

**Estación Fríos (bloque_cocina=2):**
- Ensaladas
- Ceviches
- Entradas Frías
- Sushi y Rolls

**Estación Bebidas (bloque_cocina=3):**
- Bebidas Calientes
- Refrescos
- Jugos Naturales
- Cervezas
- Vinos
- Cócteles

**Estación Postres (bloque_cocina=4):**
- Postres Clásicos
- Helados
- Pasteles

### 🍽️ Productos (52)

Algunos ejemplos:

| Producto | Categoría | Precio Base | Precio VIP | Happy Hour |
|----------|-----------|-------------|------------|------------|
| Bife de Chorizo 400g | Carnes | S/ 45.00 | S/ 49.50 | S/ 38.25 |
| Hamburguesa Clásica | Hamburguesas | S/ 18.00 | S/ 19.80 | S/ 15.30 |
| Ensalada César | Ensaladas | S/ 16.00 | S/ 17.60 | S/ 13.60 |
| Ceviche de Pescado | Ceviches | S/ 28.00 | S/ 30.80 | S/ 23.80 |
| Pisco Sour | Cócteles | S/ 18.00 | S/ 19.80 | S/ 15.30 |
| Tiramisú | Postres | S/ 14.00 | S/ 15.40 | S/ 11.90 |

## 🔧 Requisitos Previos

1. **PostgreSQL corriendo** en puerto 4306
   ```bash
   cd D:\pos_venta\scripts
   start-db.bat
   ```

2. **Base de datos creada**: `sysmehotel`

3. **Tablas existentes**: Asegúrate de que las migraciones se ejecutaron

## ⚠️ Advertencias

- **Estos seeds ejecutan TRUNCATE** en las tablas, eliminando todos los datos existentes
- Solo usar en **ambientes de desarrollo/testing**
- **NO ejecutar en producción**

## 🧪 Testing

Después de cargar los seeds, puedes verificar los datos:

```sql
-- Ver empleados
SELECT codigo_cajero, nombre_cajero FROM apcajas;

-- Ver mesas por salón
SELECT id_salon, COUNT(*) FROM mesa GROUP BY id_salon;

-- Ver productos por estación de cocina
SELECT bloque_cocina, COUNT(*) FROM complementog GROUP BY bloque_cocina;

-- Ver precios de un producto en todas las tarifas
SELECT
  c.complementog,
  t.nombre as tarifa,
  ct.pvptarifa as precio
FROM complementog c
JOIN comg_tarifa ct ON c.id_complementog = ct.id_complementog
JOIN tarifa t ON ct.id_tarifa = t.id_tarifa
WHERE c.id_complementog = 1;
```

## 📝 Mantenimiento

Para **actualizar** los seeds:

1. Edita el archivo SQL correspondiente
2. Ejecuta solo ese archivo:
   ```bash
   psql -h 127.0.0.1 -p 4306 -U root -d sysmehotel -f 05_products.sql
   ```

Para **agregar nuevos seeds**:

1. Crea un nuevo archivo con numeración secuencial: `06_nuevo.sql`
2. Agrégalo a `run-all-seeds.sql` en el orden correcto
3. Documenta en este README

## 🔗 Integración con Tests E2E

Estos seeds están diseñados para soportar las pruebas E2E de la Fase 7:

- **Credenciales conocidas** para login automatizado
- **Mesas en estado libre** para crear ventas
- **Productos variados** para testing de flujos completos
- **Múltiples tarifas** para testing de cambios de precio

## 📞 Soporte

Si encuentras problemas al cargar los seeds:

1. Verifica que PostgreSQL esté corriendo: `netstat -ano | findstr ":4306"`
2. Verifica la conexión: `psql -h 127.0.0.1 -p 4306 -U root -d sysmehotel -c "SELECT 1"`
3. Revisa los logs de error en la consola

---

**Última actualización**: 22 Diciembre 2025
