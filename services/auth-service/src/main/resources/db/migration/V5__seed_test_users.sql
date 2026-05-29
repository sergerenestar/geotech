SET search_path TO auth;

-- Test users, one per role, status=ACTIVE, language=fr
-- Passwords (BCrypt cost 10):
--   admin@lab.com      → Admin123!
--   labmanager@lab.com → Lab123!
--   pm@lab.com         → Pm123!
--   tech@lab.com       → Tech123!

INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, language)
VALUES
  (gen_random_uuid(), 'admin@lab.com',
   '$2b$10$d4payecHCzLy0OlgfwiszuVjb0YT.E4eRVb7lt3.vlafu9CQjaHPa',
   'Admin', 'GeoTech', 'ADMIN', 'ACTIVE', 'fr'),

  (gen_random_uuid(), 'labmanager@lab.com',
   '$2b$10$fibd4Z4QjMHecdTd9f7f2O5AxW4xX6Icim6/DAj1ChW8lKhwrjGZi',
   'Jean-Pierre', 'Durand', 'LAB_MANAGER', 'ACTIVE', 'fr'),

  (gen_random_uuid(), 'pm@lab.com',
   '$2b$10$Qcf1ARD2m091Wa6U4BUXO.Fl6iFZnZRlv6BaPngpidQa0Ipcv4HCC',
   'Diane', 'Martin', 'PROJECT_MANAGER', 'ACTIVE', 'fr'),

  (gen_random_uuid(), 'tech@lab.com',
   '$2b$10$MqD7McDjfmdiEqT/sCZCYOrI4kLr8NA3t/ybwYF9gza7k9SB2Vgf2',
   'Marc', 'Technicien', 'USER', 'ACTIVE', 'fr')

ON CONFLICT (email) DO NOTHING;
