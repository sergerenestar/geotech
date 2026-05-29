package com.lab.geotech.testProctor.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProctorPointInputDto(
        @NotNull BigDecimal massMoldSoilG,
        @NotNull @DecimalMin("0") BigDecimal waterContentPct
) {}
