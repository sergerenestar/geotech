package com.saker.geotech.security.util;

import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;

@Component
public class JwtParserFactory {

    private final JwtParser accessParser;
    private final JwtParser refreshParser;

    public JwtParserFactory(JwtSignatureKeys keys) {
        this.accessParser = Jwts.parserBuilder()
                .setSigningKey(keys.accessKey())
                .setAllowedClockSkewSeconds(60)
                .build();

        this.refreshParser = Jwts.parserBuilder()
                .setSigningKey(keys.refreshKey())
                .setAllowedClockSkewSeconds(60)
                .build();
    }

    public JwtParser accessParser() {
        return accessParser;
    }

    public JwtParser refreshParser() {
        return refreshParser;
    }
}