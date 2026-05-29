package com.lab.geotech.testSg.dto;

import com.lab.geotech.testSg.entity.SgDetermination;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SgDeterminationResponse(
        UUID id,
        int determinationNumber,
        String flaskNumber,
        BigDecimal massDrySoilG,
        BigDecimal massFlaskWaterG,
        BigDecimal massFlaskSoilWaterG,
        BigDecimal temperatureC,
        BigDecimal gsAtTemp,
        BigDecimal kFactor,
        BigDecimal gs20,
        OffsetDateTime createdAt
) {
    public static SgDeterminationResponse from(SgDetermination d) {
        return new SgDeterminationResponse(
                d.getId(),
                d.getDeterminationNumber(),
                d.getFlaskNumber(),
                d.getMassDrySoilG(),
                d.getMassFlaskWaterG(),
                d.getMassFlaskSoilWaterG(),
                d.getTemperatureC(),
                d.getGsAtTemp(),
                d.getKFactor(),
                d.getGs20(),
                d.getCreatedAt()
        );
    }
}
