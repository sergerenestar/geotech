package com.lab.geotech.testWc.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record WcTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        BigDecimal temperatureC,
        String notes,
        @NotEmpty @Valid List<WcDeterminationInputDto> determinations
) {}
