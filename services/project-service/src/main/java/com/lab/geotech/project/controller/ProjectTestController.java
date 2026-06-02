package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.ProjectTestAssignDto;
import com.lab.geotech.project.dto.ProjectTestResponse;
import com.lab.geotech.project.dto.ProjectTestSetDto;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.ProjectTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tests")
@RequiredArgsConstructor
public class ProjectTestController {

    private final ProjectTestService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectTestResponse>>> list(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByProject(projectId), "OK"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<List<ProjectTestResponse>>> set(
            @PathVariable UUID projectId,
            @Valid @RequestBody ProjectTestSetDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.setProjectTests(projectId, dto), "Catalogue saved"));
    }

    @PatchMapping("/{testId}/assign")
    public ResponseEntity<ApiResponse<ProjectTestResponse>> assign(
            @PathVariable UUID projectId,
            @PathVariable UUID testId,
            @RequestBody ProjectTestAssignDto dto) {
        return ResponseEntity.ok(ApiResponse.success(
                service.assignTechnician(projectId, testId, dto), "Assigned"));
    }

    @DeleteMapping("/{testType}")
    public ResponseEntity<Void> remove(
            @PathVariable UUID projectId,
            @PathVariable String testType) {
        service.removeOne(projectId, testType);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{testType}")
    public ResponseEntity<ApiResponse<ProjectTestResponse>> updateManager(
            @PathVariable UUID projectId,
            @PathVariable String testType,
            @RequestBody Map<String, String> body) {
        UUID labManagerId = body.containsKey("labManagerId") && body.get("labManagerId") != null
                ? UUID.fromString(body.get("labManagerId"))
                : null;
        return ResponseEntity.ok(ApiResponse.success(
                service.updateLabManager(projectId, testType, labManagerId), "Updated"));
    }
}
