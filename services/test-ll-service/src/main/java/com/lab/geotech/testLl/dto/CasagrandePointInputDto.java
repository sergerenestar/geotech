package com.lab.geotech.testLl.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CasagrandePointInputDto(
        @Min(1) int blowCount,
        @NotNull @Positive BigDecimal massContainerG,
        @NotNull @Positive BigDecimal massContainerWetSoilG,
        @NotNull @Positive BigDecimal massContainerDrySoilG
) {}
