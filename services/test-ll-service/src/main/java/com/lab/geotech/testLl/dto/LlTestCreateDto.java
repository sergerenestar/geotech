package com.lab.geotech.testLl.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record LlTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        String method,
        String notes,
        @NotEmpty @Valid List<CasagrandePointInputDto> casagrandePoints,
        @Valid List<PlDeterminationInputDto> plDeterminations
) {}
