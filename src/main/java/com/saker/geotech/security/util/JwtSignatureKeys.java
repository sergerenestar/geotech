package com.saker.geotech.security.util;

import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtSignatureKeys {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtSignatureKeys(
            @Value("${jwt.access.secret:default-access-secret-please-change}") String accessSecret,
            @Value("${jwt.refresh.secret:default-refresh-secret-please-change}") String refreshSecret
    ) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
    }

    public SecretKey accessKey() {
        return accessKey;
    }

    public SecretKey refreshKey() {
        return refreshKey;
    }
}