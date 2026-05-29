package com.lab.geotech.testLl.dto;

import com.lab.geotech.testLl.entity.LlCasagrandePoint;

import java.math.BigDecimal;
import java.util.UUID;

public record CasagrandePointResponse(
        UUID id,
        int pointNumber,
        int blowCount,
        BigDecimal massContainerG,
        BigDecimal massContainerWetSoilG,
        BigDecimal massContainerDrySoilG,
        BigDecimal waterContentPct
) {
    public static CasagrandePointResponse from(LlCasagrandePoint p) {
        return new CasagrandePointResponse(
                p.getId(),
                p.getPointNumber(),
                p.getBlowCount(),
                p.getMassContainerG(),
                p.getMassContainerWetSoilG(),
                p.getMassContainerDrySoilG(),
                p.getWaterContentPct()
        );
    }
}
