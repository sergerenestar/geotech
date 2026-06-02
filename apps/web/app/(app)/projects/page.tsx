'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useClients } from '@/hooks/useClients';
import ProjectCard from '@/components/projects/ProjectCard';
import Button from '@/components/ui/Button';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  clientId?: string;
  createdAt: string;
}

export default function ProjectsPage() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canDelete = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';
  const canSeeClients = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER' || user?.role === 'LAB_MANAGER';
  const { data: clients = [] } = useClients();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiRequest<{ data: { data: Project[] } }>(
        '/api/projects/mine',
        {},
      );
      return res.data.data;
    },
    enabled: !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setConfirmDeleteId(null);
    },
  });

  const filtered = (data ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(search.toLowerCase())
  );

  const projectToDelete = confirmDeleteId ? (data ?? []).find(p => p.id === confirmDeleteId) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Mes Projets</h1>
        <Button onClick={() => setShowModal(true)}>+ Nouveau projet</Button>
      </div>
      <input
        type="text"
        placeholder="Rechercher..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {isLoading ? (
        <p className="text-sm text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun projet trouvé.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard
              key={p.id}
              {...p}
              clientName={canSeeClients && p.clientId ? clients.find(c => c.id === p.clientId)?.name : undefined}
              onDelete={canDelete ? () => setConfirmDeleteId(p.id) : undefined}
            />
          ))}
        </div>
      )}
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
        />
      )}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Supprimer le projet</h2>
            <p className="text-sm text-gray-600 mb-1">
              Êtes-vous sûr de vouloir supprimer{' '}
              <span className="font-semibold">{projectToDelete?.name}</span> ?
            </p>
            <p className="text-xs text-gray-400 mb-5">
              Cette action supprimera aussi tous les forages et échantillons liés.
            </p>
            {deleteMutation.isError && (
              <p className="text-xs text-red-500 mb-3">{deleteMutation.error?.message}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setConfirmDeleteId(null); deleteMutation.reset(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
