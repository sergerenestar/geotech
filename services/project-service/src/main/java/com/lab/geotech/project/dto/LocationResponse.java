package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.Location;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LocationResponse(
        UUID id,
        String name,
        String address,
        String city,
        String country,
        BigDecimal latitude,
        BigDecimal longitude,
        OffsetDateTime createdAt
) {
    public static LocationResponse from(Location l) {
        return new LocationResponse(l.getId(), l.getName(), l.getAddress(), l.getCity(), l.getCountry(),
                l.getLatitude(), l.getLongitude(), l.getCreatedAt());
    }
}
