package com.lab.geotech.testLl.dto;

import com.lab.geotech.testLl.entity.LlPlDetermination;

import java.math.BigDecimal;
import java.util.UUID;

public record PlDeterminationResponse(
        UUID id,
        int determinationNumber,
        BigDecimal massContainerG,
        BigDecimal massContainerWetSoilG,
        BigDecimal massContainerDrySoilG,
        BigDecimal waterContentPct
) {
    public static PlDeterminationResponse from(LlPlDetermination d) {
        return new PlDeterminationResponse(
                d.getId(),
                d.getDeterminationNumber(),
                d.getMassContainerG(),
                d.getMassContainerWetSoilG(),
                d.getMassContainerDrySoilG(),
                d.getWaterContentPct()
        );
    }
}
