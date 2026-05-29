package com.lab.geotech.testWc.dto;

import com.lab.geotech.testWc.entity.WcDetermination;

import java.math.BigDecimal;
import java.util.UUID;

public record WcDeterminationResponse(
        UUID id,
        int determinationNumber,
        BigDecimal massContainerG,
        BigDecimal massContainerWetSoilG,
        BigDecimal massContainerDrySoilG,
        BigDecimal massWaterG,
        BigDecimal massDrySoilG,
        BigDecimal waterContentPct
) {
    public static WcDeterminationResponse from(WcDetermination d) {
        return new WcDeterminationResponse(
                d.getId(), d.getDeterminationNumber(),
                d.getMassContainerG(), d.getMassContainerWetSoilG(), d.getMassContainerDrySoilG(),
                d.getMassWaterG(), d.getMassDrySoilG(), d.getWaterContentPct()
        );
    }
}
