package com.lab.geotech.testDs.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record DsTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        BigDecimal boxWidthMm,
        BigDecimal boxLengthMm,
        BigDecimal specimenHeightMm,
        BigDecimal dialFactorMmPerDiv,
        @NotNull BigDecimal calibrationFactorNPerDiv,
        String notes,
        @NotEmpty @Valid List<DsStageInputDto> stages
) {}
