package com.lab.geotech.testCbr.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CbrTestCreateDto(
        @NotNull UUID projectId,
        UUID boreholeId,
        UUID sampleId,
        String reference,
        @NotNull BigDecimal specificGravity,
        BigDecimal proctorGdmaxTm3,
        BigDecimal proctorOmcPct,
        BigDecimal ringCoefficient,
        String notes,
        @Valid List<CbrIntensityInputDto> intensities
) {}
