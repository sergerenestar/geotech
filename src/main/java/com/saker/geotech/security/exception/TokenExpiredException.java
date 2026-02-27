package com.saker.geotech.security.exception;

public class TokenExpiredException extends JwtAuthenticationException {
    public TokenExpiredException(String message) {
        super(message);
    }

    public TokenExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}