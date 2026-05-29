package com.lab.geotech.testDs.controller;

import com.lab.geotech.testDs.dto.DsTestCreateDto;
import com.lab.geotech.testDs.dto.DsTestResponse;
import com.lab.geotech.testDs.dto.DsTestStatusUpdateDto;
import com.lab.geotech.testDs.exception.ApiResponse;
import com.lab.geotech.testDs.service.DsTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DsTestController {

    private final DsTestService service;

    @PostMapping("/api/tests/direct-shear")
    public ResponseEntity<DsTestResponse> create(@Valid @RequestBody DsTestCreateDto dto,
                                                  Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/direct-shear/{id}")
    public ResponseEntity<DsTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/direct-shear")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<DsTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<DsTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/direct-shear/{id}/status")
    public ResponseEntity<DsTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody DsTestStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @DeleteMapping("/api/tests/direct-shear/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/direct-shear/{id}")
    public ResponseEntity<ApiResponse<DsTestResponse>> update(@PathVariable UUID id,
                                                               @Valid @RequestBody DsTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @GetMapping("/internal/direct-shear/{sampleId}")
    public ResponseEntity<DsTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
