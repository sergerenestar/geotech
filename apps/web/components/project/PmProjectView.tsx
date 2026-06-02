'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BoreholeList from '@/components/projects/BoreholeList';
import { useLabManagers } from '@/hooks/useAdminUsers';

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Borehole {
  id: string;
  bhCode: string;
  depthM: number;
}

interface WorkflowTest {
  id: string;
  testType: string;
  status: string;
  labManagerId?: string;
}

const CATALOG = [
  { id: 'WATER_CONTENT',         name: 'Teneur en eau',    norm: 'D-2216',       dur: '~1j', cat: 'Identification', icon: 'ti-droplet',         bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'LIQUID_LIMIT',          name: 'Atterberg',         norm: 'D-4318',       dur: '~2j', cat: 'Identification', icon: 'ti-chart-line',       bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'PARTICLE_SIZE',         name: 'Granulométrie',     norm: 'NF / D-422',   dur: '~2j', cat: 'Identification', icon: 'ti-filter',           bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'PROCTOR',               name: 'Proctor',           norm: 'D-698 / D-1557',dur: '~1j', cat: 'Compactage',    icon: 'ti-wave-square',      bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706' },
  { id: 'SPECIFIC_GRAVITY',      name: 'Densité relative',  norm: 'D-854',        dur: '~1j', cat: 'Compactage',    icon: 'ti-cube',             bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706' },
  { id: 'UNCONFINED_COMPRESSION',name: 'Compression UC',    norm: 'D-2166',       dur: '~3j', cat: 'Résistance',    icon: 'ti-arrows-vertical',  bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'DIRECT_SHEAR',          name: 'Cisaillement',      norm: 'D-3080',       dur: '~4j', cat: 'Résistance',    icon: 'ti-cut',              bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'CBR',                   name: 'CBR',               norm: 'NF P94-078',   dur: '~5j', cat: 'Résistance',    icon: 'ti-weight',           bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'PERMEABILITY',          name: 'Perméabilité',      norm: 'D-2434',       dur: '~3j', cat: 'Résistance',    icon: 'ti-waves',            bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'CONSOLIDATION',         name: 'Consolidation',     norm: 'D-2435',       dur: '~5j', cat: 'Résistance',    icon: 'ti-layers',           bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
];

const CATEGORIES = ['Identification', 'Compactage', 'Résistance'];

export default function PmProjectView({ projectId }: { projectId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedManager, setSelectedManager] = useState('');

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled: !!accessToken && !!projectId,
  });

  const { data: boreholes = [] } = useQuery({
    queryKey: ['boreholes', projectId],
    queryFn: () => apiRequest<{ data: Borehole[] }>(`/api/projects/${projectId}/boreholes`).then(r => r.data),
    enabled: !!accessToken && !!projectId,
  });

  useQuery({
    queryKey: ['project-workflow-tests', projectId],
    queryFn: () =>
      apiRequest<{ data: WorkflowTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => {
          setSelectedTests(new Set(r.data.map((t: WorkflowTest) => t.testType)));
          return r.data;
        })
        .catch(() => []),
    enabled: !!accessToken && !!projectId,
  });

  const { data: managers = [] } = useLabManagers();

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/projects/${projectId}/tests`, {
        method: 'POST',
        body: JSON.stringify({ testTypes: [...selectedTests], labManagerId: selectedManager }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] }),
  });

  function toggleTest(testId: string) {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  }

  const canSubmit = selectedTests.size > 0 && selectedManager !== '';

  if (loadingProject) return <p style={{ fontSize: 12, color: '#94a3b8', padding: 24 }}>Chargement...</p>;
  if (!project) return <p style={{ fontSize: 12, color: '#ef4444', padding: 24 }}>Projet introuvable.</p>;

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', overflow: 'hidden' }}>

      {/* ── Left — Test catalogue ── */}
      <div style={{ width: 260, minWidth: 260, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Catalogue d&apos;essais</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Sélectionnez les essais pour ce projet</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CATEGORIES.map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 14px 3px' }}>
                {cat}
              </div>
              {CATALOG.filter(t => t.cat === cat).map(test => {
                const checked = selectedTests.has(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTest(test.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 14px', cursor: 'pointer',
                      borderLeft: `2px solid ${checked ? '#0e7490' : 'transparent'}`,
                      background: checked ? '#e0f2f9' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 3,
                      border: checked ? 'none' : '1.5px solid #cbd0d8',
                      background: checked ? '#0e7490' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {checked && <i className="ti ti-check" style={{ fontSize: 10, color: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#1c2333' }}>{test.name}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{test.norm}</div>
                    </div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{test.dur}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, background: '#f4f5f7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Panel header */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              Essais du projet
              <span style={{ fontSize: 10, background: '#0e7490', color: '#fff', borderRadius: 10, padding: '1px 7px' }}>
                {selectedTests.size}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
              Validez la sélection puis assignez un responsable labo
            </div>
          </div>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{project.projectCode}</span>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>

          {/* Selected test cards */}
          {selectedTests.size === 0 ? (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 11, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, marginBottom: 16 }}>
              Aucun essai sélectionné.<br />Cochez les essais dans le catalogue.
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {[...selectedTests].map(testId => {
                const test = CATALOG.find(t => t.id === testId);
                if (!test) return null;
                return (
                  <div key={testId} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 5, background: test.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${test.icon}`} style={{ fontSize: 16, color: test.ic }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#1c2333' }}>{test.name}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{test.norm} · {test.dur}</div>
                    </div>
                    <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 10, background: test.catChipBg, color: test.catChipColor }}>
                      {test.cat}
                    </span>
                    <span
                      onClick={() => toggleTest(testId)}
                      style={{ color: '#cbd0d8', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd0d8')}
                    >×</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Project info (PM retains these capabilities) ── */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                  {project.projectCode}
                </span>
                <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1c2333', margin: 0 }}>{project.name}</h1>
                {project.description && (
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{project.description}</p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge status={project.status} />
                <Link href={`/projects/${projectId}/synthesis`}>
                  <Button variant="secondary">Fiche de synthèse</Button>
                </Link>
              </div>
            </div>

            {/* Forages */}
            <section>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Forages</h2>
              <BoreholeList boreholes={boreholes} />
            </section>
          </div>
        </div>

        {/* ── Sticky footer — assign + confirm ── */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Assigner à :</span>
            <select
              value={selectedManager}
              onChange={e => setSelectedManager(e.target.value)}
              style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, color: '#1c2333', background: '#f8fafc', fontFamily: 'inherit' }}
            >
              <option value="">— Choisir un responsable labo —</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => submitMutation.mutate()}
            disabled={!canSubmit || submitMutation.isPending}
            style={{
              width: '100%', padding: '8px',
              background: canSubmit ? '#0e7490' : '#e2e8f0',
              color: canSubmit ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            {submitMutation.isPending ? 'Enregistrement...' : 'Confirmer la sélection et assigner →'}
          </button>
        </div>
      </div>
    </div>
  );
}
