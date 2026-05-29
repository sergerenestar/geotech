package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record ProjectCreateDto(
        @NotBlank String name,
        String description,
        UUID clientId,
        UUID locationId
) {}
