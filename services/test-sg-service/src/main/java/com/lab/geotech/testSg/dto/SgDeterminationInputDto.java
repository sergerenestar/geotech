package com.lab.geotech.testSg.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SgDeterminationInputDto(
        String flaskNumber,
        @NotNull BigDecimal massDrySoilG,
        @NotNull BigDecimal massFlaskWaterG,
        @NotNull BigDecimal massFlaskSoilWaterG,
        @NotNull BigDecimal temperatureC
) {}
