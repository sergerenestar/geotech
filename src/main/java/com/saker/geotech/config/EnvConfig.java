// src/main/java/com/saker/geotech/config/EnvConfig.java
package com.saker.geotech.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * ███████ ENVIRONMENT / PROPERTY CONFIG ███████
 *
 * Central place to inject externalized properties (application.yml or application.properties).
 * Currently holds JWT settings used by JwtService.
 *
 * Add more @Value fields here as the project grows (e.g. file upload path, database settings, etc.).
 */
@Configuration
@Getter
public class EnvConfig {

    /**
     * JWT secret key (should be strong and stored in environment variable or Vault in production)
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * JWT token expiration time in milliseconds (default example: 86400000 = 24 hours)
     */
    @Value("${jwt.expiration}")
    private long jwtExpiration;
}