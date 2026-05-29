package com.lab.geotech.testPerm.controller;

import com.lab.geotech.testPerm.dto.PermTestCreateDto;
import com.lab.geotech.testPerm.dto.PermTestResponse;
import com.lab.geotech.testPerm.dto.PermTestStatusUpdateDto;
import com.lab.geotech.testPerm.exception.ApiResponse;
import com.lab.geotech.testPerm.service.PermTestService;
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
public class PermTestController {

    private final PermTestService service;

    @PostMapping("/api/tests/permeability")
    public ResponseEntity<PermTestResponse> create(@Valid @RequestBody PermTestCreateDto dto,
                                                    Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/permeability/{id}")
    public ResponseEntity<PermTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/permeability")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<PermTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<PermTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/permeability/{id}/status")
    public ResponseEntity<PermTestResponse> updateStatus(@PathVariable UUID id,
                                                          @Valid @RequestBody PermTestStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @PutMapping("/api/tests/permeability/{id}")
    public ResponseEntity<ApiResponse<PermTestResponse>> update(@PathVariable UUID id,
                                                                 @Valid @RequestBody PermTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @DeleteMapping("/api/tests/permeability/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/internal/permeability/{sampleId}")
    public ResponseEntity<PermTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
