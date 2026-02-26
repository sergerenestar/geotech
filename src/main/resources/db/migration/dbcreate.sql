-- Create DB (utf8mb4 recommended)
CREATE DATABASE geotechlabdb
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;

-- Create app user (change password!)
CREATE USER 'geotech_app'@'%' IDENTIFIED BY 'Mafleur123#';

-- Grant rights on this DB only
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
    ON geotechlabdb.* TO 'geotech_app'@'%';

FLUSH PRIVILEGES;