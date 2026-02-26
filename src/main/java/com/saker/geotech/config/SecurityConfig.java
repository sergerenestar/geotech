// src/main/java/com/saker/geotech/config/SecurityConfig.java
package com.saker.geotech.config;

import com.saker.geotech.security.CustomerUserDetailsService;   // Loads user details from DB for Spring Security
import com.saker.geotech.security.JwtFilter;                    // Custom JWT validation filter (stateless auth)
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * ███████ SECURITY CONFIGURATION - CORE OF THE GEOTECHLAB BACKEND API ███████
 *
 * This is the central security configuration for the Spring Boot Geotechnical Laboratory Management System.
 * It enables JWT-based stateless authentication, protects all API endpoints except public ones (auth, Swagger, health),
 * integrates CORS (via CorsConfig), and sets up password encoding with BCrypt.
 *
 * Used by: AuthController, all protected endpoints (projects, boreholes, samples, particle-size tests, reports, etc.)
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;                              // Injects our custom JWT filter

    @Autowired
    private CustomerUserDetailsService userDetailsService;    // Loads User entity + roles from DB

    // ========================================================================
    // 1. PASSWORD ENCODER
    // ========================================================================
    /**
     * BCryptPasswordEncoder (strength 12 by default) - industry standard for hashing passwords.
     * Used during user registration and login in the auth module.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ========================================================================
    // 2. AUTHENTICATION PROVIDER
    // ========================================================================
    /**
     * DaoAuthenticationProvider links our CustomUserDetailsService with the password encoder.
     * Spring Security will use this provider to authenticate users via email + password.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ========================================================================
    // 3. AUTHENTICATION MANAGER
    // ========================================================================
    /**
     * AuthenticationManager is used by AuthService to perform actual login (authenticate() call).
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ========================================================================
    // 4. SECURITY FILTER CHAIN (main security rules)
    // ========================================================================
    /**
     * Defines the complete security rules for the entire GeotechLab API.
     * - Disables CSRF (we use JWT → stateless)
     * - Enables CORS via CorsConfig bean
     * - Permits public endpoints (signup, login, refresh, Swagger docs, health check)
     * - Requires authentication for everything else
     * - Adds our JWT filter BEFORE the default UsernamePasswordAuthenticationFilter
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF - we are a pure REST API using JWT
                .csrf(csrf -> csrf.disable())

                // CORS is handled by the dedicated CorsConfig bean (see CorsConfig.java)
                .cors(Customizer.withDefaults())

                // Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // Public health check (useful for Kubernetes / monitoring)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/health",
                                "/api/auth/signup",
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // Everything else requires valid JWT
                        .anyRequest().authenticated()
                )

                // Use our DaoAuthenticationProvider
                .authenticationProvider(authenticationProvider())

                // Add JWT filter early in the chain
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}