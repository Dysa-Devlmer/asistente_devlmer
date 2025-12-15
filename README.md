# SYSME-POS

Sistema de Punto de Venta para restaurantes multi-sucursal en Chile.

## Estructura

```
SYSME-POS/
├── backend/          # API Node.js/Express + SQLite
├── frontend/         # React + Vite + TypeScript + Tailwind
├── jarvis/           # Asistente IA (WhatsApp, voz, web)
├── docs/             # Documentación
├── .env              # Variables de entorno
└── docker-compose.yml
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
git clone https://github.com/Dysa-Devlmer/pos_venta.git SYSME-POS
cd SYSME-POS
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## Ejecutar

```bash
npm start
```

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:5173

## Características

- 5 sucursales con terminales independientes
- Multi-destino cocina (Cocina 1-4, Barra)
- Sincronización híbrida offline-first
- Gestión de mesas, pedidos, pagos
- Sistema de propinas y división de cuentas
- Reportes y analytics en tiempo real
- JARVIS: Asistente IA integrado

## Configuración Chile

- Moneda: CLP (sin decimales)
- IVA: 19%
- Timezone: America/Santiago

## Licencia

MIT
