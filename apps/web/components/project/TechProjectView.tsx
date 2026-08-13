'use client';
/**
 * Technician project view.
 *
 * Shows the technician their assigned tests for a single project with:
 * - A list panel filtered to tests assigned to the current user (`technicianId` match).
 * - A detail panel with direct links to the test data-entry pages for each test type.
 * - The latest test result summary and workflow status.
 * - A "Submit" button that calls `POST /api/tests/{id}/submit`, advancing the test to
 *   `PENDING_MANAGER_REVIEW` so the lab manager can review it.
 *
 * `TEST_META.path` is used to construct the URL to the test's edit page
 * (e.g. `/projects/{id}/tests/water-content/new`), ensuring the route matches
 * the file-system routing in `apps/web/app/(app)/projects/[id]/tests/`.
 *
 * `RESULT_RENDER` formats the key result values for each test type into a short
 * human-readable string (e.g. `w=23.4%`, `qu=145.2 kPa Su=72.6 kPa`).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
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
import { useSubmitTest, useTestComments, type WorkflowComment } from '@/hooks/useTestWorkflow';

interface AssignedTest {
  id: string;
  testType: string;
  technicianId?: string;
  priority?: string;
  deadline?: string;
  projectId: string;
  workflowStatus?: string;
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
}

const TEST_META: Record<string, { name: string; norm: string; icon: string; bg: string; ic: string; path: string }> = {
  WATER_CONTENT:          { name: 'Teneur en eau',    norm: 'D-2216',       icon: 'ti-droplet',         bg: '#e0f2f9', ic: '#0e7490', path: 'water-content'          },
  LIQUID_LIMIT:           { name: 'Atterberg',         norm: 'D-4318',       icon: 'ti-chart-line',      bg: '#e0f2f9', ic: '#0e7490', path: 'liquid-limit'           },
  PARTICLE_SIZE:          { name: 'Granulométrie',     norm: 'NF/D-422',     icon: 'ti-filter',          bg: '#e0f2f9', ic: '#0e7490', path: 'particle-size'          },
  PROCTOR:                { name: 'Proctor Modifié',   norm: 'D-698/D-1557', icon: 'ti-wave-square',     bg: '#fef3c7', ic: '#d97706', path: 'proctor'                },
  SPECIFIC_GRAVITY:       { name: 'Densité relative',  norm: 'D-854',        icon: 'ti-cube',            bg: '#fef3c7', ic: '#d97706', path: 'specific-gravity'       },
  UNCONFINED_COMPRESSION: { name: 'Compression UC',    norm: 'D-2166',       icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d', path: 'unconfined-compression' },
  DIRECT_SHEAR:           { name: 'Cisaillement',      norm: 'D-3080',       icon: 'ti-cut',             bg: '#fce7f3', ic: '#9d174d', path: 'direct-shear'           },
  CBR:                    { name: 'CBR',               norm: 'NF P94-078',   icon: 'ti-weight',          bg: '#fce7f3', ic: '#9d174d', path: 'cbr'                    },
  PERMEABILITY:           { name: 'Perméabilité',      norm: 'D-2434',       icon: 'ti-waves',           bg: '#fce7f3', ic: '#9d174d', path: 'permeability'           },
  CONSOLIDATION:          { name: 'Consolidation',     norm: 'D-2435',       icon: 'ti-layers',          bg: '#fce7f3', ic: '#9d174d', path: 'consolidation'          },
};

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

const WORKFLOW_STATUS_ACTIVE: string[] = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED_TO_TECH'];
const WORKFLOW_STATUS_COMPLETED: string[] = ['PENDING_MANAGER_REVIEW', 'PENDING_PM_REVIEW', 'APPROVED'];

function workflowPill(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    ASSIGNED:               { label: 'Assigné',          bg: '#dbeafe', color: '#1e40af' },
    IN_PROGRESS:            { label: 'En cours',          bg: '#d1fae5', color: '#065f46' },
    REJECTED_TO_TECH:       { label: 'Retourné',          bg: '#fee2e2', color: '#991b1b' },
    PENDING_MANAGER_REVIEW: { label: 'En révision (LM)',  bg: '#fef3c7', color: '#92400e' },
    PENDING_PM_REVIEW:      { label: 'En révision (PM)',  bg: '#fef3c7', color: '#92400e' },
    APPROVED:               { label: 'Approuvé',          bg: '#d1fae5', color: '#065f46' },
  };
  const s = map[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

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
    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
}

function CommentThread({ testId }: { testId: string }) {
  const { data: comments = [] } = useTestComments(testId);
  if (!comments.length) return null;

  const actionLabel: Record<string, string> = {
    SUBMITTED:        'Soumis',
    MANAGER_APPROVED: 'Approuvé (LM)',
    MANAGER_REJECTED: 'Retourné par LM',
    PM_APPROVED:      'Approuvé (PM)',
    PM_REJECTED:      'Retourné par PM',
  };
  const actionColor: Record<string, string> = {
    SUBMITTED:        '#1e40af',
    MANAGER_APPROVED: '#065f46',
    MANAGER_REJECTED: '#991b1b',
    PM_APPROVED:      '#065f46',
    PM_REJECTED:      '#991b1b',
  };

  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
      <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Fil de révision
      </div>
      {comments.map((c: WorkflowComment) => (
        <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 10 }}>
          <span style={{ color: actionColor[c.action] ?? '#64748b', fontWeight: 500, flexShrink: 0, width: 120 }}>
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

export default function TechProjectView({ projectId }: { projectId: string }) {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');

  const submitMutation = useSubmitTest();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled:  !!accessToken && !!projectId,
  });

  const { data: allTests = [] } = useQuery<AssignedTest[]>({
    queryKey: ['tech-assigned-tests', projectId, user?.id],
    queryFn:  () =>
      apiRequest<{ data: AssignedTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => r.data.filter(t => t.technicianId === user?.id))
        .catch(() => [] as AssignedTest[]),
    enabled:  !!accessToken && !!projectId && !!user?.id,
  });

  const activeTests    = allTests.filter(t => !t.workflowStatus || WORKFLOW_STATUS_ACTIVE.includes(t.workflowStatus));
  const completedTests = allTests.filter(t => t.workflowStatus && WORKFLOW_STATUS_COMPLETED.includes(t.workflowStatus));
  const visibleTests   = activeTab === 'active' ? activeTests : completedTests;

  const { data: wcResults    = [] } = useWcTestsByProject(projectId);
  const { data: llResults    = [] } = useLlTestsByProject(projectId);
  const { data: psResults    = [] } = usePsTestsByProject(projectId);
  const { data: prResults    = [] } = useProctorTestsByProject(projectId);
  const { data: sgResults    = [] } = useSgTestsByProject(projectId);
  const { data: ucResults    = [] } = useUcTestsByProject(projectId);
  const { data: dsResults    = [] } = useDsTestsByProject(projectId);
  const { data: cbrResults   = [] } = useCbrTestsByProject(projectId);
  const { data: permResults  = [] } = usePermTestsByProject(projectId);
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

  function handleSubmit(testId: string) {
    submitMutation.mutate(
      { testId, notes: submitNotes },
      {
        onSuccess: () => {
          setSubmittingId(null);
          setSubmitNotes('');
          queryClient.invalidateQueries({ queryKey: ['tech-assigned-tests', projectId, user?.id] });
        },
      }
    );
  }

  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() : '?';
  const fullName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, color: '#5b21b6' }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#1c2333' }}>{fullName}</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            Technicien · {project?.projectCode ?? ''}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 6, padding: 3 }}>
          {(['active', 'completed'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#1c2333' : '#64748b',
                fontFamily: 'inherit', fontWeight: activeTab === tab ? 500 : 400,
                boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab === 'active'
                ? `Actifs (${activeTests.length})`
                : `Terminés (${completedTests.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {visibleTests.length === 0 ? (
          <div style={{ paddingTop: 48, textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
            {activeTab === 'active' ? 'Aucun essai actif pour le moment.' : 'Aucun essai terminé.'}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              {activeTab === 'active' ? 'Essais actifs' : 'Essais terminés (lecture seule)'} — {project?.projectCode ?? ''}
            </div>

            {visibleTests.map(t => {
              const meta     = TEST_META[t.testType] ?? { name: t.testType, norm: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b', path: 'water-content' };
              const results  = getResults(t.testType);
              const due      = formatDeadline(t.deadline);
              const renderFn = RESULT_RENDER[t.testType] ?? (() => '—');
              const newRoute = `/projects/${t.projectId}/tests/${meta.path}/new`;
              const ws       = t.workflowStatus ?? 'ASSIGNED';
              const isActive = activeTab === 'active';
              const isRejected = ws === 'REJECTED_TO_TECH';
              const canSubmit  = isActive && results.length > 0 && (ws === 'IN_PROGRESS' || ws === 'ASSIGNED' || ws === 'REJECTED_TO_TECH');
              const isSubmitting = submittingId === t.id;

              const btnLabel = ws === 'ASSIGNED' ? 'Commencer' : isRejected ? 'Continuer →' : 'Continuer →';
              const btnBg    = isRejected ? '#d97706' : '#0e7490';

              return (
                <div key={t.id} style={{ background: '#fff', border: `1px solid ${isRejected ? '#fecaca' : '#e2e8f0'}`, borderRadius: 6, marginBottom: 12, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: (results.length > 0 || isSubmitting) ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 5, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${meta.icon}`} style={{ fontSize: 17, color: meta.ic }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{project?.projectCode} · {project?.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#94a3b8' }}>{meta.norm}</span>
                        {due && <span style={{ fontSize: 9, color: '#f59e0b' }}>Échéance : {due}</span>}
                      </div>
                    </div>
                    {workflowPill(ws)}
                    {isActive && (
                      <Link href={newRoute}>
                        <button style={{ background: btnBg, color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                          {btnLabel}
                        </button>
                      </Link>
                    )}
                  </div>

                  {/* Existing results */}
                  {results.length > 0 && (
                    <div style={{ padding: '6px 14px 10px' }}>
                      {results.map((r: any) => {
                        const date     = new Date(r.createdAt).toLocaleDateString('fr-CA');
                        const isLocked = r.status === 'APPROVED' || r.status === 'LOCKED';
                        return (
                          <div key={r.id} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {resultStatusChip(r.status)}
                            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{date}</span>
                            {r.aiFlag && r.aiFlag !== 'NONE' && (
                              <span style={{ fontSize: 9, background: '#ffedd5', color: '#9a3412', padding: '1px 6px', borderRadius: 10 }}>
                                ⚠ IA {r.aiFlag}
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 500, color: '#1c2333', fontFamily: 'monospace', flex: 1 }}>
                              {renderFn(r)}
                            </span>
                            <Link href={`/projects/${t.projectId}/tests/${meta.path}/${r.id}`} target="_blank">
                              <button style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '1px solid #0e7490', background: '#f0f9ff', color: '#0e7490', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Voir ↗
                              </button>
                            </Link>
                            {isActive && !isLocked && (
                              <Link href={`/projects/${t.projectId}/tests/${meta.path}/${r.id}/edit`}>
                                <button style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>
                                  Modifier
                                </button>
                              </Link>
                            )}
                          </div>
                        );
                      })}

                      {/* Add measurement (active only) */}
                      {isActive && (
                        <Link href={newRoute}>
                          <button style={{ marginTop: 10, fontSize: 10, padding: '3px 12px', borderRadius: 4, border: '1px dashed #cbd0d8', background: 'transparent', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                            + Ajouter une mesure
                          </button>
                        </Link>
                      )}

                      {/* Submit for review button */}
                      {canSubmit && !isSubmitting && (
                        <button
                          onClick={() => { setSubmittingId(t.id); setSubmitNotes(''); }}
                          style={{ marginTop: 8, width: '100%', padding: '6px', background: '#0e7490', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                          Soumettre pour révision →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Submit form inline */}
                  {isSubmitting && (
                    <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #f1f5f9' }}>
                      <textarea
                        value={submitNotes}
                        onChange={e => setSubmitNotes(e.target.value)}
                        placeholder="Notes de soumission (optionnel)..."
                        rows={2}
                        style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={() => handleSubmit(t.id)}
                          disabled={submitMutation.isPending}
                          style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {submitMutation.isPending ? '...' : 'Confirmer la soumission'}
                        </button>
                        <button
                          onClick={() => { setSubmittingId(null); setSubmitNotes(''); }}
                          style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comment thread (always visible) */}
                  <div style={{ padding: '0 14px 8px' }}>
                    <CommentThread testId={t.id} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
