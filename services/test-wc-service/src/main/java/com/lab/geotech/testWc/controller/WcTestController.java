package com.lab.geotech.testWc.controller;

import com.lab.geotech.testWc.dto.WcTestCreateDto;
import com.lab.geotech.testWc.dto.WcTestResponse;
import com.lab.geotech.testWc.dto.WcTestStatusUpdateDto;
import com.lab.geotech.testWc.exception.ApiResponse;
import com.lab.geotech.testWc.service.WcTestService;
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
public class WcTestController {

    private final WcTestService service;

    @PostMapping("/api/tests/water-content")
    public ResponseEntity<WcTestResponse> create(@Valid @RequestBody WcTestCreateDto dto,
                                                  Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/water-content/{id}")
    public ResponseEntity<WcTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/water-content")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable,
                                   Authentication auth) {
        if (sampleId != null) {
            List<WcTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<WcTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        UUID technicianId = UUID.fromString(auth.getName());
        Page<WcTestResponse> page = service.getByTechnicianId(technicianId, pageable);
        return ResponseEntity.ok(page);
    }

    @PatchMapping("/api/tests/water-content/{id}/status")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','ADMIN','USER')")
    public ResponseEntity<WcTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody WcTestStatusUpdateDto dto,
                                                        Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(service.updateStatus(id, dto.status(), userId));
    }

    @GetMapping("/internal/water-content/{sampleId}")
    public ResponseEntity<WcTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/tests/water-content/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/water-content/{id}")
    public ResponseEntity<ApiResponse<WcTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody WcTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }
}
