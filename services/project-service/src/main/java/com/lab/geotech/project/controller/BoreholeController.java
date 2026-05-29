package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.BoreholeCreateDto;
import com.lab.geotech.project.dto.BoreholeResponse;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.BoreholeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BoreholeController {

    private final BoreholeService boreholeService;

    @GetMapping("/api/projects/{projectId}/boreholes")
    public ResponseEntity<ApiResponse<List<BoreholeResponse>>> getByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(ApiResponse.success(boreholeService.getByProject(projectId), "OK"));
    }

    @GetMapping("/api/boreholes/{id}")
    public ResponseEntity<ApiResponse<BoreholeResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(boreholeService.getById(id), "OK"));
    }

    @PostMapping("/api/boreholes")
    public ResponseEntity<ApiResponse<BoreholeResponse>> create(
            @Valid @RequestBody BoreholeCreateDto dto,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(boreholeService.create(dto, UUID.fromString(userId)), "Borehole created"));
    }

    @DeleteMapping("/api/boreholes/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        boreholeService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
