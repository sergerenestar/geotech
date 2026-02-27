package com.saker.geotech.security.token;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class TokenValidator {

    private final AccessTokenService accessTokenService;
    private final RefreshTokenService refreshTokenService;

    public TokenValidator(
            AccessTokenService accessTokenService,
            RefreshTokenService refreshTokenService
    ) {
        this.accessTokenService = accessTokenService;
        this.refreshTokenService = refreshTokenService;
    }

    public boolean isValidAccessTokenForUser(String token, UserDetails user) {
        String username = accessTokenService.extractUsername(token);
        return username != null
                && username.equals(user.getUsername())
                && !accessTokenService.isExpired(token);
    }

    public boolean isValidRefreshToken(String token) {
        return !refreshTokenService.isExpired(token);
    }
}