# GeoTech Lab

**Cloud-native, bilingual (FR/EN) geotechnical laboratory management platform.**

GeoTech Lab replaces [Dartis Soil Lab](https://www.dartistech.ca/) — a Windows-only, single-user desktop application — with a web + Android solution supporting multi-user concurrent workflows, AI-assisted anomaly detection, and automated PDF report generation compliant with ASTM standards.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Architecture Overview](#2-architecture-overview)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Services Catalog](#4-services-catalog)
5. [Frontend Applications](#5-frontend-applications)
6. [Shared Packages](#6-shared-packages)
7. [Database Strategy](#7-database-strategy)
8. [Domain Model](#8-domain-model)
9. [ASTM Test Modules](#9-astm-test-modules)
10. [Cross-Module Dependencies](#10-cross-module-dependencies)
11. [AI Architecture](#11-ai-architecture)
12. [Security Model](#12-security-model)
13. [API Standards](#13-api-standards)
14. [Observability](#14-observability)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Local Development](#16-local-development)
17. [Environment Variables](#17-environment-variables)
18. [Role & Access Matrix](#18-role--access-matrix)
19. [User Personas](#19-user-personas)
20. [Roadmap](#20-roadmap)
21. [Operations & Troubleshooting](#21-operations--troubleshooting)

---

## 1. Problem Statement

Geotechnical laboratories currently rely on **Dartis Soil Lab**, a Windows-only desktop application that:

- Is inaccessible in the field (no mobile support)
- Stores data in local `.DLab` files — no cloud, no collaboration, no backup
- Supports one user at a time — no multi-user workflow
- Is English-only — no French support
- Cannot be accessed remotely by project managers or clients
- Requires manual Excel spreadsheets for any cross-test aggregation

| Dartis Soil Lab | GeoTech Lab |
|---|---|
| Windows only | Web + Android |
| Local `.DLab` file | Cloud — accessible anywhere |
| Single user | Multi-user, role-based |
| English only | French + English |
| Manual Excel import | Direct data entry + auto-calculation |
| Desktop reports | PDF + Excel, branded, locked after approval |
| No AI | AI anomaly detection + RAG assistant (Phase 2) |

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                             CLIENTS                                    │
│                                                                        │
│   ┌─────────────────────────┐     ┌──────────────────────────────┐    │
│   │   Next.js 14 (Web)      │     │   Expo 51 / React Native     │    │
│   │   Admin + Lab Tech      │     │   Lab Technician (Android)   │    │
│   │   apps/web  :3000       │     │   apps/mobile                │    │
│   └────────────┬────────────┘     └──────────────┬───────────────┘    │
└────────────────┼─────────────────────────────────┼────────────────────┘
                 │  HTTPS                          │  HTTPS
                 ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  NGINX API GATEWAY  :80 / :443                         │
│                                                                        │
│  /api/v1/auth/*          → auth-service:8080                          │
│  /api/v1/projects/*      → project-service:8081                       │
│  /api/v1/tests/wc/*      → test-wc-service:8083                       │
│  /api/v1/tests/ll/*      → test-ll-service:8084                       │
│  /api/v1/tests/proctor/* → test-proctor-service:8085                  │
│  /api/v1/tests/sg/*      → test-sg-service:8086                       │
│  /api/v1/tests/ps/*      → test-ps-service:8087                       │
│  /api/v1/tests/perm/*    → test-perm-service:8088                     │
│  /api/v1/tests/uc/*      → test-uc-service:8089                       │
│  /api/v1/tests/ds/*      → test-ds-service:8091                       │
│  /api/v1/tests/consol/*  → test-consol-service:8093                   │
│  /api/v1/tests/cbr/*     → test-cbr-service                           │
│  /api/v1/reports/*       → report-service:8090                        │
│  /api/v1/media/*         → media-service:8092                         │
│  /api/v1/ai/*            → ai-assistant-service:8095                  │
│  /api/v1/notifications/* → notification-service:8094                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │  Internal Docker network (geotech-net)
          ┌─────────────────────────┼──────────────────────────────────┐
          ▼            ▼            ▼            ▼                     ▼
   ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    ┌──────────────┐
   │auth-service│ │project-  │ │test-wc   │ │report-   │    │ai-assistant  │
   │Spring Boot │ │service   │ │service   │ │service   │    │service       │
   │Java 21     │ │Java 21   │ │Java 21   │ │JasperRep.│    │Java 21       │
   └─────┬──────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘    └──────┬───────┘
         └─────────────┴────────────┴────────────┴──────────────────┘
                                         │
                               ┌─────────▼──────────┐
                               │  PostgreSQL 16      │
                               │  Single instance    │
                               │  Per-service schemas│
                               │  :5432              │
                               └─────────┬──────────┘
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
          ┌─────────────────┐                    ┌─────────────────┐
          │  AWS S3          │                    │  Qdrant          │
          │  Field photos    │                    │  Vector store    │
          │  PDF reports     │                    │  (Phase 2 — RAG) │
          │  ca-central-1    │                    └─────────────────┘
          └─────────────────┘
```

### Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Gateway | Nginx (not Spring Cloud Gateway) | Simpler Docker config; no extra JVM; sufficient for domain scale |
| Database | Single PostgreSQL, per-service schemas | Small team; avoids 15 separate DB containers; path to split later without code changes |
| Auth | JWT (HS256) validated per-service | Services remain independently deployable — no gateway-level auth required |
| Build system | Turborepo + pnpm workspaces | Shared package dependency graph; parallel builds; cache invalidation per service |
| Container registry | ghcr.io (GitHub Container Registry) | Free, private, integrates natively with GitHub Actions |

---

## 3. Monorepo Structure

```
geotech-lab/
├── apps/
│   ├── web/                          # Next.js 14 — Admin + Lab Technician
│   └── mobile/                       # Expo 51 React Native — Technician only
│
├── services/
│   ├── auth-service/                 # JWT auth, user management, roles
│   ├── project-service/              # Projects, clients, boreholes, samples
│   ├── test-wc-service/              # Water Content — ASTM D-2216
│   ├── test-ll-service/              # Liquid & Plastic Limit — ASTM D-4318
│   ├── test-proctor-service/         # Proctor Compaction — ASTM D-698 / D-1557
│   ├── test-sg-service/              # Specific Gravity — ASTM D-854
│   ├── test-ps-service/              # Particle Size — ASTM D-422
│   ├── test-perm-service/            # Permeability — ASTM D-2434
│   ├── test-uc-service/              # Unconfined Compression — ASTM D-2166
│   ├── test-ds-service/              # Direct Shear — ASTM D-3080
│   ├── test-consol-service/          # Consolidation — ASTM D-2435
│   ├── test-cbr-service/             # CBR
│   ├── report-service/               # PDF generation — JasperReports
│   ├── ai-assistant-service/         # Anomaly detection + RAG assistant
│   ├── media-service/                # S3 upload/download proxy
│   └── notification-service/         # In-app + email notifications
│
├── packages/
│   ├── ui/                           # React component library (Tailwind + NativeWind)
│   ├── calcs/                        # ASTM calculation functions — pure TypeScript, no side effects
│   ├── i18n/                         # FR/EN translation files (fr.json + en.json)
│   ├── types/                        # Shared TypeScript DTOs and enums
│   └── api-client/                   # Generated API client (OpenAPI → TypeScript)
│
├── infra/
│   ├── nginx/                        # nginx.conf + Dockerfile
│   └── docker/                       # init-schemas.sql, shared Docker utilities
│
├── .github/
│   └── workflows/                    # Per-service CI + production deploy workflows
│
├── .specify/                         # Platform governance (ADRs, specs, standards)
│   ├── architecture/                 # system-overview, database-strategy, deployment, observability
│   ├── decisions/                    # ADR-001 through ADR-006
│   ├── specs/                        # Per-service feature specs
│   ├── standards/                    # api, coding, security, testing, ui standards
│   ├── product/                      # vision, roadmap, personas, glossary
│   └── workflows/                    # test-approval-flow, report-generation-flow
│
├── docker-compose.yml                # Local development — all services + DB + Nginx
├── docker-compose.prod.yml           # Production — images from ghcr.io, no exposed DB port
├── turbo.json                        # Turborepo task pipeline
├── pnpm-workspace.yaml               # pnpm workspace: apps/*, packages/*, services/*
└── CONSTITUTION.md                   # Architectural constitution + full feature spec
```

---

## 4. Services Catalog

All backend services are **Spring Boot 3.x, Java 21**. Each owns its port, its schema, its Flyway migrations, and its GitHub Actions deploy workflow.

| Service | Port | DB Schema | ASTM Standard | Container |
|---|---|---|---|---|
| `auth-service` | 8080 | `auth` | — | `geotech-auth` |
| `project-service` | 8081 | `projects` | — | `geotech-project` |
| `test-wc-service` | 8083 | `test_wc` | D-2216 | `geotech-test-wc` |
| `test-ll-service` | 8084 | `test_ll` | D-4318 | `geotech-test-ll` |
| `test-proctor-service` | 8085 | `test_proctor` | D-698 / D-1557 | `geotech-test-proctor` |
| `test-sg-service` | 8086 | `test_sg` | D-854 | `geotech-test-sg` |
| `test-ps-service` | 8087 | `test_ps` | D-422 | `geotech-test-ps` |
| `test-perm-service` | 8088 | `test_perm` | D-2434 | `geotech-test-perm` |
| `test-uc-service` | 8089 | `test_uc` | D-2166 | `geotech-test-uc` |
| `test-ds-service` | 8091 | `test_ds` | D-3080 | `geotech-test-ds` |
| `test-consol-service` | 8093 | `test_consol` | D-2435 | `geotech-test-consol` |
| `test-cbr-service` | — | `test_cbr` | D-1883 | `geotech-test-cbr` |
| `report-service` | 8090 | `reports` | — | `geotech-report` |
| `ai-assistant-service` | 8095 | `ai_logs` | — | `geotech-ai` |
| `media-service` | 8092 | — | — | `geotech-media` |
| `notification-service` | 8094 | `notifications` | — | `geotech-notify` |

### Spring Boot Service Internal Structure

```
services/test-wc-service/
├── src/main/java/com/lab/geotech/wc/
│   ├── WaterContentApplication.java
│   ├── controller/
│   │   └── WaterContentController.java
│   ├── service/
│   │   ├── WaterContentService.java
│   │   └── WaterContentCalculator.java    # ASTM D-2216 formulas
│   ├── entity/
│   │   ├── WaterContentTest.java
│   │   └── WcReading.java
│   ├── dto/
│   │   ├── WaterContentCreateDto.java
│   │   └── WaterContentResponseDto.java
│   ├── repository/
│   │   └── WaterContentRepository.java
│   └── security/
│       └── JwtValidationFilter.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── V1__create_schema.sql
│       └── V2__initial_tables.sql
├── Dockerfile
└── pom.xml
```

---

## 5. Frontend Applications

### Web App — `apps/web` (Next.js 14)

- **Tech:** Next.js 14, Tailwind CSS, React Query, next-i18next
- **Target users:** ADMIN, LAB_MANAGER, USER (technicians)
- **Dev port:** 3000

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                    # Persistent left sidebar
│   │   ├── dashboard/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Project list + search
│   │   │   └── [id]/
│   │   │       ├── boreholes/page.tsx
│   │   │       └── boreholes/[bhId]/samples/[sId]/
│   │   │           ├── water-content/page.tsx
│   │   │           ├── liquid-limit/page.tsx
│   │   │           ├── proctor/page.tsx
│   │   │           ├── specific-gravity/page.tsx
│   │   │           ├── particle-size/page.tsx
│   │   │           ├── permeability/page.tsx
│   │   │           ├── unconfined-compression/page.tsx
│   │   │           ├── direct-shear/page.tsx
│   │   │           └── consolidation/page.tsx
│   │   └── admin/
│   │       ├── users/page.tsx
│   │       ├── clients/page.tsx
│   │       └── dashboard/page.tsx        # KPI overview
│   └── api/                              # Next.js API routes (BFF layer)
├── components/
│   ├── charts/                           # Grain size curve, Proctor curve, Mohr-Coulomb, etc.
│   ├── tests/                            # Data entry tables per test type
│   ├── layout/
│   ├── auth/
│   └── ui/                              # shadcn/ui components
├── hooks/                               # React Query hooks
├── lib/                                 # API client wrappers, auth helpers
└── middleware.ts                        # Route protection by role
```

### Mobile App — `apps/mobile` (Expo 51 / React Native)

- **Tech:** Expo 51, React Native, NativeWind, react-i18next, WatermelonDB (offline sync)
- **Target users:** USER (field + lab technicians, Android only)
- **Offline-first:** WatermelonDB syncs to server when connectivity returns

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   └── login.tsx
│   └── (app)/
│       ├── _layout.tsx                  # Bottom tab navigator
│       ├── index.tsx                    # My projects
│       ├── projects/[id].tsx
│       └── samples/[sId]/
│           ├── water-content.tsx
│           ├── liquid-limit.tsx
│           ├── proctor.tsx
│           ├── specific-gravity.tsx
│           ├── particle-size.tsx
│           ├── permeability.tsx
│           ├── unconfined-compression.tsx
│           ├── direct-shear.tsx
│           └── consolidation.tsx
├── components/
│   ├── forms/                           # Mobile-optimized numeric inputs, large touch targets
│   └── cards/
└── lib/                                 # WatermelonDB models, sync adapters
```

---

## 6. Shared Packages

| Package | Purpose |
|---|---|
| `packages/ui` | React component library shared between web and mobile (Tailwind + NativeWind) |
| `packages/calcs` | All ASTM calculation functions — pure TypeScript, zero dependencies, 100% unit tested |
| `packages/i18n` | FR/EN translation files (`fr.json`, `en.json`) — single source of truth for all strings |
| `packages/types` | Shared TypeScript DTOs, enums, and request/response types |
| `packages/api-client` | Generated TypeScript API client (OpenAPI → TypeScript) |

### `packages/calcs` — ASTM Calculation Logic

No calculation logic lives in the frontend components. All ASTM math lives here, server-side in the Spring Boot services, or in this shared package for client-side preview feedback.

```typescript
// ASTM D-2216
export function calcWaterContent(massContainer: number, massContainerWetSoil: number, massContainerDrySoil: number): number

// ASTM D-4318
export function calcLiquidLimit(readings: LLReading[]): number          // flow curve interpolation at 25 blows
export function calcPlasticLimit(readings: PLReading[]): number
export function calcPlasticityIndex(ll: number, pl: number): number
export function calcLiquidityIndex(w: number, pl: number, ll: number): number
export function calcActivity(pi: number, clayPct: number): number

// ASTM D-698 / D-1557
export function calcProctorCurve(points: ProctorPoint[], moldVolumeCm3: number): ProctorResult  // polynomial fit

// ASTM D-854
export function calcSpecificGravity(masses: SgMasses, kFactor: number): number

// ASTM D-422
export function calcUniformityCoefficient(d10: number, d60: number): number
export function calcCurvatureCoefficient(d10: number, d30: number, d60: number): number
export function classifyUSCS(ll: number, pi: number, fines: number, sand: number, gravel: number, cu: number, cc: number): string
export function classifyAASHTO(ll: number, pi: number, fines: number, sand: number, gravel: number): string

// ASTM D-2434
export function calcPermeabilityConstantHead(q: number, l: number, a: number, h: number, t: number): number
export function calcPermeabilityFallingHead(a: number, l: number, A: number, t: number, h1: number, h2: number): number
export function calcK20Correction(kT: number, temperatureC: number): number

// ASTM D-2166
export function calcAxialStrain(deformationMm: number, initialHeightMm: number): number
export function calcCorrectedArea(initialAreaCm2: number, axialStrain: number): number
export function calcDeviatorStress(loadKn: number, areaCm2: number): number

// ASTM D-3080
export function calcMohrCoulombRegression(stages: DSStage[]): MohrCoulombResult  // linear regression

// ASTM D-2435
export function calcCvSqrtTime(t90Min: number, drainagePathCm: number): number
export function calcCvLogTime(t50Min: number, drainagePathCm: number): number
export function calcVoidRatio(e0: number, deltaH: number, h0: number): number
export function calcCompressionIndex(points: ELogPPoint[]): number
export function calcPreconsolidationPressure(points: ELogPPoint[]): number  // Casagrande method
```

### `packages/i18n` — Bilingual Strategy

- Default language: **French** (primary market)
- Web: `next-i18next` — detected from `Accept-Language` header; overridable in user profile
- Mobile: `react-i18next` + `expo-localization` — detected from device locale; overridable in profile
- Reports generated in the user's chosen language
- No hardcoded strings anywhere — all via `t('key')` calls

```json
// packages/i18n/fr.json (excerpt)
{
  "tests": {
    "waterContent": "Teneur en eau",
    "liquidLimit": "Limite de liquidité",
    "proctor": "Essai Proctor",
    "particleSize": "Granulométrie",
    "consolidation": "Consolidation"
  },
  "status": {
    "PENDING_REVIEW": "En attente de révision",
    "APPROVED": "Approuvé",
    "REJECTED": "Rejeté"
  }
}
```

---

## 7. Database Strategy

**One PostgreSQL 16 instance. Each service owns its schema. No cross-schema SQL joins — ever.**

### Schema Registry

| Schema | Owner Service | Key Tables |
|---|---|---|
| `auth` | auth-service | users, roles, refresh_tokens, audit_log |
| `projects` | project-service | projects, clients, locations, boreholes, samples |
| `test_wc` | test-wc-service | water_content_tests, wc_readings |
| `test_ll` | test-ll-service | liquid_limit_tests, plastic_limit_tests, ll_readings |
| `test_proctor` | test-proctor-service | proctor_tests, proctor_points |
| `test_sg` | test-sg-service | specific_gravity_tests, sg_readings |
| `test_ps` | test-ps-service | particle_size_tests, sieve_results, hydrometer_results |
| `test_perm` | test-perm-service | permeability_tests, perm_readings |
| `test_uc` | test-uc-service | uc_tests, uc_readings |
| `test_ds` | test-ds-service | direct_shear_tests, ds_stages |
| `test_consol` | test-consol-service | consolidation_tests, load_increments, consol_readings |
| `reports` | report-service | reports, report_sections |
| `ai_logs` | ai-assistant-service | ai_flags, ai_interactions, rag_queries |
| `notifications` | notification-service | notifications, notification_preferences |

### Schema Isolation Rules

1. **No cross-schema SQL joins.** A service never queries another service's schema directly.
2. **Cross-service references are plain UUIDs, not foreign keys.** `test_wc.water_content_tests.sample_id` is not a FK to `projects.samples` — it is a logical reference resolved via HTTP if needed.
3. **Schema creation is owned by the service.** Flyway migrations run at startup via `SET search_path`.
4. **Shared enums are duplicated, not shared.** If `test_status` appears in multiple schemas, each defines its own copy. Source of truth is `packages/types`.

### Migrations (Flyway)

```
services/{service-name}/src/main/resources/db/migration/
├── V1__create_schema.sql
├── V2__initial_tables.sql
└── V3__add_index_sample_id.sql
```

Naming convention: `V{version}__{snake_case_description}.sql`
Flyway runs automatically on Spring Boot startup. `baseline-on-migrate=false`.

### Connection Pooling (HikariCP)

- Each service manages its own HikariCP pool
- Test services: `maximum-pool-size=10`
- `project-service`, `auth-service`: `maximum-pool-size=20`

### Path to Per-Service Databases (future)

When a service needs to scale independently: run `pg_dump --schema=test_wc`, restore to a new instance, update the `SPRING_DATASOURCE_URL` environment variable. No code changes required — services never join across schemas.

---

## 8. Domain Model

### Core Hierarchy

```
clients
  └── projects  (project_code: GT-YYYY-NNNN)
        └── boreholes  (bh_code: BH-01)
              └── samples  (sample_code: S-01)
                    └── test results (one per test type per sample)
```

### `projects` Schema — Key Entities

```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code    VARCHAR(20) UNIQUE NOT NULL,   -- GT-2026-0001
    name            VARCHAR(200) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    client_id       UUID REFERENCES clients(id),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    created_by      UUID NOT NULL,                 -- auth.users.id (not FK)
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boreholes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id),
    bh_code     VARCHAR(50) NOT NULL,              -- BH-01
    depth_m     DECIMAL(8,3),
    ...
);

CREATE TABLE samples (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borehole_id     UUID NOT NULL REFERENCES boreholes(id),
    sample_code     VARCHAR(50) NOT NULL,           -- S-01
    depth_from_m    DECIMAL(8,3),
    depth_to_m      DECIMAL(8,3),
    uscs_symbol     VARCHAR(10),                   -- auto-classified
    aashto_class    VARCHAR(10),                   -- auto-classified
    ...
);
```

### `auth` Schema — Key Entities

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(200) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',   -- USER | LAB_MANAGER | ADMIN
    language        VARCHAR(5) NOT NULL DEFAULT 'fr',
    is_active       BOOLEAN DEFAULT TRUE,
    ...
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,       -- SHA-256 hashed
    expires_at  TIMESTAMPTZ NOT NULL,
    ...
);

CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   VARCHAR(100),
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Test Schema Pattern (water content as example)

```sql
CREATE TABLE water_content_tests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id       UUID NOT NULL,                 -- no FK — cross-service logical reference
    project_id      UUID NOT NULL,                 -- denormalized for reporting performance
    technician_id   UUID NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    average_w_pct   DECIMAL(8,4),                  -- server-calculated result
    ai_flags        JSONB,                         -- array of AI anomaly flag objects
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    ...
);

CREATE TABLE wc_readings (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                   UUID NOT NULL REFERENCES water_content_tests(id) ON DELETE CASCADE,
    reading_number            INT NOT NULL,
    container_no              VARCHAR(20),
    mass_container_g          DECIMAL(10,4) NOT NULL,
    mass_container_wet_soil_g DECIMAL(10,4) NOT NULL,
    mass_container_dry_soil_g DECIMAL(10,4) NOT NULL,
    m_water_g                 DECIMAL(10,4),        -- calculated server-side
    m_dry_soil_g              DECIMAL(10,4),        -- calculated server-side
    w_pct                     DECIMAL(8,4)          -- calculated server-side
);
```

---

## 9. ASTM Test Modules

Every test module implements:
- Borehole + Sample selector (always visible)
- Data entry table with Tab-key navigation
- **Apply and Calculate** button → triggers server-side recalculation (source of truth)
- Client-side preview via `packages/calcs` (immediate feedback, not persisted)
- Results panel with all calculated values
- Chart (where applicable)
- Report tab → PDF generation via report-service
- FR/EN labels on all fields and units
- AI anomaly flag display (rule-based Phase 1, RAG Phase 2)

| Module | ASTM | Key Outputs | Charts |
|---|---|---|---|
| Water Content | D-2216 | Average w% | None |
| Liquid & Plastic Limit | D-4318 | LL, PL, PI, Activity, Liquidity Index | Flow curve (semi-log); Plasticity Chart (A-line) |
| Proctor Compaction | D-698 / D-1557 | OMC%, Max dry density | Compaction curve |
| Specific Gravity | D-854 | Average Gs | None |
| Particle Size | D-422 | D10/D30/D60, Cu, Cc, grain fractions %, USCS, AASHTO | Grain size distribution curve (log scale, sieve + hydrometer combined) |
| Permeability | D-2434 | k (cm/s), k20°C | None |
| Unconfined Compression | D-2166 | qu (kPa), Su = qu/2 | Stress-strain curve |
| Direct Shear | D-3080 | c (kPa), φ (degrees) | Mohr-Coulomb failure envelope; per-stage displacement curve |
| Consolidation | D-2435 | Cv, Cc, Cs, Pc | √t chart (draggable t90); log-t chart (draggable t50); e vs log P; Cv comparison (t90 vs t50 methods) |

### Master Report — Tests Summary

The flagship deliverable. One row per sample, all test results aggregated:

| Column Group | Fields |
|---|---|
| Identity | Borehole, Sample, Depth (m), USCS, AASHTO |
| Atterberg Limits | Avg Water Content %, LL%, PL% |
| Proctor | Max dry density (g/cm³), OMC% |
| Specific Gravity | Gs @ 20°C |
| Permeability | k constant head, k falling head, average k (cm/s) |
| Compression | qu (kPa), Su (kPa) |
| Direct Shear | c (kPa), c' (kPa), φ (°), φ' (°) |
| Consolidation | Cc, Cs, Pc (ton/ft²), Pc (kPa) |
| Particle Size | D10, D30, D60, Cu, Cc; Clay%, Silt%, Fine/Med/Coarse Sand%, Fine/Coarse Gravel% |

Generated as branded PDF (FR or EN) and exportable to Excel.

---

## 10. Cross-Module Dependencies

Some calculated values require results from other test modules. All cross-service calls are **read-only**, **nullable**, and **non-blocking**.

| Value Needed | Lives In | Required By | Behavior if Missing |
|---|---|---|---|
| Water content w% | `test-wc-service` | `test-ll-service` → Liquidity Index (Li) | Li shown as `—` |
| Clay% | `test-ps-service` | `test-ll-service` → Activity | Activity shown as `—` |
| LL, PL, PI | `test-ll-service` | `test-ps-service` → USCS classification | USCS classification deferred |
| All test results | All test services | `report-service` → Tests Summary Report | Empty cells in report — not an error |

```
Data Flow: Test Submission
──────────────────────────
Technician enters test data in form
  │
  ├─► packages/calcs runs client-side preview (immediate feedback)
  │
  ├─► POST /api/v1/tests/wc/
  │
  ├─► Nginx → test-wc-service:8083
  │     1. validates input (Bean Validation)
  │     2. recalculates server-side (source of truth)
  │     3. saves to PostgreSQL test_wc schema
  │     4. publishes event: TEST_SUBMITTED { test_id, service: "WC" }
  │     5. returns 201 with full result
  │
  └─► ai-assistant-service (async):
        1. runs ASTM-range anomaly detection rules
        2. saves flags to ai_logs schema
        3. PATCH test result status → PENDING_REVIEW or FLAGGED
```

---

## 11. AI Architecture

### Phase 1 — Rule-Based Anomaly Detection (current)

Built into each test service. Before saving a result, values are checked against ASTM-defined acceptable ranges:

| Test | Rule |
|---|---|
| Water Content | Warn if w% > 100% for non-organic soils |
| Specific Gravity | Warn if Gs < 2.55 or > 2.85 |
| Liquid Limit | Warn if LL > 120% |
| Direct Shear | Warn if φ < 10° or > 50° |
| Consolidation | Warn if Cv < 1×10⁻⁵ or > 1×10⁻¹ cm²/s |

Flags stored in `ai_flags JSONB` column of each test result. Shown to LAB_MANAGER in approval workflow.

### Phase 2 — RAG Assistant (Sprint 8+)

| Component | Technology |
|---|---|
| Vector DB | Qdrant (Docker-deployable, Apache 2.0) |
| Embeddings | ASTM standards + geotechnical textbooks + project historical data |
| LLM | Claude API (`claude-sonnet-4-6`) |
| Orchestration | LangGraph (stateful multi-step reasoning, human-in-the-loop) |

Use cases:
- "This sample has PI=45, is that consistent with USCS classification CL?"
- "My consolidation Cv seems very high for this pressure range — is that expected?"
- "Generate a summary of geotechnical conditions for project GT-2026-0042"

All test data sent to the Claude API is **stripped of PII** — no client name, project name, or technician identity. Only numerical values and soil descriptions.

---

## 12. Security Model

### Authentication

- JWT access tokens: **15-minute TTL**, HS256, payload `{ sub, email, role, iat, exp }`
- Refresh tokens: **7-day TTL**, stored **hashed** (SHA-256) in database
- Refresh token rotation: old token invalidated on use; stolen token detection via family invalidation
- Web: JWT stored in `httpOnly` cookie (not `localStorage`)
- Mobile: JWT stored in Expo SecureStore

### Authorization

```java
// All controller methods require explicit @PreAuthorize
@PreAuthorize("hasAnyRole('LAB_MANAGER', 'ADMIN')")
@PatchMapping("/{id}/approve")
public ResponseEntity<TestResultResponse> approve(@PathVariable UUID id) { ... }
```

### Security Boundaries

```
PUBLIC
  POST /api/v1/auth/login
  POST /api/v1/auth/refresh

AUTHENTICATED (any role)
  GET  /api/v1/projects/**
  GET  /api/v1/tests/**
  POST /api/v1/tests/**

LAB_MANAGER or higher
  PATCH /api/v1/tests/**/approve
  PATCH /api/v1/tests/**/reject
  POST  /api/v1/reports/generate
  POST  /api/v1/reports/**/lock

ADMIN only
  POST   /api/v1/auth/users
  DELETE /api/v1/auth/users/**
  GET    /api/v1/auth/users
  DELETE /api/v1/projects/**
```

### Nginx Security Configuration

- CORS: restricted to production domain (not `*`)
- Rate limiting on auth endpoints: 10 req/min per IP, burst 5
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`
- SSL termination at gateway; services communicate over internal Docker network only

### PII Isolation

- PII (email, name) stored only in `auth` schema
- All other schemas reference users by UUID only
- No names or emails in log messages — UUIDs only
- S3 paths use UUID-based keys — no client names in storage paths
- S3 objects private — accessed via signed URLs (15-minute TTL)

### Audit Log

Every state-changing action written to `auth.audit_log`: login success/failure, test approved/rejected/locked, report generated/locked, AI flag override, user created/deactivated.

### Forbidden Patterns

| Pattern | Reason |
|---|---|
| Raw string SQL concatenation | SQL injection |
| `@CrossOrigin(origins = "*")` | CORS wildcard |
| JWT in `localStorage` | XSS attack surface |
| Stack traces returned to client | Information disclosure |
| `password` field in any DTO response | Credential exposure |
| `@PreAuthorize("permitAll()")` on write endpoints | Authorization bypass |

---

## 13. API Standards

### URL Structure

```
/api/v1/{domain}/{resource}/{id}/{sub-resource}

/api/v1/projects/42
/api/v1/tests/water-content/sample/15
/api/v1/reports/project/42/summary
```

### Response Envelope

All responses — success and error — use this envelope:

```json
// Success (single)
{ "data": { ... }, "message": "Operation successful", "timestamp": "2026-05-26T14:30:00Z" }

// Success (list)
{ "data": [...], "total": 42, "page": 1, "pageSize": 20, "timestamp": "..." }

// Error
{ "error": "Sample not found", "code": "SAMPLE_NOT_FOUND", "field": null, "timestamp": "..." }

// Validation error
{ "error": "Validation failed", "code": "VALIDATION_ERROR",
  "fields": [{ "field": "mass_container_g", "message": "Must be a positive number" }],
  "timestamp": "..." }
```

### Naming Conventions

| Layer | Convention |
|---|---|
| URL paths | kebab-case (`/water-content`, `/direct-shear`) |
| JSON fields | camelCase (`sampleId`, `waterContentPct`) |
| DB columns | snake_case (`sample_id`, `water_content_pct`) |
| Unit suffixes | Always explicit in field name (`depth_m`, `mass_g`, `k_cm_s`, `temperature_c`) |

### Pagination

All list endpoints: `?page=0&size=20&sort=createdAt,desc`

### Cross-Service Calls

- HTTP REST only — never via shared DB
- Authenticated with a service-to-service JWT
- Responses cached 30 seconds where appropriate
- If dependency service unavailable: return partial response with nullable fields — never fail the request

---

## 14. Observability

### OpenTelemetry

Every Spring Boot service runs with the OTel Java agent:

```dockerfile
COPY otel-javaagent.jar /app/otel-javaagent.jar
ENTRYPOINT ["java", "-javaagent:/app/otel-javaagent.jar", "-jar", "app.jar"]
```

Environment per service:
```yaml
OTEL_SERVICE_NAME: test-wc-service
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-collector:4317
```

Trace context propagated via `traceparent` header (W3C TraceContext). Each request generates spans for HTTP routes, DB queries (OTEL JDBC instrumentation), and cross-service HTTP calls.

### Metrics (Micrometer → Prometheus)

Exposed at `/actuator/prometheus`:

| Metric | Type | Description |
|---|---|---|
| `http_server_requests_seconds` | Histogram | Request latency per endpoint |
| `hikaricp_connections_active` | Gauge | DB connection pool usage |
| `custom_test_submissions_total` | Counter | Tests submitted per service |
| `custom_ai_flags_total` | Counter | AI flags by severity |

### Structured Logging

All services emit JSON logs:
```json
{ "timestamp": "...", "level": "INFO", "service": "test-wc-service",
  "traceId": "abc123", "message": "Test submitted", "testId": "uuid", "sampleId": "uuid" }
```

No PII in logs. UUIDs only.

### SLOs

| Service | Availability | P99 Latency |
|---|---|---|
| `auth-service` | 99.9% | < 500ms |
| `project-service` | 99.5% | < 800ms |
| `test-*-services` | 99.0% | < 2000ms |
| `report-service` | 99.0% | < 30s (PDF generation) |
| `ai-assistant-service` | 95.0% | < 5s (graceful degradation) |

### Health Checks

Every service: `GET /actuator/health → 200 { "status": "UP" }`
Nginx `/health` proxies to `auth-service` as platform health proxy.

---

## 15. CI/CD Pipeline

### Strategy

- Each service has its own GitHub Actions workflow
- Workflows use **path filters** — a change to `test-wc-service/` only triggers that service's pipeline
- Images pushed to `ghcr.io` on merge to `main`
- Production deploy: SSH to VPS → `docker compose pull + up --no-deps`

```
.github/workflows/
├── ci-auth-service.yml
├── ci-project-service.yml
├── ci-test-wc-service.yml        # (and one per test service)
├── ci-web.yml
├── ci-mobile.yml
└── deploy-production.yml         # manual trigger with service selector
```

### CI Job (per service)

```
push to main/develop with path match
  └─► test: mvn test (PostgreSQL sidecar container)
  └─► build-and-push: docker build → ghcr.io (main branch only)
```

### Production Deploy

```bash
# Via GitHub Actions deploy-production.yml (workflow_dispatch)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --no-deps {service}
docker system prune -f
```

### Rollback

```bash
export DEPLOY_SHA=<previous-sha>
docker compose -f docker-compose.prod.yml pull auth-service
docker compose -f docker-compose.prod.yml up -d --no-deps auth-service
```

### Dockerfiles

**Spring Boot services** — non-root user, minimal JRE image:
```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S geotech && adduser -S geotech -G geotech
USER geotech
COPY target/service-*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-javaagent:/app/otel-javaagent.jar", "-jar", "app.jar"]
```

**Next.js web** — standalone output for minimal image size:
```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && pnpm install --frozen-lockfile && pnpm build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 16. Local Development

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)
- Java 21 (Temurin) — for running services locally outside Docker
- Node.js 20 + pnpm — for frontend packages
- (Optional) Android Studio / Expo Go — for mobile development

### Start the full stack

```bash
# Copy environment template and fill in required secrets
cp .env.example .env

# Start all services (PostgreSQL + Nginx + all Spring Boot services + Next.js web)
docker compose up

# Start only the services you need
docker compose up postgres nginx auth-service project-service web

# Rebuild a single service after code change
docker compose build test-wc-service && docker compose up test-wc-service

# Run frontend in dev mode (hot reload)
pnpm --filter apps/web dev

# Run mobile app
pnpm --filter apps/mobile start
```

### Run tests

```bash
# All backend services (runs Maven tests with real PostgreSQL via GitHub Actions pattern)
cd services/test-wc-service && mvn test

# Frontend packages
pnpm --filter packages/calcs test

# All packages (Turborepo parallel)
pnpm run test
```

### Ports at a glance (local)

| Container | Host Port |
|---|---|
| Nginx gateway | `8888` |
| PostgreSQL | `5432` (exposed for local tooling) |
| Next.js web | `3000` |
| auth-service | Internal only (via Nginx) |
| All other services | Internal only (via Nginx) |

---

## 17. Environment Variables

```bash
# .env — never committed to git; stored as GitHub Secrets + VPS /opt/geotech/.env

# Database
POSTGRES_USER=geotech
POSTGRES_PASSWORD=          # required — strong password
POSTGRES_DB=geotechdb

# JWT
JWT_SECRET=                 # required — minimum 256 bits of entropy
JWT_REFRESH_SECRET=         # required — separate secret for refresh tokens

# AWS S3 (field photos + report PDFs)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=geotech-media-dev
AWS_REGION=ca-central-1

# AI
ANTHROPIC_API_KEY=          # optional — Phase 2 RAG features only

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8888

# Production extras
DEPLOY_SHA=                 # git SHA of the deployed image
```

---

## 18. Role & Access Matrix

| Feature | ADMIN | LAB_MANAGER | USER (web) | USER (mobile) |
|---|---|---|---|---|
| Login / logout | ✅ | ✅ | ✅ | ✅ |
| View own projects | ✅ | ✅ | ✅ | ✅ |
| Create / update project | ✅ | ✅ | ✅ | ✅ |
| Manage boreholes + samples | ✅ | ✅ | ✅ | ✅ |
| Enter test data (all modules) | ✅ | ✅ | ✅ | ✅ |
| View results + charts | ✅ | ✅ | ✅ | ✅ (adapted) |
| View all projects (cross-user) | ✅ | ✅ | ❌ | ❌ |
| Approve / reject test results | ✅ | ✅ | ❌ | ❌ |
| Generate + lock PDF reports | ✅ | ✅ | ❌ | ❌ |
| View AI anomaly flags | ✅ | ✅ | Read only | ❌ |
| Override AI flags | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage clients + locations | ✅ | Read only | Read only | ❌ |
| Admin KPI dashboard | ✅ | ❌ | ❌ | ❌ |
| Audit log | ✅ | ❌ | ❌ | ❌ |

---

## 19. User Personas

| Persona | Role | Primary Device | Key Pain Point Solved |
|---|---|---|---|
| **Marc** — Field Technician | USER | Android tablet, field site | Cannot use Dartis in the field → works offline, GPS auto-fill, camera |
| **Sophie** — Lab Technician | USER | Desktop, laboratory | Local `.DLab` files, no collaboration → cloud, Tab-key entry, auto-calc |
| **Jean-Pierre** — Lab Manager | LAB_MANAGER | Desktop, office | No QA gate before reports reach clients → AI-flagged approval workflow |
| **Diane** — Admin / Project Manager | ADMIN | Desktop, office | No cross-team visibility or user management → all-projects view, KPI dashboard, audit log |

---

## 20. Roadmap

### Phase 1 — Core Platform (Sprints 0–7)

| Sprint | Goal |
|---|---|
| Sprint 0 | Monorepo foundation — Turborepo, Docker Compose, all services scaffolded, Flyway migrations |
| Sprint 1 | Auth + Project Management — login, JWT, users, projects, boreholes, samples |
| Sprint 2 | First test modules — Water Content, Liquid/Plastic Limit, mobile shell |
| Sprint 3 | Classification tests — Proctor, Particle Size, USCS/AASHTO auto-classification |
| Sprint 4 | Strength tests — Specific Gravity, Unconfined Compression, Direct Shear |
| Sprint 5 | Advanced tests — Permeability, Consolidation, offline mobile sync |
| Sprint 6 | Approval workflow + PDF report generation (11 report types), S3 upload |
| Sprint 7 | Production deploy — HTTPS, CI/CD green, load test, UAT against Dartis reference dataset |

### Phase 2 — AI Features (Sprints 8+)

| Sprint | Goal |
|---|---|
| Sprint 8 | RAG assistant — Qdrant, ASTM document indexing, LangGraph + Claude API, web chat panel |
| Sprint 9 | AI report narratives — LAB_MANAGER-reviewed summaries in FR + EN |
| Sprint 10 | Advanced calculations — bearing capacity, settlement prediction, borehole log PDF, field photos |

### Definition of Done

A feature is done when:
- [ ] Unit tests pass — calculation functions: 100% coverage against known ASTM datasets
- [ ] Integration tests pass against real PostgreSQL (no mocks for DB layer)
- [ ] FR/EN translations complete for all user-facing strings
- [ ] AI anomaly detection rules implemented and tested
- [ ] API response matches the standard envelope
- [ ] Mobile equivalent screen exists (if applicable to USER persona)
- [ ] CI pipeline green

---

## 21. Operations & Troubleshooting

### Starting the stack

```bash
# First run or after a full shutdown
docker compose up -d --build

# Normal restart (images already built)
docker compose up -d
```

> **Note:** Spring Boot services take ~60–70 seconds to finish startup (Flyway migrations + JPA init). The web UI may show empty data for up to 90 seconds after `docker compose up` while services are still booting.

### Rebuilding a single service after code changes

```bash
# Example: rebuild project-service only
JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64 mvn package -DskipTests -q -f services/project-service/pom.xml
docker compose up -d --build project-service
docker exec geotech-gateway nginx -s reload   # always reload nginx after any service restart
```

---

### Known Issues & Fixes

#### Projects / data not showing — 502 Bad Gateway

**Symptom:** The web UI shows "Aucun projet trouvé" or API calls return 502.

**Cause:** When a Spring Boot service is restarted it gets a new Docker-internal IP address. Nginx caches the old IP in its upstream block and all requests to that service return `502 Bad Gateway` with `connect() failed (111: Connection refused)`.

**Fix — always run this after restarting any service:**

```bash
docker exec geotech-gateway nginx -s reload
```

This forces Nginx to re-resolve DNS for all upstream containers. Takes effect immediately with zero downtime.

---

#### PostgreSQL "too many clients already"

**Symptom:** Services fail to start with `FATAL: sorry, too many clients already`. One or more containers show as exited/crashed.

**Cause:** PostgreSQL defaults to `max_connections=100`. With 16+ Spring Boot services each holding a HikariCP pool (min 2 connections each), the default limit is exceeded on startup.

**Fix — already applied in `docker-compose.yml`:**

```yaml
postgres:
  command: postgres -c max_connections=300
```

If the error reappears after a fresh clone or reset, verify the `command:` line is present in `docker-compose.yml`.

**To manually terminate idle connections without restarting Postgres:**

```bash
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c \"
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname='geotechdb' AND state='idle' AND pid <> pg_backend_pid();
\""
```

---

#### Browser shows app but projects are missing (normal browser only, incognito works)

**Cause:** A stale `refresh_token` cookie from a previous session. The middleware sees the cookie, lets the request through, but the backend rejects the expired token — resulting in an empty/broken state.

**Fix:** Delete the `refresh_token` cookie in your browser:

- **Chrome/Edge:** F12 → Application → Cookies → `http://<host>:8888` → delete `refresh_token` → reload
- **Firefox:** F12 → Storage → Cookies → delete `refresh_token` → reload
- **Any browser (address bar):**
  ```
  javascript:document.cookie='refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';location.reload();
  ```

---

#### Services crashed after Postgres restart

**Cause:** When Postgres is restarted (e.g., to apply `max_connections` change), all Spring Boot services lose their DB connections. Services with `depends_on: postgres: condition: service_healthy` will auto-restart, but some may need a manual nudge.

**Fix:**

```bash
# Check which containers are not Up
docker compose ps

# Restart any that are exited or restarting
docker compose up -d <service-name>

# After all services are back up, reload nginx
docker exec geotech-gateway nginx -s reload
```

---

### Useful diagnostic commands

```bash
# Live status of all 19 containers
docker compose ps

# Check a specific service's health (Spring Boot Actuator)
docker exec geotech-project sh -c "wget -qO- http://localhost:8081/actuator/health"

# Follow logs for a service
docker compose logs -f project-service

# Count active DB connections
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c \
  \"SELECT count(*), state FROM pg_stat_activity WHERE datname='geotechdb' GROUP BY state;\""

# Query projects directly in DB
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c \
  'SELECT project_code, name, status, created_at FROM projects.projects ORDER BY created_at DESC;'"

# List all DB schemas (verify Flyway migrations ran)
docker exec geotech-db sh -c "psql -U geotech -d geotechdb -c '\dn'"

# Reload Nginx without downtime (run after any service restart)
docker exec geotech-gateway nginx -s reload
```

---

## Governance

All architectural decisions, coding standards, security standards, and per-service specs live in `.specify/`:

```
.specify/
├── architecture/         system-overview, database-strategy, deployment, observability
├── decisions/            ADR-001 (microservices), ADR-002 (PostgreSQL schema strategy),
│                         ADR-003 (Nginx gateway), ADR-004 (AI/RAG), ADR-005 (S3 media),
│                         ADR-006 (offline sync)
├── standards/            api-standards, coding-standards, security-standards,
│                         testing-standards, ui-standards
├── specs/                per-service feature specifications
├── product/              vision, roadmap, personas, glossary
└── workflows/            test-approval-flow, report-generation-flow, project-lifecycle
```

Any architectural change must be reflected in the relevant ADR before implementation begins.

---

*GeoTech Lab — Constitution v2.0.0 | Architecture approved 2026-05-23*
