package com.lab.geotech.project.exception;

import com.lab.geotech.project.constant.WorkflowStatus;

/**
 * Thrown when a workflow action is attempted from a status that does not allow that transition.
 * For example, trying to call {@code managerApprove} when the test is already {@code APPROVED}.
 * Mapped to HTTP 400 by {@link GlobalExceptionHandler}.
 */
public class InvalidWorkflowTransitionException extends RuntimeException {
    public InvalidWorkflowTransitionException(WorkflowStatus current, WorkflowStatus attempted) {
        super("Invalid workflow transition: current status is " + current + ", cannot transition to " + attempted);
    }
}
