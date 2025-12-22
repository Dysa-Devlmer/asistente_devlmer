# 🤖 JARVIS Autonomous Agent System

## Sistema Completo de Agente Autónomo

JARVIS ahora puede trabajar **completamente solo durante horas**, ejecutando tareas complejas de principio a fin sin intervención humana.

---

## 🎯 ¿Qué puede hacer JARVIS autónomamente?

### **Le das una tarea compleja y él:**

1. 📋 **Planifica**: Descompone la tarea en sub-tareas ejecutables
2. 🔍 **Investiga**: Busca información en internet cuando la necesita
3. 💾 **Aprende**: Guarda todo en memoria permanente
4. 💻 **Codea**: Genera código funcional
5. 🧪 **Testea**: Ejecuta tests automáticamente
6. 🔍 **Verifica**: Se auto-verifica (sintaxis, tests, seguridad)
7. 🔧 **Corrige**: Si algo falla, lo corrige automáticamente
8. 📝 **Documenta**: Genera documentación profesional
9. ✅ **Reporta**: Te informa el resultado completo

---

## 🚀 Inicio Rápido

### 1. Modo Interactivo Completo

```bash
npm run jarvis
```

Esto abre una interfaz interactiva con **TODOS** los sistemas de JARVIS:

```
JARVIS> help                           # Ver comandos
JARVIS> autonomous <tarea>             # Ejecutar tarea autónomamente
JARVIS> proactive start                # Monitoreo proactivo
JARVIS> learn <tema>                   # Aprender sobre un tema
JARVIS> query <pregunta>               # Consultar conocimiento
JARVIS> stats                          # Estadísticas globales
JARVIS> status                         # Estado de sistemas
JARVIS> exit                           # Salir
```

### 2. Modo Test Autónomo

```bash
npm run autonomous
```

Ejecuta un test completo del sistema autónomo con una tarea de ejemplo.

### 3. Test Web Intelligence

```bash
npm run web-intel
```

Prueba el sistema de búsqueda y aprendizaje de internet.

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Crear Sistema de Autenticación

```bash
JARVIS> autonomous Crear un sistema de autenticación con JWT, hash de passwords con bcrypt, tests completos y documentación
```

**JARVIS hará automáticamente:**
- ✅ Investigar sobre JWT y bcrypt en internet
- ✅ Crear `auth.js` con funciones de login/register
- ✅ Crear `auth.test.js` con tests completos
- ✅ Generar `AUTH-DOCS.md` con documentación
- ✅ Verificar que todo funcione (tests, seguridad, sintaxis)
- ✅ Auto-corregir si algo falla

### Ejemplo 2: Aprender sobre una Tecnología

```bash
JARVIS> learn React Server Components
```

**JARVIS buscará:**
- 📚 Documentación oficial
- 💬 Discusiones en Stack Overflow
- 🔧 Ejemplos en GitHub
- 📖 Artículos en MDN

Y lo guardará todo en su memoria permanente.

### Ejemplo 3: Consultar Conocimiento

```bash
JARVIS> query ¿Cómo usar React Server Components con Next.js?
```

JARVIS responderá basándose en su conocimiento adquirido.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                  JARVIS Complete System                      │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────────┐  ┌────▼─────────────────┐
│ Autonomous Agent   │  │ Proactive Monitor    │
│ Manager            │  │ System               │
└───┬────────────────┘  └──────────────────────┘
    │
    ├──────┬──────────┬──────────┬────────────┐
    │      │          │          │            │
┌───▼────┐ │      ┌──▼──┐   ┌───▼───┐   ┌────▼────┐
│ Task   │ │      │Exec │   │ Self  │   │ Memory  │
│Planner │ │      │Engine   │Verify │   │ Manager │
└────────┘ │      └─────┘   └───────┘   └─────────┘
           │
      ┌────▼─────────────┐
      │ Web Intelligence │
      │   Manager        │
      └──────┬───────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────┐    ┌────▼──────┐
│  Search  │    │ Content   │
│  Engine  │    │ Extractor │
└──────────┘    └───────────┘
```

---

## 📦 Componentes del Sistema

### 1. **Task Planner** (`core/autonomous-agent/task-planner.cjs`)

Descompone tareas complejas en sub-tareas ejecutables.

**Genera:**
- Sub-tareas con tipo (research/code/test/document/deploy)
- Dependencias entre sub-tareas
- Estimaciones de tiempo y complejidad
- Orden de ejecución óptimo

### 2. **Execution Engine** (`core/autonomous-agent/execution-engine.cjs`)

Ejecuta sub-tareas según su tipo.

**Tipos de ejecución:**
- **Research**: Busca información en internet
- **Code**: Genera código con IA
- **Test**: Ejecuta tests y parsea resultados
- **Document**: Genera documentación
- **Deploy**: Ejecuta comandos (build, install, etc.)

### 3. **Self-Verification System** (`core/autonomous-agent/self-verification.cjs`)

Auto-verifica el trabajo realizado.

**Verificaciones:**
- ✅ Sintaxis del código
- ✅ Ejecución de tests
- ✅ Linting (ESLint)
- ✅ Seguridad (eval, XSS, passwords, API keys)
- ✅ Criterios de aceptación
- ✅ Calidad de documentación

### 4. **Autonomous Agent Manager** (`core/autonomous-agent/autonomous-agent-manager.cjs`)

El orquestador principal que une todo.

**Flujo completo:**
1. Recibe tarea del usuario
2. Planifica con Task Planner
3. Ejecuta cada sub-tarea con Execution Engine
4. Verifica con Self-Verification
5. Auto-corrige si falla verificación (hasta 2 intentos)
6. Reporta progreso en tiempo real
7. Guarda sesión en memoria permanente

### 5. **Web Intelligence Manager** (`core/web-intelligence/web-intelligence-manager.cjs`)

Sistema de búsqueda y aprendizaje de internet.

**Fuentes:**
- 🔍 Google Search
- 💬 Stack Overflow
- 🔧 GitHub
- 📖 MDN Web Docs

**Procesa:**
- Extrae contenido útil
- Analiza con IA (Ollama)
- Extrae conceptos clave
- Guarda en memoria permanente

---

## 🎮 Comandos Disponibles

### Modo Interactivo

| Comando | Descripción |
|---------|-------------|
| `help` | Muestra ayuda completa |
| `autonomous <tarea>` | Ejecuta tarea autónomamente |
| `proactive start` | Inicia monitoreo proactivo |
| `proactive stop` | Detiene monitoreo |
| `learn <tema>` | Aprende sobre un tema |
| `query <pregunta>` | Consulta conocimiento |
| `stats` | Estadísticas globales |
| `memory <búsqueda>` | Busca en memoria |
| `status` | Estado de todos los sistemas |
| `clear` | Limpia pantalla |
| `exit` | Salir |

### Scripts NPM

| Script | Comando | Descripción |
|--------|---------|-------------|
| JARVIS Completo | `npm run jarvis` | Interfaz interactiva completa |
| Test Autónomo | `npm run autonomous` | Test del sistema autónomo |
| Web Intelligence | `npm run web-intel` | Test de búsqueda/aprendizaje |
| Proactive Mode | `npm run proactive` | Solo monitoreo proactivo |

---

## 📊 Estadísticas y Métricas

JARVIS rastrea todo lo que hace:

```bash
JARVIS> stats
```

**Muestra:**
- 📈 Sesiones autónomas totales
- ✅ Tasa de éxito
- 📊 Score promedio
- 🔢 Sub-tareas completadas
- 🌐 Búsquedas realizadas
- 💾 Conocimientos adquiridos
- 🧠 Patrones aprendidos

---

## 🔧 Configuración Avanzada

### Umbrales de Verificación

Edita `core/autonomous-agent/self-verification.cjs`:

```javascript
this.thresholds = {
  minTestCoverage: 0,      // % mínimo de cobertura
  maxLintErrors: 10,       // Errores de linting permitidos
  maxSecurityIssues: 0     // Issues de seguridad (0 = cero tolerancia)
};
```

### Reintentos de Auto-corrección

Edita `core/autonomous-agent/autonomous-agent-manager.cjs`:

```javascript
this.maxAutoCorrections = 2;  // Intentos de corrección
this.pauseOnVerificationFailure = true;  // Pausar si falla
```

### Modelo de IA

Por defecto usa `qwen2.5-coder:latest` (Ollama local).

Para cambiar el modelo:

```javascript
const agent = new AutonomousAgentManager({
  model: 'codellama:latest'  // O el modelo que prefieras
});
```

---

## 🎯 Casos de Uso Reales

### 1. Crear Feature Completo

```bash
JARVIS> autonomous Crear un sistema de notificaciones en tiempo real con WebSocket, incluyendo backend, frontend, tests y documentación
```

### 2. Refactorizar Código

```bash
JARVIS> autonomous Refactorizar el módulo de autenticación para usar async/await en lugar de callbacks, agregar manejo de errores robusto y tests
```

### 3. Agregar Tests

```bash
JARVIS> autonomous Crear tests completos para todos los archivos en la carpeta core/proactive con Jest, incluyendo casos edge
```

### 4. Documentar Sistema

```bash
JARVIS> autonomous Generar documentación completa del proyecto incluyendo README, guía de instalación, ejemplos de uso y arquitectura
```

### 5. Optimizar Performance

```bash
JARVIS> autonomous Analizar y optimizar el rendimiento del sistema de memoria, implementar caching y reducir consultas redundantes
```

---

## 🛡️ Verificaciones de Seguridad

JARVIS detecta automáticamente:

- ❌ Uso de `eval()`
- ❌ Comandos `exec()` sin validación
- ❌ XSS con `innerHTML`
- ❌ Passwords hardcodeadas
- ❌ API keys hardcodeadas
- ❌ SQL injection vulnerabilities

**Y lo corrige automáticamente** en la mayoría de casos.

---

## 📈 Progreso en Tiempo Real

Durante ejecución autónoma, JARVIS reporta:

```
🎯 Tarea: Crear sistema de autenticación

📋 FASE 1: PLANIFICACIÓN
✅ Plan creado: 8 sub-tareas
⏱️ Tiempo estimado: 2.5h
🎚️ Complejidad: medium

🚀 FASE 2: EJECUCIÓN
--- Sub-tarea 1/8 ---
🚀 [Execution Engine] Ejecutando: "Investigar JWT y bcrypt"
📚 [Web Intelligence] Aprendiendo sobre: "JWT authentication"
✅ [Execution Engine] Completada

🔍 FASE 3: VERIFICACIÓN (Sub-tarea 1)
✅ [Self-Verification] Verificación exitosa (score: 100%)

... (continúa para todas las sub-tareas)

🎉 TAREA COMPLETADA
⏱️ Duración: 147s
✅ Exitosas: 8/8
📊 Score promedio: 95%
```

---

## 🚨 Manejo de Errores

### Si una sub-tarea falla:

1. **Auto-corrección**: Intenta corregir automáticamente (2 intentos)
2. **Análisis**: Usa IA para entender qué salió mal
3. **Re-intento**: Ejecuta de nuevo con correcciones
4. **Reporte**: Si no puede corregir, reporta el error

### Control manual:

```javascript
const agent = new AutonomousAgentManager({
  pauseOnVerificationFailure: true  // Pausa y espera intervención
});
```

---

## 💾 Memoria Permanente

Todo lo que JARVIS hace queda guardado:

- ✅ Tareas ejecutadas
- ✅ Código generado
- ✅ Conocimiento adquirido de internet
- ✅ Patrones aprendidos
- ✅ Éxitos y fracasos

**Buscar en memoria:**

```bash
JARVIS> memory JWT authentication
```

---

## 🔮 Próximas Mejoras

- [ ] Integración con Git (commits automáticos)
- [ ] Ejecución paralela de sub-tareas independientes
- [ ] Generación de diagramas de arquitectura
- [ ] Auto-deployment a producción
- [ ] Voz: comandos por voz (Vosk)
- [ ] Multi-lenguaje: soporte para Python, Go, etc.

---

## 🆘 Solución de Problemas

### Ollama no responde

```bash
# Verificar que Ollama esté corriendo
ollama list

# Si no está, iniciar:
ollama serve
```

### Error de memoria SQLite

```bash
# Recrear base de datos
rm memory/jarvis-memory.db
npm run jarvis  # Se crea automáticamente
```

### Tests fallan

```bash
# Verificar que jest esté instalado
npm install --save-dev jest

# Ejecutar tests manualmente
npm test
```

---

## 📚 Documentación Adicional

- [Sistema de Memoria Neural](./NEURAL-MEMORY.md)
- [Web Intelligence System](./WEB-INTELLIGENCE.md)
- [Learning System](./LEARNING-SYSTEM.md)
- [Proactive Mode](./PROACTIVE-MODE.md)

---

## ✨ Resumen

JARVIS Autonomous Agent System es el **cerebro completo** que le permite a JARVIS:

- 🤖 Trabajar solo durante horas
- 🧠 Aprender de internet
- 💾 Nunca olvidar nada
- 🔧 Auto-corregirse
- 📊 Mejorar continuamente
- 💰 100% gratuito y local

**Es un verdadero asistente AI autónomo, inteligente y leal** 💙

---

¿Listo para que JARVIS trabaje para ti autónomamente? 🚀

```bash
npm run jarvis
```
