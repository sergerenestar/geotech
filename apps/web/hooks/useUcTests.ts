'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface UcReadingInput {
  deformationDiv: number;
  provingRingDiv: number;
}

export interface UcCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  initialHeightMm: number;
  initialDiameterMm: number;
  dialGaugeFactorMmPerDiv?: number;
  calibrationFactorNPerDiv: number;
  failureMode?: string;
  notes?: string;
  readings: UcReadingInput[];
}

export interface UcReadingResponse {
  id: string;
  readingNumber: number;
  deformationDiv: number;
  provingRingDiv: number;
  deformationMm?: number;
  loadN?: number;
  strainPct?: number;
  correctedAreaCm2?: number;
  stressKpa?: number;
}

export interface UcTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  initialHeightMm: number;
  initialDiameterMm: number;
  dialGaugeFactorMmPerDiv: number;
  calibrationFactorNPerDiv: number;
  quKpa?: number;
  suKpa?: number;
  failureStrainPct?: number;
  failureMode?: string;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  readings: UcReadingResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useUcTestsByProject(projectId: string) {
  return useQuery<UcTest[]>({
    queryKey: ['uc-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: UcTest[] }>(`/api/tests/unconfined-compression?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function useUcTest(testId: string) {
  return useQuery<UcTest>({
    queryKey: ['uc-tests', testId],
    queryFn: () => apiRequest(`/api/tests/unconfined-compression/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateUcTest() {
  const qc = useQueryClient();
  return useMutation<UcTest, Error, UcCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/unconfined-compression', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uc-tests'] }),
  });
}

export function useUpdateUcTest() {
  const qc = useQueryClient();
  return useMutation<UcTest, Error, { testId: string; payload: UcCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/unconfined-compression/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uc-tests'] }),
  });
}

export function useDeleteUcTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/unconfined-compression/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uc-tests'] }),
  });
}

export function useUpdateUcTestStatus() {
  const qc = useQueryClient();
  return useMutation<UcTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/unconfined-compression/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uc-tests'] }),
  });
}
