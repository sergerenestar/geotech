'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface WcDeterminationInput {
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
}

export interface WcCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  temperatureC?: number;
  notes?: string;
  determinations: WcDeterminationInput[];
}

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

export interface WcTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  temperatureC?: number;
  notes?: string;
  averageWaterContentPct?: number;
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
