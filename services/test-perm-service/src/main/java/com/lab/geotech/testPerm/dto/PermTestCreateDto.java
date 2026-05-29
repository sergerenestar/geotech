package com.lab.geotech.testPerm.dto;

import com.lab.geotech.testPerm.constant.TestType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PermTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        TestType testType,
        @NotNull @Positive BigDecimal specimenDiameterMm,
        @NotNull @Positive BigDecimal specimenLengthMm,
        BigDecimal waterTemperatureC,
        BigDecimal standpipeAreaCm2,
        BigDecimal headCm,
        String notes,
        @NotEmpty @Valid List<PermReadingInputDto> readings
) {}
