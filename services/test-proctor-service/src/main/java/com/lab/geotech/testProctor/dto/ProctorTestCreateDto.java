package com.lab.geotech.testProctor.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProctorTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        String method,
        @NotNull @DecimalMin("0.001") BigDecimal moldVolumeCm3,
        @NotNull @DecimalMin("0.001") BigDecimal moldMassG,
        BigDecimal specificGravity,
        String notes,
        @NotEmpty @Valid List<ProctorPointInputDto> points
) {}
