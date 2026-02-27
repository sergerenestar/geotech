package com.saker.geotech.security.token;

import com.saker.geotech.security.dto.TokenResponseDto;
import org.springframework.stereotype.Component;

@Component
public class TokenPairGenerator {

    private final AccessTokenService accessTokenService;
    private final RefreshTokenService refreshTokenService;

    public TokenPairGenerator(
            AccessTokenService accessTokenService,
            RefreshTokenService refreshTokenService
    ) {
        this.accessTokenService = accessTokenService;
        this.refreshTokenService = refreshTokenService;
    }

    public TokenResponseDto generate(String username) {
        String access = accessTokenService.generate(username);
        String refresh = refreshTokenService.generate(username);
        return new TokenResponseDto(access, refresh, "Bearer");
    }
}