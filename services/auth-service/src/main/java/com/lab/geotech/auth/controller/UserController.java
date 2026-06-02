package com.lab.geotech.auth.controller;

import com.lab.geotech.auth.dto.AdminNoteResponse;
import com.lab.geotech.auth.dto.CreateClientUserRequest;
import com.lab.geotech.auth.dto.CreateUserRequest;
import com.lab.geotech.auth.dto.NoteRequest;
import com.lab.geotech.auth.dto.PagedResponse;
import com.lab.geotech.auth.dto.UpdateRoleRequest;
import com.lab.geotech.auth.dto.UpdateUserProfileRequest;
import com.lab.geotech.auth.dto.UserResponse;
import com.lab.geotech.auth.exception.ApiResponse;
import com.lab.geotech.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getAllUsers(page, size, role, status), "OK"));
    }

    @GetMapping("/lab-managers")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'LAB_MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getLabManagers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getAllUsers(page, size, "LAB_MANAGER", null), "OK"));
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getTechnicians(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.getAllUsers(page, size, "TECHNICIAN", null), "OK"));
    }

    @PostMapping("/client")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> createClientUser(
            @Valid @RequestBody CreateClientUserRequest req,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                userService.createClientUser(req, UUID.fromString(adminId)), "Client user created"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                userService.createUser(req, UUID.fromString(adminId)), "User created"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id), "OK"));
    }

    @PatchMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserProfileRequest req,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateProfile(id, req, UUID.fromString(adminId)), "Profile updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal String adminId) {
        userService.deleteUser(id, UUID.fromString(adminId));
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<UserResponse>> approve(
            @PathVariable UUID id,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.approveUser(id, UUID.fromString(adminId)), "User approved"));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<UserResponse>> deactivate(
            @PathVariable UUID id,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.deactivateUser(id, UUID.fromString(adminId)), "User deactivated"));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<UserResponse>> reactivate(
            @PathVariable UUID id,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.reactivateUser(id, UUID.fromString(adminId)), "User reactivated"));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest req,
            @AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateRole(id, req.role(), UUID.fromString(adminId)), "Role updated"));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<List<AdminNoteResponse>>> getNotes(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getNotes(id), "OK"));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<AdminNoteResponse>> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody NoteRequest req,
            @AuthenticationPrincipal String authorId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                userService.addNote(id, UUID.fromString(authorId), req), "Note added"));
    }

    @PatchMapping("/{id}/notes/{noteId}")
    public ResponseEntity<ApiResponse<AdminNoteResponse>> updateNote(
            @PathVariable UUID id,
            @PathVariable UUID noteId,
            @Valid @RequestBody NoteRequest req,
            @AuthenticationPrincipal String authorId) {
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateNote(id, noteId, UUID.fromString(authorId), req), "Note updated"));
    }

    @DeleteMapping("/{id}/notes/{noteId}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable UUID id,
            @PathVariable UUID noteId,
            @AuthenticationPrincipal String authorId) {
        userService.deleteNote(id, noteId, UUID.fromString(authorId));
        return ResponseEntity.noContent().build();
    }
}
