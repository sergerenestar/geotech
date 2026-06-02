'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
  role: string;
  status: string;
  language: string;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  userId: string;
  authorId: string;
  authorHandle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const ROLES = ['ADMIN', 'LAB_MANAGER', 'PROJECT_MANAGER', 'USER'] as const;
export type RoleFilter = typeof ROLES[number] | 'ALL' | 'PENDING';

export function useAdminUsers(filter: RoleFilter = 'ALL') {
  const role = ROLES.includes(filter as any) ? filter : undefined;
  const status = filter === 'PENDING' ? 'PENDING' : undefined;
  const params = new URLSearchParams({ size: '100' });
  if (role) params.set('role', role as string);
  if (status) params.set('status', status);

  return useQuery<AdminUser[]>({
    queryKey: ['admin-users', filter],
    queryFn: () =>
      apiRequest<{ data: { data: AdminUser[] } }>(`/api/auth/users?${params}`)
        .then(r => r.data.data),
  });
}

export function useLabManagers() {
  return useQuery<AdminUser[]>({
    queryKey: ['lab-managers'],
    queryFn: () =>
      apiRequest<{ data: { data: AdminUser[] } }>('/api/auth/users/lab-managers')
        .then(r => r.data.data),
  });
}

export function useTechnicians() {
  return useQuery<AdminUser[]>({
    queryKey: ['technicians'],
    queryFn: () =>
      apiRequest<{ data: { data: AdminUser[] } }>('/api/auth/users/technicians')
        .then(r => r.data.data),
  });
}

export function useAdminUser(id: string) {
  return useQuery<AdminUser>({
    queryKey: ['admin-user', id],
    queryFn: () =>
      apiRequest<{ data: AdminUser }>(`/api/auth/users/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useUserNotes(userId: string) {
  return useQuery<AdminNote[]>({
    queryKey: ['user-notes', userId],
    queryFn: () =>
      apiRequest<{ data: AdminNote[] }>(`/api/auth/users/${userId}/notes`).then(r => r.data),
    enabled: !!userId,
  });
}

export function useUserMutations(userId?: string) {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    if (userId) qc.invalidateQueries({ queryKey: ['admin-user', userId] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/auth/users/${id}/approve`, { method: 'PATCH' }),
    onSuccess: invalidate,
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/auth/users/${id}/deactivate`, { method: 'PATCH' }),
    onSuccess: invalidate,
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/auth/users/${id}/reactivate`, { method: 'PATCH' }),
    onSuccess: invalidate,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiRequest(`/api/auth/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: invalidate,
  });

  const createUser = useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; password: string; role: string }) =>
      apiRequest('/api/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const updateProfile = useMutation({
    mutationFn: ({ id, ...data }: { id: string; firstName: string; lastName: string; email: string; contactNumber?: string }) =>
      apiRequest(`/api/auth/users/${id}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: invalidate,
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/auth/users/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { approve, deactivate, reactivate, updateRole, createUser, updateProfile, deleteUser };
}

export function useNoteMutations(userId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['user-notes', userId] });

  const add = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/api/auth/users/${userId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      apiRequest(`/api/auth/users/${userId}/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (noteId: string) =>
      apiRequest(`/api/auth/users/${userId}/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}
