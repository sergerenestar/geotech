SET search_path TO test_sg;

CREATE TABLE IF NOT EXISTS sg_tests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID,
    project_id          UUID,
    borehole_id         UUID,
    technician_id       UUID NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    gs_average          DECIMAL(8,4),
    notes               TEXT,
    ai_flag             VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message     TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sg_status  CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_sg_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_sg_tests_project_id    ON sg_tests(project_id);
CREATE INDEX idx_sg_tests_sample_id     ON sg_tests(sample_id);
CREATE INDEX idx_sg_tests_technician_id ON sg_tests(technician_id);
CREATE INDEX idx_sg_tests_status        ON sg_tests(status);

CREATE TABLE IF NOT EXISTS sg_determinations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 UUID NOT NULL REFERENCES sg_tests(id) ON DELETE CASCADE,
    determination_number    INT NOT NULL,
    flask_number            VARCHAR(20),
    mass_dry_soil_g         DECIMAL(10,4) NOT NULL,
    mass_flask_water_g      DECIMAL(10,4) NOT NULL,
    mass_flask_soil_water_g DECIMAL(10,4) NOT NULL,
    temperature_c           DECIMAL(6,2) NOT NULL,
    gs_at_temp              DECIMAL(8,4),
    k_factor                DECIMAL(8,6),
    gs_20                   DECIMAL(8,4),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, determination_number)
);

CREATE INDEX idx_sg_det_test_id ON sg_determinations(test_id);
