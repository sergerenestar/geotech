package com.lab.geotech.testPs.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PsTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        @NotNull String testType,
        BigDecimal sampleMassG,
        BigDecimal waterContentPct,
        BigDecimal totalDryMassG,
        BigDecimal specificGravity,
        String materialType,
        String applicableNorm,
        String notes,
        @Valid List<SieveResultInputDto> sieveResults,
        @Valid List<HydrometerReadingInputDto> hydrometerReadings
) {}
