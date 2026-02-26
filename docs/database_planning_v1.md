# Minimum Database Schema Proposal (v1 – Granulometry-First Focus)

Goal: Build the smallest usable schema that supports:
- Full JWT auth + roles + refresh tokens
- Client/project tracking (labs bill clients!)
- Project → Borehole → Sample hierarchy (your UI flow)
- Basic chain-of-custody fields for samples
- First test type: **Granulometry / Particle Size** (GNT & S-A-R variants)
- Workflow: create test run → enter raw sieve data → compute/store results → display curve

This schema is **minimal yet production-ready** for the first vertical slice.  
Later test types (water content, Atterberg, etc.) follow the same pattern: one `test_runs` row + one set of type-specific tables.

## Core Tables (Always Needed)

### 1. users (auth, reporting, audit)
```sql
id                  BIGINT PK AUTO_INCREMENT
email               VARCHAR(255) UNIQUE NOT NULL
password_hash       VARCHAR(255) NOT NULL
role                ENUM('ADMIN', 'MANAGER', 'TECHNICIAN') NOT NULL
enabled             BOOLEAN DEFAULT TRUE
first_name          VARCHAR(100) NULL
last_name           VARCHAR(100) NULL
phone               VARCHAR(50) NULL
last_login_at       TIMESTAMP NULL
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at          TIMESTAMP NULL  -- soft delete
```

Why these fields? Names/phone appear in reports/approvals/notifications. Soft delete for audit/compliance.
### 2. refresh_tokens (JWT refresh rotation)
```SQL 
id          BIGINT PK AUTO_INCREMENT
user_id     BIGINT NOT NULL FK(users.id) INDEX
token       VARCHAR(512) UNIQUE NOT NULL
expires_at  TIMESTAMP NOT NULL
revoked     BOOLEAN DEFAULT FALSE
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
Opaque random string stored in DB.
```

### 3. clients (high-value for labs – billing/filtering)

```SQL
id          BIGINT PK AUTO_INCREMENT
name        VARCHAR(255) NOT NULL
email       VARCHAR(255) NULL
phone       VARCHAR(50) NULL
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at  TIMESTAMP NULL
Alternative: just client_name VARCHAR on projects if you want ultra-minimal.
```
    
### 4. projects (core business unit)
```SQL
id          BIGINT PK AUTO_INCREMENT
code        VARCHAR(50) UNIQUE NULL  -- e.g. PROJ-2025-001
name        VARCHAR(255) NOT NULL
status      ENUM('DRAFT', 'IN_PROGRESS', 'APPROVED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT'
client_id   BIGINT NULL FK(clients.id)
start_date  DATE NULL
due_date    DATE NULL
created_by  BIGINT NOT NULL FK(users.id)
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at  TIMESTAMP NULL
```
### 5. sample_sources (NEW — universal origin container)

One row per “where this sample came from”: borehole, stockpile, quarry, borrow pit, truck delivery, etc.
```sql 
id            BIGINT PK AUTO_INCREMENT
project_id    BIGINT NOT NULL FK(projects.id) INDEX
source_type   ENUM('BOREHOLE','STOCKPILE','QUARRY','BORROW_PIT','TRUCKLOAD','LAB_RECEIVED','UNKNOWN')
name          VARCHAR(100) NULL        -- "BH-01", "Stockpile A", "Quarry X"
location_desc VARCHAR(255) NULL        -- optional free text
notes         TEXT NULL
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at    TIMESTAMP NULL
```
### 6. boreholes (UPDATED — specialized extension of a sample source)

A borehole is now a type of source, not the parent of all samples.

```sql
id               BIGINT PK AUTO_INCREMENT
sample_source_id BIGINT UNIQUE NOT NULL FK(sample_sources.id)  -- 1:1 with source row
depth_m          DECIMAL(6,2) NULL
diameter_mm      DECIMAL(6,2) NULL
method           VARCHAR(50) NULL       -- drilling method, optional
created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at       TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at       TIMESTAMP NULL
```
Enforced rule: if a borehole row exists, its sample_source_id must point to a sample_sources.source_type='BOREHOLE' (enforce in service layer; DB trigger optional).

### 7. samples (UPDATED — now belongs to sample_sources)
This is the key change: no more required borehole.
```sql
id               BIGINT PK AUTO_INCREMENT
sample_source_id BIGINT NOT NULL FK(sample_sources.id) INDEX
sample_code      VARCHAR(100) NOT NULL
sample_type      VARCHAR(50) NULL          -- disturbed, undisturbed, bulk, core...
classification   VARCHAR(50) NULL          -- USCS/AASHTO placeholder
depth_from_m     DECIMAL(6,2) NULL         -- meaningful if source is borehole
depth_to_m       DECIMAL(6,2) NULL
collection_date  DATE NULL
received_date    DATE NULL
description      TEXT NULL
created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at       TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
deleted_at       TIMESTAMP NULL
UNIQUE KEY (sample_source_id, sample_code)
```

### Granulometry-Specific Tables (based on real Excel data)
#### 8. ps_tests (header – one per test run)
```SQL
   id                        BIGINT PRIMARY KEY AUTO_INCREMENT
   test_run_id               BIGINT UNIQUE NOT NULL REFERENCES test_runs(id)
   method                    VARCHAR(50) NULL          -- 'GNT', 'S-A-R', 'DRY', 'WET'
   standard                  VARCHAR(50) DEFAULT 'NF P94-056'
   dry_mass_before_washing_g DECIMAL(10,2) NULL         -- Poids sec avant lavage
   dry_mass_after_washing_g  DECIMAL(10,2) NULL         -- Poids sec après lavage (used for % calc)
   washing_loss_percent      DECIMAL(6,3) NULL         -- (before - after)/before * 100
   notes                     TEXT NULL
   created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   updated_at                TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
   deleted_at                TIMESTAMP NULL
```

### 9. ps_sieve_readings (raw measurements – what technician enters)
```SQL
   id              BIGINT PRIMARY KEY AUTO_INCREMENT
   ps_test_id      BIGINT NOT NULL REFERENCES ps_tests(id)
   sieve_mm        DECIMAL(8,4) NULL           -- 40.0, 31.5, ..., 0.08, 0.00 (pan)
   sieve_name      VARCHAR(50) NULL            -- optional: "#4", "#200", "pan"
   mass_retained_g DECIMAL(10,3) NULL
   is_pan          BOOLEAN DEFAULT FALSE       -- true for the pan row (<0.08 mm)
   row_order       INT NOT NULL                -- 1,2,3... for correct sorting/display
   INDEX (ps_test_id)
```
### 10.ps_results (calculated – stored for fast UI & reports)
```SQL
    id                  BIGINT PRIMARY KEY AUTO_INCREMENT
    ps_test_id          BIGINT UNIQUE NOT NULL REFERENCES ps_tests(id)
    total_mass_g        DECIMAL(10,3)               -- sum(retained) + pan
    fines_percent       DECIMAL(6,3)                -- % < 0.08 mm
    d10                 DECIMAL(6,3) NULL
    d30                 DECIMAL(6,3) NULL
    d60                 DECIMAL(6,3) NULL
    cu                  DECIMAL(6,2) NULL           -- D60 / D10
    cc                  DECIMAL(6,2) NULL           -- (D30²) / (D10 × D60)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    updated_at          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
```

###11. ps_curve_points (optional – precomputed for curve plotting)
```SQL
    id                      BIGINT PRIMARY KEY AUTO_INCREMENT
    ps_test_id              BIGINT NOT NULL REFERENCES ps_tests(id)
    sieve_mm                DECIMAL(8,4) NOT NULL
    percent_passing_cumulative DECIMAL(6,3) NOT NULL
    row_order               INT NOT NULL
    INDEX (ps_test_id)
```