package com.lab.geotech.testConsol.dto;

import com.lab.geotech.testConsol.entity.ConsolReading;

import java.math.BigDecimal;
import java.util.UUID;

public record ConsolReadingResponse(
        UUID id,
        int readingNumber,
        BigDecimal timeMin,
        BigDecimal dialReadingMm,
        BigDecimal settlementMm
) {
    public static ConsolReadingResponse from(ConsolReading r) {
        return new ConsolReadingResponse(
                r.getId(),
                r.getReadingNumber(),
                r.getTimeMin(),
                r.getDialReadingMm(),
                r.getSettlementMm()
        );
    }
}
