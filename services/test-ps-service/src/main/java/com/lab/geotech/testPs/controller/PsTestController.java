package com.lab.geotech.testPs.controller;

import com.lab.geotech.testPs.dto.PsTestCreateDto;
import com.lab.geotech.testPs.dto.PsTestResponse;
import com.lab.geotech.testPs.dto.PsTestStatusUpdateDto;
import com.lab.geotech.testPs.exception.ApiResponse;
import com.lab.geotech.testPs.service.PsTestService;
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
public class PsTestController {

    private final PsTestService service;

    @PostMapping("/api/tests/particle-size")
    public ResponseEntity<PsTestResponse> create(@Valid @RequestBody PsTestCreateDto dto,
                                                   Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/particle-size/{id}")
    public ResponseEntity<PsTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/particle-size")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<PsTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<PsTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("sampleId or projectId query parameter is required");
    }

    @PatchMapping("/api/tests/particle-size/{id}/status")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','ADMIN','USER')")
    public ResponseEntity<PsTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody PsTestStatusUpdateDto dto,
                                                        Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(service.updateStatus(id, dto.status(), userId));
    }

    @GetMapping("/internal/particle-size/{sampleId}")
    public ResponseEntity<PsTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/tests/particle-size/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/particle-size/{id}")
    public ResponseEntity<ApiResponse<PsTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PsTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }
}
