'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

interface CreateProjectDto {
  name: string;
  description?: string;
  clientId?: string;
  locationId?: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () =>
      apiRequest<{ data: { data: Project[] } }>('/api/projects/mine').then(r => r.data.data),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateProjectDto) =>
      apiRequest<{ data: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
