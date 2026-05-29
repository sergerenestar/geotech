'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface PermReadingInput {
  flowVolumeMl?: number;
  initialHeadCm?: number;
  finalHeadCm?: number;
  elapsedTimeS: number;
}

export interface PermCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  testType: 'CONSTANT_HEAD' | 'FALLING_HEAD';
  specimenDiameterMm: number;
  specimenLengthMm: number;
  waterTemperatureC?: number;
  standpipeAreaCm2?: number;
  headCm?: number;
  notes?: string;
  readings: PermReadingInput[];
}

export interface PermReadingResponse {
  id: string;
  readingNumber: number;
  flowVolumeMl?: number;
  initialHeadCm?: number;
  finalHeadCm?: number;
  elapsedTimeS: number;
  kCms?: number;
}

export interface PermTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  testType: 'CONSTANT_HEAD' | 'FALLING_HEAD';
  specimenDiameterMm: number;
  specimenLengthMm: number;
  waterTemperatureC: number;
  standpipeAreaCm2?: number;
  headCm?: number;
  kCms?: number;
  kAt20cCms?: number;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  readings: PermReadingResponse[];
  createdAt: string;
  updatedAt: string;
}

export function usePermTestsByProject(projectId: string) {
  return useQuery<PermTest[]>({
    queryKey: ['perm-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: PermTest[] }>(`/api/tests/permeability?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function usePermTest(testId: string) {
  return useQuery<PermTest>({
    queryKey: ['perm-tests', testId],
    queryFn: () => apiRequest(`/api/tests/permeability/${testId}`),
    enabled: !!testId,
  });
}

export function useCreatePermTest() {
  const qc = useQueryClient();
  return useMutation<PermTest, Error, PermCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/permeability', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perm-tests'] }),
  });
}

export function useUpdatePermTest() {
  const qc = useQueryClient();
  return useMutation<PermTest, Error, { testId: string; payload: PermCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/permeability/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perm-tests'] }),
  });
}

export function useDeletePermTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/permeability/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perm-tests'] }),
  });
}

export function useUpdatePermTestStatus() {
  const qc = useQueryClient();
  return useMutation<PermTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/permeability/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perm-tests'] }),
  });
}
