package com.lab.geotech.testDs.dto;

import com.lab.geotech.testDs.entity.DsStage;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DsStageResponse(
        UUID id,
        int stageNumber,
        BigDecimal normalStressKpa,
        BigDecimal peakShearStressKpa,
        BigDecimal displacementAtPeakMm,
        List<DsReadingResponse> readings,
        OffsetDateTime createdAt
) {
    public static DsStageResponse from(DsStage stage) {
        List<DsReadingResponse> readingResponses = stage.getReadings().stream()
                .map(DsReadingResponse::from)
                .toList();
        return new DsStageResponse(
                stage.getId(),
                stage.getStageNumber(),
                stage.getNormalStressKpa(),
                stage.getPeakShearStressKpa(),
                stage.getDisplacementAtPeakMm(),
                readingResponses,
                stage.getCreatedAt()
        );
    }
}
