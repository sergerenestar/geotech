'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  type: 'PERSON' | 'BUSINESS';
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  projectCount: number;
  createdAt: string;
}

export interface ClientNote {
  id: string;
  projectId: string;
  clientId: string;
  author: string;
  content: string;
  createdAt: string;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => apiRequest<{ data: Client[] }>('/api/clients').then(r => r.data),
  });
}

export function useClient(clientId: string) {
  return useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: () => apiRequest<{ data: Client }>(`/api/clients/${clientId}`).then(r => r.data),
    enabled: !!clientId,
  });
}

export function useClientProjects(clientId: string) {
  return useQuery({
    queryKey: ['client-projects', clientId],
    queryFn: () =>
      apiRequest<{ data: { data: any[] } }>(`/api/clients/${clientId}/projects`).then(r => r.data.data),
    enabled: !!clientId,
  });
}

export function useClientNotes(clientId: string, projectId: string) {
  return useQuery<ClientNote[]>({
    queryKey: ['client-notes', projectId],
    queryFn: () =>
      apiRequest<{ data: ClientNote[] }>(`/api/clients/${clientId}/projects/${projectId}/notes`).then(r => r.data),
    enabled: !!clientId && !!projectId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Omit<Client, 'id' | 'projectCount' | 'createdAt'>) =>
      apiRequest<{ data: Client }>('/api/clients', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useAddClientNote(clientId: string, projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { content: string; author: string }) =>
      apiRequest<{ data: ClientNote }>(`/api/clients/${clientId}/projects/${projectId}/notes`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-notes', projectId] }),
  });
}

export function useCreateClientPortalUser() {
  return useMutation({
    mutationFn: (dto: { firstName: string; lastName: string; email: string; password: string; clientId: string }) =>
      apiRequest('/api/auth/users/client', { method: 'POST', body: JSON.stringify(dto) }),
  });
}
