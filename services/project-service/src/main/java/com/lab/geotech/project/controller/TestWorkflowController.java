package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.TestCommentResponse;
import com.lab.geotech.project.dto.TestWorkflowResponse;
import com.lab.geotech.project.dto.WorkflowActionDto;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.TestWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for the test review workflow.
 *
 * <p>Base path: {@code /api/tests}
 *
 * <p>Each action endpoint extracts the caller's UUID and role from the JWT-populated
 * {@link Authentication} object and passes them to the service layer for identity and
 * role checks. This means the JWT is the single source of truth for "who is acting" —
 * there is no separate session or user lookup.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code POST /{id}/submit}          — TECHNICIAN: submit for manager review</li>
 *   <li>{@code POST /{id}/manager-approve} — LAB_MANAGER: approve → PM queue</li>
 *   <li>{@code POST /{id}/manager-reject}  — LAB_MANAGER: return to technician</li>
 *   <li>{@code POST /{id}/pm-approve}      — PROJECT_MANAGER: final approval</li>
 *   <li>{@code POST /{id}/pm-reject}       — PROJECT_MANAGER: return to manager</li>
 *   <li>{@code GET  /active}               — current user's pending-action queue</li>
 *   <li>{@code GET  /completed}            — current user's completed queue</li>
 *   <li>{@code GET  /{id}/comments}        — full comment thread for a test</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestWorkflowController {

    private final TestWorkflowService service;

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TestWorkflowResponse>> submit(
            @PathVariable UUID id,
            @RequestBody WorkflowActionDto dto,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
                service.submit(id, userId, role, dto.notes()), "Test submitted"));
    }

    @PostMapping("/{id}/manager-approve")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<ApiResponse<TestWorkflowResponse>> managerApprove(
            @PathVariable UUID id,
            @RequestBody WorkflowActionDto dto,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
                service.managerApprove(id, userId, role, dto.notes()), "Approved by manager"));
    }

    @PostMapping("/{id}/manager-reject")
    @PreAuthorize("hasRole('LAB_MANAGER')")
    public ResponseEntity<ApiResponse<TestWorkflowResponse>> managerReject(
            @PathVariable UUID id,
            @RequestBody WorkflowActionDto dto,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
                service.managerReject(id, userId, role, dto.notes()), "Returned to technician"));
    }

    @PostMapping("/{id}/pm-approve")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<TestWorkflowResponse>> pmApprove(
            @PathVariable UUID id,
            @RequestBody WorkflowActionDto dto,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
                service.pmApprove(id, userId, role, dto.notes()), "Approved by project manager"));
    }

    @PostMapping("/{id}/pm-reject")
    @PreAuthorize("hasRole('PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<TestWorkflowResponse>> pmReject(
            @PathVariable UUID id,
            @RequestBody WorkflowActionDto dto,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(
                service.pmReject(id, userId, role, dto.notes()), "Returned to manager"));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<TestWorkflowResponse>>> getActive(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(service.getActive(userId, role), "OK"));
    }

    @GetMapping("/completed")
    public ResponseEntity<ApiResponse<List<TestWorkflowResponse>>> getCompleted(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        String role = extractRole(auth);
        return ResponseEntity.ok(ApiResponse.success(service.getCompleted(userId, role), "OK"));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<List<TestCommentResponse>>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getComments(id), "OK"));
    }

    /**
     * Extracts the bare role name from the first {@code ROLE_} prefixed authority
     * (e.g. {@code "ROLE_LAB_MANAGER"} → {@code "LAB_MANAGER"}).
     * Returns "UNKNOWN" if no matching authority exists, which will fail
     * subsequent identity checks in the service layer.
     */
    private String extractRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .orElse("UNKNOWN");
    }
}
