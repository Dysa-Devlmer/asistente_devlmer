# 🧠 JARVIS - MOTOR DE IA PROFUNDA (Python + Ollama)

Sistema híbrido de inteligencia artificial que combina:
- **JavaScript**: Motor rápido para acciones y decisiones básicas
- **Python**: Motor de IA profunda con modelos locales (Mistral, Llama2)
- **Ollama**: Runtime para ejecutar modelos LLM localmente

## 🚀 INSTALACIÓN RÁPIDA

### Paso 1: Instalar Ollama

#### Windows
```powershell
# Descargar e instalar desde:
https://ollama.ai/download/windows

# O usando winget:
winget install Ollama.Ollama
```

#### macOS
```bash
# Usando Homebrew:
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Paso 2: Iniciar Ollama

```bash
# En una terminal separada, ejecutar:
ollama serve

# Debería ver: "Ollama is running on http://127.0.0.1:11434"
```

### Paso 3: Descargar Modelo Local

Opciones de modelos (elegir uno):

```bash
# RECOMENDADO: Mistral (7B, balance perfecto)
ollama pull mistral

# ALTERNATIVA 1: Llama 2 (7B, muy capaz)
ollama pull llama2

# ALTERNATIVA 2: Phi-2 (2.7B, más rápido, menos recursos)
ollama pull phi

# ALTERNATIVA 3: Neural Chat (7B, especializado en conversación)
ollama pull neural-chat
```

**Recomendación**: Usar `mistral` para mejor balance entre velocidad y capacidad.

### Paso 4: Verificar Ollama

```bash
# Verificar que Ollama esté funcionando:
ollama list

# Debería mostrar los modelos instalados:
# NAME              ID              SIZE      MODIFIED
# mistral:latest    abc123def456    4.1 GB    2 hours ago
```

### Paso 5: Instalar Dependencias Python

```bash
# Navegar a la carpeta python:
cd python

# Instalar dependencias:
pip install -r requirements.txt

# O con Python 3 específicamente:
python3 -m pip install -r requirements.txt
```

**Dependencias instaladas**:
- Flask: Servidor web para API REST
- torch: PyTorch (base para ML)
- transformers: Librería de Hugging Face
- ollama: Cliente Python para Ollama
- numpy, scipy, scikit-learn: Matemáticas y ML
- flask-cors: CORS para llamadas desde JavaScript

### Paso 6: Iniciar Servidor Python

```bash
# En la carpeta python:
python server.py

# Debería ver:
# ════════════════════════════════════════════════════════════
# 🧠 J.A.R.V.I.S. AI ENGINE SERVER
# ════════════════════════════════════════════════════════════
#
# ✅ Motor de IA inicializado: mistral:latest
# 🚀 Servidor iniciando en http://127.0.0.1:5000
# 🔧 Debug mode: False
# 🤖 Modelo: mistral:latest
```

### Paso 7: Iniciar JARVIS (JavaScript)

```bash
# En la carpeta raíz (jarvis-standalone):
npm run pure

# Debería ver:
# ✅ Motor de IA Profunda (Python + Ollama): CONECTADO
```

## 🧪 PRUEBAS

### Test 1: Verificar Conexión

En JARVIS, escribir:
```
test IA profunda
```

Debería responder con el motor de IA profunda si todo está bien.

### Test 2: Pregunta Compleja

```
JARVIS, explícame por qué la arquitectura de microservicios es mejor que monolítica
```

Esto debería activar el motor de IA profunda (verás el mensaje "🧠 Usando Motor de IA Profunda").

### Test 3: Pregunta Simple

```
hola JARVIS como estas
```

Esto debería usar JavaScript (más rápido para respuestas simples).

## 🔧 CONFIGURACIÓN AVANZADA

### Variables de Entorno

Crear archivo `.env` en la carpeta `python/`:

```bash
# Modelo de Ollama (default: mistral:latest)
OLLAMA_MODEL=mistral:latest

# URL de Ollama (default: http://localhost:11434)
OLLAMA_URL=http://localhost:11434

# Host del servidor Flask (default: 127.0.0.1)
FLASK_HOST=127.0.0.1

# Puerto del servidor Flask (default: 5000)
FLASK_PORT=5000

# Modo debug (default: false)
FLASK_DEBUG=false
```

### Cambiar Modelo

```bash
# Parar el servidor Python (Ctrl+C)

# Cambiar modelo en .env:
OLLAMA_MODEL=llama2:latest

# Reiniciar servidor:
python server.py
```

## 📊 ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│                    JARVIS (Node.js)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Decision Engine (JavaScript)                    │   │
│  │  ↓                                               │   │
│  │  ¿Necesita IA Profunda?                         │   │
│  │  ├─ NO  → Procesar en JavaScript (rápido)      │   │
│  │  └─ SÍ  → HybridBridge → Python API            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│              Flask API Server (Python)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  AIEngine                                        │   │
│  │  ↓                                               │   │
│  │  Ollama Client → http://localhost:11434         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                  Ollama Runtime                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Mistral 7B (o Llama2, Phi, etc.)              │   │
│  │  Ejecutando localmente en CPU/GPU                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 CRITERIOS DE IA PROFUNDA

JARVIS usa IA profunda (Python + Ollama) cuando detecta:

1. **Preguntas complejas**: "explícame", "analiza", "compara"
2. **Generación creativa**: "escribe", "genera", "crea un"
3. **Razonamiento filosófico**: "por qué", "qué opinas"
4. **Análisis de código extenso**: "refactoriza", "optimiza"
5. **Mensajes largos**: >100 caracteres

Usa JavaScript para:
- Comandos simples: "git status", "busca archivos"
- Saludos: "hola", "cómo estás"
- Acciones rápidas: "screenshot", "monitor sistema"

## 🛠️ TROUBLESHOOTING

### Error: "Ollama no disponible"

```bash
# Verificar que Ollama esté corriendo:
curl http://localhost:11434/api/tags

# Si no responde, iniciar Ollama:
ollama serve
```

### Error: "Motor de IA Python no disponible"

```bash
# Verificar que el servidor Python esté corriendo:
curl http://127.0.0.1:5000/health

# Si no responde, iniciar servidor:
cd python
python server.py
```

### Error: "ModuleNotFoundError: No module named 'flask'"

```bash
# Reinstalar dependencias:
cd python
pip install -r requirements.txt
```

### Python muy lento

```bash
# Usar modelo más ligero:
ollama pull phi

# Cambiar en .env:
OLLAMA_MODEL=phi:latest

# Reiniciar servidor Python
```

### JARVIS no usa IA profunda

```bash
# Verificar en la respuesta de JARVIS:
# - Debería decir "🧠 Usando Motor de IA Profunda" para preguntas complejas
# - Si no aparece, el mensaje es considerado "simple"

# Forzar IA profunda con preguntas como:
# "JARVIS explícame en detalle..."
# "JARVIS analiza esto..."
```

## 📈 MONITOREO

### Ver estadísticas del motor de IA

```bash
# Endpoint de estadísticas:
curl http://127.0.0.1:5000/ai/stats

# Respuesta JSON con:
# - queries: total de consultas
# - successful_responses: respuestas exitosas
# - avg_response_time: tiempo promedio
# - memory_conversations: conversaciones en memoria
```

### Logs del servidor Python

El servidor Python muestra en consola:
- Cada consulta procesada
- Tiempo de respuesta
- Errores si los hay

## 🔒 SEGURIDAD

- ✅ **100% Local**: No se envían datos a servicios externos
- ✅ **Sin API Keys**: No requiere claves de OpenAI, Anthropic, etc.
- ✅ **Privacidad Total**: Todo procesado en tu máquina
- ✅ **Memoria Persistente**: Guardada localmente en `memory/ai_memory.json`

## 🎓 MODELOS RECOMENDADOS

| Modelo        | Tamaño | RAM Req. | Velocidad | Capacidad | Recomendado para      |
|---------------|--------|----------|-----------|-----------|----------------------|
| **mistral**   | 4.1GB  | 8GB      | ⚡⚡⚡     | ⭐⭐⭐⭐   | **Balance perfecto**  |
| llama2        | 3.8GB  | 8GB      | ⚡⚡⚡     | ⭐⭐⭐⭐   | Muy capaz            |
| phi           | 1.6GB  | 4GB      | ⚡⚡⚡⚡    | ⭐⭐⭐     | PCs con menos RAM    |
| neural-chat   | 4.1GB  | 8GB      | ⚡⚡⚡     | ⭐⭐⭐⭐   | Conversación natural |
| codellama     | 3.8GB  | 8GB      | ⚡⚡⚡     | ⭐⭐⭐⭐⭐  | Análisis de código   |

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Ollama instalado
- [ ] `ollama serve` ejecutándose
- [ ] Modelo descargado (`ollama pull mistral`)
- [ ] Dependencias Python instaladas (`pip install -r requirements.txt`)
- [ ] Servidor Python ejecutándose (`python server.py`)
- [ ] JARVIS muestra "✅ Motor de IA Profunda: CONECTADO"

## 🆘 SOPORTE

Si tienes problemas:

1. Verificar que Ollama esté ejecutándose: `ollama serve`
2. Verificar que el modelo esté descargado: `ollama list`
3. Verificar logs del servidor Python
4. Probar endpoint de health: `curl http://127.0.0.1:5000/health`

---

**Sistema implementado por**: J.A.R.V.I.S. para Ulmer Solier
**Fecha**: 2025-01-05
**Versión**: 1.0.0
