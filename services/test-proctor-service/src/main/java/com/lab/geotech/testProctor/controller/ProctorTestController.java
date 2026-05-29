package com.lab.geotech.testProctor.controller;

import com.lab.geotech.testProctor.dto.ProctorTestCreateDto;
import com.lab.geotech.testProctor.dto.ProctorTestResponse;
import com.lab.geotech.testProctor.dto.ProctorTestStatusUpdateDto;
import com.lab.geotech.testProctor.exception.ApiResponse;
import com.lab.geotech.testProctor.service.ProctorTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ProctorTestController {

    private final ProctorTestService service;

    /**
     * POST /api/tests/proctor
     * Create a new Proctor compaction test.
     */
    @PostMapping("/api/tests/proctor")
    public ResponseEntity<ProctorTestResponse> create(
            @Valid @RequestBody ProctorTestCreateDto dto,
            Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    /**
     * GET /api/tests/proctor/{id}
     * Retrieve a single test by its UUID.
     */
    @GetMapping("/api/tests/proctor/{id}")
    public ResponseEntity<ProctorTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    /**
     * GET /api/tests/proctor?projectId=...  → Page
     * GET /api/tests/proctor?sampleId=...   → List
     */
    @GetMapping("/api/tests/proctor")
    public ResponseEntity<?> list(
            @RequestParam(required = false) UUID sampleId,
            @RequestParam(required = false) UUID projectId,
            Pageable pageable) {
        if (sampleId != null) {
            List<ProctorTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<ProctorTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    /**
     * PATCH /api/tests/proctor/{id}/status
     * Transition the test to a new status.
     */
    @PatchMapping("/api/tests/proctor/{id}/status")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','ADMIN','USER')")
    public ResponseEntity<ProctorTestResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ProctorTestStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    /**
     * DELETE /api/tests/proctor/{id}
     * Soft-delete the test (sets is_deleted = true).
     */
    @DeleteMapping("/api/tests/proctor/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/tests/proctor/{id}
     * Replace all compaction points and recalculate.
     */
    @PutMapping("/api/tests/proctor/{id}")
    public ResponseEntity<ApiResponse<ProctorTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProctorTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    /**
     * GET /internal/proctor/{sampleId}
     * Internal endpoint — returns the latest test for a sample (used by other services).
     */
    @GetMapping("/internal/proctor/{sampleId}")
    public ResponseEntity<ProctorTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
