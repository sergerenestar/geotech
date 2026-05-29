package com.lab.geotech.testPerm.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PermReadingInputDto(
        BigDecimal flowVolumeMl,
        BigDecimal initialHeadCm,
        BigDecimal finalHeadCm,
        @NotNull @Positive BigDecimal elapsedTimeS
) {}
