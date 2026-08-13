package com.lab.geotech.project.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Servlet filter that validates incoming JWT Bearer tokens and populates the Spring Security context.
 *
 * <p>JWT validation is intentionally done inside each microservice rather than at the Nginx gateway.
 * This means that even if a request reaches the service directly (bypassing Nginx), it cannot
 * authenticate without a valid token signed with the shared HMAC-SHA key.
 *
 * <p>Token parsing:
 * <ul>
 *   <li>{@code sub} (subject) = the user's UUID — becomes {@code Authentication.getName()}.</li>
 *   <li>{@code role} custom claim = e.g. "ADMIN" → stored as {@code ROLE_ADMIN} authority.</li>
 *   <li>{@code clientId} custom claim (optional) = only present on CLIENT-role tokens;
 *       stored in {@code auth.details} so the controller can scope project queries to the client.</li>
 * </ul>
 *
 * <p>On an invalid or expired token the request is allowed to continue unauthenticated (no 401
 * is thrown here). Endpoint-level {@code @PreAuthorize} or {@code SecurityConfig} rules then
 * reject the request if authentication is required.
 */
@Slf4j
@Component
public class JwtValidationFilter extends OncePerRequestFilter {

    private final SecretKey signingKey;

    public JwtValidationFilter(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String role = claims.get("role", String.class);
            String clientIdStr = claims.get("clientId", String.class);
            var auth = new UsernamePasswordAuthenticationToken(
                    claims.getSubject(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            if (clientIdStr != null) {
                auth.setDetails(java.util.Map.of("clientId", clientIdStr));
            }
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException ex) {
            // Log at DEBUG to avoid noise in production logs for naturally expired tokens.
            // The request continues unauthenticated; Spring Security will reject it at the endpoint layer.
            log.debug("Invalid JWT token: {}", ex.getMessage());
        }
        chain.doFilter(request, response);
    }
}
