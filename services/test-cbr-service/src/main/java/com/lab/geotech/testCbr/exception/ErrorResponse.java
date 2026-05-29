package com.lab.geotech.testCbr.exception;

import java.time.Instant;

public record ErrorResponse(String message, String code, String timestamp) {
    public static ErrorResponse of(String message, String code) {
        return new ErrorResponse(message, code, Instant.now().toString());
    }
}
