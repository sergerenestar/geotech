package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.TestComment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TestCommentResponse(
        UUID id,
        UUID projectTestId,
        UUID userId,
        String role,
        String action,
        String comment,
        OffsetDateTime createdAt
) {
    public static TestCommentResponse from(TestComment c) {
        return new TestCommentResponse(
                c.getId(), c.getProjectTestId(), c.getUserId(),
                c.getRole(), c.getAction(), c.getComment(), c.getCreatedAt()
        );
    }
}
