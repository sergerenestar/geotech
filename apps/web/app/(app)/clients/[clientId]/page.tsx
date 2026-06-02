'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useClient, useClientProjects, useCreateClientPortalUser } from '@/hooks/useClients';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import Badge from '@/components/ui/Badge';

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: client, isLoading } = useClient(clientId);
  const { data: projects = [] } = useClientProjects(clientId);
  const createPortalUser = useCreateClientPortalUser();

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [portalForm, setPortalForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [portalError, setPortalError] = useState('');
  const [portalSuccess, setPortalSuccess] = useState(false);

  async function handleCreatePortalUser(e: React.FormEvent) {
    e.preventDefault();
    setPortalError('');
    try {
      await createPortalUser.mutateAsync({ ...portalForm, clientId });
      setPortalSuccess(true);
      setTimeout(() => { setShowModal(false); setPortalSuccess(false); }, 2000);
    } catch (err: any) {
      setPortalError(err?.message || 'Erreur');
    }
  }

  if (isLoading) return <p style={{ fontSize: 12, color: '#94a3b8', padding: 24 }}>Chargement...</p>;
  if (!client) return <p style={{ fontSize: 12, color: '#ef4444', padding: 24 }}>Client introuvable.</p>;

  const inputStyle = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: 12, color: '#94a3b8', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 16 }}>
        ← Retour aux clients
      </button>

      {/* Client info card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1c2333', margin: 0 }}>{client.name}</h1>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                background: client.type === 'BUSINESS' ? '#dbeafe' : '#ede9fe',
                color: client.type === 'BUSINESS' ? '#1e40af' : '#5b21b6',
              }}>
                {client.type === 'BUSINESS' ? 'Entreprise' : 'Particulier'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {client.contactName && <span style={{ fontSize: 13, color: '#475569' }}>{client.contactName}</span>}
              {client.email && <span style={{ fontSize: 12, color: '#64748b' }}>{client.email}</span>}
              {client.phone && <span style={{ fontSize: 12, color: '#64748b' }}>{client.phone}</span>}
              {client.address && <span style={{ fontSize: 12, color: '#94a3b8' }}>{client.address}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowModal(true)}
              style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Créer un compte portail
            </button>
          </div>
        </div>
      </div>

      {/* Projects section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>
          Projets <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>({projects.length})</span>
        </h2>
        <button
          onClick={() => setShowCreateProject(true)}
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#475569', fontFamily: 'inherit' }}>
          + Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun projet pour ce client.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', marginBottom: 4 }}>{p.projectCode}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1c2333', marginBottom: 8 }}>{p.name}</div>
                <Badge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateProject && (
        <CreateProjectModal
          clientId={clientId}
          onClose={() => setShowCreateProject(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['client-projects', clientId] });
            queryClient.invalidateQueries({ queryKey: ['client', clientId] });
          }}
        />
      )}

      {/* Portal user modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, width: 420, maxWidth: '90vw' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Créer un compte portail client</h2>
            {portalSuccess ? (
              <p style={{ color: '#12B76A', fontSize: 13 }}>✓ Compte créé avec succès.</p>
            ) : (
              <form onSubmit={handleCreatePortalUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 3 }}>Prénom *</label>
                    <input style={inputStyle} required value={portalForm.firstName} onChange={e => setPortalForm(f => ({ ...f, firstName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 3 }}>Nom *</label>
                    <input style={inputStyle} required value={portalForm.lastName} onChange={e => setPortalForm(f => ({ ...f, lastName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 3 }}>Email *</label>
                  <input style={inputStyle} type="email" required value={portalForm.email} onChange={e => setPortalForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 3 }}>Mot de passe *</label>
                  <input style={inputStyle} type="password" required minLength={6} value={portalForm.password} onChange={e => setPortalForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {portalError && <p style={{ fontSize: 12, color: '#ef4444' }}>{portalError}</p>}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>Annuler</button>
                  <button type="submit" disabled={createPortalUser.isPending} style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {createPortalUser.isPending ? 'Création...' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
