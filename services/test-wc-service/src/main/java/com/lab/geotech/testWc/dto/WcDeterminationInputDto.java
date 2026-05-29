package com.lab.geotech.testWc.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record WcDeterminationInputDto(
        @NotNull @Positive BigDecimal massContainerG,
        @NotNull @Positive BigDecimal massContainerWetSoilG,
        @NotNull @Positive BigDecimal massContainerDrySoilG
) {}
