package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.ProjectTest;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectTestResponse(
        UUID id,
        UUID projectId,
        String testType,
        UUID labManagerId,
        UUID technicianId,
        String priority,
        LocalDate deadline,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProjectTestResponse from(ProjectTest e) {
        return new ProjectTestResponse(
                e.getId(),
                e.getProjectId(),
                e.getTestType().name(),
                e.getLabManagerId(),
                e.getTechnicianId(),
                e.getPriority(),
                e.getDeadline(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
