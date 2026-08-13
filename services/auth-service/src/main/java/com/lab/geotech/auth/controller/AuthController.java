package com.lab.geotech.auth.controller;

import com.lab.geotech.auth.dto.*;
import com.lab.geotech.auth.exception.ApiResponse;
import com.lab.geotech.auth.service.AuthService;
import com.lab.geotech.auth.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for authentication and user session management.
 *
 * <p>Base path: {@code /api/auth}
 *
 * <p>Token lifecycle:
 * <ul>
 *   <li>Login returns a short-lived access token (JWT, in-memory on client) and a long-lived
 *       refresh token (opaque, stored in the database).</li>
 *   <li>The refresh token is passed back in requests to {@code POST /refresh} to obtain a new
 *       access token. In the Next.js web app the refresh token is stored in an HttpOnly cookie
 *       managed by the {@code /api/auth/refresh} Next.js route handler — the browser never
 *       sees it directly.</li>
 *   <li>Logout invalidates the refresh token in the database so it cannot be replayed.</li>
 * </ul>
 *
 * <p>New users self-register and start with {@code status = PENDING} — an ADMIN must activate
 * the account before they can log in.
 *
 * <p>The client IP is logged at registration and login for audit purposes.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    /** Registers a new user account. The account requires admin activation before login is possible. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest httpRequest) {
        UserResponse user = authService.register(req, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "Registration successful. Await admin approval."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest httpRequest) {
        AuthResponse auth = authService.login(req, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(auth, "Login successful"));
    }

    /** Exchanges a valid refresh token for a new access token (and new refresh token). */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshRequest req) {
        AuthResponse auth = authService.refresh(req.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(auth, "Token refreshed"));
    }

    /** Invalidates the given refresh token so it can no longer be used. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest req) {
        authService.logout(req.refreshToken());
        return ResponseEntity.noContent().build();
    }

    /** Returns the authenticated user's profile (decoded from the JWT subject). */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal String userId) {
        UserResponse user = authService.getCurrentUser(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(user, "OK"));
    }

    /** Updates the user's preferred UI language ("fr" or "en"). */
    @PatchMapping("/me/language")
    public ResponseEntity<ApiResponse<UserResponse>> updateLanguage(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateLanguageRequest req) {
        UserResponse user = userService.updateLanguage(UUID.fromString(userId), req.language());
        return ResponseEntity.ok(ApiResponse.success(user, "Language updated"));
    }
}
