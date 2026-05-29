package com.lab.geotech.testPerm.dto;

import com.lab.geotech.testPerm.constant.AiFlag;
import com.lab.geotech.testPerm.constant.TestStatus;
import com.lab.geotech.testPerm.constant.TestType;
import com.lab.geotech.testPerm.entity.PermTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PermTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        TestType testType,
        BigDecimal specimenDiameterMm,
        BigDecimal specimenLengthMm,
        BigDecimal waterTemperatureC,
        BigDecimal standpipeAreaCm2,
        BigDecimal headCm,
        BigDecimal kCms,
        BigDecimal kAt20cCms,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<PermReadingResponse> readings,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PermTestResponse from(PermTest t) {
        List<PermReadingResponse> readingResponses = t.getReadings().stream()
                .map(PermReadingResponse::from)
                .toList();
        return new PermTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getTestType(),
                t.getSpecimenDiameterMm(),
                t.getSpecimenLengthMm(),
                t.getWaterTemperatureC(),
                t.getStandpipeAreaCm2(),
                t.getHeadCm(),
                t.getKCms(),
                t.getKAt20cCms(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                readingResponses,
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
