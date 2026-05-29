'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface ConsolReadingInput {
  timeMin: number;
  dialReadingMm: number;
}

export interface ConsolStageInput {
  loadType: 'LOADING' | 'UNLOADING' | 'RELOADING';
  sigmaVKpa: number;
  readings: ConsolReadingInput[];
}

export interface ConsolCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  specimenDiameterMm: number;
  initialHeightMm: number;
  initialVoidRatio: number;
  specificGravity?: number;
  drainageType?: 'SINGLE' | 'DOUBLE';
  notes?: string;
  stages: ConsolStageInput[];
}

export interface ConsolReadingResponse {
  id: string;
  readingNumber: number;
  timeMin: number;
  dialReadingMm: number;
  settlementMm?: number;
}

export interface ConsolStageResponse {
  id: string;
  stageNumber: number;
  loadType: 'LOADING' | 'UNLOADING' | 'RELOADING';
  sigmaVKpa: number;
  eFinal?: number;
  cvM2Yr?: number;
  mvM2Kn?: number;
  t50Min?: number;
  t90Min?: number;
  readings: ConsolReadingResponse[];
}

export interface ConsolTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  specimenDiameterMm: number;
  initialHeightMm: number;
  initialVoidRatio: number;
  specificGravity: number;
  drainageType: 'SINGLE' | 'DOUBLE';
  cc?: number;
  cs?: number;
  sigmaPKpa?: number;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  stages: ConsolStageResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useConsolTestsByProject(projectId: string) {
  return useQuery<ConsolTest[]>({
    queryKey: ['consol-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: ConsolTest[] }>(`/api/tests/consolidation?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useConsolTest(testId: string) {
  return useQuery<ConsolTest>({
    queryKey: ['consol-tests', testId],
    queryFn: () => apiRequest(`/api/tests/consolidation/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateConsolTest() {
  const qc = useQueryClient();
  return useMutation<ConsolTest, Error, ConsolCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/consolidation', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consol-tests'] }),
  });
}

export function useUpdateConsolTest() {
  const qc = useQueryClient();
  return useMutation<ConsolTest, Error, { testId: string; payload: ConsolCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/consolidation/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consol-tests'] }),
  });
}

export function useDeleteConsolTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/consolidation/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consol-tests'] }),
  });
}

export function useUpdateConsolTestStatus() {
  const qc = useQueryClient();
  return useMutation<ConsolTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/consolidation/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consol-tests'] }),
  });
}
