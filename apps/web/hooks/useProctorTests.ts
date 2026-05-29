'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface ProctorPointInput {
  massMoldSoilG: number;
  waterContentPct: number;
}

export interface ProctorCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  method?: 'STANDARD' | 'MODIFIED';
  moldVolumeCm3: number;
  moldMassG: number;
  specificGravity?: number;
  notes?: string;
  points: ProctorPointInput[];
}

export interface ProctorPointResponse {
  id: string;
  pointNumber: number;
  massMoldSoilG: number;
  waterContentPct: number;
  wetUnitWeightKnM3: number | null;
  dryUnitWeightKnM3: number | null;
}

export interface ProctorTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  method: 'STANDARD' | 'MODIFIED';
  moldVolumeCm3: number;
  moldMassG: number;
  specificGravity: number;
  gdMaxKnM3?: number;
  omcPct?: number;
  rSquared?: number;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  points: ProctorPointResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useProctorTestsByProject(projectId: string) {
  return useQuery<ProctorTest[]>({
    queryKey: ['proctor-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: ProctorTest[] }>(`/api/tests/proctor?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useProctorTest(testId: string) {
  return useQuery<ProctorTest>({
    queryKey: ['proctor-tests', testId],
    queryFn: () => apiRequest(`/api/tests/proctor/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateProctorTest() {
  const qc = useQueryClient();
  return useMutation<ProctorTest, Error, ProctorCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/proctor', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proctor-tests'] }),
  });
}

export function useUpdateProctorTest() {
  const qc = useQueryClient();
  return useMutation<ProctorTest, Error, { testId: string; payload: ProctorCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/proctor/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proctor-tests'] }),
  });
}

export function useDeleteProctorTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/proctor/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proctor-tests'] }),
  });
}

export function useUpdateProctorTestStatus() {
  const qc = useQueryClient();
  return useMutation<ProctorTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/proctor/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proctor-tests'] }),
  });
}
