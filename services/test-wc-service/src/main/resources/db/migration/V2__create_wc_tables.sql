-- test-wc-service: water content test tables (ASTM D-2216)
SET search_path TO test_wc;

CREATE TABLE IF NOT EXISTS wc_tests (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id                   UUID,
    project_id                  UUID,
    borehole_id                 UUID,
    technician_id               UUID NOT NULL,
    status                      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    temperature_c               DECIMAL(5,1),
    notes                       TEXT,
    average_water_content_pct   DECIMAL(8,3),
    ai_flag                     VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message             TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wc_status CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_wc_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_wc_tests_sample_id     ON wc_tests(sample_id);
CREATE INDEX idx_wc_tests_project_id    ON wc_tests(project_id);
CREATE INDEX idx_wc_tests_technician_id ON wc_tests(technician_id);
CREATE INDEX idx_wc_tests_status        ON wc_tests(status);

CREATE TABLE IF NOT EXISTS wc_determinations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                     UUID NOT NULL REFERENCES wc_tests(id) ON DELETE CASCADE,
    determination_number        INT NOT NULL,
    mass_container_g            DECIMAL(8,3) NOT NULL,
    mass_container_wet_soil_g   DECIMAL(8,3) NOT NULL,
    mass_container_dry_soil_g   DECIMAL(8,3) NOT NULL,
    mass_water_g                DECIMAL(8,3),
    mass_dry_soil_g             DECIMAL(8,3),
    water_content_pct           DECIMAL(8,3),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, determination_number)
);

CREATE INDEX idx_wc_det_test_id ON wc_determinations(test_id);
