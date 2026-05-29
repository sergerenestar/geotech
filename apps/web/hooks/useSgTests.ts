'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface SgDeterminationInput {
  flaskNumber?: string;
  massDrySoilG: number;
  massFlaskWaterG: number;
  massFlaskSoilWaterG: number;
  temperatureC: number;
}

export interface SgCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  notes?: string;
  determinations: SgDeterminationInput[];
}

export interface SgDeterminationResponse {
  id: string;
  determinationNumber: number;
  flaskNumber?: string;
  massDrySoilG: number;
  massFlaskWaterG: number;
  massFlaskSoilWaterG: number;
  temperatureC: number;
  gsAtTemp?: number;
  kFactor?: number;
  gs20?: number;
}

export interface SgTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  gsAverage?: number;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  determinations: SgDeterminationResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useSgTestsByProject(projectId: string) {
  return useQuery<SgTest[]>({
    queryKey: ['sg-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: SgTest[] }>(`/api/tests/specific-gravity?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useSgTest(testId: string) {
  return useQuery<SgTest>({
    queryKey: ['sg-tests', testId],
    queryFn: () => apiRequest(`/api/tests/specific-gravity/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateSgTest() {
  const qc = useQueryClient();
  return useMutation<SgTest, Error, SgCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/specific-gravity', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sg-tests'] }),
  });
}

export function useUpdateSgTest() {
  const qc = useQueryClient();
  return useMutation<SgTest, Error, { testId: string; payload: SgCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/specific-gravity/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sg-tests'] }),
  });
}

export function useDeleteSgTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/specific-gravity/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sg-tests'] }),
  });
}

export function useUpdateSgTestStatus() {
  const qc = useQueryClient();
  return useMutation<SgTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/specific-gravity/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sg-tests'] }),
  });
}
