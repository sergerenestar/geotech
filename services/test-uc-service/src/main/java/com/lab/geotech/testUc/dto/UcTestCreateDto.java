package com.lab.geotech.testUc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UcTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        @NotNull BigDecimal initialHeightMm,
        @NotNull BigDecimal initialDiameterMm,
        BigDecimal dialGaugeFactorMmPerDiv,
        @NotNull BigDecimal calibrationFactorNPerDiv,
        String failureMode,
        String notes,
        @NotEmpty @Valid List<UcReadingInputDto> readings
) {}
