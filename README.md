# Asistente Devlmer (JARVIS)

Asistente de IA conversacional multicanal.

## Estructura

```
asistente_devlmer/
├── channels/         # Canales de comunicación
│   ├── voice/        # Interfaz de voz
│   ├── webchat/      # Chat web
│   └── whatsapp/     # WhatsApp Business API
├── core/             # Núcleo del asistente
│   ├── conversation-engine.js
│   ├── decision-engine.js
│   ├── emotional-intelligence.js
│   ├── nlp-engine.js
│   └── personality.js
├── integrations/     # Integraciones externas
├── memory/           # Sistema de memoria
│   ├── continuous-memory.js
│   ├── memory-advanced.js
│   └── persistent-memory.js
├── skills/           # Habilidades
│   ├── menu-info.js
│   ├── order-taking.js
│   └── reservations.js
└── index.js          # Punto de entrada
```

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

## Canales Disponibles

- **WhatsApp:** Integración con WhatsApp Business API
- **Voz:** Comandos de voz con TTS/STT
- **WebChat:** Chat embebido en web

## Características

- Motor de conversación natural
- Inteligencia emocional
- Memoria persistente (corto, mediano, largo plazo)
- Personalidad configurable
- Multi-canal

## Licencia

MIT
