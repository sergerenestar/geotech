package com.lab.geotech.auth.dto;

import com.lab.geotech.auth.entity.AdminNote;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminNoteResponse(
        UUID id,
        UUID userId,
        UUID authorId,
        String authorHandle,
        String content,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AdminNoteResponse from(AdminNote note) {
        return new AdminNoteResponse(
                note.getId(),
                note.getUserId(),
                note.getAuthorId(),
                note.getAuthorHandle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
