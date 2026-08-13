package com.lab.geotech.project.entity;

import com.lab.geotech.project.constant.TestType;
import com.lab.geotech.project.constant.WorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents one test type in a project's test catalogue.
 *
 * <p>A {@code ProjectTest} row is created for each test type requested for a project
 * (e.g. one row for WATER_CONTENT, one for PROCTOR, etc.). The combination
 * {@code (project_id, test_type)} is unique — a project cannot have duplicate test types
 * in its catalogue.
 *
 * <p>This entity owns the full three-tier workflow state machine
 * (see {@link WorkflowStatus} for allowed transitions):
 * <ol>
 *   <li>Lab manager assigns a technician and optional priority/deadline.</li>
 *   <li>Technician performs the test and submits → PENDING_MANAGER_REVIEW.</li>
 *   <li>Lab manager reviews and either approves (→ PENDING_PM_REVIEW) or rejects (→ REJECTED_TO_TECH).</li>
 *   <li>Project manager gives final approval (→ APPROVED) or rejects back to manager (→ REJECTED_TO_MANAGER).</li>
 * </ol>
 *
 * <p>{@code pmId} is stored for convenience but the authoritative PM check uses
 * {@code Project.createdBy} (see {@code TestWorkflowService#requireProjectManager}).
 */
@Entity
@Table(name = "project_tests", schema = "projects",
       uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "test_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Parent project. Logical UUID reference — no FK constraint across schemas. */
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "test_type", nullable = false, length = 50)
    private TestType testType;

    /** Lab manager responsible for reviewing this test. Set at catalogue creation time. */
    @Column(name = "lab_manager_id")
    private UUID labManagerId;

    /** Technician assigned to perform the test. Null until the lab manager assigns one. */
    @Column(name = "technician_id")
    private UUID technicianId;

    /** Informal priority label (e.g. "Normale", "Haute", "Urgente"). Not machine-enforced. */
    @Column(name = "priority", length = 20)
    private String priority;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "workflow_status", nullable = false, length = 30)
    @Builder.Default
    private WorkflowStatus workflowStatus = WorkflowStatus.ASSIGNED;

    /** Denormalised project-manager ID for quick lookup. Source of truth is {@code Project.createdBy}. */
    @Column(name = "pm_id")
    private UUID pmId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
