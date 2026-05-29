package com.lab.geotech.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
