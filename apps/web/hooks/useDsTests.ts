'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface DsReadingInput {
  displacementDiv: number;
  provingRingDiv: number;
}

export interface DsStageInput {
  normalStressKpa: number;
  readings: DsReadingInput[];
}

export interface DsCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  boxWidthMm?: number;
  boxLengthMm?: number;
  specimenHeightMm?: number;
  dialFactorMmPerDiv?: number;
  calibrationFactorNPerDiv: number;
  notes?: string;
  stages: DsStageInput[];
}

export interface DsReadingResponse {
  id: string;
  readingNumber: number;
  displacementDiv: number;
  provingRingDiv: number;
  displacementMm?: number;
  shearForceN?: number;
  shearStressKpa?: number;
}

export interface DsStageResponse {
  id: string;
  stageNumber: number;
  normalStressKpa: number;
  peakShearStressKpa?: number;
  displacementAtPeakMm?: number;
  readings: DsReadingResponse[];
}

export interface DsTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  boxWidthMm: number;
  boxLengthMm: number;
  specimenHeightMm?: number;
  dialFactorMmPerDiv: number;
  calibrationFactorNPerDiv: number;
  cohesionKpa?: number;
  frictionAngleDeg?: number;
  rSquared?: number;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  stages: DsStageResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useDsTestsByProject(projectId: string) {
  return useQuery<DsTest[]>({
    queryKey: ['ds-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: DsTest[] }>(`/api/tests/direct-shear?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useDsTest(testId: string) {
  return useQuery<DsTest>({
    queryKey: ['ds-tests', testId],
    queryFn: () => apiRequest(`/api/tests/direct-shear/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateDsTest() {
  const qc = useQueryClient();
  return useMutation<DsTest, Error, DsCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/direct-shear', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ds-tests'] }),
  });
}

export function useUpdateDsTest() {
  const qc = useQueryClient();
  return useMutation<DsTest, Error, { testId: string; payload: DsCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/direct-shear/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ds-tests'] }),
  });
}

export function useDeleteDsTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/direct-shear/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ds-tests'] }),
  });
}

export function useUpdateDsTestStatus() {
  const qc = useQueryClient();
  return useMutation<DsTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/direct-shear/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ds-tests'] }),
  });
}
