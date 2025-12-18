# 🚀 CONFIGURACIÓN RUNTIME POSTGRESQL EMBEBIDO

Sistema de base de datos embebida 100% portable, sin instalación en Windows.

---

## 📦 REQUISITOS PREVIOS

1. **Descargar PostgreSQL Portable**
   - URL: https://get.enterprisedb.com/postgresql/postgresql-16.2-1-windows-x64-binaries.zip
   - Tamaño: ~50MB comprimido

2. **Extraer archivos**
   - Extraer el ZIP descargado
   - Copiar las carpetas `bin/`, `lib/`, `share/` a: `D:\pos_venta\runtime\postgres\`

3. **Configurar credenciales**
   - Editar `backend\.env`
   - Configurar variables:
     - `PGUSER` (por defecto: `pos_admin`)
     - `PGPASSWORD` (CAMBIAR por contraseña segura)
     - `PGPORT` (por defecto: `5433`)

---

## 🔧 INSTALACIÓN (PRIMERA VEZ)

### Paso 1: Inicializar cluster PostgreSQL

```bash
scripts\init-db.bat
```

Esto creará:
- Cluster PostgreSQL en `runtime\data\postgres\`
- Configuración de acceso local
- Usuario configurado desde `.env`

**⚠️ SOLO EJECUTAR UNA VEZ**

---

### Paso 2: Arrancar PostgreSQL

```bash
scripts\start-db.bat
```

Verifica que el servidor esté corriendo:
```bash
scripts\status-db.bat
```

---

### Paso 3: Crear base de datos `pos_db`

```bash
scripts\create-db.bat
```

---

### Paso 4: Validar conexión

```bash
cd backend
node test-connections.js
```

Debes ver:
```
✅ MySQL Legacy: Conexión exitosa
✅ PostgreSQL DEV: Conexión exitosa
```

---

## 🎮 USO DIARIO

### Arrancar sistema completo

```bash
start-pos.bat
```

Esto iniciará:
1. PostgreSQL embebido
2. Backend Node.js
3. Dashboard (cuando esté implementado)

---

### Detener sistema completo

```bash
stop-pos.bat
```

O presiona cualquier tecla en la ventana del sistema.

---

## 🛠️ SCRIPTS DISPONIBLES

| Script | Descripción |
|--------|-------------|
| `scripts\init-db.bat` | Inicializar cluster (solo 1ra vez) |
| `scripts\start-db.bat` | Arrancar PostgreSQL |
| `scripts\stop-db.bat` | Detener PostgreSQL |
| `scripts\status-db.bat` | Ver estado del servidor |
| `scripts\create-db.bat` | Crear base de datos pos_db |
| `scripts\backup-db.bat` | Generar backup manual |
| `start-pos.bat` | Arrancar sistema completo (DEV) |
| `stop-pos.bat` | Detener sistema completo |

---

## 📂 ESTRUCTURA DE CARPETAS

```
pos_venta/
├── runtime/
│   ├── postgres/          ← PostgreSQL portable (bin, lib, share)
│   └── data/
│       ├── postgres/      ← Datos del cluster (auto-generado)
│       └── backups/       ← Backups automáticos
│
├── scripts/               ← Scripts de control
│   ├── init-db.bat
│   ├── start-db.bat
│   ├── stop-db.bat
│   └── ...
│
├── backend/
│   └── .env               ← Configuración (NUNCA versionar)
│
├── start-pos.bat          ← Ejecutable principal
└── stop-pos.bat
```

---

## 🔒 SEGURIDAD

### Variables de entorno

Todas las credenciales están en `backend\.env`:

```env
PGUSER=pos_admin
PGPASSWORD=TU_PASSWORD_SEGURO_AQUI
PGPORT=5433
DATABASE_URL="postgresql://pos_admin:TU_PASSWORD@localhost:5433/pos_db"
```

**⚠️ NUNCA versionar el archivo `.env` con credenciales reales**

---

### Backups

Generar backup manual:
```bash
scripts\backup-db.bat
```

Ubicación: `runtime\data\backups\pos_db_YYYYMMDD_HHMMSS.backup`

---

## 🚨 TROUBLESHOOTING

### Error: "PostgreSQL no encontrado"
- Verifica que exista `runtime\postgres\bin\postgres.exe`
- Descarga y extrae PostgreSQL portable

### Error: "Cluster no inicializado"
- Ejecuta `scripts\init-db.bat` primero

### Error: "PGPASSWORD no configurado"
- Edita `backend\.env` y configura `PGPASSWORD`

### Error: "Puerto 5433 en uso"
- Cambia `PGPORT` en `.env`
- Ejecuta `netstat -an | findstr :5433` para ver qué lo usa

---

## ✅ VENTAJAS DE ESTE MODELO

- ✅ 100% portable (copia la carpeta y funciona)
- ✅ Sin instalación en Windows
- ✅ Sin servicios del sistema
- ✅ Sin Docker
- ✅ Idéntico al modelo legacy (XAMPP embebido)
- ✅ PostgreSQL real (no SQLite)
- ✅ Soporta concurrencia
- ✅ ACID completo
- ✅ Backups automáticos

---

## 📞 SOPORTE

Si encuentras problemas, revisa:
1. `runtime\data\postgres.log` (log del servidor)
2. Ejecuta `scripts\status-db.bat`
3. Verifica credenciales en `.env`

---

**Sistema diseñado para máxima portabilidad y seguridad.**
**Basado en el modelo XAMPP del sistema legacy.**
