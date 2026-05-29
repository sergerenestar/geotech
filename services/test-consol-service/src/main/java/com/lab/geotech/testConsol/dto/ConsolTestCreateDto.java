package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.constant.DrainageType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ConsolTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        @NotNull @Positive BigDecimal specimenDiameterMm,
        @NotNull @Positive BigDecimal initialHeightMm,
        @NotNull @Positive BigDecimal initialVoidRatio,
        @Positive BigDecimal specificGravity,
        DrainageType drainageType,
        String notes,
        @NotEmpty @Valid List<ConsolStageInputDto> stages
) {}
