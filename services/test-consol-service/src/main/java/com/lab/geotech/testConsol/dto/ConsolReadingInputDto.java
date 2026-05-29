package com.lab.geotech.testConsol.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ConsolReadingInputDto(
        int readingNumber,
        @NotNull @PositiveOrZero BigDecimal timeMin,
        @NotNull BigDecimal dialReadingMm
) {}
