'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useClient, useClientNotes, useAddClientNote } from '@/hooks/useClients';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  status: string;
  clientId: string;
  clientAccepted: boolean;
  clientAcceptedAt?: string;
  createdAt: string;
}

interface WorkflowTest {
  id: string;
  testType: string;
  technicianId?: string;
  labManagerId?: string;
}

const TEST_META: Record<string, { name: string; norm: string; icon: string; bg: string; ic: string }> = {
  WATER_CONTENT:          { name: 'Teneur en eau',   norm: 'D-2216',       icon: 'ti-droplet',         bg: '#e0f2f9', ic: '#0e7490' },
  LIQUID_LIMIT:           { name: 'Atterberg',        norm: 'D-4318',       icon: 'ti-chart-line',      bg: '#e0f2f9', ic: '#0e7490' },
  PARTICLE_SIZE:          { name: 'Granulométrie',    norm: 'NF/D-422',     icon: 'ti-filter',          bg: '#e0f2f9', ic: '#0e7490' },
  PROCTOR:                { name: 'Proctor',          norm: 'D-698/D-1557', icon: 'ti-wave-square',     bg: '#fef3c7', ic: '#d97706' },
  SPECIFIC_GRAVITY:       { name: 'Densité relative', norm: 'D-854',        icon: 'ti-cube',            bg: '#fef3c7', ic: '#d97706' },
  UNCONFINED_COMPRESSION: { name: 'Compression UC',   norm: 'D-2166',       icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d' },
  DIRECT_SHEAR:           { name: 'Cisaillement',     norm: 'D-3080',       icon: 'ti-cut',             bg: '#fce7f3', ic: '#9d174d' },
  CBR:                    { name: 'CBR',              norm: 'NF P94-078',   icon: 'ti-weight',          bg: '#fce7f3', ic: '#9d174d' },
  PERMEABILITY:           { name: 'Perméabilité',     norm: 'D-2434',       icon: 'ti-waves',           bg: '#fce7f3', ic: '#9d174d' },
  CONSOLIDATION:          { name: 'Consolidation',    norm: 'D-2435',       icon: 'ti-layers',          bg: '#fce7f3', ic: '#9d174d' },
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:          { label: 'Brouillon',       bg: '#f1f5f9', color: '#64748b' },
  ACTIVE:         { label: 'Actif',           bg: '#d1fae5', color: '#065f46' },
  ON_HOLD:        { label: 'En attente',      bg: '#fef3c7', color: '#92400e' },
  PENDING_REVIEW: { label: 'En révision',     bg: '#fef3c7', color: '#92400e' },
  COMPLETED:      { label: 'Terminé',         bg: '#d1fae5', color: '#065f46' },
  ARCHIVED:       { label: 'Archivé',         bg: '#f1f5f9', color: '#64748b' },
  CANCELLED:      { label: 'Annulé',          bg: '#fee2e2', color: '#991b1b' },
};

export default function ClientProjectView({ projectId }: { projectId: string }) {
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [noteContent, setNoteContent] = useState('');
  const [confirmAccept, setConfirmAccept] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled: !!accessToken && !!projectId,
  });

  const { data: workflowTests = [] } = useQuery<WorkflowTest[]>({
    queryKey: ['project-workflow-tests', projectId],
    queryFn: () =>
      apiRequest<{ data: WorkflowTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => r.data)
        .catch(() => []),
    enabled: !!accessToken && !!projectId,
  });

  const clientId = project?.clientId ?? user?.clientId ?? '';
  const { data: client } = useClient(clientId);
  const { data: notes = [] } = useClientNotes(clientId, projectId);
  const addNote = useAddClientNote(clientId, projectId);

  const acceptMutation = useMutation({
    mutationFn: () => apiRequest(`/api/projects/${projectId}/accept`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setConfirmAccept(false);
    },
  });

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await addNote.mutateAsync({ content: noteContent, author: `${user?.firstName} ${user?.lastName}` });
    setNoteContent('');
  }

  if (isLoading) return <p style={{ fontSize: 12, color: '#94a3b8', padding: 24 }}>Chargement...</p>;
  if (!project) return <p style={{ fontSize: 12, color: '#ef4444', padding: 24 }}>Projet introuvable.</p>;

  const statusInfo = STATUS_LABELS[project.status] ?? { label: project.status, bg: '#f1f5f9', color: '#64748b' };
  const canAccept = project.status === 'COMPLETED' && !project.clientAccepted;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8', marginBottom: 4 }}>{project.projectCode}</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1c2333', margin: '0 0 6px' }}>{project.name}</h1>
            {client && <div style={{ fontSize: 13, color: '#64748b' }}>{client.name}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: statusInfo.bg, color: statusInfo.color, fontWeight: 500 }}>
              {statusInfo.label}
            </span>
            <Link href={`/projects/${projectId}/synthesis`}>
              <button style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                Fiche de synthèse
              </button>
            </Link>
          </div>
        </div>

        {project.description && (
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 12, marginBottom: 0 }}>{project.description}</p>
        )}

        {/* Accept banner / button */}
        {project.clientAccepted && (
          <div style={{ marginTop: 14, background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>Projet accepté</div>
              {project.clientAcceptedAt && (
                <div style={{ fontSize: 11, color: '#059669' }}>
                  Le {new Date(project.clientAcceptedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        )}

        {canAccept && !confirmAccept && (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => setConfirmAccept(true)}
              style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Marquer comme accepté
            </button>
          </div>
        )}

        {confirmAccept && (
          <div style={{ marginTop: 14, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16 }}>
            <p style={{ fontSize: 13, color: '#0c4a6e', margin: '0 0 12px' }}>
              En acceptant ce projet, vous confirmez avoir pris connaissance des résultats. Cette action est définitive.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                {acceptMutation.isPending ? 'Confirmation...' : 'Confirmer l\'acceptation'}
              </button>
              <button
                onClick={() => setConfirmAccept(false)}
                style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tests section */}
      {workflowTests.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Essais du projet</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workflowTests.map(t => {
              const meta = TEST_META[t.testType] ?? { name: t.testType, norm: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
              return (
                <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 17, color: meta.ic }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes section */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 0, marginBottom: 16 }}>Notes et commentaires</h2>

        <form onSubmit={handleAddNote} style={{ marginBottom: 20 }}>
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Votre commentaire..."
            rows={3}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={!noteContent.trim() || addNote.isPending}
              style={{ background: noteContent.trim() ? '#0e7490' : '#e2e8f0', color: noteContent.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 6, padding: '7px 18px', fontSize: 12, fontWeight: 500, cursor: noteContent.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
              {addNote.isPending ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucun commentaire pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...notes].reverse().map(n => (
              <div key={n.id} style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1c2333' }}>{n.author}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{n.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
