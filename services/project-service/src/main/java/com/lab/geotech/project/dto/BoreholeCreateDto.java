package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record BoreholeCreateDto(
        @NotNull UUID projectId,
        @NotBlank String bhCode,
        BigDecimal depthM,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal groundwaterDepthM,
        String notes
) {}
