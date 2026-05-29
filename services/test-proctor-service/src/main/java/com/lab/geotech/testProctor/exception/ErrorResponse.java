package com.lab.geotech.testProctor.exception;

import java.time.Instant;

public record ErrorResponse(String error, String code, String field, String timestamp) {
    public static ErrorResponse of(String error, String code) {
        return new ErrorResponse(error, code, null, Instant.now().toString());
    }
}
