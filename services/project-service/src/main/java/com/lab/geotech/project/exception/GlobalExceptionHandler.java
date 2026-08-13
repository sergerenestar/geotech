package com.lab.geotech.project.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Centralised exception-to-HTTP-response mapping for the project-service.
 *
 * <p>All responses use the {@link ErrorResponse} envelope {@code { error, code, timestamp }},
 * ensuring the API contract remains consistent regardless of which exception was thrown.
 * Stack traces are never serialised to the response body (only logged server-side) to prevent
 * information disclosure.
 *
 * <p>Exception hierarchy handled:
 * <ul>
 *   <li>{@code MethodArgumentNotValidException} — 400 with per-field validation errors.</li>
 *   <li>{@code ProjectNotFoundException} / {@code ResourceNotFoundException} — 404.</li>
 *   <li>{@code InvalidStatusTransitionException} / {@code InvalidWorkflowTransitionException} — 400.</li>
 *   <li>{@code AccessDeniedException} — 403 (message intentionally generic to avoid enumeration).</li>
 *   <li>{@code Exception} (catch-all) — 500, full stack trace logged at ERROR.</li>
 * </ul>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(Map.of(
                "error", "Validation failed",
                "code", "VALIDATION_ERROR",
                "fields", fields,
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler({ProjectNotFoundException.class, ResourceNotFoundException.class})
    public ResponseEntity<ErrorResponse> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), "NOT_FOUND"));
    }

    @ExceptionHandler({InvalidStatusTransitionException.class, InvalidWorkflowTransitionException.class})
    public ResponseEntity<ErrorResponse> handleInvalidTransition(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), "INVALID_STATUS_TRANSITION"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        // Return a generic message to avoid leaking which specific user/resource was checked.
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("Access denied", "ACCESS_DENIED"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Internal server error", "INTERNAL_ERROR"));
    }
}
