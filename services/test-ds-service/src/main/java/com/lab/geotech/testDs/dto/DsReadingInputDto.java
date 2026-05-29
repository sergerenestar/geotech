package com.lab.geotech.testDs.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record DsReadingInputDto(
        @NotNull BigDecimal displacementDiv,
        @NotNull BigDecimal provingRingDiv
) {}
