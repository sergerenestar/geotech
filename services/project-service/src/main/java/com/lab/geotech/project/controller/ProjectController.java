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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<PagedResponse<ProjectResponse>>> getMyProjects(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                projectService.getMyProjects(UUID.fromString(userId), page, size), "OK"));
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PROJECT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        projectService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
