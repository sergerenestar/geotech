package com.lab.geotech.auth.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final EntityManager entityManager;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID userId, String action, String entityType, String entityId,
                    Map<String, Object> details, String ipAddress) {
        try {
            String detailsJson = details != null ? toJson(details) : null;
            entityManager.createNativeQuery("""
                    INSERT INTO auth.audit_log (user_id, action, entity_type, entity_id, details, ip_address)
                    VALUES (CAST(:userId AS uuid), :action, :entityType, :entityId,
                            CAST(:details AS jsonb), CAST(:ipAddress AS inet))
                    """)
                    .setParameter("userId", userId != null ? userId.toString() : null)
                    .setParameter("action", action)
                    .setParameter("entityType", entityType)
                    .setParameter("entityId", entityId)
                    .setParameter("details", detailsJson)
                    .setParameter("ipAddress", ipAddress)
                    .executeUpdate();
        } catch (Exception e) {
            log.warn("Audit log failed for action={}: {}", action, e.getMessage());
        }
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        map.forEach((k, v) -> {
            if (sb.length() > 1) sb.append(",");
            sb.append("\"").append(k).append("\":");
            if (v instanceof String) sb.append("\"").append(v).append("\"");
            else sb.append(v);
        });
        sb.append("}");
        return sb.toString();
    }
}
