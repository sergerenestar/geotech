package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.constant.LoadType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.List;

public record ConsolStageInputDto(
        LoadType loadType,
        @NotNull @Positive BigDecimal sigmaVKpa,
        @NotEmpty @Valid List<ConsolReadingInputDto> readings
) {}
