package com.lab.geotech.testCbr.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SwellingInputDto(
        @NotNull Integer hours,
        BigDecimal readingMm,
        BigDecimal swellingPct
) {}
