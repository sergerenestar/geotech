package com.lab.geotech.testPs.dto;

import com.lab.geotech.testPs.entity.PsSieveResult;

import java.math.BigDecimal;
import java.util.UUID;

public record SieveResultResponse(
        UUID id,
        String sieveLabel,
        BigDecimal openingMm,
        BigDecimal massRetainedG,
        BigDecimal pctRetained,
        BigDecimal pctFiner
) {
    public static SieveResultResponse from(PsSieveResult r) {
        return new SieveResultResponse(
                r.getId(),
                r.getSieveLabel(),
                r.getOpeningMm(),
                r.getMassRetainedG(),
                r.getPctRetained(),
                r.getPctFiner()
        );
    }
}
