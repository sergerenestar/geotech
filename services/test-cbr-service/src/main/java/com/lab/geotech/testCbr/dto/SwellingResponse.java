package com.lab.geotech.testCbr.dto;

import com.lab.geotech.testCbr.entity.CbrSwelling;

import java.math.BigDecimal;
import java.util.UUID;

public record SwellingResponse(
        UUID id,
        Integer hours,
        BigDecimal readingMm,
        BigDecimal swellingPct
) {
    public static SwellingResponse from(CbrSwelling s) {
        return new SwellingResponse(s.getId(), s.getHours(), s.getReadingMm(), s.getSwellingPct());
    }
}
