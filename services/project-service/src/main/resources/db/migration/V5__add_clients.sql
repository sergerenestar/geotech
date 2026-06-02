SET search_path TO projects;

-- Alter existing clients table (created in V2)
ALTER TABLE clients RENAME COLUMN contact_person TO contact_name;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type        VARCHAR(20) NOT NULL DEFAULT 'PERSON';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by  UUID;

-- Client acceptance on projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_accepted    BOOLEAN     NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_accepted_at TIMESTAMPTZ;

-- Client notes
CREATE TABLE IF NOT EXISTS client_notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id   UUID        NOT NULL REFERENCES clients(id)  ON DELETE CASCADE,
    author      VARCHAR(200) NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_notes_project ON client_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client  ON client_notes(client_id);
