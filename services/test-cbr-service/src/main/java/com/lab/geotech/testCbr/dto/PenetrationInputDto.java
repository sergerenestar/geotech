package com.lab.geotech.testCbr.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PenetrationInputDto(
        @NotNull BigDecimal penetrationMm,
        BigDecimal ringReading,
        BigDecimal loadKn
) {}
