package com.lab.geotech.project.entity;

import com.lab.geotech.project.constant.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.Where;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Core project entity — the top-level container in the domain hierarchy
 * clients → projects → boreholes → samples → test results.
 *
 * <p>Project codes follow the pattern {@code GT-YYYY-NNNN} (e.g. GT-2026-0001), assigned
 * sequentially per calendar year by {@link com.lab.geotech.project.service.ProjectCodeService}.
 *
 * <p>Soft-delete: setting {@code is_deleted = true} cascades a soft-delete to all boreholes
 * and samples (via {@link com.lab.geotech.project.service.ProjectService#softDelete}).
 * The {@code @Where} clause automatically excludes deleted rows from all JPA queries,
 * but the native query in {@code ProjectRepository#findLastCodeByPrefix} intentionally bypasses
 * it so that soft-deleted project codes are never reused.
 *
 * <p>Client acceptance ({@code clientAccepted} / {@code clientAcceptedAt}) is a lightweight
 * sign-off mechanism: when a CLIENT-role user calls {@code PATCH /api/projects/{id}/accept},
 * the flag is set and the timestamp recorded.
 */
@Entity
@Table(name = "projects", schema = "projects")
@Where(clause = "is_deleted = false")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Human-readable unique code: GT-YYYY-NNNN. Immutable once created. */
    @Column(name = "project_code", nullable = false, unique = true, length = 20)
    private String projectCode;

    @Column(nullable = false, length = 300)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectStatus status;

    /** Logical reference to a Client entity in the same schema (no FK constraint). */
    @Column(name = "client_id")
    private UUID clientId;

    /** True once the client has explicitly accepted the project via the CLIENT portal. */
    @Column(name = "client_accepted", nullable = false)
    @Builder.Default
    private boolean clientAccepted = false;

    @Column(name = "client_accepted_at")
    private OffsetDateTime clientAcceptedAt;

    /** Logical reference to a Location entity (no FK constraint). */
    @Column(name = "location_id")
    private UUID locationId;

    /**
     * UUID of the user who created the project; treated as the project manager.
     * Used in {@code ProjectService#getMyProjects} and in workflow PM-role checks.
     */
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    /** Soft-delete flag. All JPA queries exclude rows where this is true. */
    @Column(name = "is_deleted", nullable = false)
    private boolean deleted;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
