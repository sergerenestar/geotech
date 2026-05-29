'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface CasagrandePointInput {
  blowCount: number;
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
}

export interface PlDeterminationInput {
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
}

export interface LlCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  method?: 'MULTI_POINT' | 'ONE_POINT';
  notes?: string;
  casagrandePoints: CasagrandePointInput[];
  plDeterminations: PlDeterminationInput[];
}

export interface CasagrandePointResult {
  id: string;
  pointNumber: number;
  blowCount: number;
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
  waterContentPct: number;
}

export interface PlDeterminationResult {
  id: string;
  determinationNumber: number;
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
  waterContentPct: number;
}

export interface LlTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  method: string;
  llPct?: number;
  plPct?: number;
  piPct?: number;
  rSquared?: number;
  liquidityIndex?: number;
  activity?: number;
  uscsSymbol?: string;
  uscsName?: string;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  casagrandePoints: CasagrandePointResult[];
  plDeterminations: PlDeterminationResult[];
  createdAt: string;
  updatedAt: string;
}

export function useLlTestsByProject(projectId: string) {
  return useQuery<LlTest[]>({
    queryKey: ['ll-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: LlTest[] }>(`/api/tests/liquid-limit?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useLlTest(testId: string) {
  return useQuery<LlTest>({
    queryKey: ['ll-tests', testId],
    queryFn: () => apiRequest(`/api/tests/liquid-limit/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateLlTest() {
  const qc = useQueryClient();
  return useMutation<LlTest, Error, LlCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/liquid-limit', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ll-tests'] }),
  });
}

export function useUpdateLlTestStatus() {
  const qc = useQueryClient();
  return useMutation<LlTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/liquid-limit/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ll-tests'] }),
  });
}

export function useUpdateLlTest() {
  const qc = useQueryClient();
  return useMutation<LlTest, Error, { testId: string; payload: LlCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/liquid-limit/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ll-tests'] }),
  });
}

export function useDeleteLlTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/liquid-limit/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ll-tests'] }),
  });
}
