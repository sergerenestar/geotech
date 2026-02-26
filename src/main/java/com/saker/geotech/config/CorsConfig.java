// src/main/java/com/saker/geotech/config/CorsConfig.java
package com.saker.geotech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration for Geotech Laboratory Management API
 * ─────────────────────────────────────────────────────────
 *
 * Controls Cross-Origin Resource Sharing for the REST API.
 *
 * Main purposes:
 *   - Allow Angular frontend (localhost:4200 during dev)
 *   - Allow production frontend domains
 *   - Support JWT Bearer token authentication (via Authorization header)
 *   - Be explicit and audit-friendly (avoid wildcard *)
 *   - Protect against misconfiguration in production
 *
 * This bean is automatically applied in SecurityConfig via:
 *   .cors(Customizer.withDefaults())
 *
 * Configuration is externalized via application.properties:
 *   app.cors.allowed-origins=http://localhost:4200,https://sakergeolab.com,...
 */
@Configuration
public class CorsConfig {

    private static final String DEFAULT_ALLOWED_ORIGINS =
            "http://localhost:4200,http://127.0.0.1:4200";

    /**
     * Comma-separated list of allowed origins.
     * Example in application.properties:
     * app.cors.allowed-origins=http://localhost:4200,https://sakergeolab.com,https://www.sakergeolab.com
     *
     * Fallback to safe local development values if property is missing or empty.
     */
    @Value("${app.cors.allowed-origins:" + DEFAULT_ALLOWED_ORIGINS + "}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // ── Parse and clean origins ───────────────────────────────────────
        //It takes a single string from the application property file and transforms it into a clean list of web
        // addresses for CORS
        // CORS (Cross-Origin Resource Sharing).
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        // Safety fallback - prevent complete lockout if config is broken
        if (origins.isEmpty()) {
            origins = List.of("http://localhost:4200", "http://127.0.0.1:4200");
        }
        // Configure which origins are allowed to access the API
        // This is a critical security setting - only add trusted domains
        config.setAllowedOrigins(origins);

        // ── HTTP methods allowed ───────────────────────────────────────────
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setExposedHeaders(List.of("Authorization", "Vary"));

        // ── Explicit allowed headers (audit-friendly, no wildcard) ────────
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));

        // Expose Authorization so the frontend can read JWT if returned in header
        config.setExposedHeaders(List.of("Authorization"));

        // ── Credentials setting ────────────────────────────────────────────
        // false = safer when using Bearer JWT (no cookies needed)
        // Set to true ONLY if you later implement a refresh token in a cookie
        config.setAllowCredentials(false);

        // ── Preflight cache duration ──────────────────────────────────────
        // 3600 seconds = 1 hour → reduces OPTIONS requests significantly
        config.setMaxAge(3600L);

        // ── Apply to all endpoints ────────────────────────────────────────
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}