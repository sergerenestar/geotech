package com.lab.geotech.testSg.dto;

import com.lab.geotech.testSg.constant.AiFlag;
import com.lab.geotech.testSg.constant.TestStatus;
import com.lab.geotech.testSg.entity.SgTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record SgTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        BigDecimal gsAverage,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<SgDeterminationResponse> determinations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static SgTestResponse from(SgTest t) {
        return new SgTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getGsAverage(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                t.getDeterminations().stream().map(SgDeterminationResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
