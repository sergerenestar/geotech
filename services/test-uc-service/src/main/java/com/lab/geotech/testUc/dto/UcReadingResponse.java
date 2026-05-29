package com.lab.geotech.testUc.dto;

import com.lab.geotech.testUc.entity.UcReading;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UcReadingResponse(
        UUID id,
        int readingNumber,
        BigDecimal deformationDiv,
        BigDecimal provingRingDiv,
        BigDecimal deformationMm,
        BigDecimal loadN,
        BigDecimal strainPct,
        BigDecimal correctedAreaCm2,
        BigDecimal stressKpa,
        OffsetDateTime createdAt
) {
    public static UcReadingResponse from(UcReading r) {
        return new UcReadingResponse(
                r.getId(),
                r.getReadingNumber(),
                r.getDeformationDiv(),
                r.getProvingRingDiv(),
                r.getDeformationMm(),
                r.getLoadN(),
                r.getStrainPct(),
                r.getCorrectedAreaCm2(),
                r.getStressKpa(),
                r.getCreatedAt()
        );
    }
}
