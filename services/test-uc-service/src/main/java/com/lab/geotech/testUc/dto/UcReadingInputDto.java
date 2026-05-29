package com.lab.geotech.testUc.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UcReadingInputDto(
        @NotNull BigDecimal deformationDiv,
        @NotNull BigDecimal provingRingDiv
) {}
