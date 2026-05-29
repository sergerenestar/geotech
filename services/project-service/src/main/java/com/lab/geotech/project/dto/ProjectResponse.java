package com.lab.geotech.project.dto;

import com.lab.geotech.project.constant.ProjectStatus;
import com.lab.geotech.project.entity.Project;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String projectCode,
        String name,
        String description,
        ProjectStatus status,
        UUID clientId,
        UUID locationId,
        UUID createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProjectResponse from(Project p) {
        return new ProjectResponse(p.getId(), p.getProjectCode(), p.getName(), p.getDescription(),
                p.getStatus(), p.getClientId(), p.getLocationId(), p.getCreatedBy(),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
