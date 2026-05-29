package com.lab.geotech.testWc.dto;

import com.lab.geotech.testWc.constant.AiFlag;
import com.lab.geotech.testWc.constant.TestStatus;
import com.lab.geotech.testWc.entity.WcTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record WcTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        BigDecimal temperatureC,
        String notes,
        BigDecimal averageWaterContentPct,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<WcDeterminationResponse> determinations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static WcTestResponse from(WcTest t) {
        return new WcTestResponse(
                t.getId(), t.getSampleId(), t.getProjectId(), t.getBoreholeId(),
                t.getTechnicianId(), t.getStatus(), t.getTemperatureC(), t.getNotes(),
                t.getAverageWaterContentPct(), t.getAiFlag(), t.getAiFlagMessage(),
                t.getDeterminations().stream().map(WcDeterminationResponse::from).toList(),
                t.getCreatedAt(), t.getUpdatedAt()
        );
    }
}
