-- GeoTech Lab — PostgreSQL schema initialization
-- Run once on first boot via docker-entrypoint-initdb.d/
-- Each service manages its own tables via Flyway migrations.
--
-- Architecture: single PostgreSQL instance, per-service schemas.
-- Services set `spring.jpa.properties.hibernate.default_schema` (or search_path) to their
-- own schema. Cross-schema SQL joins are prohibited — cross-service data is fetched via
-- HTTP /internal/ endpoints between services.
--
-- Schema-to-service mapping:
--   auth          → auth-service
--   projects      → project-service  (projects, boreholes, samples, project_tests, workflow)
--   test_wc       → test-wc-service  (ASTM D-2216 water content)
--   test_ll       → test-ll-service  (ASTM D-4318 liquid limit)
--   test_proctor  → test-proctor-service (ASTM D-698 / D-1557)
--   test_sg       → test-sg-service  (ASTM D-854 specific gravity)
--   test_ps       → test-ps-service  (ASTM D-422 particle size)
--   test_perm     → test-perm-service (ASTM D-2434 permeability)
--   test_uc       → test-uc-service  (ASTM D-2166 unconfined compression)
--   test_ds       → test-ds-service  (ASTM D-3080 direct shear)
--   test_consol   → test-consol-service (ASTM D-2435 consolidation)
--   reports       → report-service
--   ai_logs       → ai-assistant-service
--   media         → media-service
--   notifications → notification-service

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS projects;
CREATE SCHEMA IF NOT EXISTS test_wc;
CREATE SCHEMA IF NOT EXISTS test_ll;
CREATE SCHEMA IF NOT EXISTS test_proctor;
CREATE SCHEMA IF NOT EXISTS test_sg;
CREATE SCHEMA IF NOT EXISTS test_ps;
CREATE SCHEMA IF NOT EXISTS test_perm;
CREATE SCHEMA IF NOT EXISTS test_uc;
CREATE SCHEMA IF NOT EXISTS test_ds;
CREATE SCHEMA IF NOT EXISTS test_consol;
CREATE SCHEMA IF NOT EXISTS reports;
CREATE SCHEMA IF NOT EXISTS ai_logs;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS notifications;
