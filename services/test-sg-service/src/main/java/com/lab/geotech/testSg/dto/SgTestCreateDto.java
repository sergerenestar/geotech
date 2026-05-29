package com.lab.geotech.testSg.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record SgTestCreateDto(
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        String notes,
        @NotEmpty @Valid List<SgDeterminationInputDto> determinations
) {}
