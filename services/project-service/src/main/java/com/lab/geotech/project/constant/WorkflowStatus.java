package com.lab.geotech.project.constant;

/**
 * Lifecycle states for a single test assignment in the three-tier review workflow.
 *
 * Allowed transitions (enforced by {@code TestWorkflowService}):
 * <pre>
 *   ASSIGNED / IN_PROGRESS / REJECTED_TO_TECH
 *       ↓  (technician submits)
 *   PENDING_MANAGER_REVIEW  ←── REJECTED_TO_MANAGER  (PM rejects back to LM)
 *       ↓  (lab manager approves)              ↑
 *   PENDING_PM_REVIEW  ────────────────────────┘
 *       ↓  (project manager approves)
 *   APPROVED
 * </pre>
 *
 * Rejection always sends the test back to the prior actor:
 * - Lab manager reject → REJECTED_TO_TECH (back to technician)
 * - PM reject         → REJECTED_TO_MANAGER (back to lab manager)
 */
public enum WorkflowStatus {
    /** Test has been assigned to a technician but work has not started. */
    ASSIGNED,
    /** Technician has started data entry (set client-side; future use). */
    IN_PROGRESS,
    /** Technician submitted; awaiting lab manager review. */
    PENDING_MANAGER_REVIEW,
    /** Lab manager approved; awaiting project manager sign-off. */
    PENDING_PM_REVIEW,
    /** Project manager approved — final approval state. */
    APPROVED,
    /** Lab manager rejected; returned to the technician for correction. */
    REJECTED_TO_TECH,
    /** Project manager rejected; returned to the lab manager for review. */
    REJECTED_TO_MANAGER
}
