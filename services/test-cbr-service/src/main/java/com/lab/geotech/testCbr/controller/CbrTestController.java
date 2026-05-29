package com.lab.geotech.testCbr.controller;

import com.lab.geotech.testCbr.dto.CbrStatusUpdateDto;
import com.lab.geotech.testCbr.dto.CbrTestCreateDto;
import com.lab.geotech.testCbr.dto.CbrTestResponse;
import com.lab.geotech.testCbr.exception.ApiResponse;
import com.lab.geotech.testCbr.service.CbrTestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CbrTestController {

    private final CbrTestService service;

    @PostMapping("/api/tests/cbr")
    public ResponseEntity<CbrTestResponse> create(
            @Valid @RequestBody CbrTestCreateDto dto,
            Authentication auth) {
        UUID technicianId = UUID.fromString(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, technicianId));
    }

    @GetMapping("/api/tests/cbr/{id}")
    public ResponseEntity<CbrTestResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/api/tests/cbr")
    public ResponseEntity<?> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID sampleId) {
        if (projectId != null) {
            List<CbrTestResponse> results = service.getByProjectId(projectId);
            return ResponseEntity.ok(results);
        }
        if (sampleId != null) {
            return ResponseEntity.ok(service.getBySampleId(sampleId));
        }
        return ResponseEntity.badRequest().body("Either projectId or sampleId must be provided");
    }

    @PutMapping("/api/tests/cbr/{id}")
    public ResponseEntity<ApiResponse<CbrTestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CbrTestCreateDto dto) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, dto), "Updated"));
    }

    @PatchMapping("/api/tests/cbr/{id}/status")
    public ResponseEntity<CbrTestResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody CbrStatusUpdateDto dto) {
        return ResponseEntity.ok(service.updateStatus(id, dto.status()));
    }

    @DeleteMapping("/api/tests/cbr/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
