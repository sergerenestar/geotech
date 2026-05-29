package com.lab.geotech.testConsol.controller;

import com.lab.geotech.testConsol.dto.ConsolTestCreateDto;
import com.lab.geotech.testConsol.dto.ConsolTestResponse;
import com.lab.geotech.testConsol.dto.ConsolTestStatusUpdateDto;
import com.lab.geotech.testConsol.exception.ApiResponse;
import com.lab.geotech.testConsol.service.ConsolTestService;
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
public class ConsolTestController {

    private final ConsolTestService service;

    @PostMapping("/api/tests/consolidation")
    public ResponseEntity<ConsolTestResponse> create(@Valid @RequestBody ConsolTestCreateDto dto,
                                                      Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/consolidation/{id}")
    public ResponseEntity<ConsolTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/consolidation")
    public ResponseEntity<?> list(@RequestParam(required = false) UUID sampleId,
                                   @RequestParam(required = false) UUID projectId,
                                   Pageable pageable) {
        if (sampleId != null) {
            List<ConsolTestResponse> results = service.getBySampleId(sampleId);
            return ResponseEntity.ok(results);
        }
        if (projectId != null) {
            Page<ConsolTestResponse> page = service.getByProjectId(projectId, pageable);
            return ResponseEntity.ok(page);
        }
        return ResponseEntity.badRequest().body("Either sampleId or projectId must be provided");
    }

    @PatchMapping("/api/tests/consolidation/{id}/status")
    public ResponseEntity<ConsolTestResponse> updateStatus(@PathVariable UUID id,
                                                            @Valid @RequestBody ConsolTestStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @PutMapping("/api/tests/consolidation/{id}")
    public ResponseEntity<ApiResponse<ConsolTestResponse>> update(@PathVariable UUID id,
                                                                   @Valid @RequestBody ConsolTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @DeleteMapping("/api/tests/consolidation/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/internal/consolidation/{sampleId}")
    public ResponseEntity<ConsolTestResponse> getLatestBySample(@PathVariable UUID sampleId) {
        return service.getLatestBySampleId(sampleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
