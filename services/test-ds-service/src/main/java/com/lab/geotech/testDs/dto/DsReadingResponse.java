package com.lab.geotech.testDs.dto;

import com.lab.geotech.testDs.entity.DsReading;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record DsReadingResponse(
        UUID id,
        int readingNumber,
        BigDecimal displacementDiv,
        BigDecimal provingRingDiv,
        BigDecimal displacementMm,
        BigDecimal shearForceN,
        BigDecimal shearStressKpa,
        OffsetDateTime createdAt
) {
    public static DsReadingResponse from(DsReading reading) {
        return new DsReadingResponse(
                reading.getId(),
                reading.getReadingNumber(),
                reading.getDisplacementDiv(),
                reading.getProvingRingDiv(),
                reading.getDisplacementMm(),
                reading.getShearForceN(),
                reading.getShearStressKpa(),
                reading.getCreatedAt()
        );
    }
}
