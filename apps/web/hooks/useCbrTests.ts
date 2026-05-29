'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface SwellingInput {
  hours: number;
  readingMm?: number;
  swellingPct?: number;
}

export interface PenetrationInput {
  penetrationMm: number;
  ringReading?: number;
  loadKn?: number;
}

export interface CbrIntensityInput {
  blows: number;
  massMoldG?: number;
  massWetG?: number;
  massDryG?: number;
  waterContentPct?: number;
  dryDensityTm3?: number;
  compactionDegreePct?: number;
  cbr25mm?: number;
  cbr50mm?: number;
  swellingReadings?: SwellingInput[];
  penetrationReadings?: PenetrationInput[];
}

export interface CbrCreatePayload {
  projectId: string;
  boreholeId?: string;
  sampleId?: string;
  reference?: string;
  specificGravity: number;
  proctorGdmaxTm3?: number;
  proctorOmcPct?: number;
  ringCoefficient?: number;
  notes?: string;
  intensities?: CbrIntensityInput[];
}

export interface SwellingResponse {
  id: string;
  hours: number;
  readingMm: number | null;
  swellingPct: number | null;
}

export interface PenetrationResponse {
  id: string;
  penetrationMm: number;
  ringReading: number | null;
  loadKn: number | null;
}

export interface CbrIntensityResponse {
  id: string;
  blows: number;
  massMoldG: number | null;
  massWetG: number | null;
  massDryG: number | null;
  waterContentPct: number | null;
  dryDensityTm3: number | null;
  compactionDegreePct: number | null;
  cbr25mm: number | null;
  cbr50mm: number | null;
  cbrIndex: number | null;
  swellingReadings: SwellingResponse[];
  penetrationReadings: PenetrationResponse[];
}

export interface CbrTest {
  id: string;
  projectId: string;
  boreholeId?: string;
  sampleId?: string;
  technicianId: string;
  reference?: string;
  status: string;
  specificGravity: number;
  proctorGdmaxTm3?: number;
  proctorOmcPct?: number;
  ringCoefficient: number;
  notes?: string;
  intensities: CbrIntensityResponse[];
  createdAt: string;
  updatedAt: string;
}

export function useCbrTestsByProject(projectId: string) {
  return useQuery<CbrTest[]>({
    queryKey: ['cbr-tests', 'project', projectId],
    queryFn: () => apiRequest<CbrTest[]>(`/api/tests/cbr?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCbrTest(testId: string) {
  return useQuery<CbrTest>({
    queryKey: ['cbr-tests', testId],
    queryFn: () => apiRequest(`/api/tests/cbr/${testId}`),
    enabled: !!testId,
  });
}

export function useCreateCbrTest() {
  const qc = useQueryClient();
  return useMutation<CbrTest, Error, CbrCreatePayload>({
    mutationFn: (payload) =>
      apiRequest('/api/tests/cbr', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cbr-tests'] }),
  });
}

export function useUpdateCbrTest() {
  const qc = useQueryClient();
  return useMutation<CbrTest, Error, { testId: string; payload: CbrCreatePayload }>({
    mutationFn: ({ testId, payload }) =>
      apiRequest(`/api/tests/cbr/${testId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cbr-tests'] }),
  });
}

export function useDeleteCbrTest() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (testId) =>
      apiRequest(`/api/tests/cbr/${testId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cbr-tests'] }),
  });
}

export function useUpdateCbrTestStatus() {
  const qc = useQueryClient();
  return useMutation<CbrTest, Error, { testId: string; status: string }>({
    mutationFn: ({ testId, status }) =>
      apiRequest(`/api/tests/cbr/${testId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cbr-tests'] }),
  });
}
