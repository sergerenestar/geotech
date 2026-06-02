package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotBlank;

public record ClientCreateDto(
        @NotBlank String name,
        String type,
        String contactName,
        String email,
        String phone,
        String address,
        String notes
) {}
