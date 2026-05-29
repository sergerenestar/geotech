package com.lab.geotech.auth.exception;

public class UserNotActiveException extends RuntimeException {
    public UserNotActiveException(String status) {
        super("User account is not active. Current status: " + status);
    }
}
