package com.lab.geotech.testDs.dto;

import com.lab.geotech.testDs.constant.AiFlag;
import com.lab.geotech.testDs.constant.TestStatus;
import com.lab.geotech.testDs.entity.DsTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DsTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        BigDecimal boxWidthMm,
        BigDecimal boxLengthMm,
        BigDecimal specimenHeightMm,
        BigDecimal dialFactorMmPerDiv,
        BigDecimal calibrationFactorNPerDiv,
        BigDecimal cohesionKpa,
        BigDecimal frictionAngleDeg,
        BigDecimal rSquared,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<DsStageResponse> stages,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static DsTestResponse from(DsTest test) {
        List<DsStageResponse> stageResponses = test.getStages().stream()
                .map(DsStageResponse::from)
                .toList();
        return new DsTestResponse(
                test.getId(),
                test.getSampleId(),
                test.getProjectId(),
                test.getBoreholeId(),
                test.getTechnicianId(),
                test.getStatus(),
                test.getBoxWidthMm(),
                test.getBoxLengthMm(),
                test.getSpecimenHeightMm(),
                test.getDialFactorMmPerDiv(),
                test.getCalibrationFactorNPerDiv(),
                test.getCohesionKpa(),
                test.getFrictionAngleDeg(),
                test.getRSquared(),
                test.getNotes(),
                test.getAiFlag(),
                test.getAiFlagMessage(),
                stageResponses,
                test.getCreatedAt(),
                test.getUpdatedAt()
        );
    }
}
