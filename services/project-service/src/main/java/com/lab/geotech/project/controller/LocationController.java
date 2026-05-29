package com.lab.geotech.project.controller;

import com.lab.geotech.project.dto.LocationCreateDto;
import com.lab.geotech.project.dto.LocationResponse;
import com.lab.geotech.project.exception.ApiResponse;
import com.lab.geotech.project.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                locationService.getAll(PageRequest.of(page, size)).getContent(), "OK"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(locationService.getById(id), "OK"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<LocationResponse>> create(@Valid @RequestBody LocationCreateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(locationService.create(dto), "Location created"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        locationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
