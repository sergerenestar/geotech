package com.lab.geotech.testDs.exception;

import java.time.Instant;

public record ApiResponse<T>(T data, String message, String timestamp) {
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, message, Instant.now().toString());
    }

    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(null, message, Instant.now().toString());
    }
}
