package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.Client;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ClientResponse(
        UUID id,
        String name,
        String type,
        String contactName,
        String email,
        String phone,
        String address,
        String notes,
        long projectCount,
        OffsetDateTime createdAt
) {
    public static ClientResponse from(Client c, long projectCount) {
        return new ClientResponse(c.getId(), c.getName(), c.getType(), c.getContactName(),
                c.getEmail(), c.getPhone(), c.getAddress(), c.getNotes(),
                projectCount, c.getCreatedAt());
    }
}
