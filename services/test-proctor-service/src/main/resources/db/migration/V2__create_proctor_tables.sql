SET search_path TO test_proctor;

CREATE TABLE IF NOT EXISTS proctor_tests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id           UUID,
    project_id          UUID,
    borehole_id         UUID,
    technician_id       UUID NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    method              VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    mold_volume_cm3     DECIMAL(10,3) NOT NULL,
    mold_mass_g         DECIMAL(10,3) NOT NULL,
    specific_gravity    DECIMAL(6,4) DEFAULT 2.70,
    gd_max_kn_m3        DECIMAL(10,4),
    omc_pct             DECIMAL(8,3),
    r_squared           DECIMAL(8,6),
    notes               TEXT,
    ai_flag             VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message     TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_proctor_status CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_proctor_method CHECK (method IN ('STANDARD','MODIFIED')),
    CONSTRAINT chk_proctor_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_proctor_tests_project_id    ON proctor_tests(project_id);
CREATE INDEX idx_proctor_tests_sample_id     ON proctor_tests(sample_id);
CREATE INDEX idx_proctor_tests_technician_id ON proctor_tests(technician_id);
CREATE INDEX idx_proctor_tests_status        ON proctor_tests(status);

CREATE TABLE IF NOT EXISTS proctor_points (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id             UUID NOT NULL REFERENCES proctor_tests(id) ON DELETE CASCADE,
    point_number        INT NOT NULL,
    mass_mold_soil_g    DECIMAL(10,3) NOT NULL,
    water_content_pct   DECIMAL(8,3) NOT NULL,
    wet_unit_weight_kn_m3  DECIMAL(10,4),
    dry_unit_weight_kn_m3  DECIMAL(10,4),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, point_number)
);

CREATE INDEX idx_proctor_points_test_id ON proctor_points(test_id);
