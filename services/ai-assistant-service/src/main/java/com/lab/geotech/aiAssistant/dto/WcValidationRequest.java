package com.lab.geotech.aiAssistant.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record WcValidationRequest(
        @NotNull UUID testId,
        BigDecimal averageWaterContentPct,
        @NotEmpty List<DeterminationData> determinations
) {
    public record DeterminationData(
            int determinationNumber,
            BigDecimal massDrySoilG,
            BigDecimal waterContentPct
    ) {}
}
