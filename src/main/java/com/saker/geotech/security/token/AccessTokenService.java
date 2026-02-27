package com.saker.geotech.security.token;

import com.saker.geotech.security.util.JwtClaimsExtractor;
import com.saker.geotech.security.util.JwtSignatureKeys;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;

@Service
public class AccessTokenService {

    private final JwtSignatureKeys keys;
    private final JwtClaimsExtractor extractor;
    private final long accessTtlMs;

    public AccessTokenService(
            JwtSignatureKeys keys,
            JwtClaimsExtractor extractor,
            @Value("${jwt.access.exp.ms:900000}") long accessTtlMs
    ) {
        this.keys = keys;
        this.extractor = extractor;
        this.accessTtlMs = accessTtlMs;
    }

    public String generate(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(Instant.now().toEpochMilli() + accessTtlMs))
                .signWith(keys.accessKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractor.accessUsername(token);
    }

    public boolean isExpired(String token) {
        return extractor.accessExpiration(token).before(new Date());
    }

    public UsernamePasswordAuthenticationToken buildAuthentication(UserDetails userDetails) {
        return new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
    }
}