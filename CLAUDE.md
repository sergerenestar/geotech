# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Full stack

```bash
cp .env.example .env          # first run — fill in secrets
docker compose up -d          # start all services
docker compose up -d postgres nginx auth-service project-service web   # minimal subset
```

After any service restart, **always reload Nginx** or you'll get 502s due to stale upstream IPs:
```bash
docker exec geotech-gateway nginx -s reload
```

### Rebuild a single backend service

```bash
JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64 mvn package -DskipTests -q -f services/<service>/pom.xml
docker compose up -d --build <service>
docker exec geotech-gateway nginx -s reload
```

Use `build --no-cache` + stop + up for reliable deploys; `up --build` silently reuses stale cache.

### Frontend (hot reload)

```bash
pnpm --filter @geotech/web dev         # web on :3000
pnpm --filter apps/mobile start        # Expo / React Native
```

### Tests

```bash
# Backend — one service
cd services/test-wc-service && mvn test

# Frontend calcs package
pnpm --filter @geotech/calcs test

# All packages (Turborepo parallel)
pnpm run test

# Typecheck web
pnpm --filter @geotech/web typecheck
```

Backend integration tests use `@ActiveProfiles("test")` with an external PostgreSQL — do **not** use `@Testcontainers` (Docker API version mismatch in this environment). Configure the test DB via `application-test.properties`.

### Lint

```bash
pnpm run lint                           # all packages (Turborepo)
pnpm --filter @geotech/web lint         # web only
```

### Useful diagnostics

```bash
docker compose ps
docker compose logs -f <service>
docker exec geotech-project sh -c "wget -qO- http://localhost:8081/actuator/health"
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c '\dn'"   # list schemas
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c 'SELECT project_code, status FROM projects.projects ORDER BY created_at DESC;'"
```

---

## Architecture

### Request path

```
Browser / Android app
  → Nginx :8888 (gateway, routes by path prefix)
  → Spring Boot service (validates JWT, calculates, persists)
  → PostgreSQL :5432 (single instance, per-service schemas)
```

JWT is validated **by each service**, not by Nginx. Nginx does only routing, CORS, SSL termination, and rate limiting on auth endpoints.

### Monorepo layout

| Directory | Purpose |
|---|---|
| `apps/web` | Next.js 14 — ADMIN, LAB_MANAGER, USER (web) |
| `apps/mobile` | Expo 51 React Native — USER (field/lab, Android, offline-first) |
| `services/*` | Spring Boot 3.x Java 21 microservices |
| `packages/calcs` | Pure TypeScript ASTM calculation functions — shared by web, mobile, and test suites |
| `packages/types` | Shared TypeScript DTOs and enums |
| `packages/i18n` | `fr.json` + `en.json` — single source of truth for all user-facing strings |
| `infra/nginx` | `nginx.conf` + Dockerfile |
| `infra/docker` | `init-schemas.sql` (creates all PG schemas on first run), `seed-admin.sql` |
| `.specify/` | ADRs, coding/testing/UI/API standards, product specs — read before making architectural decisions |

### Backend service structure (every test service is identical)

```
services/test-wc-service/src/main/java/com/lab/geotech/testWc/
  controller/    ← HTTP layer, @PreAuthorize on every endpoint
  service/       ← business logic (WcTestService, WcAnomalyService)
  service/       ← WcCalculationService — ASTM math only, no DB calls
  entity/        ← JPA entities
  dto/           ← Java records (immutable); input DTOs use @Valid
  repository/    ← Spring Data JPA
  security/      ← JwtValidationFilter
  exception/     ← GlobalExceptionHandler + domain exceptions
  config/        ← SecurityConfig
src/main/resources/db/migration/
  V1__create_schema.sql
  V2__create_tables.sql
  ...            ← Flyway runs automatically on startup
```

The package base is `com.lab.geotech.{camelCaseServiceName}` (e.g. `testWc`, `testLl`, `testProctor`).

### Database — one instance, per-service schemas

Each service owns one schema and sets `search_path` to it. **No cross-schema SQL joins — ever.** `sample_id`, `project_id`, etc. in test schemas are logical UUIDs, not foreign keys. Cross-service data is fetched via HTTP (`/internal/` endpoints). PostgreSQL runs with `max_connections=300` (configured in `docker-compose.yml`).

### Test data flow

1. Technician enters data → `packages/calcs` shows live client-side preview (not persisted)
2. "Apply and Calculate" → POST to the test service
3. Service validates → recalculates server-side (source of truth) → saves → returns result with `status: PENDING_REVIEW`
4. AI anomaly detection runs async — may update status to `FLAGGED`
5. LAB_MANAGER reviews and APPROVE/REJECT
6. When all project tests are APPROVED → report-service generates locked PDF → status `LOCKED` (immutable)

### Test result statuses

`PENDING_REVIEW` → `FLAGGED` → `APPROVED` / `REJECTED` → `LOCKED`

A LOCKED result cannot be edited — an ADMIN must reopen the project.

### Domain hierarchy

```
clients → projects (GT-YYYY-NNNN) → boreholes (BH-01) → samples (S-01) → test results
```

### Roles

| Role | Key permission |
|---|---|
| `USER` | Enter test data, view own projects |
| `LAB_MANAGER` | Approve/reject tests, generate/lock reports, view all projects |
| `ADMIN` | User management, delete projects, audit log |

### Calculation placement

- **`packages/calcs`** — client-side preview (TypeScript, pure functions, zero dependencies)
- **`services/*/service/*CalculationService.java`** — server-side recalculation (source of truth)
- No calculation logic in controllers or frontend components

### API response envelope

All responses use this shape — errors included:

```json
// success
{ "data": {...}, "message": "...", "timestamp": "..." }

// error
{ "error": "Sample not found", "code": "SAMPLE_NOT_FOUND", "timestamp": "..." }
```

URL paths are kebab-case, JSON fields camelCase, DB columns snake_case. Units are always explicit in field names (`depth_m`, `mass_g`, `k_cm_s`).

### Frontend

- **State:** React Query for server state; `useState`/`useReducer` for UI state only. No global store.
- **i18n:** All user-facing text via `t('key')`. French is the default language. Keys must exist in both `fr.json` and `en.json`.
- **Styling:** Tailwind CSS on web, NativeWind on mobile — same class names. Never inline styles except for dynamic values.
- **No `any` types.** Functional components only.

### Design tokens (never hardcode these colors)

| Token | Hex | Use |
|---|---|---|
| `brand-cyan` | `#2EC5FF` | Gradient start, active indicators |
| `brand-blue` | `#4F7DF3` | Primary buttons, links |
| `sidebar` | `#102A43` | Left sidebar, mobile bottom bar |
| `background` | `#F8FAFC` | Page background |
| `surface` | `#FFFFFF` | Cards, modals |
| `status.success` | `#12B76A` | Approved, completed |
| `status.warning` | `#F79009` | AI WARNING flags |
| `status.error` | `#D92D20` | Rejected, validation errors |

The brand gradient is `linear-gradient(135deg, #2EC5FF 0%, #4F7DF3 50%, #A78BFA 100%)`.

### AI anomaly detection

Phase 1 (current): rule-based checks built into each test service before saving. Flags stored in `ai_flags JSONB` on the test result. Severities: `INFO`, `WARNING`, `ERROR`. LAB_MANAGER always has final authority — flags are advisory.

Phase 2 (Sprint 8+): RAG assistant using Qdrant + Claude API (`claude-sonnet-4-6`) + LangGraph. Test data sent to Claude is stripped of PII.

### Testing rules

- Every ASTM formula in `packages/calcs` needs a unit test using the Dartis Soil Lab demo dataset
- Calculator classes (`*CalculationService`) require 100% coverage
- Integration tests must hit a real PostgreSQL — no mocked repositories
- `*CalculationTest` is the mandatory class name pattern for calculation unit tests

### Forbidden patterns

| Pattern | Reason |
|---|---|
| Raw string SQL concatenation | SQL injection |
| `@CrossOrigin(origins = "*")` | CORS wildcard |
| JWT in `localStorage` | XSS surface |
| Stack traces returned to client | Information disclosure |
| `password` field in any DTO response | Credential exposure |
| Cross-schema SQL joins | Schema isolation violation |
| Hardcoded strings in UI | i18n violation |

### Local ports

| Service | Host |
|---|---|
| Nginx gateway | `localhost:8888` |
| PostgreSQL | `localhost:5432` |
| Next.js web (dev) | `localhost:3000` |
| All backend services | Internal only (via Nginx) |

Spring Boot services take ~60–70 seconds to start (Flyway + JPA init).
