package com.saker.geotech.security.token;

import com.saker.geotech.security.util.JwtClaimsExtractor;
import com.saker.geotech.security.util.JwtSignatureKeys;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
public class RefreshTokenService {

    private final JwtSignatureKeys keys;
    private final JwtClaimsExtractor extractor;
    private final long refreshTtlMs;

    public RefreshTokenService(
            JwtSignatureKeys keys,
            JwtClaimsExtractor extractor,
            @Value("${jwt.refresh.exp.ms:1209600000}") long refreshTtlMs
    ) {
        this.keys = keys;
        this.extractor = extractor;
        this.refreshTtlMs = refreshTtlMs;
    }

    public String generate(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(Instant.now().toEpochMilli() + refreshTtlMs))
                .signWith(keys.refreshKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractor.refreshUsername(token);
    }

    public boolean isExpired(String token) {
        return extractor.refreshExpiration(token).before(new Date());
    }
}