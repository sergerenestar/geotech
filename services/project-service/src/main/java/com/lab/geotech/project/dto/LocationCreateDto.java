package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record LocationCreateDto(
        @NotBlank String name,
        String address,
        String city,
        String country,
        BigDecimal latitude,
        BigDecimal longitude
) {}
