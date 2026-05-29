package com.lab.geotech.testPs.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record HydrometerReadingInputDto(
        int readingNumber,
        @NotNull @Positive BigDecimal elapsedTimeMin,
        @NotNull BigDecimal hydrometerReading,
        @NotNull BigDecimal temperatureC
) {}
