package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientCreateDto(
        @NotBlank String name,
        String contactPerson,
        String email,
        String phone
) {}
