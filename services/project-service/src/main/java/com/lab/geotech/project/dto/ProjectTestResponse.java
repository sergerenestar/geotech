package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.ProjectTest;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Read-only view of a {@link com.lab.geotech.project.entity.ProjectTest}.
 *
 * <p>{@code testType} and {@code workflowStatus} are serialised as their enum name strings
 * (e.g. {@code "WATER_CONTENT"}, {@code "PENDING_MANAGER_REVIEW"}) so the front-end can
 * display labels without a separate lookup.
 */
public record ProjectTestResponse(
        UUID id,
        UUID projectId,
        /** Enum name of the test type (e.g. "WATER_CONTENT"). */
        String testType,
        UUID labManagerId,
        UUID technicianId,
        UUID pmId,
        String priority,
        LocalDate deadline,
        /** Current workflow status name, or null if not yet started. */
        String workflowStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Converts a {@link com.lab.geotech.project.entity.ProjectTest} entity to this response record. */
    public static ProjectTestResponse from(ProjectTest e) {
        return new ProjectTestResponse(
                e.getId(),
                e.getProjectId(),
                e.getTestType().name(),
                e.getLabManagerId(),
                e.getTechnicianId(),
                e.getPmId(),
                e.getPriority(),
                e.getDeadline(),
                e.getWorkflowStatus() != null ? e.getWorkflowStatus().name() : null,
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
