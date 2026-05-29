'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface Sample {
  id: string;
  boreholeId: string;
  sampleCode: string;
  depthFromM: number;
  depthToM: number;
  soilDescription: string;
  uscsSymbol: string;
  aashtoClass: string;
}

export function useSamples(boreholeId: string) {
  return useQuery({
    queryKey: ['samples', boreholeId],
    queryFn: () =>
      apiRequest<{ data: Sample[] }>(`/api/boreholes/${boreholeId}/samples`).then(r => r.data),
    enabled: !!boreholeId,
  });
}
