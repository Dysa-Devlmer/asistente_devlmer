# Instrucciones para Transferir SYSME-POS a tu PC

## Resumen de Funcionalidades Implementadas

Se han implementado las siguientes funcionalidades del sistema legacy SYSME TPV v5.04:

| Funcionalidad | Estado | Archivo Principal |
|---------------|--------|-------------------|
| Teclado Virtual Táctil | ✅ Completo | `dashboard-web/src/components/ui/VirtualKeyboard.tsx` |
| Notas Rápidas Cocina | ✅ Completo | `dashboard-web/src/components/KitchenNotesModal.tsx` |
| Métodos de Pago Chilenos | ✅ Completo | `backend/src/database/migrations/005_chile_payment_methods.sql` |
| Productos Favoritos | ✅ Completo | `backend/src/modules/products/favorites.js` |
| Badge Ventas Pendientes | ✅ Completo | `dashboard-web/src/components/ui/ParkedSalesBadge.tsx` |
| Reimprimir Ticket (F4) | ✅ Completo | `dashboard-web/src/components/ui/ReprintButton.tsx` |

---

## Opción 1: Clonar desde GitHub (Recomendado)

```bash
# 1. Clonar el repositorio completo
git clone https://github.com/Dysa-Devlmer/pos_venta.git

# 2. Navegar al directorio del proyecto
cd pos_venta/Proyectos/SYSME-POS

# 3. Instalar dependencias del backend
cd backend
npm install

# 4. Instalar dependencias del frontend
cd ../dashboard-web
npm install

# 5. Configurar variables de entorno
cd ..
cp .env.example .env
# Editar .env con tu configuración
```

---

## Opción 2: Descarga Directa

1. Ve a: https://github.com/Dysa-Devlmer/pos_venta
2. Haz clic en **Code** → **Download ZIP**
3. Extrae el archivo en tu PC
4. Navega a `pos_venta/Proyectos/SYSME-POS`

---

## Configuración Inicial

### 1. Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto:

```env
# Servidor
NODE_ENV=production
PORT=3001

# Base de datos
DB_PATH=./data/sysme.db

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura-aqui

# Impresoras (opcional)
KITCHEN_PRINTER_ENABLED=true
KITCHEN_PRINTER_TYPE=network
KITCHEN_PRINTER_IP=192.168.1.100
KITCHEN_PRINTER_PORT=9100

RECEIPT_PRINTER_ENABLED=true
RECEIPT_PRINTER_TYPE=network
RECEIPT_PRINTER_IP=192.168.1.101
RECEIPT_PRINTER_PORT=9100
```

### 2. Inicializar Base de Datos

```bash
# Desde el directorio backend
cd backend
npm run db:init
```

### 3. Ejecutar Migraciones

```bash
npm run db:migrate
```

---

## Iniciar el Sistema

### Opción A: Scripts de Windows

Ejecuta `START-SYSTEM.bat` en la raíz del proyecto.

### Opción B: Manual

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd dashboard-web
npm run dev
```

### URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Documentación API**: http://localhost:3001/api-docs

---

## Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| cajero | cajero123 | Cajero |

**IMPORTANTE**: Cambiar las contraseñas inmediatamente después del primer login.

---

## Uso de las Nuevas Funcionalidades

### Teclado Virtual
- Se activa automáticamente en dispositivos táctiles
- Modo numérico para cantidades y precios
- Modo alfanumérico completo con ñ

### Notas Rápidas de Cocina
- Clic en un producto → Botón "Notas"
- 26 notas predefinidas: TERMINO MEDIO, CON PAPAS, SIN AJÍ, etc.
- Permite notas personalizadas

### Productos Favoritos
- Estrella junto a cada producto para marcar favorito
- Categoría "Favoritos" en el POS para acceso rápido
- Drag-and-drop para reordenar

### Badge Ventas Pendientes
- Muestra contador de ventas parqueadas
- Se actualiza cada 30 segundos
- Notificación flotante para ventas antiguas

### Reimprimir Ticket (F4)
- Presiona F4 en cualquier momento
- Reimprime el último ticket completado
- Lleva conteo de reimpresiones

### Métodos de Pago Chilenos
- Red Compra (débito)
- Visa / Mastercard
- Cheque
- Transferencia
- Webpay / Transbank

---

## Requisitos del Sistema

- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **RAM**: Mínimo 4GB
- **Disco**: Mínimo 2GB libres
- **SO**: Windows 10/11, macOS, Linux

---

## Soporte Técnico

Para reportar problemas o solicitar funcionalidades:
- GitHub Issues: https://github.com/Dysa-Devlmer/pos_venta/issues

---

*Sistema listo para producción en restaurantes chilenos* 🇨🇱
