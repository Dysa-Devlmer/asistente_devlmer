# Plan de Reestructuración: SYSME-POS + JARVIS Unificado

## Estructura Actual
```
pos_venta/
├── Proyectos/SYSME-POS/     # Sistema POS
├── core/                     # JARVIS (86 módulos)
├── web-interface/           # Dashboard JARVIS antiguo
└── [otros archivos JARVIS]
```

## Estructura Nueva (SYSME-POS como raíz)
```
SYSME-POS/
├── backend/                  # API REST (existente)
├── dashboard-web/            # Frontend React (existente)
├── jarvis/                   # JARVIS integrado
│   ├── core/                 # Motor de IA
│   ├── channels/             # WhatsApp, Web Chat, Voz
│   ├── skills/               # Habilidades específicas
│   └── memory/               # Sistema de memoria
├── mobile/                   # App garzones (futuro)
├── docs/                     # Documentación
├── scripts/                  # Utilidades
└── docker-compose.yml
```

## Pasos de Migración
1. ✅ Crear estructura de directorios
2. ⬜ Mover backend y dashboard existentes
3. ⬜ Integrar módulos JARVIS relevantes
4. ⬜ Actualizar imports y configuración
5. ⬜ Crear esquema BD unificado
6. ⬜ Testear sistema integrado

## Módulos JARVIS a Integrar
- conversation-engine.js      → Chatbot
- conversation-memory.js      → Contexto
- voice-interface.js          → Comandos voz
- webhook-engine.js           → WhatsApp
- emotional-intelligence.js   → Personalidad
- nlp-engine.js               → Procesamiento lenguaje
- decision-engine.js          → Toma decisiones
- notification-service.js     → Alertas
