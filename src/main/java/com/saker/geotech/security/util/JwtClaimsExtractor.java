package com.saker.geotech.security.util;

import com.saker.geotech.security.exception.TokenExpiredException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.function.Function;

@Component
public class JwtClaimsExtractor {

    private final JwtParserFactory parsers;

    public JwtClaimsExtractor(JwtParserFactory parsers) {
        this.parsers = parsers;
    }

    public Claims accessClaims(String token) {
        try {
            return parsers.accessParser().parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException ex) {
            throw new TokenExpiredException("Access token expired", ex);
        }
    }

    public Claims refreshClaims(String token) {
        try {
            return parsers.refreshParser().parseClaimsJws(token).getBody();
        } catch (ExpiredJwtException ex) {
            throw new TokenExpiredException("Refresh token expired", ex);
        }
    }

    public <T> T accessClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(accessClaims(token));
    }

    public <T> T refreshClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(refreshClaims(token));
    }

    public String accessUsername(String token) {
        return accessClaim(token, Claims::getSubject);
    }

    public String refreshUsername(String token) {
        return refreshClaim(token, Claims::getSubject);
    }

    public Date accessExpiration(String token) {
        return accessClaim(token, Claims::getExpiration);
    }

    public Date refreshExpiration(String token) {
        return refreshClaim(token, Claims::getExpiration);
    }
}