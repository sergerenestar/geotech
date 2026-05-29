package com.lab.geotech.testPs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record SieveResultInputDto(
        @NotBlank String sieveLabel,
        @NotNull @Positive BigDecimal openingMm,
        @NotNull @Positive BigDecimal massRetainedG
) {}
