'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

/**
 * React Query hooks for ASTM D-2216 water-content test results.
 * Communicates with the `test-wc-service` via the Nginx gateway at `/api/tests/water-content`.
 */

/** Raw determination inputs sent by the technician. */
export interface WcDeterminationInput {
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
}

/** Payload for creating or updating a water-content test. */
export interface WcCreatePayload {
  /** Logical sample UUID (optional — a test can be linked to a project without a specific sample). */
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  temperatureC?: number;
  notes?: string;
  determinations: WcDeterminationInput[];
}

/** Server-calculated determination result (masses and derived w%). */
export interface WcDeterminationResult {
  id: string;
  determinationNumber: number;
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
  massWaterG: number;
  massDrySoilG: number;
  waterContentPct: number;
}

/**
 * A complete water-content test result as returned by the test-wc-service.
 *
 * `status` follows the test-result status machine: PENDING_REVIEW → FLAGGED → APPROVED / REJECTED → LOCKED.
 * `aiFlag` is set by the rule-based anomaly service; LAB_MANAGER has final authority regardless of the flag.
 */
export interface WcTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  temperatureC?: number;
  notes?: string;
  /** Average of all determination water contents (%), computed server-side. */
  averageWaterContentPct?: number;
  /** AI anomaly flag. NONE = no anomaly; WARNING / ERROR = flagged by rule engine. */
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  determinations: WcDeterminationResult[];
  createdAt: string;
  updatedAt: string;
}

export function useWcTestsByProject(projectId: string) {
  return useQuery<WcTest[]>({
    queryKey: ['wc-tests', 'project', projectId],
    queryFn: () => apiRequest<{ content: WcTest[] }>(`/api/tests/water-content?projectId=${projectId}&size=100`)
      .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useWcTest(testId: string) {
  return useQuery<WcTest>({
    queryKey: ['wc-tests', testId],
    queryFn: () => apiRequest(`/api/tests/water-content/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateWcTest() {
  const qc = useQueryClient();
  return useMutation<WcTest, Error, WcCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/water-content', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wc-tests'] }),
  });
}

export function useUpdateWcTestStatus() {
  const qc = useQueryClient();
  return useMutation<WcTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/water-content/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wc-tests'] }),
  });
}

export function useUpdateWcTest() {
  const qc = useQueryClient();
  return useMutation<WcTest, Error, { testId: string; payload: WcCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/water-content/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wc-tests'] }),
  });
}

export function useDeleteWcTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/water-content/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wc-tests'] }),
  });
}
