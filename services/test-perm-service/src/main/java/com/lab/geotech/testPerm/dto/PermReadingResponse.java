package com.lab.geotech.testPerm.dto;

import com.lab.geotech.testPerm.entity.PermReading;

import java.math.BigDecimal;
import java.util.UUID;

public record PermReadingResponse(
        UUID id,
        int readingNumber,
        BigDecimal flowVolumeMl,
        BigDecimal initialHeadCm,
        BigDecimal finalHeadCm,
        BigDecimal elapsedTimeS,
        BigDecimal kCms
) {
    public static PermReadingResponse from(PermReading r) {
        return new PermReadingResponse(
                r.getId(),
                r.getReadingNumber(),
                r.getFlowVolumeMl(),
                r.getInitialHeadCm(),
                r.getFinalHeadCm(),
                r.getElapsedTimeS(),
                r.getKCms()
        );
    }
}
