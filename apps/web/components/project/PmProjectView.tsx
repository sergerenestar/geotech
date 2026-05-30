'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BoreholeList from '@/components/projects/BoreholeList';
import { useWcTestsByProject, useDeleteWcTest } from '@/hooks/useWcTests';
import { useLlTestsByProject, useDeleteLlTest } from '@/hooks/useLlTests';
import { usePsTestsByProject, useDeletePsTest } from '@/hooks/usePsTests';
import { useProctorTestsByProject, useDeleteProctorTest } from '@/hooks/useProctorTests';
import { useSgTestsByProject, useDeleteSgTest } from '@/hooks/useSgTests';
import { useUcTestsByProject, useDeleteUcTest } from '@/hooks/useUcTests';
import { useDsTestsByProject, useDeleteDsTest } from '@/hooks/useDsTests';
import { useCbrTestsByProject, useDeleteCbrTest } from '@/hooks/useCbrTests';
import { usePermTestsByProject, useDeletePermTest } from '@/hooks/usePermTests';
import { useConsolTestsByProject, useDeleteConsolTest } from '@/hooks/useConsolTests';
import { useAdminUsers } from '@/hooks/useAdminUsers';

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
  { id: 'WATER_CONTENT', name: 'Teneur en eau', norm: 'D-2216', dur: '~1j', cat: 'Identification', icon: 'ti-droplet', bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'LIQUID_LIMIT', name: 'Atterberg', norm: 'D-4318', dur: '~2j', cat: 'Identification', icon: 'ti-chart-line', bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'PARTICLE_SIZE', name: 'Granulométrie', norm: 'NF / D-422', dur: '~2j', cat: 'Identification', icon: 'ti-filter', bg: '#e0f2f9', ic: '#0e7490', catChipBg: '#e0f2f9', catChipColor: '#0e7490' },
  { id: 'PROCTOR', name: 'Proctor', norm: 'D-698 / D-1557', dur: '~1j', cat: 'Compactage', icon: 'ti-wave-square', bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706' },
  { id: 'SPECIFIC_GRAVITY', name: 'Densité relative', norm: 'D-854', dur: '~1j', cat: 'Compactage', icon: 'ti-cube', bg: '#fef3c7', ic: '#d97706', catChipBg: '#fef3c7', catChipColor: '#d97706' },
  { id: 'UNCONFINED_COMPRESSION', name: 'Compression UC', norm: 'D-2166', dur: '~3j', cat: 'Résistance', icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'DIRECT_SHEAR', name: 'Cisaillement', norm: 'D-3080', dur: '~4j', cat: 'Résistance', icon: 'ti-cut', bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'CBR', name: 'CBR', norm: 'NF P94-078', dur: '~5j', cat: 'Résistance', icon: 'ti-weight', bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'PERMEABILITY', name: 'Perméabilité', norm: 'D-2434', dur: '~3j', cat: 'Résistance', icon: 'ti-waves', bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
  { id: 'CONSOLIDATION', name: 'Consolidation', norm: 'D-2435', dur: '~5j', cat: 'Résistance', icon: 'ti-layers', bg: '#fce7f3', ic: '#9d174d', catChipBg: '#fce7f3', catChipColor: '#9d174d' },
];

const CATEGORIES = ['Identification', 'Compactage', 'Résistance'];

function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Supprimer ce test ?</h3>
        <p className="text-sm text-gray-500">Cette action est irréversible.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function TestResultRow({ href, editHref, status, aiFlag, label, value, onDelete }: {
  href: string; editHref?: string; status: string; aiFlag?: string; label: string; value: string; onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors group">
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <Badge status={status} />
        {aiFlag && aiFlag !== 'NONE' && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${aiFlag === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {aiFlag}
          </span>
        )}
        <span className="text-sm text-gray-600 shrink-0">{label}</span>
        <span className="text-base font-semibold text-brand-700 truncate">{value}</span>
      </Link>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {editHref && (
          <Link href={editHref}>
            <button className="px-2 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100">
              Modifier
            </button>
          </Link>
        )}
        <button
          onClick={e => { e.preventDefault(); onDelete(); }}
          className="px-2 py-1 rounded-md text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-red-100"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export default function PmProjectView({ projectId }: { projectId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedManager, setSelectedManager] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ type: string; testId: string } | null>(null);

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
          const preSelected = new Set(r.data.map((t: WorkflowTest) => t.testType));
          setSelectedTests(preSelected);
          return r.data;
        })
        .catch(() => []),
    enabled: !!accessToken && !!projectId,
  });

  const { data: managers = [] } = useAdminUsers('LAB_MANAGER');

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/projects/${projectId}/tests`, {
        method: 'POST',
        body: JSON.stringify({ testTypes: [...selectedTests], labManagerId: selectedManager }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] }),
  });

  const { data: wcTests = [] } = useWcTestsByProject(projectId);
  const { data: llTests = [] } = useLlTestsByProject(projectId);
  const { data: psTests = [] } = usePsTestsByProject(projectId);
  const { data: proctorTests = [] } = useProctorTestsByProject(projectId);
  const { data: sgTests = [] } = useSgTestsByProject(projectId);
  const { data: ucTests = [] } = useUcTestsByProject(projectId);
  const { data: dsTests = [] } = useDsTestsByProject(projectId);
  const { data: cbrTests = [] } = useCbrTestsByProject(projectId);
  const { data: permTests = [] } = usePermTestsByProject(projectId);
  const { data: consolTests = [] } = useConsolTestsByProject(projectId);

  const deleteWc = useDeleteWcTest();
  const deleteLl = useDeleteLlTest();
  const deletePs = useDeletePsTest();
  const deleteProctor = useDeleteProctorTest();
  const deleteSg = useDeleteSgTest();
  const deleteUc = useDeleteUcTest();
  const deleteDs = useDeleteDsTest();
  const deleteCbr = useDeleteCbrTest();
  const deletePerm = useDeletePermTest();
  const deleteConsol = useDeleteConsolTest();

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { type, testId } = pendingDelete;
    if (type === 'wc') await deleteWc.mutateAsync(testId);
    if (type === 'll') await deleteLl.mutateAsync(testId);
    if (type === 'ps') await deletePs.mutateAsync(testId);
    if (type === 'proctor') await deleteProctor.mutateAsync(testId);
    if (type === 'sg') await deleteSg.mutateAsync(testId);
    if (type === 'uc') await deleteUc.mutateAsync(testId);
    if (type === 'ds') await deleteDs.mutateAsync(testId);
    if (type === 'cbr') await deleteCbr.mutateAsync(testId);
    if (type === 'perm') await deletePerm.mutateAsync(testId);
    if (type === 'consol') await deleteConsol.mutateAsync(testId);
    setPendingDelete(null);
  }

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
      {pendingDelete && (
        <ConfirmDeleteModal onConfirm={confirmDelete} onCancel={() => setPendingDelete(null)} />
      )}

      {/* Left — Test catalog */}
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 14px',
                      cursor: 'pointer',
                      borderLeft: `2px solid ${checked ? '#0e7490' : 'transparent'}`,
                      background: checked ? '#e0f2f9' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: checked ? 'none' : '1.5px solid #cbd0d8',
                      background: checked ? '#0e7490' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
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

      {/* Right panel */}
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
          {/* Added test cards */}
          {selectedTests.size === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
              Aucun essai sélectionné.<br />Cochez les essais dans le catalogue.
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
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
                    >
                      ×
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Divider + existing project content */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 16 }}>
            {/* Project header */}
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
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Forages</h2>
              <BoreholeList boreholes={boreholes} />
            </section>

            {/* Test results — only sections whose test type is in the saved catalogue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {selectedTests.size === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>
                  Sélectionnez les essais dans le catalogue puis confirmez.
                </p>
              ) : null}
              {[
                { testType: 'WATER_CONTENT',         label: 'Teneur en eau (D-2216)',            href: 'water-content',          tests: wcTests,       type: 'wc',      render: (t: any) => t.averageWaterContentPct != null ? `w=${t.averageWaterContentPct.toFixed(1)}%` : '—' },
                { testType: 'LIQUID_LIMIT',           label: "Limites d'Atterberg (D-4318)",      href: 'liquid-limit',           tests: llTests,       type: 'll',      render: (t: any) => t.llPct != null ? `LL=${t.llPct.toFixed(1)}% LP=${t.plPct?.toFixed(1) ?? '—'}% IP=${t.piPct?.toFixed(1) ?? '—'}%` : '—' },
                { testType: 'PARTICLE_SIZE',          label: 'Analyse granulométrique (D-422)',   href: 'particle-size',          tests: psTests,       type: 'ps',      render: (t: any) => t.uscsSymbol ? `${t.uscsSymbol} — G:${t.pctGravel?.toFixed(0) ?? '?'}% S:${t.pctSand?.toFixed(0) ?? '?'}% F:${t.pctFines?.toFixed(0) ?? '?'}%` : '—' },
                { testType: 'PROCTOR',                label: 'Proctor (D-698 / D-1557)',          href: 'proctor',                tests: proctorTests,  type: 'proctor', render: (t: any) => t.gdMaxKnM3 != null ? `γd=${t.gdMaxKnM3.toFixed(2)} kN/m³  OPM=${t.omcPct?.toFixed(1) ?? '—'}%` : '—' },
                { testType: 'SPECIFIC_GRAVITY',       label: 'Densité relative (D-854)',          href: 'specific-gravity',       tests: sgTests,       type: 'sg',      render: (t: any) => t.gsAverage != null ? `Gs=${t.gsAverage.toFixed(3)}` : '—' },
                { testType: 'UNCONFINED_COMPRESSION', label: 'Compression non confinée (D-2166)', href: 'unconfined-compression', tests: ucTests,       type: 'uc',      render: (t: any) => t.quKpa != null ? `qu=${t.quKpa.toFixed(1)} kPa  Su=${t.suKpa?.toFixed(1) ?? '—'} kPa` : '—' },
                { testType: 'DIRECT_SHEAR',           label: 'Cisaillement direct (D-3080)',      href: 'direct-shear',           tests: dsTests,       type: 'ds',      render: (t: any) => t.cohesionKpa != null ? `c=${t.cohesionKpa.toFixed(1)} kPa  φ=${t.frictionAngleDeg?.toFixed(1) ?? '—'}°` : '—' },
                { testType: 'CBR',                    label: 'CBR (NF P94-078)',                  href: 'cbr',                    tests: cbrTests,      type: 'cbr',     render: (t: any) => { const best = t.intensities?.find((i: any) => i.blows === 55); return best?.cbrIndex != null ? `CBR@55 coups = ${best.cbrIndex.toFixed(1)}%` : '—'; } },
                { testType: 'PERMEABILITY',           label: 'Perméabilité (D-2434)',             href: 'permeability',           tests: permTests,     type: 'perm',    render: (t: any) => t.kAt20cCms != null ? `k₂₀ = ${t.kAt20cCms.toExponential(2)} cm/s` : t.kCms != null ? `k = ${t.kCms.toExponential(2)} cm/s` : '—' },
                { testType: 'CONSOLIDATION',          label: 'Consolidation (D-2435)',            href: 'consolidation',          tests: consolTests,   type: 'consol',  render: (t: any) => t.cc != null ? `Cc=${t.cc.toFixed(3)}  σ'p=${t.sigmaPKpa?.toFixed(0) ?? '—'} kPa` : '—' },
              ].filter(s => selectedTests.has(s.testType)).map(section => (
                <section key={section.type}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>{section.label}</h2>
                    <Link href={`/projects/${projectId}/tests/${section.href}/new`}>
                      <Button variant="primary">+ Ajouter</Button>
                    </Link>
                  </div>
                  {section.tests.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>Aucun essai enregistré.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {section.tests.map((t: any) => (
                        <TestResultRow
                          key={t.id}
                          href={`/projects/${projectId}/tests/${section.href}/${t.id}`}
                          editHref={`/projects/${projectId}/tests/${section.href}/${t.id}/edit`}
                          status={t.status}
                          aiFlag={t.aiFlag}
                          label={section.type === 'cbr' ? (t.reference ?? new Date(t.createdAt).toLocaleDateString('fr-CA')) : new Date(t.createdAt).toLocaleDateString('fr-CA')}
                          value={section.render(t)}
                          onDelete={() => setPendingDelete({ type: section.type, testId: t.id })}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer — assign + confirm */}
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
              width: '100%',
              padding: '8px',
              background: canSubmit ? '#0e7490' : '#e2e8f0',
              color: canSubmit ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            Confirmer la sélection et assigner →
          </button>
        </div>
      </div>
    </div>
  );
}
