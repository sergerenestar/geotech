package com.lab.geotech.testUc.controller;

import com.lab.geotech.testUc.dto.UcTestCreateDto;
import com.lab.geotech.testUc.dto.UcTestResponse;
import com.lab.geotech.testUc.dto.UcTestStatusUpdateDto;
import com.lab.geotech.testUc.exception.ApiResponse;
import com.lab.geotech.testUc.service.UcTestService;
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
public class UcTestController {

    private final UcTestService service;

    @PostMapping("/api/tests/unconfined-compression")
    public ResponseEntity<UcTestResponse> create(@Valid @RequestBody UcTestCreateDto dto,
                                                  Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/unconfined-compression/{id}")
    public ResponseEntity<UcTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/unconfined-compression")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<UcTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<UcTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/unconfined-compression/{id}/status")
    public ResponseEntity<UcTestResponse> updateStatus(@PathVariable UUID id,
                                                        @Valid @RequestBody UcTestStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @DeleteMapping("/api/tests/unconfined-compression/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/tests/unconfined-compression/{id}")
    public ResponseEntity<ApiResponse<UcTestResponse>> update(@PathVariable UUID id,
                                                               @Valid @RequestBody UcTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @GetMapping("/internal/unconfined-compression/{sampleId}")
    public ResponseEntity<UcTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
