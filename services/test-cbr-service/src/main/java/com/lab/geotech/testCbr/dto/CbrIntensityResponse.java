package com.lab.geotech.testCbr.dto;

import com.lab.geotech.testCbr.entity.CbrIntensity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CbrIntensityResponse(
        UUID id,
        Integer blows,
        BigDecimal massMoldG,
        BigDecimal massWetG,
        BigDecimal massDryG,
        BigDecimal waterContentPct,
        BigDecimal dryDensityTm3,
        BigDecimal compactionDegreePct,
        BigDecimal cbr25mm,
        BigDecimal cbr50mm,
        BigDecimal cbrIndex,
        List<SwellingResponse> swellingReadings,
        List<PenetrationResponse> penetrationReadings
) {
    public static CbrIntensityResponse from(CbrIntensity i) {
        return new CbrIntensityResponse(
                i.getId(),
                i.getBlows(),
                i.getMassMoldG(),
                i.getMassWetG(),
                i.getMassDryG(),
                i.getWaterContentPct(),
                i.getDryDensityTm3(),
                i.getCompactionDegreePct(),
                i.getCbr25mm(),
                i.getCbr50mm(),
                i.getCbrIndex(),
                i.getSwellingReadings().stream().map(SwellingResponse::from).toList(),
                i.getPenetrationReadings().stream().map(PenetrationResponse::from).toList()
        );
    }
}
