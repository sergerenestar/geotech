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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

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

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshRequest req) {
        AuthResponse auth = authService.refresh(req.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(auth, "Token refreshed"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest req) {
        authService.logout(req.refreshToken());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal String userId) {
        UserResponse user = authService.getCurrentUser(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success(user, "OK"));
    }

    @PatchMapping("/me/language")
    public ResponseEntity<ApiResponse<UserResponse>> updateLanguage(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateLanguageRequest req) {
        UserResponse user = userService.updateLanguage(UUID.fromString(userId), req.language());
        return ResponseEntity.ok(ApiResponse.success(user, "Language updated"));
    }
}
