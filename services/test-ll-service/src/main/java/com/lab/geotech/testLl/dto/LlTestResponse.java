package com.lab.geotech.testLl.dto;

import com.lab.geotech.testLl.constant.AiFlag;
import com.lab.geotech.testLl.constant.TestMethod;
import com.lab.geotech.testLl.constant.TestStatus;
import com.lab.geotech.testLl.entity.LlTest;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record LlTestResponse(
        UUID id,
        UUID sampleId,
        UUID projectId,
        UUID boreholeId,
        UUID technicianId,
        TestStatus status,
        TestMethod method,
        BigDecimal llPct,
        BigDecimal plPct,
        BigDecimal piPct,
        BigDecimal rSquared,
        BigDecimal liquidityIndex,
        BigDecimal activity,
        String uscsSymbol,
        String uscsName,
        String notes,
        AiFlag aiFlag,
        String aiFlagMessage,
        List<CasagrandePointResponse> casagrandePoints,
        List<PlDeterminationResponse> plDeterminations,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static LlTestResponse from(LlTest t) {
        return new LlTestResponse(
                t.getId(),
                t.getSampleId(),
                t.getProjectId(),
                t.getBoreholeId(),
                t.getTechnicianId(),
                t.getStatus(),
                t.getMethod(),
                t.getLlPct(),
                t.getPlPct(),
                t.getPiPct(),
                t.getRSquared(),
                t.getLiquidityIndex(),
                t.getActivity(),
                t.getUscsSymbol(),
                t.getUscsName(),
                t.getNotes(),
                t.getAiFlag(),
                t.getAiFlagMessage(),
                t.getCasagrandePoints().stream().map(CasagrandePointResponse::from).toList(),
                t.getPlDeterminations().stream().map(PlDeterminationResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
