'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface Borehole {
  id: string;
  projectId: string;
  bhCode: string;
  depthM: number;
  latitude: number;
  longitude: number;
  notes: string;
}

export function useBoreholes(projectId: string) {
  return useQuery({
    queryKey: ['boreholes', projectId],
    queryFn: () =>
      apiRequest<{ data: Borehole[] }>(`/api/projects/${projectId}/boreholes`).then(r => r.data),
    enabled: !!projectId,
  });
}
