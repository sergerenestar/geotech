-- test-ll-service: liquid limit / Atterberg limits tables (ASTM D-4318)
SET search_path TO test_ll;

CREATE TABLE IF NOT EXISTS ll_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id               UUID,
    project_id              UUID,
    borehole_id             UUID,
    technician_id           UUID NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    method                  VARCHAR(20) NOT NULL DEFAULT 'MULTI_POINT',
    ll_pct                  DECIMAL(8,3),
    pl_pct                  DECIMAL(8,3),
    pi_pct                  DECIMAL(8,3),
    r_squared               DECIMAL(8,6),
    liquidity_index         DECIMAL(8,3),
    activity                DECIMAL(8,3),
    uscs_symbol             VARCHAR(10),
    uscs_name               VARCHAR(100),
    notes                   TEXT,
    ai_flag                 VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message         TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ll_status  CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_ll_method  CHECK (method IN ('MULTI_POINT','ONE_POINT')),
    CONSTRAINT chk_ll_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_ll_tests_sample_id     ON ll_tests(sample_id);
CREATE INDEX idx_ll_tests_project_id    ON ll_tests(project_id);
CREATE INDEX idx_ll_tests_technician_id ON ll_tests(technician_id);
CREATE INDEX idx_ll_tests_status        ON ll_tests(status);

CREATE TABLE IF NOT EXISTS ll_casagrande_points (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                     UUID NOT NULL REFERENCES ll_tests(id) ON DELETE CASCADE,
    point_number                INT NOT NULL,
    blow_count                  INT NOT NULL,
    mass_container_g            DECIMAL(8,3) NOT NULL,
    mass_container_wet_soil_g   DECIMAL(8,3) NOT NULL,
    mass_container_dry_soil_g   DECIMAL(8,3) NOT NULL,
    water_content_pct           DECIMAL(8,3),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, point_number)
);

CREATE INDEX idx_ll_casagrande_test_id ON ll_casagrande_points(test_id);

CREATE TABLE IF NOT EXISTS ll_pl_determinations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                     UUID NOT NULL REFERENCES ll_tests(id) ON DELETE CASCADE,
    determination_number        INT NOT NULL,
    mass_container_g            DECIMAL(8,3) NOT NULL,
    mass_container_wet_soil_g   DECIMAL(8,3) NOT NULL,
    mass_container_dry_soil_g   DECIMAL(8,3) NOT NULL,
    water_content_pct           DECIMAL(8,3),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, determination_number)
);

CREATE INDEX idx_ll_pl_det_test_id ON ll_pl_determinations(test_id);
