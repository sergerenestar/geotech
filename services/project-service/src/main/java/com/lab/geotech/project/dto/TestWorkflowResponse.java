package com.lab.geotech.project.dto;

import com.lab.geotech.project.entity.ProjectTest;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Full workflow view of a {@link com.lab.geotech.project.entity.ProjectTest}, including
 * the audit comment thread and status-change history.
 *
 * <p>Two factory methods are provided:
 * <ul>
 *   <li>{@link #from} — includes comments and history; used after a workflow action.</li>
 *   <li>{@link #fromNoThread} — omits both lists (empty); used in list queries where
 *       fetching N comment threads would be expensive.</li>
 * </ul>
 */
public record TestWorkflowResponse(
        UUID id,
        UUID projectId,
        String testType,
        UUID labManagerId,
        UUID technicianId,
        UUID pmId,
        String priority,
        LocalDate deadline,
        String workflowStatus,
        /** Chronological list of comments/actions on this test. Empty for list views. */
        List<TestCommentResponse> comments,
        /** Chronological status-change audit trail. Empty for list views. */
        List<TestStatusHistoryResponse> history,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    /** Full response including comment thread — used after single-resource workflow actions. */
    public static TestWorkflowResponse from(
            ProjectTest e,
            List<TestCommentResponse> comments,
            List<TestStatusHistoryResponse> history) {
        return new TestWorkflowResponse(
                e.getId(), e.getProjectId(), e.getTestType().name(),
                e.getLabManagerId(), e.getTechnicianId(), e.getPmId(),
                e.getPriority(), e.getDeadline(),
                e.getWorkflowStatus() != null ? e.getWorkflowStatus().name() : null,
                comments, history,
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    /** Lightweight list-view response without comment/history threads. */
    public static TestWorkflowResponse fromNoThread(ProjectTest e) {
        return from(e, List.of(), List.of());
    }
}
