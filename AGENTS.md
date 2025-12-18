# Repository Guidelines

## Project Structure & Module Organization
- Core POS backend in `backend/` (Express + Prisma); ETL pipeline under `backend/etl` migrates MySQL `sysmehotel` (read-only 127.0.0.1:4306) into portable PostgreSQL at `runtime/data/postgres` (scripts control `start-db.bat`/`stop-db.bat`).
- Prisma schema resides in `backend/prisma`; application code in `backend/src`; tests in `backend/tests`; ETL source lives in `backend/etl/src/migrators` grouped by phases; ETL logs in `backend/etl/logs`.
- Scripts/infra helpers sit in `scripts/`; docs and checkpoints in root (`PUNTO-CONTINUACION-ETL.md`, `PASO-4.3-REPORTE-FINAL.md`, `docs/`); session context/memory in `memory/`.

## Build, Test, and Development Commands
- Bootstrap: `cd backend && npm install` (and `cd backend/etl && npm install` for ETL).
- DB lifecycle: `scripts/start-db.bat` and `scripts/stop-db.bat` (PGDATA `runtime/data/postgres`, port 5432); backups land in `runtime/data/backups/`.
- Backend: `npm run dev` for hot reload, `npm run build` then `npm start` for compiled server; lint/format with `npm run lint` / `npm run format`.
- ETL: `cd backend/etl && npm run build`; run a phase with `npm run migrate` (targets configured phases) or direct `node dist/index.js`; validations via `npm run validate`.

## Coding Style & Naming Conventions
- TypeScript/JavaScript with 2-space indent; keep ASCII; prefer explicit types and early null guards.
- Preserve idempotency: always key by `legacyId`/traceability fields; do not alter Prisma schema without explicit approval.
- Legacy-mapping rules: respect zero-padded codes (`id_complementog` length 5), avoid casting to numbers, and trim+`padStart` when matching against product maps.

## Testing Guidelines
- Backend uses Vitest; add `.spec.ts` near code and run `npm test` before pushes.
- ETL: compile with `npm run build`; for changes run the targeted phase and inspect logs (`backend/etl/logs/*`). Validate FK/totals via `npm run validate` when relevant.

## Commit & Pull Request Guidelines
- Commit messages in imperative, concise form (e.g., "Add shift placeholder mapping"); group work by phase/module.
- PRs/handovers should list affected areas (`backend/etl`, `backend/src`, `scripts`), commands run, DB touch-points (scripts/ports/PGDATA), and attach top orphans/warnings when ETL changes.
- Update checkpoints (`PUNTO-CONTINUACION-ETL.md`) and mention placeholder employee usage when shift logic changes; avoid committing secrets, `node_modules`, or runtime artifacts.
