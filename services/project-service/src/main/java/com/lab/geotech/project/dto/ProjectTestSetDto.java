package com.lab.geotech.project.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ProjectTestSetDto(
        @NotNull List<String> testTypes,
        UUID labManagerId
) {}
