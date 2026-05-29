package com.lab.geotech.testUc.dto;

import com.lab.geotech.testUc.constant.AiFlag;
import com.lab.geotech.testUc.constant.TestStatus;
import com.lab.geotech.testUc.entity.UcTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record UcTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        BigDecimal initialHeightMm,
        BigDecimal initialDiameterMm,
        BigDecimal dialGaugeFactorMmPerDiv,
        BigDecimal calibrationFactorNPerDiv,
        BigDecimal quKpa,
        BigDecimal suKpa,
        BigDecimal failureStrainPct,
        String failureMode,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<UcReadingResponse> readings,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static UcTestResponse from(UcTest t) {
        return new UcTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getInitialHeightMm(),
                t.getInitialDiameterMm(),
                t.getDialGaugeFactorMmPerDiv(),
                t.getCalibrationFactorNPerDiv(),
                t.getQuKpa(),
                t.getSuKpa(),
                t.getFailureStrainPct(),
                t.getFailureMode(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                t.getReadings().stream().map(UcReadingResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
