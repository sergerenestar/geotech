'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

/**
 * React Query hooks for the three-tier test review workflow.
 *
 * The hooks in this file map directly to the `TestWorkflowController` endpoints:
 *   GET  /api/tests/active       → useActiveWorkflowTests
 *   GET  /api/tests/completed    → useCompletedWorkflowTests
 *   GET  /api/tests/:id/comments → useTestComments
 *   POST /api/tests/:id/submit             → useSubmitTest
 *   POST /api/tests/:id/manager-approve   → useManagerApprove
 *   POST /api/tests/:id/manager-reject    → useManagerReject
 *   POST /api/tests/:id/pm-approve        → usePmApprove
 *   POST /api/tests/:id/pm-reject         → usePmReject
 */

/** A single comment/action event in the test review thread. */
export interface WorkflowComment {
  id: string;
  projectTestId: string;
  userId: string;
  role: string;
  /** Machine-readable action label: SUBMITTED | MANAGER_APPROVED | MANAGER_REJECTED | PM_APPROVED | PM_REJECTED. */
  action: string;
  /** Free-text note from the actor, or null if none was entered. */
  comment: string | null;
  createdAt: string;
}

/** An immutable status-change audit record. */
export interface WorkflowHistoryEntry {
  id: string;
  projectTestId: string;
  /** Previous workflow status, or null for the initial transition. */
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  role: string;
  changedAt: string;
}

/**
 * A test assignment with its current workflow state.
 * Comments and history are empty arrays on list responses (populated only on detail/action responses).
 */
export interface WorkflowTest {
  id: string;
  projectId: string;
  /** Enum name, e.g. "WATER_CONTENT". */
  testType: string;
  labManagerId: string | null;
  technicianId: string | null;
  pmId: string | null;
  priority: string | null;
  deadline: string | null;
  /** Current WorkflowStatus enum name. */
  workflowStatus: string;
  comments: WorkflowComment[];
  history: WorkflowHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the tests currently awaiting action from the authenticated user.
 * The server filters by role automatically — technicians, lab managers, and PMs
 * each receive their own relevant subset.
 */
export function useActiveWorkflowTests() {
  return useQuery<WorkflowTest[]>({
    queryKey: ['workflow-tests', 'active'],
    queryFn: () =>
      apiRequest<{ data: WorkflowTest[] }>('/api/tests/active').then(r => r.data),
  });
}

/**
 * Returns tests where the authenticated user's action is complete.
 * Used to populate the "completed" tab in the workflow dashboard.
 */
export function useCompletedWorkflowTests() {
  return useQuery<WorkflowTest[]>({
    queryKey: ['workflow-tests', 'completed'],
    queryFn: () =>
      apiRequest<{ data: WorkflowTest[] }>('/api/tests/completed').then(r => r.data),
  });
}

/** Returns the full comment/action thread for a test in chronological order. */
export function useTestComments(testId: string) {
  return useQuery<WorkflowComment[]>({
    queryKey: ['workflow-comments', testId],
    queryFn: () =>
      apiRequest<{ data: WorkflowComment[] }>(`/api/tests/${testId}/comments`).then(r => r.data),
    enabled: !!testId,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Factory for workflow action mutations.
 *
 * All workflow actions share the same shape: POST to a test-specific endpoint with
 * an optional free-text `notes` field. On success, all workflow query caches are
 * invalidated so the UI reflects the new state immediately.
 *
 * @param endpoint - Function that maps a testId to the action URL.
 */
function useWorkflowMutation(endpoint: (id: string) => string) {
  const qc = useQueryClient();
  return useMutation<WorkflowTest, Error, { testId: string; notes?: string }>({
    mutationFn: ({ testId, notes }) =>
      apiRequest<{ data: WorkflowTest }>(endpoint(testId), {
        method: 'POST',
        body: JSON.stringify({ notes: notes ?? null }),
      }).then(r => r.data),
    onSuccess: (_, { testId }) => {
      qc.invalidateQueries({ queryKey: ['workflow-tests'] });
      qc.invalidateQueries({ queryKey: ['workflow-comments', testId] });
      qc.invalidateQueries({ queryKey: ['project-workflow-tests'] });
    },
  });
}

export function useSubmitTest() {
  return useWorkflowMutation(id => `/api/tests/${id}/submit`);
}

export function useManagerApprove() {
  return useWorkflowMutation(id => `/api/tests/${id}/manager-approve`);
}

export function useManagerReject() {
  return useWorkflowMutation(id => `/api/tests/${id}/manager-reject`);
}

export function usePmApprove() {
  return useWorkflowMutation(id => `/api/tests/${id}/pm-approve`);
}

export function usePmReject() {
  return useWorkflowMutation(id => `/api/tests/${id}/pm-reject`);
}
