package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SampleCreateDto(
        @NotNull UUID boreholeId,
        @NotBlank String sampleCode,
        BigDecimal depthFromM,
        BigDecimal depthToM,
        String soilDescription,
        String uscsSymbol,
        String aashtoClass
) {}
