SET search_path TO auth;

ALTER TABLE users DROP CONSTRAINT chk_role;
ALTER TABLE users ADD CONSTRAINT chk_role
    CHECK (role IN ('USER','LAB_MANAGER','ADMIN','PROJECT_MANAGER','TECHNICIAN'));

-- Promote the seeded technician to the proper role
UPDATE users SET role = 'TECHNICIAN' WHERE email = 'tech@lab.com';
