-- ====================================================
-- V1__create_geotech_schema.sql  (Flyway baseline v1)
-- Geotechnical Lab Schema with Sample Source Abstraction
-- ====================================================

-- =====================
-- 1) USERS
-- =====================
CREATE TABLE users (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       email VARCHAR(255) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       role ENUM('ADMIN','MANAGER','TECHNICIAN') NOT NULL,
                       enabled BOOLEAN NOT NULL DEFAULT TRUE,
                       first_name VARCHAR(100),
                       last_name VARCHAR(100),
                       phone VARCHAR(50),
                       last_login_at TIMESTAMP NULL,
                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                       deleted_at TIMESTAMP NULL
);

-- =====================
-- 2) REFRESH TOKENS
-- =====================
CREATE TABLE refresh_tokens (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                user_id BIGINT NOT NULL,
                                token VARCHAR(512) NOT NULL UNIQUE,
                                expires_at TIMESTAMP NOT NULL,
                                revoked BOOLEAN NOT NULL DEFAULT FALSE,
                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_refresh_user FOREIGN KEY (user_id)
                                    REFERENCES users(id)
);

-- =====================
-- 3) CLIENTS
-- =====================
CREATE TABLE clients (
                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                         name VARCHAR(255) NOT NULL,
                         email VARCHAR(255),
                         phone VARCHAR(50),
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                         deleted_at TIMESTAMP NULL
);

-- =====================
-- 4) PROJECTS
-- =====================
CREATE TABLE projects (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          code VARCHAR(50) UNIQUE,
                          name VARCHAR(255) NOT NULL,
                          status ENUM('DRAFT','IN_PROGRESS','APPROVED','COMPLETED','ARCHIVED')
                                            NOT NULL DEFAULT 'DRAFT',
                          client_id BIGINT NULL,
                          start_date DATE,
                          due_date DATE,
                          created_by BIGINT NOT NULL,
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                          deleted_at TIMESTAMP NULL,
                          CONSTRAINT fk_proj_client FOREIGN KEY (client_id)
                              REFERENCES clients(id),
                          CONSTRAINT fk_proj_user FOREIGN KEY (created_by)
                              REFERENCES users(id)
);

-- =====================
-- 5) SAMPLE SOURCES
-- =====================
CREATE TABLE sample_sources (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                project_id BIGINT NOT NULL,
                                source_type ENUM(
                                    'BOREHOLE','STOCKPILE','QUARRY',
                                    'BORROW_PIT','TRUCKLOAD','LAB_RECEIVED','UNKNOWN'
                                    ) NOT NULL,
                                name VARCHAR(100),
                                location_desc VARCHAR(255),
                                notes TEXT,
                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                                deleted_at TIMESTAMP NULL,
                                CONSTRAINT fk_ss_project FOREIGN KEY (project_id)
                                    REFERENCES projects(id)
);

-- =====================
-- 6) BOREHOLES
-- =====================
CREATE TABLE boreholes (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           sample_source_id BIGINT NOT NULL UNIQUE,
                           depth_m DECIMAL(6,2),
                           diameter_mm DECIMAL(6,2),
                           method VARCHAR(50),
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                           deleted_at TIMESTAMP NULL,
                           CONSTRAINT fk_bh_ssource FOREIGN KEY (sample_source_id)
                               REFERENCES sample_sources(id)
);

-- =====================
-- 7) SAMPLES
-- =====================
CREATE TABLE samples (
                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                         sample_source_id BIGINT NOT NULL,
                         sample_code VARCHAR(100) NOT NULL,
                         sample_type VARCHAR(50),
                         classification VARCHAR(50),
                         depth_from_m DECIMAL(6,2),
                         depth_to_m DECIMAL(6,2),
                         collection_date DATE,
                         received_date DATE,
                         description TEXT,
                         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                         deleted_at TIMESTAMP NULL,
                         CONSTRAINT fk_sample_source FOREIGN KEY (sample_source_id)
                             REFERENCES sample_sources(id),
                         UNIQUE KEY uq_sample_source_code (sample_source_id, sample_code)
);

-- =====================
-- 8) TEST RUNS
-- =====================
CREATE TABLE test_runs (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           sample_id BIGINT NOT NULL,
                           test_type VARCHAR(50) NOT NULL,
                           status ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED')
                               NOT NULL DEFAULT 'DRAFT',
                           performed_at DATE,
                           technician_id BIGINT NULL,
                           approved_by BIGINT NULL,
                           created_by BIGINT NOT NULL,
                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                           deleted_at TIMESTAMP NULL,
                           CONSTRAINT fk_tr_sample FOREIGN KEY (sample_id)
                               REFERENCES samples(id),
                           CONSTRAINT fk_tr_tech FOREIGN KEY (technician_id)
                               REFERENCES users(id),
                           CONSTRAINT fk_tr_approver FOREIGN KEY (approved_by)
                               REFERENCES users(id),
                           CONSTRAINT fk_tr_creator FOREIGN KEY (created_by)
                               REFERENCES users(id)
);

-- =====================
-- 9) PS_TESTS (Granulometry)
-- =====================
CREATE TABLE ps_tests (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          test_run_id BIGINT NOT NULL UNIQUE,
                          method VARCHAR(50),
                          standard VARCHAR(50) DEFAULT 'NF P94-056',
                          sampling_date DATE,
                          specimen_ref VARCHAR(100),
                          initial_wet_mass_before_wash_g DECIMAL(10,2),
                          natural_moisture_percent DECIMAL(6,3),
                          dry_mass_before_wash_g DECIMAL(10,2),
                          dry_mass_after_wash_g DECIMAL(10,2),
                          washing_loss_percent DECIMAL(6,3),
                          notes TEXT,
                          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                          deleted_at TIMESTAMP NULL,
                          CONSTRAINT fk_pst_test_run FOREIGN KEY (test_run_id)
                              REFERENCES test_runs(id)
);

-- =====================
-- 10) PS_SIEVE_READINGS
-- =====================
CREATE TABLE ps_sieve_readings (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   ps_test_id BIGINT NOT NULL,
                                   row_order INT NOT NULL,
                                   sieve_mm DECIMAL(8,4),
                                   sieve_name VARCHAR(50),
                                   is_pan BOOLEAN DEFAULT FALSE,
                                   retained_mass_cum_g DECIMAL(10,3),
                                   percent_retained_cum DECIMAL(6,3),
                                   percent_passing_cum DECIMAL(6,3),
                                   CONSTRAINT fk_psr_test FOREIGN KEY (ps_test_id)
                                       REFERENCES ps_tests(id),
                                   INDEX idx_psr_test (ps_test_id)
);

-- =====================
-- 11) PS_RESULTS
-- =====================
CREATE TABLE ps_results (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            ps_test_id BIGINT NOT NULL UNIQUE,
                            total_mass_g DECIMAL(10,3),
                            fines_percent DECIMAL(6,3),
                            d10 DECIMAL(6,3),
                            d30 DECIMAL(6,3),
                            d60 DECIMAL(6,3),
                            cu DECIMAL(6,2),
                            cc DECIMAL(6,2),
                            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                            CONSTRAINT fk_psres_test FOREIGN KEY (ps_test_id)
                                REFERENCES ps_tests(id)
);

-- =====================
-- 12) PS_CURVE_POINTS
-- =====================
CREATE TABLE ps_curve_points (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 ps_test_id BIGINT NOT NULL,
                                 row_order INT NOT NULL,
                                 sieve_mm DECIMAL(8,4) NOT NULL,
                                 percent_passing_cum DECIMAL(6,3) NOT NULL,
                                 CONSTRAINT fk_pscp_test FOREIGN KEY (ps_test_id)
                                     REFERENCES ps_tests(id),
                                 INDEX idx_pscp_test (ps_test_id)
);

-- =====================
-- 13) PS_CCTP_LIMITS
-- =====================
CREATE TABLE ps_cctp_limits (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                ps_test_id BIGINT NOT NULL,
                                row_order INT NOT NULL,
                                sieve_mm DECIMAL(8,4) NOT NULL,
                                min_cctp_percent DECIMAL(6,3),
                                max_cctp_percent DECIMAL(6,3),
                                CONSTRAINT fk_pslim_test FOREIGN KEY (ps_test_id)
                                    REFERENCES ps_tests(id),
                                INDEX idx_pslim_test (ps_test_id)
);