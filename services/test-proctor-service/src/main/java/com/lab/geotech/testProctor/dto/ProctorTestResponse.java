package com.lab.geotech.testProctor.dto;

import com.lab.geotech.testProctor.constant.AiFlag;
import com.lab.geotech.testProctor.constant.ProctorMethod;
import com.lab.geotech.testProctor.constant.TestStatus;
import com.lab.geotech.testProctor.entity.ProctorTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ProctorTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        ProctorMethod method,
        BigDecimal moldVolumeCm3,
        BigDecimal moldMassG,
        BigDecimal specificGravity,
        BigDecimal gdMaxKnM3,
        BigDecimal omcPct,
        BigDecimal rSquared,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<ProctorPointResponse> points,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProctorTestResponse from(ProctorTest t) {
        List<ProctorPointResponse> pointResponses = t.getPoints() == null ? List.of()
                : t.getPoints().stream().map(ProctorPointResponse::from).toList();
        return new ProctorTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getMethod(),
                t.getMoldVolumeCm3(),
                t.getMoldMassG(),
                t.getSpecificGravity(),
                t.getGdMaxKnM3(),
                t.getOmcPct(),
                t.getRSquared(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                pointResponses,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
