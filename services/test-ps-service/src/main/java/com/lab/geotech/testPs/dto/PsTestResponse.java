package com.lab.geotech.testPs.dto;

import com.lab.geotech.testPs.constant.AiFlag;
import com.lab.geotech.testPs.constant.PsTestType;
import com.lab.geotech.testPs.constant.TestStatus;
import com.lab.geotech.testPs.entity.PsTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PsTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        PsTestType testType,
        BigDecimal sampleMassG,
        BigDecimal waterContentPct,
        BigDecimal totalDryMassG,
        BigDecimal specificGravity,
        String materialType,
        String applicableNorm,
        BigDecimal pctGravel,
        BigDecimal pctSand,
        BigDecimal pctFines,
        BigDecimal pctClay,
        BigDecimal d10Mm,
        BigDecimal d30Mm,
        BigDecimal d60Mm,
        BigDecimal cu,
        BigDecimal cc,
        String uscsSymbol,
        String uscsName,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<SieveResultResponse> sieveResults,
        List<HydrometerReadingResponse> hydrometerReadings,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PsTestResponse from(PsTest t) {
        return new PsTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getTestType(),
                t.getSampleMassG(),
                t.getWaterContentPct(),
                t.getTotalDryMassG(),
                t.getSpecificGravity(),
                t.getMaterialType(),
                t.getApplicableNorm(),
                t.getPctGravel(),
                t.getPctSand(),
                t.getPctFines(),
                t.getPctClay(),
                t.getD10Mm(),
                t.getD30Mm(),
                t.getD60Mm(),
                t.getCu(),
                t.getCc(),
                t.getUscsSymbol(),
                t.getUscsName(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                t.getSieveResults().stream().map(SieveResultResponse::from).toList(),
                t.getHydrometerReadings().stream().map(HydrometerReadingResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
