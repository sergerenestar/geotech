'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useAdminUsers } from '@/hooks/useAdminUsers';

interface WorkflowTest {
  id: string;
  testType: string;
  testTypeName: string;
  testNorm: string;
  status: string;
  technicianId?: string;
  technicianName?: string;
  priority?: string;
  deadline?: string;
  category?: string;
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
}

const TEST_META: Record<string, { name: string; norm: string; cat: string; icon: string; bg: string; ic: string }> = {
  WATER_CONTENT: { name: 'Teneur en eau', norm: 'D-2216', cat: 'Identification', icon: 'ti-droplet', bg: '#e0f2f9', ic: '#0e7490' },
  LIQUID_LIMIT: { name: 'Atterberg', norm: 'D-4318', cat: 'Identification', icon: 'ti-chart-line', bg: '#e0f2f9', ic: '#0e7490' },
  PARTICLE_SIZE: { name: 'Granulométrie', norm: 'NF/D-422', cat: 'Identification', icon: 'ti-filter', bg: '#e0f2f9', ic: '#0e7490' },
  PROCTOR: { name: 'Proctor', norm: 'D-698/D-1557', cat: 'Compactage', icon: 'ti-wave-square', bg: '#fef3c7', ic: '#d97706' },
  SPECIFIC_GRAVITY: { name: 'Densité relative', norm: 'D-854', cat: 'Compactage', icon: 'ti-cube', bg: '#fef3c7', ic: '#d97706' },
  UNCONFINED_COMPRESSION: { name: 'Compression UC', norm: 'D-2166', cat: 'Résistance', icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d' },
  DIRECT_SHEAR: { name: 'Cisaillement', norm: 'D-3080', cat: 'Résistance', icon: 'ti-cut', bg: '#fce7f3', ic: '#9d174d' },
  CBR: { name: 'CBR', norm: 'NF P94-078', cat: 'Résistance', icon: 'ti-weight', bg: '#fce7f3', ic: '#9d174d' },
  PERMEABILITY: { name: 'Perméabilité', norm: 'D-2434', cat: 'Résistance', icon: 'ti-waves', bg: '#fce7f3', ic: '#9d174d' },
  CONSOLIDATION: { name: 'Consolidation', norm: 'D-2435', cat: 'Résistance', icon: 'ti-layers', bg: '#fce7f3', ic: '#9d174d' },
};

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#ede9fe', text: '#5b21b6' },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function LmProjectView({ projectId }: { projectId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState('Normale');
  const [deadline, setDeadline] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled: !!accessToken && !!projectId,
  });

  const { data: workflowTests = [], refetch: refetchTests } = useQuery({
    queryKey: ['project-workflow-tests', projectId],
    queryFn: () =>
      apiRequest<{ data: WorkflowTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => r.data)
        .catch(() => [] as WorkflowTest[]),
    enabled: !!accessToken && !!projectId,
  });

  const { data: technicians = [] } = useAdminUsers('LAB_MANAGER');

  const techQuery = useQuery({
    queryKey: ['technicians'],
    queryFn: () =>
      apiRequest<{ data: { data: any[] } }>('/api/auth/users?role=TECHNICIAN&size=100')
        .then(r => r.data.data)
        .catch(() => [] as any[]),
    enabled: !!accessToken,
  });
  const techList = techQuery.data ?? [];

  const assignMutation = useMutation({
    mutationFn: ({ testId, body }: { testId: string; body: object }) =>
      apiRequest(`/api/projects/${projectId}/tests/${testId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
    },
  });

  const selectedTest = workflowTests.find(t => t.id === selectedTestId) ?? workflowTests[0] ?? null;

  function handleSelectTest(t: WorkflowTest) {
    setSelectedTestId(t.id);
    setTechnicianId(t.technicianId ?? '');
    setPriority(t.priority ?? 'Normale');
    setDeadline(t.deadline?.split('T')[0] ?? '');
  }

  function handleSave() {
    if (!selectedTest) return;
    assignMutation.mutate({
      testId: selectedTest.id,
      body: { technicianId, priority, deadline },
    });
  }

  const techAssignmentCount: Record<string, number> = {};
  workflowTests.forEach(t => {
    if (t.technicianId) techAssignmentCount[t.technicianId] = (techAssignmentCount[t.technicianId] ?? 0) + 1;
  });

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', overflow: 'hidden' }}>

      {/* Left — Test list */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Essais à gérer</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
            {project?.projectCode} · {workflowTests.length} essai{workflowTests.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {workflowTests.length === 0 && (
            <div style={{ padding: '24px 14px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
              Aucun essai assigné à ce projet.
            </div>
          )}
          {workflowTests.map(t => {
            const meta = TEST_META[t.testType] ?? { name: t.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const isActive = (selectedTest?.id ?? workflowTests[0]?.id) === t.id;
            const assigned = !!t.technicianId;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTest(t)}
                style={{
                  padding: '8px 12px',
                  borderLeft: `3px solid ${isActive ? '#0e7490' : 'transparent'}`,
                  background: isActive ? '#e0f2f9' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: assigned ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: assigned ? '#065f46' : '#92400e' }}>
                    {t.technicianName ?? 'Non assigné'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technician availability */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Techniciens disponibles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {techList.slice(0, 5).map(tech => {
              const color = hashColor(`${tech.firstName}${tech.lastName}`);
              const count = techAssignmentCount[tech.id] ?? 0;
              const init = initials(tech.firstName, tech.lastName);
              return (
                <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: count > 0 ? '#475569' : '#94a3b8' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: color.text, flexShrink: 0 }}>
                    {init}
                  </div>
                  {tech.firstName} {tech.lastName} · {count > 0 ? `${count} essai${count > 1 ? 's' : ''}` : 'libre'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right — Assignment area */}
      <div style={{ flex: 1, background: '#f4f5f7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {!selectedTest ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
              Sélectionnez un essai pour l&apos;assigner.
            </div>
          ) : (() => {
            const meta = TEST_META[selectedTest.testType] ?? { name: selectedTest.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const assigned = !!selectedTest.technicianId;
            return (
              <>
                {/* Assignment card */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 5, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: meta.ic }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1c2333', flex: 1 }}>{meta.name}</div>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</span>
                    <span style={{
                      fontSize: 9, padding: '2px 8px', borderRadius: 10,
                      background: assigned ? '#d1fae5' : '#fef3c7',
                      color: assigned ? '#065f46' : '#92400e',
                    }}>
                      {assigned ? 'Assigné' : 'En attente'}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    {[
                      {
                        label: 'Technicien',
                        content: (
                          <select
                            value={technicianId}
                            onChange={e => setTechnicianId(e.target.value)}
                            style={{
                              flex: 1, border: `1px solid ${technicianId ? '#10b981' : '#e2e8f0'}`,
                              borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit',
                              color: '#1c2333', background: technicianId ? '#f0fdf4' : '#f8fafc', outline: 'none',
                            }}
                          >
                            <option value="">— Choisir —</option>
                            {techList.map(t => (
                              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                            ))}
                          </select>
                        ),
                      },
                      {
                        label: 'Priorité',
                        content: (
                          <select value={priority} onChange={e => setPriority(e.target.value)}
                            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }}>
                            <option>Normale</option>
                            <option>Haute</option>
                            <option>Urgente</option>
                          </select>
                        ),
                      },
                      {
                        label: 'Échéance',
                        content: (
                          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }} />
                        ),
                      },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#475569', width: 100, flexShrink: 0 }}>{row.label}</span>
                        {row.content}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        onClick={handleSave}
                        disabled={assignMutation.isPending}
                        style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Enregistrer
                      </button>
                      <button style={{ border: '1px solid #e2e8f0', background: 'transparent', borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                        + Note
                      </button>
                    </div>
                  </div>
                </div>

                {/* Assignment overview table */}
                <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '12px 0 8px' }}>
                  Aperçu des assignations
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        {['Essai', 'Technicien', 'Priorité', 'Statut'].map(col => (
                          <th key={col} style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, color: '#64748b', fontWeight: 500 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workflowTests.map((t, i) => {
                        const m = TEST_META[t.testType];
                        const isAssigned = !!t.technicianId;
                        return (
                          <tr key={t.id} style={{ borderBottom: i < workflowTests.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                            <td style={{ padding: '6px 12px', color: '#1c2333' }}>{m?.name ?? t.testType}</td>
                            <td style={{ padding: '6px 12px', color: t.technicianName ? '#1c2333' : '#94a3b8' }}>
                              {t.technicianName ?? '—'}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              {t.priority ? (
                                <span style={{ fontSize: 9, background: '#f1f5f9', color: '#64748b', padding: '1px 7px', borderRadius: 10 }}>{t.priority}</span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{
                                fontSize: 9, padding: '1px 7px', borderRadius: 10,
                                background: isAssigned ? '#d1fae5' : '#fef3c7',
                                color: isAssigned ? '#065f46' : '#92400e',
                              }}>
                                {isAssigned ? 'Assigné' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
