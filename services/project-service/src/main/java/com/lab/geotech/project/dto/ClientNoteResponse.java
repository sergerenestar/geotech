package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.ClientNote;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ClientNoteResponse(UUID id, UUID projectId, UUID clientId, String author, String content, OffsetDateTime createdAt) {
    public static ClientNoteResponse from(ClientNote n) {
        return new ClientNoteResponse(n.getId(), n.getProjectId(), n.getClientId(), n.getAuthor(), n.getContent(), n.getCreatedAt());
    }
}
