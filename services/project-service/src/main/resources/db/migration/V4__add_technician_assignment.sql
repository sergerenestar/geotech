SET search_path TO projects;

ALTER TABLE project_tests ADD COLUMN IF NOT EXISTS technician_id UUID;
ALTER TABLE project_tests ADD COLUMN IF NOT EXISTS priority     VARCHAR(20);
ALTER TABLE project_tests ADD COLUMN IF NOT EXISTS deadline     DATE;
