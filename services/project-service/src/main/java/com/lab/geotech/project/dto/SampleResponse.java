package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.Sample;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SampleResponse(
        UUID id,
        UUID boreholeId,
        String sampleCode,
        BigDecimal depthFromM,
        BigDecimal depthToM,
        String soilDescription,
        String uscsSymbol,
        String aashtoClass,
        OffsetDateTime createdAt
) {
    public static SampleResponse from(Sample s) {
        return new SampleResponse(s.getId(), s.getBorehole().getId(), s.getSampleCode(),
                s.getDepthFromM(), s.getDepthToM(), s.getSoilDescription(),
                s.getUscsSymbol(), s.getAashtoClass(), s.getCreatedAt());
    }
}
