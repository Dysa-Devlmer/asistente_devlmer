# Arquitectura Híbrida SYSME-POS

## Resumen

Sistema diseñado para operar en múltiples sucursales con:
- **Funcionamiento 100% offline** en cada sucursal
- **Sincronización automática** cuando hay internet
- **Reportes consolidados** en servidor central

---

## Diagrama de Arquitectura

```
                         ☁️ SERVIDOR CENTRAL (VPS/Cloud)
                    ┌─────────────────────────────────────┐
                    │  • Base de datos consolidada        │
                    │  • Reportes multi-sucursal          │
                    │  • JARVIS WhatsApp centralizado     │
                    │  • Panel de administración          │
                    │  • API de sincronización            │
                    └─────────────────┬───────────────────┘
                                      │
                         Internet (cuando disponible)
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  SUCURSAL 1   │           │  SUCURSAL 2   │           │  SUCURSAL N   │
│               │           │               │           │               │
│ ┌───────────┐ │           │ ┌───────────┐ │           │ ┌───────────┐ │
│ │ SQLite    │ │           │ │ SQLite    │ │           │ │ SQLite    │ │
│ │ Local     │ │           │ │ Local     │ │           │ │ Local     │ │
│ └───────────┘ │           │ └───────────┘ │           │ └───────────┘ │
│               │           │               │           │               │
│ PC Principal  │           │ PC Principal  │           │ PC Principal  │
│ + N Tablets   │           │ + N Tablets   │           │ + N Tablets   │
└───────────────┘           └───────────────┘           └───────────────┘
```

---

## Componentes por Nivel

### 1. Sucursal (Local)

Cada sucursal opera de forma **completamente independiente**:

| Componente | Descripción |
|------------|-------------|
| **PC Principal** | Servidor local, caja, reportes, administración |
| **SQLite Local** | Base de datos completa de la sucursal |
| **Tablets Garzones** | Se conectan al PC principal vía WiFi |
| **Impresoras** | Cocina, Barra, Tickets conectados al PC |

**Capacidades offline:**
- ✅ Tomar pedidos
- ✅ Cobrar ventas
- ✅ Abrir/cerrar caja
- ✅ Generar reportes locales
- ✅ Reservaciones locales
- ⏳ WhatsApp (requiere internet, pero cola mensajes)

### 2. Servidor Central (Opcional)

Solo necesario si quieres:
- Reportes consolidados de todas las sucursales
- JARVIS WhatsApp centralizado
- Administración remota

**Opciones gratuitas/económicas:**
- Oracle Cloud Free Tier (siempre gratis)
- Google Cloud Free Tier
- Railway.app (gratis para proyectos pequeños)
- VPS económico ($5-10/mes)

---

## Flujo de Sincronización

```
SUCURSAL                                    SERVIDOR CENTRAL
    │                                              │
    │  1. Venta realizada                          │
    │  ────────────────►                           │
    │  Guardada en SQLite local                    │
    │                                              │
    │  2. Cola de sync (si hay internet)           │
    │  ────────────────────────────────────►       │
    │                                   Recibe datos│
    │                                   Actualiza BD│
    │                                              │
    │  3. Confirmación                             │
    │  ◄────────────────────────────────────       │
    │  Marca como sincronizado                     │
    │                                              │
    │  4. Sin internet? No pasa nada               │
    │  Los datos quedan en cola                    │
    │  Se sincronizan cuando vuelve               │
    │                                              │
```

### Tabla de Sincronización

```sql
-- Cada registro importante se agrega a la cola
sync_queue (
    id,
    branch_id,
    table_name,      -- 'orders', 'payments', etc.
    record_id,
    operation,       -- 'insert', 'update', 'delete'
    data,            -- JSON con los datos
    status,          -- 'pending', 'synced', 'error'
    created_at
)
```

---

## Configuración por Sucursal

### PC Principal (Caja)

```javascript
// config/branch.js
module.exports = {
  branch_id: 1,
  branch_code: 'SUC001',
  branch_name: 'Sucursal Centro',

  // Base de datos local
  database: {
    type: 'sqlite',
    path: './data/sysme.db'
  },

  // Servidor central (para sync)
  central_server: {
    url: 'https://mi-servidor.com/api',
    api_key: 'xxx-xxx-xxx',
    sync_enabled: true,
    sync_interval: 300 // segundos
  },

  // Terminal
  terminal: {
    code: 'TPV1',
    type: 'main',
    can_open_cash: true,
    can_close_cash: true
  }
}
```

### Tablets Garzones

```javascript
// Las tablets se conectan al PC principal
// NO tienen base de datos propia
module.exports = {
  server: {
    // IP del PC principal en la red local
    url: 'http://192.168.1.100:3001/api',
  },

  terminal: {
    code: 'TABLET1',
    type: 'tablet',
    can_open_cash: false,
    can_process_payments: false
  }
}
```

---

## Plan de Despliegue (4 Fases)

### Fase 1: Sucursal Piloto (1-2 semanas)
```
1. Instalar en 1 sucursal
2. Configurar PC principal + 2 tablets
3. Probar todas las funciones
4. Ajustar según feedback
```

### Fase 2: Servidor Central (1 semana)
```
1. Configurar servidor (VPS o cloud gratuito)
2. Instalar API de sincronización
3. Conectar sucursal piloto
4. Verificar sincronización funciona
```

### Fase 3: JARVIS WhatsApp (1 semana)
```
1. Configurar WhatsApp Business API
2. Conectar JARVIS al servidor central
3. Probar reservaciones y pedidos
4. Entrenar al equipo
```

### Fase 4: Despliegue Completo (2-3 semanas)
```
1. Instalar en sucursales 2-5
2. Configurar sync con servidor central
3. Capacitar personal
4. Monitorear y ajustar
```

---

## Requisitos Técnicos

### Por Sucursal

| Componente | Requisito Mínimo |
|------------|------------------|
| **PC Principal** | Windows 10/11, 4GB RAM, SSD 128GB |
| **Tablets** | Android 8+ o iPad, WiFi |
| **Red Local** | Router WiFi, sin necesidad de internet |
| **Impresoras** | Térmica 80mm (tickets), Térmica cocina |

### Servidor Central (Opcional)

| Componente | Requisito Mínimo |
|------------|------------------|
| **VPS** | 1 vCPU, 1GB RAM, 20GB SSD |
| **Sistema** | Ubuntu 22.04 o similar |
| **Base Datos** | PostgreSQL o MySQL |
| **Internet** | IP fija o dominio |

---

## Resolución de Problemas

### Sin Internet en Sucursal

**Problema:** La sucursal pierde internet.

**Solución:** El sistema sigue funcionando normalmente. Todas las ventas se guardan en SQLite local. Cuando vuelve internet, se sincronizan automáticamente.

### PC Principal se Apaga

**Problema:** El PC principal se apaga o reinicia.

**Solución:** Las tablets pierden conexión temporalmente. Al reiniciar el PC, todo vuelve a funcionar. Los pedidos en progreso se recuperan de la BD.

### Conflictos de Sincronización

**Problema:** Mismo registro modificado en dos lugares.

**Solución:** El servidor central tiene la última palabra. Se usa timestamp para resolver conflictos (el más reciente gana).

---

## Costos Estimados

### Opción 1: Solo Local (Sin servidor central)
```
- PC Principal: Ya existente o ~$300
- Tablets: $100-150 c/u (Android económico)
- Impresoras: $80-150 c/u
- Software: GRATIS (SYSME-POS es open source)

Total por sucursal: $300-600
```

### Opción 2: Con Servidor Central
```
- Opción local: $300-600 por sucursal
- Servidor: $0-10/mes (cloud gratuito o VPS económico)
- Dominio: $10-15/año
- WhatsApp Business: $0-15/mes según volumen

Total mensual: $0-25/mes
```

---

## Siguiente Paso

Con este esquema aprobado:

1. ✅ Esquema BD completo creado
2. ⏳ Actualizar backend para usar nuevo esquema
3. ⏳ Crear servicio de sincronización
4. ⏳ Implementar UI moderna del POS
5. ⏳ Probar en ambiente de desarrollo

¿Procedemos con la implementación?
