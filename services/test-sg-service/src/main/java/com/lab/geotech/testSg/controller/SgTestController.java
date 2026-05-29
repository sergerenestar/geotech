package com.lab.geotech.testSg.controller;

import com.lab.geotech.testSg.dto.SgTestCreateDto;
import com.lab.geotech.testSg.dto.SgTestResponse;
import com.lab.geotech.testSg.dto.SgTestStatusUpdateDto;
import com.lab.geotech.testSg.exception.ApiResponse;
import com.lab.geotech.testSg.service.SgTestService;
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
public class SgTestController {

    private final SgTestService service;

    @PostMapping("/api/tests/specific-gravity")
    public ResponseEntity<SgTestResponse> create(@Valid @RequestBody SgTestCreateDto dto,
                                                  Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/specific-gravity/{id}")
    public ResponseEntity<SgTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/specific-gravity")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<SgTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<SgTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/specific-gravity/{id}/status")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','ADMIN','USER')")
    public ResponseEntity<SgTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody SgTestStatusUpdateDto dto,
                                                        Authentication auth) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @DeleteMapping("/api/tests/specific-gravity/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/specific-gravity/{id}")
    public ResponseEntity<ApiResponse<SgTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody SgTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @GetMapping("/internal/specific-gravity/{sampleId}")
    public ResponseEntity<SgTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
