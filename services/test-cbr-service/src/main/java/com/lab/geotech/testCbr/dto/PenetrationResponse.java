package com.lab.geotech.testCbr.dto;

import com.lab.geotech.testCbr.entity.CbrPenetration;

import java.math.BigDecimal;
import java.util.UUID;

public record PenetrationResponse(
        UUID id,
        BigDecimal penetrationMm,
        BigDecimal ringReading,
        BigDecimal loadKn
) {
    public static PenetrationResponse from(CbrPenetration p) {
        return new PenetrationResponse(p.getId(), p.getPenetrationMm(), p.getRingReading(), p.getLoadKn());
    }
}
