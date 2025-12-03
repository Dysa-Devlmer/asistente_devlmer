# Documentación SYSME-POS

Sistema de Punto de Venta para restaurantes multi-sucursal.

## Estructura del Proyecto

```
SYSME-POS/
├── backend/          # API Node.js/Express
├── frontend/         # React + Vite + TypeScript
├── jarvis/           # Asistente IA integrado
├── docs/             # Documentación
└── docker-compose.yml
```

## Inicio Rápido

```bash
# Instalar dependencias
npm install
cd backend && npm install
cd ../frontend && npm install

# Ejecutar en desarrollo
npm start
```

## Configuración

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173
- **Base de datos:** SQLite (backend/data/posventa.db)

## Arquitectura

- **5 sucursales** con terminales independientes
- **Sincronización híbrida** (offline-first)
- **Multi-destino cocina** (Cocina 1-4, Barra)
- **Chile:** CLP, 19% IVA, timezone America/Santiago
