SET search_path TO projects;

-- Extend project_tests with workflow tracking
ALTER TABLE project_tests
    ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',
    ADD COLUMN IF NOT EXISTS pm_id           UUID;

ALTER TABLE project_tests
    ADD CONSTRAINT chk_workflow_status CHECK (workflow_status IN (
        'ASSIGNED','IN_PROGRESS','PENDING_MANAGER_REVIEW','PENDING_PM_REVIEW',
        'APPROVED','REJECTED_TO_TECH','REJECTED_TO_MANAGER'
    ));

CREATE INDEX IF NOT EXISTS idx_pt_workflow_status  ON project_tests(workflow_status);
CREATE INDEX IF NOT EXISTS idx_pt_technician_ws    ON project_tests(technician_id, workflow_status);
CREATE INDEX IF NOT EXISTS idx_pt_lab_manager_ws   ON project_tests(lab_manager_id, workflow_status);

-- Audit trail: every status change
CREATE TABLE IF NOT EXISTS test_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_test_id UUID        NOT NULL REFERENCES project_tests(id) ON DELETE CASCADE,
    from_status     VARCHAR(30),
    to_status       VARCHAR(30) NOT NULL,
    changed_by      UUID        NOT NULL,
    role            VARCHAR(30) NOT NULL,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tsh_project_test_id ON test_status_history(project_test_id);

-- Immutable comment thread tied to a test assignment
CREATE TABLE IF NOT EXISTS test_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_test_id UUID        NOT NULL REFERENCES project_tests(id) ON DELETE CASCADE,
    user_id         UUID        NOT NULL,
    role            VARCHAR(30) NOT NULL,
    action          VARCHAR(40) NOT NULL,
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tc_project_test_id ON test_comments(project_test_id);
