package com.lab.geotech.testProctor.dto;

import com.lab.geotech.testProctor.entity.ProctorPoint;

import java.math.BigDecimal;
import java.util.UUID;

public record ProctorPointResponse(
        UUID id,
        int pointNumber,
        BigDecimal massMoldSoilG,
        BigDecimal waterContentPct,
        BigDecimal wetUnitWeightKnM3,
        BigDecimal dryUnitWeightKnM3
) {
    public static ProctorPointResponse from(ProctorPoint p) {
        return new ProctorPointResponse(
                p.getId(),
                p.getPointNumber(),
                p.getMassMoldSoilG(),
                p.getWaterContentPct(),
                p.getWetUnitWeightKnM3(),
                p.getDryUnitWeightKnM3()
        );
    }
}
