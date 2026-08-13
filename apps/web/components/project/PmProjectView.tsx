'use client';
/**
 * Project Manager project view.
 *
 * The PM's view has two modes:
 * 1. **Test selection mode**: The PM selects test types from a grouped catalogue (Identification,
 *    Compactage, Résistance), assigns a lab manager, and saves the catalogue. This calls
 *    `POST /api/projects/{id}/tests` which replaces the entire catalogue.
 * 2. **Workflow review mode**: Tests that have been approved by the LM appear here awaiting
 *    the PM's final sign-off (`pm-approve` / `pm-reject`).
 *
 * The `CATALOG` constant is the canonical front-end list of all test types with metadata
 * (display name, ASTM norm, typical duration, category). It mirrors the `TestType` enum
 * on the backend.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BoreholeList from '@/components/projects/BoreholeList';
import { useLabManagers } from '@/hooks/useAdminUsers';
import { usePmApprove, usePmReject, useTestComments, type WorkflowComment } from '@/hooks/useTestWorkflow';
import { useWcTestsByProject } from '@/hooks/useWcTests';
import { useLlTestsByProject } from '@/hooks/useLlTests';
import { usePsTestsByProject } from '@/hooks/usePsTests';
import { useProctorTestsByProject } from '@/hooks/useProctorTests';
import { useSgTestsByProject } from '@/hooks/useSgTests';
import { useUcTestsByProject } from '@/hooks/useUcTests';
import { useDsTestsByProject } from '@/hooks/useDsTests';
import { useCbrTestsByProject } from '@/hooks/useCbrTests';
import { usePermTestsByProject } from '@/hooks/usePermTests';
import { useConsolTestsByProject } from '@/hooks/useConsolTests';

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
  workflowStatus?: string;
  labManagerId?: string;
}

const CATALOG = [
  { id: 'WATER_CONTENT',         name: 'Teneur en eau',    norm: 'D-2216',         dur: '~1j', cat: 'Identification', icon: 'ti-droplet',         bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490', path: 'water-content'          },
  { id: 'LIQUID_LIMIT',          name: 'Atterberg',         norm: 'D-4318',         dur: '~2j', cat: 'Identification', icon: 'ti-chart-line',       bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490', path: 'liquid-limit'           },
  { id: 'PARTICLE_SIZE',         name: 'Granulométrie',     norm: 'NF / D-422',     dur: '~2j', cat: 'Identification', icon: 'ti-filter',           bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490', path: 'particle-size'          },
  { id: 'PROCTOR',               name: 'Proctor',           norm: 'D-698 / D-1557', dur: '~1j', cat: 'Compactage',    icon: 'ti-wave-square',      bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706', path: 'proctor'                },
  { id: 'SPECIFIC_GRAVITY',      name: 'Densité relative',  norm: 'D-854',          dur: '~1j', cat: 'Compactage',    icon: 'ti-cube',             bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706', path: 'specific-gravity'       },
  { id: 'UNCONFINED_COMPRESSION',name: 'Compression UC',    norm: 'D-2166',         dur: '~3j', cat: 'Résistance',    icon: 'ti-arrows-vertical',  bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d', path: 'unconfined-compression' },
  { id: 'DIRECT_SHEAR',          name: 'Cisaillement',      norm: 'D-3080',         dur: '~4j', cat: 'Résistance',    icon: 'ti-cut',              bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d', path: 'direct-shear'           },
  { id: 'CBR',                   name: 'CBR',               norm: 'NF P94-078',     dur: '~5j', cat: 'Résistance',    icon: 'ti-weight',           bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d', path: 'cbr'                    },
  { id: 'PERMEABILITY',          name: 'Perméabilité',      norm: 'D-2434',         dur: '~3j', cat: 'Résistance',    icon: 'ti-waves',            bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d', path: 'permeability'           },
  { id: 'CONSOLIDATION',         name: 'Consolidation',     norm: 'D-2435',         dur: '~5j', cat: 'Résistance',    icon: 'ti-layers',           bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d', path: 'consolidation'          },
];

const CATEGORIES = ['Identification', 'Compactage', 'Résistance'];

const RESULT_RENDER: Record<string, (t: any) => string> = {
  WATER_CONTENT:          (t) => t.averageWaterContentPct != null ? `w=${t.averageWaterContentPct.toFixed(1)}%` : '—',
  LIQUID_LIMIT:           (t) => t.llPct != null ? `LL=${t.llPct.toFixed(1)}% LP=${t.plPct?.toFixed(1) ?? '—'}% IP=${t.piPct?.toFixed(1) ?? '—'}%` : '—',
  PARTICLE_SIZE:          (t) => t.uscsSymbol ? `${t.uscsSymbol} — G:${t.pctGravel?.toFixed(0) ?? '?'}% S:${t.pctSand?.toFixed(0) ?? '?'}% F:${t.pctFines?.toFixed(0) ?? '?'}%` : '—',
  PROCTOR:                (t) => t.gdMaxKnM3 != null ? `γd=${t.gdMaxKnM3.toFixed(2)} kN/m³ OPM=${t.omcPct?.toFixed(1) ?? '—'}%` : '—',
  SPECIFIC_GRAVITY:       (t) => t.gsAverage != null ? `Gs=${t.gsAverage.toFixed(3)}` : '—',
  UNCONFINED_COMPRESSION: (t) => t.quKpa != null ? `qu=${t.quKpa.toFixed(1)} kPa Su=${t.suKpa?.toFixed(1) ?? '—'} kPa` : '—',
  DIRECT_SHEAR:           (t) => t.cohesionKpa != null ? `c=${t.cohesionKpa.toFixed(1)} kPa φ=${t.frictionAngleDeg?.toFixed(1) ?? '—'}°` : '—',
  CBR:                    (t) => { const b = t.intensities?.find((i: any) => i.blows === 55); return b?.cbrIndex != null ? `CBR@55 = ${b.cbrIndex.toFixed(1)}%` : '—'; },
  PERMEABILITY:           (t) => t.kAt20cCms != null ? `k₂₀=${t.kAt20cCms.toExponential(2)} cm/s` : t.kCms != null ? `k=${t.kCms.toExponential(2)} cm/s` : '—',
  CONSOLIDATION:          (t) => t.cc != null ? `Cc=${t.cc.toFixed(3)} σ'p=${t.sigmaPKpa?.toFixed(0) ?? '—'} kPa` : '—',
};

function resultStatusChip(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING_REVIEW: { label: 'En révision', bg: '#fef3c7', color: '#92400e' },
    FLAGGED:        { label: 'Signalé IA',  bg: '#ffedd5', color: '#9a3412' },
    APPROVED:       { label: 'Approuvé',    bg: '#d1fae5', color: '#065f46' },
    REJECTED:       { label: 'Retourné',    bg: '#fee2e2', color: '#991b1b' },
    LOCKED:         { label: 'Verrouillé',  bg: '#f1f5f9', color: '#64748b' },
  };
  const s = map[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

const WF_ACTIVE: string[]    = ['PENDING_PM_REVIEW'];
const WF_COMPLETED: string[] = ['APPROVED'];

function workflowPill(ws?: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING_PM_REVIEW: { label: 'En attente PM',  bg: '#ede9fe', color: '#5b21b6' },
    APPROVED:          { label: 'Approuvé',        bg: '#d1fae5', color: '#065f46' },
  };
  const s = map[ws ?? ''] ?? { label: ws ?? '—', bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

function CommentThread({ testId }: { testId: string }) {
  const { data: comments = [] } = useTestComments(testId);
  if (!comments.length) return null;

  const actionLabel: Record<string, string> = {
    SUBMITTED:        'Soumis',
    MANAGER_APPROVED: 'Approuvé (LM)',
    MANAGER_REJECTED: 'Retourné technicien',
    PM_APPROVED:      'Approuvé (PM)',
    PM_REJECTED:      'Retourné manager',
  };
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
      <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Fil de révision
      </div>
      {comments.map((c: WorkflowComment) => (
        <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 10 }}>
          <span style={{ width: 130, flexShrink: 0, color: '#475569', fontWeight: 500 }}>
            {actionLabel[c.action] ?? c.action}
          </span>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
            {new Date(c.createdAt).toLocaleDateString('fr-CA')}
          </span>
          {c.comment && <span style={{ color: '#475569', flex: 1 }}>{c.comment}</span>}
        </div>
      ))}
    </div>
  );
}

export default function PmProjectView({ projectId }: { projectId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [mainTab, setMainTab]               = useState<'catalog' | 'review'>('catalog');
  const [reviewTab, setReviewTab]           = useState<'active' | 'completed'>('active');
  const [selectedTests, setSelectedTests]   = useState<Set<string>>(new Set());
  const [selectedManager, setSelectedManager] = useState('');
  const [reviewingId, setReviewingId]       = useState<string | null>(null);
  const [rejectingId, setRejectingId]       = useState<string | null>(null);
  const [approveNotes, setApproveNotes]     = useState('');
  const [rejectNotes, setRejectNotes]       = useState('');

  const approveMutation = usePmApprove();
  const rejectMutation  = usePmReject();

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

  const { data: workflowTests = [] } = useQuery<WorkflowTest[]>({
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

  const { data: wcResults     = [] } = useWcTestsByProject(projectId);
  const { data: llResults     = [] } = useLlTestsByProject(projectId);
  const { data: psResults     = [] } = usePsTestsByProject(projectId);
  const { data: prResults     = [] } = useProctorTestsByProject(projectId);
  const { data: sgResults     = [] } = useSgTestsByProject(projectId);
  const { data: ucResults     = [] } = useUcTestsByProject(projectId);
  const { data: dsResults     = [] } = useDsTestsByProject(projectId);
  const { data: cbrResults    = [] } = useCbrTestsByProject(projectId);
  const { data: permResults   = [] } = usePermTestsByProject(projectId);
  const { data: consolResults = [] } = useConsolTestsByProject(projectId);

  function getResults(testType: string): any[] {
    switch (testType) {
      case 'WATER_CONTENT':          return wcResults;
      case 'LIQUID_LIMIT':           return llResults;
      case 'PARTICLE_SIZE':          return psResults;
      case 'PROCTOR':                return prResults;
      case 'SPECIFIC_GRAVITY':       return sgResults;
      case 'UNCONFINED_COMPRESSION': return ucResults;
      case 'DIRECT_SHEAR':           return dsResults;
      case 'CBR':                    return cbrResults;
      case 'PERMEABILITY':           return permResults;
      case 'CONSOLIDATION':          return consolResults;
      default:                       return [];
    }
  }

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

  const pendingReview = workflowTests.filter(t => t.workflowStatus && WF_ACTIVE.includes(t.workflowStatus));
  const approved      = workflowTests.filter(t => t.workflowStatus && WF_COMPLETED.includes(t.workflowStatus));
  const reviewList    = reviewTab === 'active' ? pendingReview : approved;

  function handleApprove(testId: string) {
    approveMutation.mutate({ testId, notes: approveNotes }, {
      onSuccess: () => {
        setReviewingId(null);
        setApproveNotes('');
        queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
      },
    });
  }

  function handleReject(testId: string) {
    rejectMutation.mutate({ testId, notes: rejectNotes }, {
      onSuccess: () => {
        setRejectingId(null);
        setRejectNotes('');
        queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
      },
    });
  }

  const canSubmit = selectedTests.size > 0 && selectedManager !== '';

  if (loadingProject) return <p style={{ fontSize: 12, color: '#94a3b8', padding: 24 }}>Chargement...</p>;
  if (!project) return <p style={{ fontSize: 12, color: '#ef4444', padding: 24 }}>Projet introuvable.</p>;

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', overflow: 'hidden', flexDirection: 'column' }}>

      {/* Top tab bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{project.projectCode}</span>
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 6, padding: 3 }}>
          {(['catalog', 'review'] as const).map(tab => (
            <button key={tab} onClick={() => setMainTab(tab)}
              style={{
                padding: '4px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                background: mainTab === tab ? '#fff' : 'transparent',
                color: mainTab === tab ? '#1c2333' : '#64748b',
                fontFamily: 'inherit', fontWeight: mainTab === tab ? 500 : 400,
                boxShadow: mainTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab === 'catalog'
                ? 'Catalogue & attribution'
                : `Révision PM${pendingReview.length > 0 ? ` (${pendingReview.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* ── CATALOG TAB ── */}
      {mainTab === 'catalog' && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left — Test catalogue */}
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
                      <div key={test.id} onClick={() => toggleTest(test.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer', borderLeft: `2px solid ${checked ? '#0e7490' : 'transparent'}`, background: checked ? '#e0f2f9' : 'transparent' }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, border: checked ? 'none' : '1.5px solid #cbd0d8', background: checked ? '#0e7490' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

          {/* Right panel */}
          <div style={{ flex: 1, background: '#f4f5f7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Essais du projet
                  <span style={{ fontSize: 10, background: '#0e7490', color: '#fff', borderRadius: 10, padding: '1px 7px' }}>{selectedTests.size}</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Validez la sélection puis assignez un responsable labo</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
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
                        <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 10, background: test.catChipBg, color: test.catChipColor }}>{test.cat}</span>
                        <span onClick={() => toggleTest(testId)} style={{ color: '#cbd0d8', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#cbd0d8')}>×</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Project info */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', display: 'block', marginBottom: 2 }}>{project.projectCode}</span>
                    <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1c2333', margin: 0 }}>{project.name}</h1>
                    {project.description && <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{project.description}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge status={project.status} />
                    <Link href={`/projects/${projectId}/synthesis`}>
                      <Button variant="secondary">Fiche de synthèse</Button>
                    </Link>
                  </div>
                </div>
                <section>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Forages</h2>
                  <BoreholeList boreholes={boreholes} />
                </section>
              </div>
            </div>

            {/* Sticky footer */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>Assigner à :</span>
                <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)}
                  style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, color: '#1c2333', background: '#f8fafc', fontFamily: 'inherit' }}>
                  <option value="">— Choisir un responsable labo —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </div>
              <button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending}
                style={{ width: '100%', padding: '8px', background: canSubmit ? '#0e7490' : '#e2e8f0', color: canSubmit ? '#fff' : '#94a3b8', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit' }}>
                {submitMutation.isPending ? 'Enregistrement...' : 'Confirmer la sélection et assigner →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEW TAB ── */}
      {mainTab === 'review' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 6, padding: 3, marginBottom: 14, width: 'fit-content' }}>
            {(['active', 'completed'] as const).map(tab => (
              <button key={tab} onClick={() => setReviewTab(tab)}
                style={{
                  padding: '4px 14px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                  background: reviewTab === tab ? '#fff' : 'transparent',
                  color: reviewTab === tab ? '#1c2333' : '#64748b',
                  fontFamily: 'inherit', fontWeight: reviewTab === tab ? 500 : 400,
                  boxShadow: reviewTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}>
                {tab === 'active' ? `En attente (${pendingReview.length})` : `Approuvés (${approved.length})`}
              </button>
            ))}
          </div>

          {reviewList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', fontSize: 11, color: '#94a3b8' }}>
              {reviewTab === 'active' ? 'Aucun essai en attente de votre approbation.' : 'Aucun essai approuvé.'}
            </div>
          ) : (
            reviewList.map(t => {
              const catItem  = CATALOG.find(c => c.id === t.testType);
              const ws       = t.workflowStatus ?? '';
              const isActive = reviewTab === 'active';
              const isExpanded = reviewingId === t.id;
              const results  = getResults(t.testType);
              const renderFn = RESULT_RENDER[t.testType] ?? (() => '—');

              return (
                <div key={t.id} style={{ background: '#fff', border: `1px solid ${ws === 'PENDING_PM_REVIEW' ? '#c4b5fd' : '#e2e8f0'}`, borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: isActive ? 'pointer' : 'default' }}
                    onClick={() => isActive && setReviewingId(isExpanded ? null : t.id)}>
                    {catItem && (
                      <div style={{ width: 30, height: 30, borderRadius: 5, background: catItem.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`ti ${catItem.icon}`} style={{ fontSize: 16, color: catItem.ic }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1c2333' }}>{catItem?.name ?? t.testType}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', marginTop: 1 }}>{catItem?.norm}</div>
                    </div>
                    {workflowPill(ws)}
                    {isActive && (
                      <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14, color: '#94a3b8' }} />
                    )}
                  </div>

                  {/* Approval / rejection panel */}
                  {isActive && isExpanded && rejectingId !== t.id && (
                    <div style={{ padding: '8px 14px 14px', borderTop: '1px solid #f1f5f9' }}>

                      {/* Results list */}
                      {results.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                            Résultats · {results.length}
                          </div>
                          {results.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              {resultStatusChip(r.status)}
                              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                                {new Date(r.createdAt).toLocaleDateString('fr-CA')}
                              </span>
                              {r.aiFlag && r.aiFlag !== 'NONE' && (
                                <span style={{ fontSize: 9, background: '#ffedd5', color: '#9a3412', padding: '1px 6px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                                  ⚠ IA {r.aiFlag}
                                </span>
                              )}
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#1c2333', fontFamily: 'monospace', flex: 1 }}>
                                {renderFn(r)}
                              </span>
                              {catItem?.path && (
                                <Link href={`/projects/${projectId}/tests/${catItem.path}/${r.id}`} target="_blank">
                                  <button style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                                    Voir résultats ↗
                                  </button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <input
                        value={approveNotes}
                        onChange={e => setApproveNotes(e.target.value)}
                        placeholder="Note d'approbation finale (optionnel)..."
                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleApprove(t.id)}
                          disabled={approveMutation.isPending}
                          style={{ background: '#12B76A', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {approveMutation.isPending ? '...' : 'Approuver définitivement'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(t.id); setRejectNotes(''); }}
                          style={{ background: 'transparent', color: '#D92D20', border: '1px solid #D92D20', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Retourner au manager
                        </button>
                      </div>
                      <CommentThread testId={t.id} />
                    </div>
                  )}

                  {/* Rejection form */}
                  {isActive && rejectingId === t.id && (
                    <div style={{ padding: '8px 14px 14px', borderTop: '1px solid #f1f5f9' }}>
                      <textarea
                        value={rejectNotes}
                        onChange={e => setRejectNotes(e.target.value)}
                        placeholder="Motif du retour au manager (obligatoire)..."
                        rows={3}
                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => handleReject(t.id)}
                          disabled={rejectMutation.isPending || !rejectNotes.trim()}
                          style={{ background: '#D92D20', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {rejectMutation.isPending ? '...' : 'Confirmer le retour'}
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectNotes(''); }}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                          Annuler
                        </button>
                      </div>
                      <CommentThread testId={t.id} />
                    </div>
                  )}

                  {/* Completed: results + comment thread read-only */}
                  {!isActive && (
                    <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #f1f5f9' }}>
                      {results.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {results.map((r: any) => (
                            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                              {resultStatusChip(r.status)}
                              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                                {new Date(r.createdAt).toLocaleDateString('fr-CA')}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#1c2333', fontFamily: 'monospace', flex: 1 }}>
                                {renderFn(r)}
                              </span>
                              {catItem?.path && (
                                <Link href={`/projects/${projectId}/tests/${catItem.path}/${r.id}`} target="_blank">
                                  <button style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                                    Voir résultats ↗
                                  </button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <CommentThread testId={t.id} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
