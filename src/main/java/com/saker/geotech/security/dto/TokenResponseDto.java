package com.saker.geotech.security.dto;

public record TokenResponseDto(
        String accessToken,
        String refreshToken,
        String tokenType
) {}