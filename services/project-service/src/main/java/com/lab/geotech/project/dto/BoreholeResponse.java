package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.Borehole;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BoreholeResponse(
        UUID id,
        UUID projectId,
        String bhCode,
        BigDecimal depthM,
        BigDecimal latitude,
        BigDecimal longitude,
        BigDecimal groundwaterDepthM,
        String notes,
        UUID createdBy,
        OffsetDateTime createdAt
) {
    public static BoreholeResponse from(Borehole b) {
        return new BoreholeResponse(b.getId(), b.getProject().getId(), b.getBhCode(), b.getDepthM(),
                b.getLatitude(), b.getLongitude(), b.getGroundwaterDepthM(), b.getNotes(),
                b.getCreatedBy(), b.getCreatedAt());
    }
}
