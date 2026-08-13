package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.PagedResponse;
import com.lab.geotech.project.dto.ProjectCreateDto;
import com.lab.geotech.project.dto.ProjectResponse;
import com.lab.geotech.project.dto.ProjectStatusUpdateDto;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for the Project resource.
 *
 * <p>Base path: {@code /api/projects}
 *
 * <p>Project access is role-scoped:
 * <ul>
 *   <li>ADMIN / LAB_MANAGER — {@code GET /} returns all projects (paginated).</li>
 *   <li>PROJECT_MANAGER (default) — {@code GET /mine} returns projects they created.</li>
 *   <li>LAB_MANAGER — {@code GET /mine} returns projects with at least one test assigned to them.</li>
 *   <li>TECHNICIAN / USER — {@code GET /mine} returns projects with a test assigned to them.</li>
 *   <li>CLIENT — {@code GET /mine} returns projects linked to their client account
 *       (client UUID is read from the {@code clientId} JWT claim, not the principal UUID).</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Returns a paginated list of projects visible to the authenticated user.
     *
     * <p>The project set returned depends on the caller's role (see class Javadoc).
     * CLIENT users have their {@code clientId} resolved from the JWT {@code details} map
     * populated by {@link com.lab.geotech.project.security.JwtValidationFilter}.
     */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getMyProjects(
            @AuthenticationPrincipal String userId,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID uid = UUID.fromString(userId);
        boolean isLabManager  = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LAB_MANAGER"));
        boolean isTechnician  = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TECHNICIAN")
                            || a.getAuthority().equals("ROLE_USER"));
        boolean isClient = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CLIENT"));
        PagedResponse<ProjectResponse> result;
        if (isLabManager) {
            result = projectService.getProjectsForLabManager(uid, page, size);
        } else if (isTechnician) {
            result = projectService.getProjectsForTechnician(uid, page, size);
        } else if (isClient) {
            Object details = authentication.getDetails();
            String clientIdStr = details instanceof Map
                    ? ((Map<?, ?>) details).get("clientId").toString() : null;
            if (clientIdStr == null) return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(List.of(), 0L, page, size), "OK"));
            result = projectService.getProjectsByClientId(UUID.fromString(clientIdStr), page, size);
        } else {
            result = projectService.getMyProjects(uid, page, size);
        }
        return ResponseEntity.ok(ApiResponse.success(result, "OK"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','LAB_MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects(page, size), "OK"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getById(id), "OK"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            @Valid @RequestBody ProjectCreateDto dto,
            @AuthenticationPrincipal String userId) {
        ProjectResponse project = projectService.createProject(dto, UUID.fromString(userId));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(project, "Project created"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectStatusUpdateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.updateStatus(id, dto.status()), "Status updated"));
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<ProjectResponse>> accept(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.acceptProject(id), "Project accepted"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
