package com.lab.geotech.testCbr.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record CbrIntensityInputDto(
        @NotNull Integer blows,
        BigDecimal massMoldG,
        BigDecimal massWetG,
        BigDecimal massDryG,
        BigDecimal waterContentPct,
        BigDecimal dryDensityTm3,
        BigDecimal compactionDegreePct,
        BigDecimal cbr25mm,
        BigDecimal cbr50mm,
        List<SwellingInputDto> swellingReadings,
        List<PenetrationInputDto> penetrationReadings
) {}
