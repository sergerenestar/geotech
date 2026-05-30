SET search_path TO projects;

CREATE TABLE IF NOT EXISTS project_tests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    test_type      VARCHAR(50) NOT NULL,
    lab_manager_id UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, test_type)
);

CREATE INDEX idx_project_tests_project_id ON project_tests(project_id);
