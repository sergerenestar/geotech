package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.TestStatusHistory;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TestStatusHistoryResponse(
        UUID id,
        UUID projectTestId,
        String fromStatus,
        String toStatus,
        UUID changedBy,
        String role,
        OffsetDateTime changedAt
) {
    public static TestStatusHistoryResponse from(TestStatusHistory h) {
        return new TestStatusHistoryResponse(
                h.getId(), h.getProjectTestId(),
                h.getFromStatus() != null ? h.getFromStatus().name() : null,
                h.getToStatus().name(),
                h.getChangedBy(), h.getRole(), h.getChangedAt()
        );
    }
}
