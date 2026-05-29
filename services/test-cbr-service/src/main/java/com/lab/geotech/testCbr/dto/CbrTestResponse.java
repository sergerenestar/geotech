package com.lab.geotech.testCbr.dto;

import com.lab.geotech.testCbr.constant.TestStatus;
import com.lab.geotech.testCbr.entity.CbrTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CbrTestResponse(
        UUID id,
        UUID projectId,
        UUID boreholeId,
        UUID sampleId,
        UUID technicianId,
        String reference,
        TestStatus status,
        BigDecimal specificGravity,
        BigDecimal proctorGdmaxTm3,
        BigDecimal proctorOmcPct,
        BigDecimal ringCoefficient,
        String notes,
        List<CbrIntensityResponse> intensities,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CbrTestResponse from(CbrTest t) {
        return new CbrTestResponse(
                t.getId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getSampleId(),
                t.getTechnicianId(),
                t.getReference(),
                t.getStatus(),
                t.getSpecificGravity(),
                t.getProctorGdmaxTm3(),
                t.getProctorOmcPct(),
                t.getRingCoefficient(),
                t.getNotes(),
                t.getIntensities().stream().map(CbrIntensityResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
