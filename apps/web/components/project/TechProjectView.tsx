'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';

interface AssignedTest {
  id: string;
  testType: string;
  status: string;
  priority?: string;
  deadline?: string;
  projectId: string;
  projectCode?: string;
  projectName?: string;
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
}

const TEST_META: Record<string, { name: string; norm: string; icon: string; bg: string; ic: string; path: string }> = {
  WATER_CONTENT: { name: 'Teneur en eau', norm: 'D-2216', icon: 'ti-droplet', bg: '#e0f2f9', ic: '#0e7490', path: 'water-content' },
  LIQUID_LIMIT: { name: 'Atterberg', norm: 'D-4318', icon: 'ti-chart-line', bg: '#e0f2f9', ic: '#0e7490', path: 'liquid-limit' },
  PARTICLE_SIZE: { name: 'Granulométrie', norm: 'NF/D-422', icon: 'ti-filter', bg: '#e0f2f9', ic: '#0e7490', path: 'particle-size' },
  PROCTOR: { name: 'Proctor', norm: 'D-698/D-1557', icon: 'ti-wave-square', bg: '#fef3c7', ic: '#d97706', path: 'proctor' },
  SPECIFIC_GRAVITY: { name: 'Densité relative', norm: 'D-854', icon: 'ti-cube', bg: '#fef3c7', ic: '#d97706', path: 'specific-gravity' },
  UNCONFINED_COMPRESSION: { name: 'Compression UC', norm: 'D-2166', icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d', path: 'unconfined-compression' },
  DIRECT_SHEAR: { name: 'Cisaillement', norm: 'D-3080', icon: 'ti-cut', bg: '#fce7f3', ic: '#9d174d', path: 'direct-shear' },
  CBR: { name: 'CBR', norm: 'NF P94-078', icon: 'ti-weight', bg: '#fce7f3', ic: '#9d174d', path: 'cbr' },
  PERMEABILITY: { name: 'Perméabilité', norm: 'D-2434', icon: 'ti-waves', bg: '#fce7f3', ic: '#9d174d', path: 'permeability' },
  CONSOLIDATION: { name: 'Consolidation', norm: 'D-2435', icon: 'ti-layers', bg: '#fce7f3', ic: '#9d174d', path: 'consolidation' },
};

function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
}

export default function TechProjectView({ projectId }: { projectId: string }) {
  const { accessToken, user } = useAuth();
  const router = useRouter();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled: !!accessToken && !!projectId,
  });

  const { data: assignedTests = [] } = useQuery({
    queryKey: ['tech-assigned-tests', projectId],
    queryFn: () =>
      apiRequest<{ data: AssignedTest[] }>(`/api/projects/${projectId}/tests?assignedTo=me`)
        .then(r => r.data)
        .catch(() => [] as AssignedTest[]),
    enabled: !!accessToken && !!projectId,
  });

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tech header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#ede9fe', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#5b21b6',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1c2333' }}>{fullName}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            Technicien · {assignedTests.length} essai{assignedTests.length !== 1 ? 's' : ''} assigné{assignedTests.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {assignedTests.length === 0 ? (
          <div style={{ paddingTop: 48, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
            Aucun essai assigné pour le moment.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              Assigné à moi — {project?.projectCode ?? ''}
            </div>
            {assignedTests.map(t => {
              const meta = TEST_META[t.testType] ?? { name: t.testType, norm: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b', path: 'water-content' };
              const isNew = t.status === 'NEW' || t.status === 'PENDING' || !t.status;
              const due = formatDeadline(t.deadline);

              return (
                <div key={t.id} style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6,
                  padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 5, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${meta.icon}`} style={{ fontSize: 17, color: meta.ic }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>
                        {project?.projectCode} · {project?.name}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#94a3b8' }}>{meta.norm}</span>
                      {due && (
                        <span style={{ fontSize: 9, color: '#f59e0b' }}>Échéance : {due}</span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                    background: isNew ? '#dbeafe' : '#d1fae5',
                    color: isNew ? '#1e40af' : '#065f46',
                  }}>
                    {isNew ? 'Nouveau' : 'En cours'}
                  </span>
                  <button
                    onClick={() => router.push(`/projects/${t.projectId}/tests/${meta.path}/new`)}
                    style={{
                      background: isNew ? '#0e7490' : '#475569',
                      color: '#fff', border: 'none', borderRadius: 4,
                      padding: '4px 12px', fontSize: 10, cursor: 'pointer',
                      fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    {isNew ? 'Commencer' : 'Continuer →'}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
