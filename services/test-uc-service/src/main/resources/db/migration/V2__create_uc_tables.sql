SET search_path TO test_uc;

CREATE TABLE IF NOT EXISTS uc_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id               UUID,
    project_id              UUID,
    borehole_id             UUID,
    technician_id           UUID NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    initial_height_mm       DECIMAL(8,3) NOT NULL,
    initial_diameter_mm     DECIMAL(8,3) NOT NULL,
    dial_gauge_factor_mm_per_div  DECIMAL(10,6) NOT NULL DEFAULT 0.01,
    calibration_factor_n_per_div  DECIMAL(10,4) NOT NULL,
    qu_kpa                  DECIMAL(10,3),
    su_kpa                  DECIMAL(10,3),
    failure_strain_pct      DECIMAL(8,3),
    failure_mode            VARCHAR(50),
    notes                   TEXT,
    ai_flag                 VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message         TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_uc_status  CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_uc_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_uc_tests_project_id    ON uc_tests(project_id);
CREATE INDEX idx_uc_tests_sample_id     ON uc_tests(sample_id);
CREATE INDEX idx_uc_tests_technician_id ON uc_tests(technician_id);
CREATE INDEX idx_uc_tests_status        ON uc_tests(status);

CREATE TABLE IF NOT EXISTS uc_readings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 UUID NOT NULL REFERENCES uc_tests(id) ON DELETE CASCADE,
    reading_number          INT NOT NULL,
    deformation_div         DECIMAL(10,2) NOT NULL,
    proving_ring_div        DECIMAL(10,2) NOT NULL,
    deformation_mm          DECIMAL(10,4),
    load_n                  DECIMAL(10,4),
    strain_pct              DECIMAL(10,4),
    corrected_area_cm2      DECIMAL(10,4),
    stress_kpa              DECIMAL(10,3),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, reading_number)
);

CREATE INDEX idx_uc_readings_test_id ON uc_readings(test_id);
