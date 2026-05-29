-- Seed admin user for development/demo
-- Password: Admin@2026!  (BCrypt hash below)
-- Run after Flyway migrations have created the auth.users table.
INSERT INTO auth.users (id, email, password_hash, first_name, last_name, contact_number, role, status, language, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@geotech.lab',
    '$2b$10$rQlkWeiFTDIYBZAiU7gmMu3KsG2Mj9ipcssQLOGPrnrQM1fgLShmu',
    'Admin',
    'GeoTech',
    NULL,
    'ADMIN',
    'ACTIVE',
    'fr',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
