package com.lab.geotech.testLl.controller;

import com.lab.geotech.testLl.dto.LlTestCreateDto;
import com.lab.geotech.testLl.dto.LlTestResponse;
import com.lab.geotech.testLl.dto.LlTestStatusUpdateDto;
import com.lab.geotech.testLl.exception.ApiResponse;
import com.lab.geotech.testLl.service.LlTestService;
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
public class LlTestController {

    private final LlTestService service;

    @PostMapping("/api/tests/liquid-limit")
    public ResponseEntity<LlTestResponse> create(@Valid @RequestBody LlTestCreateDto dto,
                                                  Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/liquid-limit/{id}")
    public ResponseEntity<LlTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/liquid-limit")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<LlTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<LlTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/liquid-limit/{id}/status")
    @PreAuthorize("hasAnyRole('LAB_MANAGER','ADMIN','USER')")
    public ResponseEntity<LlTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody LlTestStatusUpdateDto dto,
                                                        Authentication auth) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @GetMapping("/internal/liquid-limit/{sampleId}")
    public ResponseEntity<LlTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/tests/liquid-limit/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/liquid-limit/{id}")
    public ResponseEntity<ApiResponse<LlTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody LlTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }
}
