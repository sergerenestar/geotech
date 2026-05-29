package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.SampleCreateDto;
import com.lab.geotech.project.dto.SampleResponse;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.SampleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class SampleController {

    private final SampleService sampleService;

    @GetMapping("/api/boreholes/{boreholeId}/samples")
    public ResponseEntity<ApiResponse<List<SampleResponse>>> getByBorehole(@PathVariable UUID boreholeId) {
        return ResponseEntity.ok(ApiResponse.success(sampleService.getByBorehole(boreholeId), "OK"));
    }

    @GetMapping("/api/samples/{id}")
    public ResponseEntity<ApiResponse<SampleResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(sampleService.getById(id), "OK"));
    }

    @PostMapping("/api/samples")
    public ResponseEntity<ApiResponse<SampleResponse>> create(@Valid @RequestBody SampleCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(sampleService.create(dto), "Sample created"));
    }

    @DeleteMapping("/api/samples/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        sampleService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
