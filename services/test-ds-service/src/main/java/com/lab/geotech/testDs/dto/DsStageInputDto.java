package com.lab.geotech.testDs.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record DsStageInputDto(
        @NotNull BigDecimal normalStressKpa,
        @NotEmpty @Valid List<DsReadingInputDto> readings
) {}
