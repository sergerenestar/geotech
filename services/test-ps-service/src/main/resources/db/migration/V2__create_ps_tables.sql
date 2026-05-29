-- ASTM D-422 Particle Size Analysis — table definitions
SET search_path TO test_ps;

CREATE TABLE IF NOT EXISTS ps_tests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID,
    project_id          UUID,
    borehole_id         UUID,
    technician_id       UUID NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CONSTRAINT ps_tests_status_chk CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    test_type           VARCHAR(20) NOT NULL DEFAULT 'SIEVE'
        CONSTRAINT ps_tests_test_type_chk CHECK (test_type IN ('SIEVE','HYDROMETER','COMBINED')),
    total_dry_mass_g    DECIMAL(10,3) NOT NULL,
    specific_gravity    DECIMAL(8,4)  NOT NULL DEFAULT 2.70,
    -- Fraction results (calculated)
    pct_gravel          DECIMAL(8,3),
    pct_sand            DECIMAL(8,3),
    pct_fines           DECIMAL(8,3),
    pct_clay            DECIMAL(8,3),
    -- Characteristic diameters (calculated, nullable if not determinable)
    d10_mm              DECIMAL(12,6),
    d30_mm              DECIMAL(12,6),
    d60_mm              DECIMAL(12,6),
    cu                  DECIMAL(10,4),
    cc                  DECIMAL(10,4),
    -- Classification
    uscs_symbol         VARCHAR(10),
    uscs_name           VARCHAR(100),
    notes               TEXT,
    ai_flag             VARCHAR(10) NOT NULL DEFAULT 'NONE'
        CONSTRAINT ps_tests_ai_flag_chk CHECK (ai_flag IN ('NONE','WARNING','ERROR')),
    ai_flag_message     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ps_sieve_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id             UUID NOT NULL REFERENCES ps_tests(id) ON DELETE CASCADE,
    sieve_label         VARCHAR(20) NOT NULL,
    opening_mm          DECIMAL(10,4) NOT NULL,
    mass_retained_g     DECIMAL(10,3) NOT NULL,
    -- Calculated
    pct_retained        DECIMAL(8,3),
    pct_finer           DECIMAL(8,3),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ps_sieve_results_unique UNIQUE (test_id, opening_mm)
);

CREATE TABLE IF NOT EXISTS ps_hydrometer_readings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 UUID NOT NULL REFERENCES ps_tests(id) ON DELETE CASCADE,
    reading_number          INT NOT NULL,
    elapsed_time_min        DECIMAL(10,2) NOT NULL,
    hydrometer_reading      DECIMAL(8,3) NOT NULL,
    temperature_c           DECIMAL(5,1) NOT NULL,
    -- Calculated
    corrected_reading       DECIMAL(8,3),
    particle_diameter_mm    DECIMAL(12,8),
    pct_finer               DECIMAL(8,3),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ps_hydrometer_readings_unique UNIQUE (test_id, reading_number)
);
