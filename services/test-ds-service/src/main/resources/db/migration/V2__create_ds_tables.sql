SET search_path TO test_ds;

-- One group per sample (groups 3+ stages under one test)
CREATE TABLE IF NOT EXISTS ds_tests (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id               UUID,
    project_id              UUID,
    borehole_id             UUID,
    technician_id           UUID NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    box_width_mm            DECIMAL(8,3) NOT NULL DEFAULT 60.0,
    box_length_mm           DECIMAL(8,3) NOT NULL DEFAULT 60.0,
    specimen_height_mm      DECIMAL(8,3),
    dial_factor_mm_per_div  DECIMAL(10,6) NOT NULL DEFAULT 0.01,
    calibration_factor_n_per_div  DECIMAL(10,4) NOT NULL,
    cohesion_kpa            DECIMAL(10,3),
    friction_angle_deg      DECIMAL(8,3),
    r_squared               DECIMAL(8,6),
    notes                   TEXT,
    ai_flag                 VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ai_flag_message         TEXT,
    is_deleted              BOOLEAN NOT NULL DEFAULT false,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ds_status  CHECK (status IN ('DRAFT','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')),
    CONSTRAINT chk_ds_ai_flag CHECK (ai_flag IN ('NONE','WARNING','ERROR'))
);

CREATE INDEX idx_ds_tests_project_id    ON ds_tests(project_id);
CREATE INDEX idx_ds_tests_sample_id     ON ds_tests(sample_id);
CREATE INDEX idx_ds_tests_technician_id ON ds_tests(technician_id);

-- Each stage = one specimen at one normal stress
CREATE TABLE IF NOT EXISTS ds_stages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id                 UUID NOT NULL REFERENCES ds_tests(id) ON DELETE CASCADE,
    stage_number            INT NOT NULL,
    normal_stress_kpa       DECIMAL(10,3) NOT NULL,
    peak_shear_stress_kpa   DECIMAL(10,3),
    displacement_at_peak_mm DECIMAL(10,4),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (test_id, stage_number)
);

CREATE INDEX idx_ds_stages_test_id ON ds_stages(test_id);

-- Per-stage readings
CREATE TABLE IF NOT EXISTS ds_readings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_id                UUID NOT NULL REFERENCES ds_stages(id) ON DELETE CASCADE,
    reading_number          INT NOT NULL,
    displacement_div        DECIMAL(10,2) NOT NULL,
    proving_ring_div        DECIMAL(10,2) NOT NULL,
    displacement_mm         DECIMAL(10,4),
    shear_force_n           DECIMAL(10,4),
    shear_stress_kpa        DECIMAL(10,3),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stage_id, reading_number)
);

CREATE INDEX idx_ds_readings_stage_id ON ds_readings(stage_id);
