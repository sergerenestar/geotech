# Entity-Relationship Diagram – v1 (Granulometry Focus)

```mermaid
erDiagram
  direction TB

  %% -----------------------
  %% RELATIONSHIPS (v1B)
  %% -----------------------
  USERS ||--o{ PROJECTS : creates
  USERS ||--o{ REFRESH_TOKENS : owns

  CLIENTS ||--o{ PROJECTS : "has (billing)"

  PROJECTS ||--o{ SAMPLE_SOURCES : defines
  SAMPLE_SOURCES ||--o{ SAMPLES : provides

  %% Borehole is a specialized "extension" of a Sample Source (only if source_type=BOREHOLE)
  SAMPLE_SOURCES ||--o| BOREHOLES : "extends"

  SAMPLES ||--o{ TEST_RUNS : undergoes

  USERS ||--o{ TEST_RUNS : created_by
  USERS ||--o{ TEST_RUNS : technician
  USERS ||--o{ TEST_RUNS : approved_by

  TEST_RUNS ||--|| PS_TESTS : has_one
  PS_TESTS ||--o{ PS_SIEVE_READINGS : raw_rows
  PS_TESTS ||--|| PS_RESULTS : computed
  PS_TESTS ||--o{ PS_CURVE_POINTS : curve
  PS_TESTS ||--o{ PS_CCTP_LIMITS : spec_band


  %% -----------------------
  %% ENTITIES
  %% -----------------------

  USERS {
    BIGINT id PK
    VARCHAR email "UNIQUE, NOT NULL"
    VARCHAR password_hash "NOT NULL"
    ENUM role "ADMIN|MANAGER|TECHNICIAN"
    BOOLEAN enabled "DEFAULT TRUE"
    VARCHAR first_name
    VARCHAR last_name
    VARCHAR phone
    TIMESTAMP last_login_at
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  REFRESH_TOKENS {
    BIGINT id PK
    BIGINT user_id FK "-> USERS.id (INDEX)"
    VARCHAR token "UNIQUE, NOT NULL"
    TIMESTAMP expires_at "NOT NULL"
    BOOLEAN revoked "DEFAULT FALSE"
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
  }

  CLIENTS {
    BIGINT id PK
    VARCHAR name "NOT NULL"
    VARCHAR email
    VARCHAR phone
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  PROJECTS {
    BIGINT id PK
    VARCHAR code "UNIQUE, nullable (e.g., PROJ-2025-001)"
    VARCHAR name "NOT NULL"
    ENUM status "DRAFT|IN_PROGRESS|APPROVED|COMPLETED|ARCHIVED (DEFAULT DRAFT)"
    BIGINT client_id FK "-> CLIENTS.id (nullable)"
    DATE start_date
    DATE due_date
    BIGINT created_by FK "-> USERS.id"
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  SAMPLE_SOURCES {
    BIGINT id PK
    BIGINT project_id FK "-> PROJECTS.id (INDEX)"

    ENUM source_type "BOREHOLE|STOCKPILE|QUARRY|BORROW_PIT|TRUCKLOAD|LAB_RECEIVED|UNKNOWN"
    VARCHAR name "BH-01 / Stockpile A / Quarry X..."
    VARCHAR location_desc "optional"
    TEXT notes "optional"

    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  BOREHOLES {
    BIGINT id PK
    BIGINT sample_source_id FK "UNIQUE, -> SAMPLE_SOURCES.id (1:1)"
    DECIMAL depth_m "DECIMAL(6,2), optional"
    DECIMAL diameter_mm "DECIMAL(6,2), optional"
    VARCHAR method "drilling method, optional"
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  SAMPLES {
    BIGINT id PK
    BIGINT sample_source_id FK "-> SAMPLE_SOURCES.id (INDEX)"

    VARCHAR sample_code "NOT NULL"
    VARCHAR sample_type "disturbed/undisturbed/bulk/core..."
    VARCHAR classification "USCS/AASHTO placeholder"

    DECIMAL depth_from_m "DECIMAL(6,2), optional (borehole context)"
    DECIMAL depth_to_m "DECIMAL(6,2), optional (borehole context)"

    DATE collection_date
    DATE received_date
    TEXT description

    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"

    %% suggested constraint (not enforced by ERD)
    %% UNIQUE(sample_source_id, sample_code)
  }

  TEST_RUNS {
    BIGINT id PK
    BIGINT sample_id FK "-> SAMPLES.id (INDEX)"

    VARCHAR test_type "PARTICLE_SIZE_GNT|PARTICLE_SIZE_SAR|WATER_CONTENT|ATTERBERG|..."
    ENUM status "DRAFT|SUBMITTED|APPROVED|REJECTED (DEFAULT DRAFT)"

    DATE performed_at
    BIGINT technician_id FK "-> USERS.id (nullable)"
    BIGINT approved_by FK "-> USERS.id (nullable)"
    BIGINT created_by FK "-> USERS.id (NOT NULL)"

    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  %% -----------------------
  %% GRANULOMETRY (Particle Size) - First Test Module
  %% -----------------------

  PS_TESTS {
    BIGINT id PK
    BIGINT test_run_id FK "UNIQUE, -> TEST_RUNS.id"

    VARCHAR method "GNT|S-A-R|DRY|WET (optional)"
    VARCHAR standard "DEFAULT 'NF P94-056'"

    DATE sampling_date "optional (Date de prélèvement)"
    VARCHAR specimen_ref "optional (ECH / N° Echantillon)"

    DECIMAL initial_wet_mass_before_wash_g "DECIMAL(10,2), optional"
    DECIMAL natural_moisture_percent "DECIMAL(6,3), optional"
    DECIMAL dry_mass_before_wash_g "DECIMAL(10,2), optional"

    DECIMAL dry_mass_after_wash_g "DECIMAL(10,2), optional"
    DECIMAL washing_loss_percent "DECIMAL(6,3), optional"

    TEXT notes
    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
    TIMESTAMP deleted_at "soft delete"
  }

  PS_SIEVE_READINGS {
    BIGINT id PK
    BIGINT ps_test_id FK "-> PS_TESTS.id (INDEX)"

    INT row_order "NOT NULL"
    DECIMAL sieve_mm "DECIMAL(8,4), optional for PAN"
    VARCHAR sieve_name "optional (#4/#200/pan)"
    BOOLEAN is_pan "DEFAULT FALSE"

    %% Excel-aligned cumulative columns (store what is entered/imported)
    DECIMAL retained_mass_cum_g "DECIMAL(10,3), optional"
    DECIMAL percent_retained_cum "DECIMAL(6,3), optional"
    DECIMAL percent_passing_cum "DECIMAL(6,3), optional"
  }

  PS_RESULTS {
    BIGINT id PK
    BIGINT ps_test_id FK "UNIQUE, -> PS_TESTS.id"

    DECIMAL total_mass_g "DECIMAL(10,3)"
    DECIMAL fines_percent "DECIMAL(6,3)  (% < 0.08mm)"

    DECIMAL d10 "DECIMAL(6,3), nullable"
    DECIMAL d30 "DECIMAL(6,3), nullable"
    DECIMAL d60 "DECIMAL(6,3), nullable"
    DECIMAL cu  "DECIMAL(6,2), nullable  (D60/D10)"
    DECIMAL cc  "DECIMAL(6,2), nullable  ((D30^2)/(D10*D60))"

    TIMESTAMP created_at "DEFAULT CURRENT_TIMESTAMP"
    TIMESTAMP updated_at "ON UPDATE CURRENT_TIMESTAMP"
  }

  PS_CURVE_POINTS {
    BIGINT id PK
    BIGINT ps_test_id FK "-> PS_TESTS.id (INDEX)"
    INT row_order "NOT NULL"
    DECIMAL sieve_mm "DECIMAL(8,4) NOT NULL"
    DECIMAL percent_passing_cum "DECIMAL(6,3) NOT NULL"
  }

  PS_CCTP_LIMITS {
    BIGINT id PK
    BIGINT ps_test_id FK "-> PS_TESTS.id (INDEX)"
    INT row_order "NOT NULL"
    DECIMAL sieve_mm "DECIMAL(8,4) NOT NULL"
    DECIMAL min_cctp_percent "DECIMAL(6,3), nullable"
    DECIMAL max_cctp_percent "DECIMAL(6,3), nullable"
  }