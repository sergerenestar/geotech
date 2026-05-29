package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.Client;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ClientResponse(
        UUID id,
        String name,
        String contactPerson,
        String email,
        String phone,
        OffsetDateTime createdAt
) {
    public static ClientResponse from(Client c) {
        return new ClientResponse(c.getId(), c.getName(), c.getContactPerson(), c.getEmail(), c.getPhone(), c.getCreatedAt());
    }
}
