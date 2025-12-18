# Repository Guidelines

## Project Structure & Modules
- Root: JARVIS core scripts (`jarvis-complete.js`, `start-protected.js`) and AI subsystems in `core/` (autonomous-agent, neural-memory, web-intelligence, voice, security, etc.).
- POS backend: TypeScript Express + Prisma in `backend/src`; DB schema in `backend/prisma`; tests in `backend/tests`; env templates in `backend/.env.example`.
- Panel web: `web-interface/backend` (Express + Socket.io) and `web-interface/frontend` (React/Vite). Entry helpers in `web-interface/start-protected-panel.js`.
- Infra/assets: Docker (`docker-compose.yml`, `Dockerfile.backend`), k8s (`k8s/`), Terraform (`terraform/`), docs in `docs/`, artifacts/archives/logs live outside source.

## Build, Test, Run
- Install: `npm install` (root), `cd backend && npm install`.
- Run JARVIS protected: `npm run protected`; panel web: `npm run panel`.
- POS backend dev: `cd backend && npm run dev`; build: `npm run build`; start compiled: `npm start`.
- Tests: root (Jest) `npm test`; backend (Vitest) `cd backend && npm test`.
- Lint/format: root `npm run lint`; backend `npm run lint` and `npm run format`.

## Coding Style & Naming
- JS/TS with 2-space indent. Prefer TypeScript in backend; CommonJS predominates in JARVIS core.
- File naming: kebab-case for scripts, PascalCase for React components, `.spec.ts`/`.test.js` for tests.
- Use ESLint/Prettier where configured; keep ASCII; preserve structured logging (e.g., `request_id`).

## Testing Guidelines
- Frameworks: Jest (root), Vitest + Supertest in `backend/`.
- Add unit/integration tests near code (`tests/unit`, `tests/integration`, `backend/tests`).
- Cover health checks, DB connectivity, and new routes/services; run suites before PRs.

## Memory & Continuity (Agents)
- Siempre cargar contexto antes de actuar: leer `memory/CONTEXT-FOR-CLAUDE.md`; si se necesita detalle, revisar `memory/context/CURRENT-STATE.json` y últimos JSON en `memory/sessions/`.
- Registrar acciones importantes con el logger (`core/auto-memory-logger.cjs`): `logCommand`, `logFileModified`, `logDecision` para comandos, archivos y decisiones clave.
- Mantener coherencia diaria: resúmenes en `memory/daily/YYYY-MM-DD.md` y snapshots en `memory/state-snapshots/` ayudan a reconstruir sesiones.
- Al abrir nueva sesión, mencionar última sesión, pendientes y siguiente paso sugerido; al cerrar, actualizar estado y pendientes.

## Commit & PR Guidelines
- Commits: imperative, concise (e.g., "Fix bootstrap pagination", "Add caja delta validation").
- PRs: include summary, modules touched (`backend/`, `core/`, `web-interface/`), tests run, and env/DB changes. Add screenshots for UI tweaks and note Prisma migration steps.

## Security & Configuration
- Keep secrets out of VCS; copy `.env.example` to `.env` locally. Backend uses `DATABASE_URL`; align driver choice (MySQL/PostgreSQL) with code and docs.
- Do not commit `node_modules`, build outputs (`backend/dist`), large zips (`postgresql-portable.zip`), or logs.
