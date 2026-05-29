package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.constant.LoadType;
import com.lab.geotech.testConsol.entity.ConsolStage;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ConsolStageResponse(
        UUID id,
        int stageNumber,
        LoadType loadType,
        BigDecimal sigmaVKpa,
        BigDecimal eFinal,
        BigDecimal cvM2Yr,
        BigDecimal mvM2Kn,
        BigDecimal t50Min,
        BigDecimal t90Min,
        List<ConsolReadingResponse> readings
) {
    public static ConsolStageResponse from(ConsolStage s) {
        List<ConsolReadingResponse> readingResponses = s.getReadings().stream()
                .map(ConsolReadingResponse::from)
                .toList();
        return new ConsolStageResponse(
                s.getId(),
                s.getStageNumber(),
                s.getLoadType(),
                s.getSigmaVKpa(),
                s.getEFinal(),
                s.getCvM2Yr(),
                s.getMvM2Kn(),
                s.getT50Min(),
                s.getT90Min(),
                readingResponses
        );
    }
}
