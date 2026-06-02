'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useTechnicians } from '@/hooks/useAdminUsers';
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

const TEST_API_BASE: Record<string, string> = {
  WATER_CONTENT:          '/api/tests/water-content',
  LIQUID_LIMIT:           '/api/tests/liquid-limit',
  PARTICLE_SIZE:          '/api/tests/particle-size',
  PROCTOR:                '/api/tests/proctor',
  SPECIFIC_GRAVITY:       '/api/tests/specific-gravity',
  UNCONFINED_COMPRESSION: '/api/tests/unconfined-compression',
  DIRECT_SHEAR:           '/api/tests/direct-shear',
  CBR:                    '/api/tests/cbr',
  PERMEABILITY:           '/api/tests/permeability',
  CONSOLIDATION:          '/api/tests/consolidation',
};

const TEST_META: Record<string, { name: string; norm: string; cat: string; icon: string; bg: string; ic: string }> = {
  WATER_CONTENT:          { name: 'Teneur en eau',    norm: 'D-2216',       cat: 'Identification', icon: 'ti-droplet',        bg: '#e0f2f9', ic: '#0e7490' },
  LIQUID_LIMIT:           { name: 'Atterberg',         norm: 'D-4318',       cat: 'Identification', icon: 'ti-chart-line',    bg: '#e0f2f9', ic: '#0e7490' },
  PARTICLE_SIZE:          { name: 'Granulométrie',     norm: 'NF/D-422',     cat: 'Identification', icon: 'ti-filter',        bg: '#e0f2f9', ic: '#0e7490' },
  PROCTOR:                { name: 'Proctor',           norm: 'D-698/D-1557', cat: 'Compactage',     icon: 'ti-wave-square',   bg: '#fef3c7', ic: '#d97706' },
  SPECIFIC_GRAVITY:       { name: 'Densité relative',  norm: 'D-854',        cat: 'Compactage',     icon: 'ti-cube',          bg: '#fef3c7', ic: '#d97706' },
  UNCONFINED_COMPRESSION: { name: 'Compression UC',    norm: 'D-2166',       cat: 'Résistance',     icon: 'ti-arrows-vertical',bg: '#fce7f3', ic: '#9d174d' },
  DIRECT_SHEAR:           { name: 'Cisaillement',      norm: 'D-3080',       cat: 'Résistance',     icon: 'ti-cut',           bg: '#fce7f3', ic: '#9d174d' },
  CBR:                    { name: 'CBR',               norm: 'NF P94-078',   cat: 'Résistance',     icon: 'ti-weight',        bg: '#fce7f3', ic: '#9d174d' },
  PERMEABILITY:           { name: 'Perméabilité',      norm: 'D-2434',       cat: 'Résistance',     icon: 'ti-waves',         bg: '#fce7f3', ic: '#9d174d' },
  CONSOLIDATION:          { name: 'Consolidation',     norm: 'D-2435',       cat: 'Résistance',     icon: 'ti-layers',        bg: '#fce7f3', ic: '#9d174d' },
};

// Renders a short human-readable summary of a test result
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

function statusChip(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING_REVIEW: { label: 'En révision', bg: '#fef3c7', color: '#92400e' },
    FLAGGED:        { label: 'Signalé IA',  bg: '#ffedd5', color: '#9a3412' },
    APPROVED:       { label: 'Approuvé',    bg: '#d1fae5', color: '#065f46' },
    REJECTED:       { label: 'Rejeté',      bg: '#fee2e2', color: '#991b1b' },
    LOCKED:         { label: 'Verrouillé',  bg: '#f1f5f9', color: '#64748b' },
  };
  const s = map[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

function resultDotColor(results: any[]): string {
  if (!results || results.length === 0) return '#f59e0b'; // amber = no results
  if (results.some(r => r.status === 'FLAGGED'))        return '#f97316'; // orange = AI flag
  if (results.some(r => r.status === 'PENDING_REVIEW')) return '#60a5fa'; // blue = needs review
  if (results.some(r => r.status === 'REJECTED'))       return '#ef4444'; // red = rejected
  if (results.every(r => r.status === 'APPROVED' || r.status === 'LOCKED')) return '#10b981'; // green = done
  return '#f59e0b';
}

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
  const [technicianId, setTechnicianId]     = useState('');
  const [priority, setPriority]             = useState('Normale');
  const [deadline, setDeadline]             = useState('');
  const [rejectingId, setRejectingId]       = useState<string | null>(null);
  const [rejectComment, setRejectComment]   = useState('');

  // Project + workflow tests
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled:  !!accessToken && !!projectId,
  });

  const { data: workflowTests = [], refetch: refetchTests } = useQuery({
    queryKey: ['project-workflow-tests', projectId],
    queryFn:  () =>
      apiRequest<{ data: WorkflowTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => r.data)
        .catch(() => [] as WorkflowTest[]),
    enabled:  !!accessToken && !!projectId,
  });

  const { data: techList = [] } = useTechnicians();

  // ── All test results (called unconditionally — React hook rules) ──
  const { data: wcResults    = [] } = useWcTestsByProject(projectId);
  const { data: llResults    = [] } = useLlTestsByProject(projectId);
  const { data: psResults    = [] } = usePsTestsByProject(projectId);
  const { data: prResults    = [] } = useProctorTestsByProject(projectId);
  const { data: sgResults    = [] } = useSgTestsByProject(projectId);
  const { data: ucResults    = [] } = useUcTestsByProject(projectId);
  const { data: dsResults    = [] } = useDsTestsByProject(projectId);
  const { data: cbrResults   = [] } = useCbrTestsByProject(projectId);
  const { data: permResults  = [] } = usePermTestsByProject(projectId);
  const { data: consolResults= [] } = useConsolTestsByProject(projectId);

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

  // ── Assignment mutation ──
  const assignMutation = useMutation({
    mutationFn: ({ testId, body }: { testId: string; body: object }) =>
      apiRequest(`/api/projects/${projectId}/tests/${testId}/assign`, {
        method: 'PATCH',
        body:   JSON.stringify(body),
      }),
    onSuccess: () => {
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
    },
  });

  // ── Approve mutation ──
  const approveMutation = useMutation({
    mutationFn: ({ testType, resultId }: { testType: string; resultId: string }) =>
      apiRequest(`${TEST_API_BASE[testType]}/${resultId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-results', projectId] });
      // Invalidate the specific test hook query so the dot color updates
      queryClient.invalidateQueries({ queryKey: ['wc-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ll-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ps-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['proctor-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sg-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['uc-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ds-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['cbr-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['perm-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['consol-tests', projectId] });
    },
  });

  // ── Reject mutation ──
  const rejectMutation = useMutation({
    mutationFn: ({ testType, resultId }: { testType: string; resultId: string }) =>
      apiRequest(`${TEST_API_BASE[testType]}/${resultId}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status: 'REJECTED' }),
      }),
    onSuccess: () => {
      setRejectingId(null);
      setRejectComment('');
      queryClient.invalidateQueries({ queryKey: ['wc-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ll-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ps-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['proctor-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['sg-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['uc-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['ds-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['cbr-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['perm-tests', projectId] });
      queryClient.invalidateQueries({ queryKey: ['consol-tests', projectId] });
    },
  });

  const enrichedTests = workflowTests.map(t => ({
    ...t,
    technicianName: t.technicianId
      ? (() => { const tech = techList.find((tc: any) => tc.id === t.technicianId); return tech ? `${tech.firstName} ${tech.lastName}` : undefined; })()
      : undefined,
  }));

  const selectedTest = enrichedTests.find(t => t.id === selectedTestId) ?? enrichedTests[0] ?? null;

  function handleSelectTest(t: WorkflowTest & { technicianName?: string }) {
    setSelectedTestId(t.id);
    setTechnicianId(t.technicianId ?? '');
    setPriority(t.priority ?? 'Normale');
    setDeadline(t.deadline ?? '');
    setRejectingId(null);
    setRejectComment('');
  }

  function handleSave() {
    if (!selectedTest) return;
    assignMutation.mutate({ testId: selectedTest.id, body: { technicianId, priority, deadline } });
  }

  const techAssignmentCount: Record<string, number> = {};
  enrichedTests.forEach(t => {
    if (t.technicianId) techAssignmentCount[t.technicianId] = (techAssignmentCount[t.technicianId] ?? 0) + 1;
  });

  // Result status for overview table
  function tableResultStatus(results: any[]): { label: string; bg: string; color: string } {
    if (!results.length)                                          return { label: 'Aucun résultat', bg: '#f1f5f9', color: '#94a3b8' };
    if (results.some(r => r.status === 'FLAGGED'))               return { label: 'Signalé IA',      bg: '#ffedd5', color: '#9a3412' };
    if (results.some(r => r.status === 'REJECTED'))              return { label: 'Rejeté',           bg: '#fee2e2', color: '#991b1b' };
    if (results.some(r => r.status === 'PENDING_REVIEW'))        return { label: 'Soumis',           bg: '#fef3c7', color: '#92400e' };
    if (results.every(r => r.status === 'APPROVED' || r.status === 'LOCKED')) return { label: 'Approuvé', bg: '#d1fae5', color: '#065f46' };
    return { label: 'En cours', bg: '#f1f5f9', color: '#64748b' };
  }

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', overflow: 'hidden' }}>

      {/* ── Left — Test list ── */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Essais à gérer</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
            {project?.projectCode} · {enrichedTests.length} essai{enrichedTests.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {enrichedTests.length === 0 && (
            <div style={{ padding: '24px 14px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
              Aucun essai assigné à ce projet.
            </div>
          )}
          {enrichedTests.map(t => {
            const meta     = TEST_META[t.testType] ?? { name: t.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const isActive = (selectedTest?.id ?? enrichedTests[0]?.id) === t.id;
            const results  = getResults(t.testType);
            const dotColor = resultDotColor(results);
            const assigned = !!t.technicianId;
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTest(t)}
                style={{ padding: '8px 12px', borderLeft: `3px solid ${isActive ? '#0e7490' : 'transparent'}`, background: isActive ? '#e0f2f9' : 'transparent', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
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
            {techList.slice(0, 5).map((tech: any) => {
              const color = hashColor(`${tech.firstName}${tech.lastName}`);
              const count = techAssignmentCount[tech.id] ?? 0;
              return (
                <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: count > 0 ? '#475569' : '#94a3b8' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: color.text, flexShrink: 0 }}>
                    {initials(tech.firstName, tech.lastName)}
                  </div>
                  {tech.firstName} {tech.lastName} · {count > 0 ? `${count} essai${count > 1 ? 's' : ''}` : 'libre'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right — Detail area ── */}
      <div style={{ flex: 1, background: '#f4f5f7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {!selectedTest ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
              Sélectionnez un essai pour l&apos;assigner.
            </div>
          ) : (() => {
            const meta     = TEST_META[selectedTest.testType] ?? { name: selectedTest.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const assigned = !!selectedTest.technicianId;
            const results  = getResults(selectedTest.testType);
            const renderFn = RESULT_RENDER[selectedTest.testType] ?? (() => '—');

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
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: assigned ? '#d1fae5' : '#fef3c7', color: assigned ? '#065f46' : '#92400e' }}>
                      {assigned ? 'Assigné' : 'En attente'}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    {[
                      { label: 'Technicien', content: (
                        <select value={technicianId} onChange={e => setTechnicianId(e.target.value)}
                          style={{ flex: 1, border: `1px solid ${technicianId ? '#10b981' : '#e2e8f0'}`, borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: technicianId ? '#f0fdf4' : '#f8fafc', outline: 'none' }}>
                          <option value="">— Choisir —</option>
                          {techList.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                      )},
                      { label: 'Priorité', content: (
                        <select value={priority} onChange={e => setPriority(e.target.value)}
                          style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }}>
                          <option>Normale</option><option>Haute</option><option>Urgente</option>
                        </select>
                      )},
                      { label: 'Échéance', content: (
                        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                          style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }} />
                      )},
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#475569', width: 100, flexShrink: 0 }}>{row.label}</span>
                        {row.content}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button onClick={handleSave} disabled={assignMutation.isPending}
                        style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {assignMutation.isPending ? '...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Results review section ── */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <span style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Résultats soumis · {results.length} résultat{results.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ padding: '8px 14px' }}>
                    {results.length === 0 ? (
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Aucun résultat soumis pour le moment.</p>
                    ) : (
                      results.map((r: any) => {
                        const canAction  = r.status === 'PENDING_REVIEW' || r.status === 'FLAGGED';
                        const isRejecting = rejectingId === r.id;
                        const date = new Date(r.createdAt).toLocaleDateString('fr-CA');
                        return (
                          <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {statusChip(r.status)}
                              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{date}</span>
                              {r.aiFlag && r.aiFlag !== 'NONE' && (
                                <span style={{ fontSize: 9, background: '#ffedd5', color: '#9a3412', padding: '1px 6px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                                  ⚠ IA {r.aiFlag}
                                </span>
                              )}
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#1c2333', fontFamily: 'monospace', flex: 1 }}>
                                {renderFn(r)}
                              </span>
                              {canAction && !isRejecting && (
                                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                                  <button
                                    onClick={() => approveMutation.mutate({ testType: selectedTest.testType, resultId: r.id })}
                                    disabled={approveMutation.isPending}
                                    style={{ background: '#12B76A', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Approuver
                                  </button>
                                  <button
                                    onClick={() => { setRejectingId(r.id); setRejectComment(''); }}
                                    style={{ background: 'transparent', color: '#D92D20', border: '1px solid #D92D20', borderRadius: 4, padding: '3px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    Retourner
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Rejection comment form */}
                            {isRejecting && (
                              <div style={{ marginTop: 8 }}>
                                <textarea
                                  value={rejectComment}
                                  onChange={e => setRejectComment(e.target.value)}
                                  placeholder="Motif du retour (obligatoire)..."
                                  rows={3}
                                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                  <button
                                    onClick={() => rejectMutation.mutate({ testType: selectedTest.testType, resultId: r.id })}
                                    disabled={rejectMutation.isPending}
                                    style={{ background: '#D92D20', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {rejectMutation.isPending ? '...' : 'Confirmer le retour'}
                                  </button>
                                  <button
                                    onClick={() => { setRejectingId(null); setRejectComment(''); }}
                                    style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 12px', fontSize: 11, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
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
                        {['Essai', 'Technicien', 'Priorité', 'Assignation', 'Résultat'].map(col => (
                          <th key={col} style={{ padding: '6px 12px', textAlign: 'left', fontSize: 10, color: '#64748b', fontWeight: 500 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedTests.map((t, i) => {
                        const m        = TEST_META[t.testType];
                        const isAssigned = !!t.technicianId;
                        const rs       = getResults(t.testType);
                        const resultSt = tableResultStatus(rs);
                        return (
                          <tr key={t.id} style={{ borderBottom: i < enrichedTests.length - 1 ? '1px solid #f1f5f9' : 'none', cursor: 'pointer' }}
                            onClick={() => handleSelectTest(t)}>
                            <td style={{ padding: '6px 12px', color: '#1c2333' }}>{m?.name ?? t.testType}</td>
                            <td style={{ padding: '6px 12px', color: t.technicianName ? '#1c2333' : '#94a3b8' }}>
                              {t.technicianName ?? '—'}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              {t.priority
                                ? <span style={{ fontSize: 9, background: '#f1f5f9', color: '#64748b', padding: '1px 7px', borderRadius: 10 }}>{t.priority}</span>
                                : '—'}
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 10, background: isAssigned ? '#d1fae5' : '#fef3c7', color: isAssigned ? '#065f46' : '#92400e' }}>
                                {isAssigned ? 'Assigné' : 'En attente'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 12px' }}>
                              <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 10, background: resultSt.bg, color: resultSt.color }}>
                                {resultSt.label}
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
