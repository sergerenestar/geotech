'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface SieveResultInput {
  sieveLabel: string;
  openingMm: number;
  massRetainedG: number;
}

export interface HydrometerReadingInput {
  readingNumber: number;
  elapsedTimeMin: number;
  hydrometerReading: number;
  temperatureC: number;
}

export interface PsCreatePayload {
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  testType?: 'SIEVE' | 'HYDROMETER' | 'COMBINED';
  totalDryMassG: number;
  specificGravity?: number;
  notes?: string;
  sieveResults: SieveResultInput[];
  hydrometerReadings?: HydrometerReadingInput[];
}

export interface SieveResultResponse {
  id: string;
  sieveLabel: string;
  openingMm: number;
  massRetainedG: number;
  pctRetained: number;
  pctFiner: number;
}

export interface HydrometerReadingResponse {
  id: string;
  readingNumber: number;
  elapsedTimeMin: number;
  hydrometerReading: number;
  temperatureC: number;
  correctedReading?: number;
  particleDiameterMm?: number;
  pctFiner?: number;
}

export interface PsTest {
  id: string;
  sampleId?: string;
  projectId?: string;
  boreholeId?: string;
  technicianId: string;
  status: string;
  testType: string;
  totalDryMassG: number;
  specificGravity: number;
  pctGravel?: number;
  pctSand?: number;
  pctFines?: number;
  pctClay?: number;
  d10Mm?: number;
  d30Mm?: number;
  d60Mm?: number;
  cu?: number;
  cc?: number;
  uscsSymbol?: string;
  uscsName?: string;
  notes?: string;
  aiFlag: 'NONE' | 'WARNING' | 'ERROR';
  aiFlagMessage?: string;
  sieveResults: SieveResultResponse[];
  hydrometerReadings: HydrometerReadingResponse[];
  createdAt: string;
  updatedAt: string;
}

export function usePsTestsByProject(projectId: string) {
  return useQuery<PsTest[]>({
    queryKey: ['ps-tests', 'project', projectId],
    queryFn: () =>
      apiRequest<{ content: PsTest[] }>(`/api/tests/particle-size?projectId=${projectId}&size=100`)
        .then(r => r.content ?? []),
    enabled: !!projectId,
  });
}

export function usePsTest(testId: string) {
  return useQuery<PsTest>({
    queryKey: ['ps-tests', testId],
    queryFn: () => apiRequest(`/api/tests/particle-size/${testId}`),
    enabled: !!testId,
  });
}

export function useCreatePsTest() {
  const qc = useQueryClient();
  return useMutation<PsTest, Error, PsCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/particle-size', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ps-tests'] }),
  });
}

export function useUpdatePsTestStatus() {
  const qc = useQueryClient();
  return useMutation<PsTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/particle-size/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ps-tests'] }),
  });
}

export function useUpdatePsTest() {
  const qc = useQueryClient();
  return useMutation<PsTest, Error, { testId: string; payload: PsCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/particle-size/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ps-tests'] }),
  });
}

export function useDeletePsTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/particle-size/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ps-tests'] }),
  });
}
