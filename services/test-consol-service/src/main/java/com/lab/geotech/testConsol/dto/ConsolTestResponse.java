package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.constant.AiFlag;
import com.lab.geotech.testConsol.constant.DrainageType;
import com.lab.geotech.testConsol.constant.TestStatus;
import com.lab.geotech.testConsol.entity.ConsolTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ConsolTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        BigDecimal specimenDiameterMm,
        BigDecimal initialHeightMm,
        BigDecimal initialVoidRatio,
        BigDecimal specificGravity,
        DrainageType drainageType,
        BigDecimal cc,
        BigDecimal cs,
        BigDecimal sigmaPKpa,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<ConsolStageResponse> stages,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ConsolTestResponse from(ConsolTest t) {
        List<ConsolStageResponse> stageResponses = t.getStages().stream()
                .map(ConsolStageResponse::from)
                .toList();
        return new ConsolTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getSpecimenDiameterMm(),
                t.getInitialHeightMm(),
                t.getInitialVoidRatio(),
                t.getSpecificGravity(),
                t.getDrainageType(),
                t.getCc(),
                t.getCs(),
                t.getSigmaPKpa(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                stageResponses,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
