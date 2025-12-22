# ⚡ J.A.R.V.I.S. Mark VII - Startup Guide

> **"Jarvis, we're home."** - Tony Stark

## 🎯 Quick Start (The Fast Way)

### Option 1: Complete Initialization (Recommended)

```bash
# Windows
jarvis.bat

# Or using npm
npm run init
```

This will:
- ✅ Run pre-flight checks
- ✅ Initialize all 21 subsystems in correct order
- ✅ Verify dependencies
- ✅ Run health checks
- ✅ Start monitoring
- ✅ Launch web dashboard

### Option 2: Protected Panel

```bash
npm run panel
```

Starts the protected web interface with all security features enabled.

### Option 3: Legacy Start

```bash
npm run protected
```

The original protected startup script.

---

## 🚀 The Complete Initialization System

The new `jarvis-init.js` orchestrates all JARVIS systems with:

### **Pre-Flight Checks**
- Node.js version verification (14+)
- Directory structure validation
- Configuration file checks
- Port availability verification

### **Layer-by-Layer Initialization**

**Layer 1: Foundation** (No Dependencies)
- Neural Memory System
- Process Guardian
- Distributed Cache System

**Layer 2: Services** (Depends on Layer 1)
- API Gateway Enterprise
- Event Sourcing & CQRS
- Voice Interaction System
- Proactive Monitoring
- Email Management
- GitHub Integration
- Project Management

**Layer 3: Applications** (Depends on Layer 2)
- Backend Server (Port 7777)
- Frontend Server (Port 5173)

### **Health Monitoring**
- Initial health checks for all systems
- Continuous monitoring (every 10 seconds)
- Automatic failure detection
- Critical system alerts

### **Graceful Shutdown**
- Reverse-order shutdown (Layer 3 → Layer 1)
- Process cleanup
- Resource release

---

## 📊 System Status

After initialization, you'll see:

```
⚡ JARVIS MARK VII FULLY OPERATIONAL ⚡
============================================================

"All systems online, sir."

📊 Initialization Statistics:
   Systems Started: 12
   Systems Failed: 0
   Startup Time: 8523ms
   Health Checks Passed: 12

🚀 Dashboard: http://localhost:5173
⚙️  Backend: http://localhost:7777
📊 Status: All systems nominal

"Shall we begin?"
```

---

## 🎛️ Access Points

### Web Dashboard
```
http://localhost:5173
```
Full-featured React dashboard with:
- Real-time system monitoring
- Task management interface
- Voice command console
- Memory explorer
- Performance metrics

### Backend API
```
http://localhost:7777
```
REST API with WebSocket support:
- `/api/status` - System status
- `/api/chat` - Chat interface
- `/api/memory` - Memory access
- `/api/tasks` - Task management

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in root:

```env
# API Keys
ANTHROPIC_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Server Configuration
BACKEND_PORT=7777
FRONTEND_PORT=5173

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret

# Features
ENABLE_VOICE=true
ENABLE_EMAIL=true
ENABLE_GITHUB=true
ENABLE_PROACTIVE=true
```

### Initialization Options

Edit `jarvis-init.js` or create `jarvis.config.json`:

```json
{
  "logLevel": "info",
  "timeout": 60000,
  "retries": 3,
  "healthCheckInterval": 10000,
  "gracefulShutdown": true
}
```

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Windows - Check what's using the port
netstat -ano | findstr :7777
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <process_id> /F
```

### Module Not Found

```bash
# Reinstall dependencies
npm install

# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Memory System Errors

```bash
# Initialize memory directory
mkdir -p memory/daily memory/context memory/sessions

# Reset memory
npm run clean
```

### Pre-flight Check Failures

Check that all required files exist:
```
✓ core/
✓ memory/
✓ web-interface/
✓ web-interface/backend/
✓ web-interface/frontend/
✓ package.json
```

---

## 🔴 Emergency Protocols

### Code Red - System Crash

```bash
# 1. Check logs
cat logs/error.log

# 2. Clean restart
npm run clean
npm run init

# 3. Safe mode (minimal systems)
npm run safe
```

### Defense Condition 1 - Critical Failure

```bash
# 1. Stop all processes
Ctrl + C (SIGINT)

# 2. Kill background processes
taskkill /F /IM node.exe

# 3. Clean slate restart
npm run clean
npm install
npm run init
```

---

## 📈 Performance Optimization

### Memory Settings

```bash
# Increase Node.js memory limit
set NODE_OPTIONS=--max-old-space-size=4096

# Run with garbage collection exposed
node --expose-gc jarvis-init.js
```

### Production Mode

```bash
# Set production environment
set NODE_ENV=production

# Disable debug logging
# In jarvis-init.js, set logLevel: 'warn'
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Backend Tests Only

```bash
npm run test:backend
```

### Frontend Tests Only

```bash
npm run test:frontend
```

### Coverage Report

```bash
npm run test:coverage
```

---

## 📚 System Architecture

### 21 Integrated Subsystems

1. **Neural Memory System** - Persistent learning
2. **Voice Interaction** - TTS/STT processing
3. **Autonomous Task Execution** - Self-directed AI
4. **Proactive Monitoring** - Real-time alerts
5. **Email Management** - Gmail integration
6. **GitHub Integration** - Repository automation
7. **Project Management** - Task tracking
8. **Web Interface** - React dashboard
9. **Backend Server** - Express + Socket.io
10. **Backup & Recovery** - Automated backups
11. **Testing & QA** - Automated testing
12. **Security & Auth** - JWT + RBAC
13. **Performance Monitor** - Real-time metrics
14. **Process Guardian** - Process management
15. **API Gateway Enterprise** - Rate limiting + JWT
16. **Distributed Cache System** - Multi-level caching
17. **Event Sourcing & CQRS** - Event-driven architecture
18. **Circuit Breaker** - Fault tolerance
19. **Service Mesh** - Microservices communication
20. **Observability** - Metrics + Tracing
21. **Auto-scaling** - Dynamic resource management

### Data Flow

```
User Input → API Gateway → Backend Services → Neural Memory
                ↓                ↓                  ↓
          Rate Limiting    Event Sourcing    Persistent Storage
                ↓                ↓                  ↓
          Authentication   CQRS Patterns    Cache Layer (L1/L2)
                ↓                ↓                  ↓
          Web Dashboard ← WebSocket ← Real-time Updates
```

---

## 🎯 Next Steps

After successful initialization:

1. **Configure API Keys** - Add your credentials to `.env`
2. **Test Voice Commands** - Try "Hey Jarvis, status report"
3. **Explore Dashboard** - Visit http://localhost:5173
4. **Review Documentation** - Check `JARVIS-COMPLETE-PLATFORM-GUIDE.md`
5. **Customize Settings** - Edit configuration files
6. **Start Building** - Create your first autonomous task

---

## 💡 Pro Tips

### Faster Startup

```bash
# Skip optional systems
# Edit jarvis-init.js and set critical: false for:
# - voice-interaction
# - email-management
# - github-integration
```

### Development Mode

```bash
# Auto-restart on changes
npm run dev

# Watch mode for frontend
cd web-interface/frontend
npm run dev
```

### Custom Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "jarvis:quick": "node jarvis-init.js --skip-health-checks",
    "jarvis:verbose": "node jarvis-init.js --log-level debug",
    "jarvis:minimal": "node jarvis-init.js --minimal"
  }
}
```

---

## 🔐 Security Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Rotate JWT secrets** - Change regularly
3. **Use strong passwords** - For admin accounts
4. **Enable HTTPS** - In production
5. **Monitor logs** - Check for suspicious activity
6. **Update dependencies** - Run `npm audit` regularly

---

## 📞 Support

### Documentation
- **Complete Guide**: `JARVIS-COMPLETE-PLATFORM-GUIDE.md`
- **README**: `README.md`
- **API Docs**: `web-interface/backend/API.md`

### Logs
- **System Logs**: `logs/combined.log`
- **Error Logs**: `logs/error.log`
- **Memory Logs**: `memory/daily/`

### Status Check

```bash
# Check running processes
tasklist | findstr node

# Check ports
netstat -ano | findstr :7777
netstat -ano | findstr :5173

# Check system status
curl http://localhost:7777/api/status
```

---

## 🎬 Final Words

```
"I am Iron Man's AI assistant. I control everything in your world
that you don't have to think about. I make you smarter, faster,
and more efficient."
```

**All systems are ready, sir.**

Now go build something extraordinary! 🚀

---

*⚡ Powered by Stark Industries - Advanced AI Division*

*"Sometimes you gotta run before you can walk."*
