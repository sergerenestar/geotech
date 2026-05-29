'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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

function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Supprimer ce test ?</h3>
        <p className="text-sm text-gray-500">Cette action est irréversible. Le test sera archivé et retiré de la liste.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function TestRow({ href, editHref, status, aiFlag, label, value, onDelete }: {
  href: string;
  editHref?: string;
  status: string;
  aiFlag?: string;
  label: string;
  value: string;
  onDelete: () => void;
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
            <button className="px-2 py-1 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
              Modifier
            </button>
          </Link>
        )}
        <button
          onClick={e => { e.preventDefault(); onDelete(); }}
          className="px-2 py-1 rounded-md text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [pendingDelete, setPendingDelete] = useState<{ type: string; testId: string } | null>(null);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${id}`).then(r => r.data),
    enabled: !!accessToken && !!id,
  });

  const { data: boreholes = [] } = useQuery({
    queryKey: ['boreholes', id],
    queryFn: () => apiRequest<{ data: Borehole[] }>(`/api/projects/${id}/boreholes`).then(r => r.data),
    enabled: !!accessToken && !!id,
  });

  const { data: wcTests = [] } = useWcTestsByProject(id);
  const { data: llTests = [] } = useLlTestsByProject(id);
  const { data: psTests = [] } = usePsTestsByProject(id);
  const { data: proctorTests = [] } = useProctorTestsByProject(id);
  const { data: sgTests = [] } = useSgTestsByProject(id);
  const { data: ucTests = [] } = useUcTestsByProject(id);
  const { data: dsTests = [] } = useDsTestsByProject(id);
  const { data: cbrTests = [] } = useCbrTestsByProject(id);
  const { data: permTests = [] } = usePermTestsByProject(id);
  const { data: consolTests = [] } = useConsolTestsByProject(id);

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

  if (loadingProject) return <p className="text-sm text-gray-400">Chargement...</p>;
  if (!project) return <p className="text-sm text-red-500">Projet introuvable.</p>;

  return (
    <div>
      {pendingDelete && (
        <ConfirmDeleteModal
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-xs font-mono text-gray-500 mb-1 block">{project.projectCode}</span>
          <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge status={project.status} />
          <Link href={`/projects/${id}/synthesis`}>
            <Button variant="secondary">Fiche de synthèse</Button>
          </Link>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Forages</h2>
        <BoreholeList boreholes={boreholes} />
      </section>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Teneur en eau (D-2216)</h2>
            <Link href={`/projects/${id}/tests/water-content/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {wcTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {wcTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/water-content/${t.id}`}
                  editHref={`/projects/${id}/tests/water-content/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.averageWaterContentPct != null ? `w=${t.averageWaterContentPct.toFixed(1)}%` : '—'}
                  onDelete={() => setPendingDelete({ type: 'wc', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Limites d&apos;Atterberg (D-4318)</h2>
            <Link href={`/projects/${id}/tests/liquid-limit/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {llTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {llTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/liquid-limit/${t.id}`}
                  editHref={`/projects/${id}/tests/liquid-limit/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.llPct != null
                    ? `LL=${t.llPct.toFixed(1)}% LP=${t.plPct?.toFixed(1) ?? '—'}% IP=${t.piPct?.toFixed(1) ?? '—'}%`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'll', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Analyse granulométrique (D-422)</h2>
            <Link href={`/projects/${id}/tests/particle-size/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {psTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {psTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/particle-size/${t.id}`}
                  editHref={`/projects/${id}/tests/particle-size/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.uscsSymbol
                    ? `${t.uscsSymbol} — G:${t.pctGravel?.toFixed(0) ?? '?'}% S:${t.pctSand?.toFixed(0) ?? '?'}% F:${t.pctFines?.toFixed(0) ?? '?'}%`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'ps', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Proctor (D-698 / D-1557)</h2>
            <Link href={`/projects/${id}/tests/proctor/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {proctorTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {proctorTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/proctor/${t.id}`}
                  editHref={`/projects/${id}/tests/proctor/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.gdMaxKnM3 != null
                    ? `γd=${t.gdMaxKnM3.toFixed(2)} kN/m³  OPM=${t.omcPct?.toFixed(1) ?? '—'}%`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'proctor', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Densité relative (D-854)</h2>
            <Link href={`/projects/${id}/tests/specific-gravity/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {sgTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {sgTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/specific-gravity/${t.id}`}
                  editHref={`/projects/${id}/tests/specific-gravity/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.gsAverage != null ? `Gs=${t.gsAverage.toFixed(3)}` : '—'}
                  onDelete={() => setPendingDelete({ type: 'sg', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Compression non confinée (D-2166)</h2>
            <Link href={`/projects/${id}/tests/unconfined-compression/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {ucTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {ucTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/unconfined-compression/${t.id}`}
                  editHref={`/projects/${id}/tests/unconfined-compression/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.quKpa != null
                    ? `qu=${t.quKpa.toFixed(1)} kPa  Su=${t.suKpa?.toFixed(1) ?? '—'} kPa`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'uc', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Cisaillement direct (D-3080)</h2>
            <Link href={`/projects/${id}/tests/direct-shear/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {dsTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {dsTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/direct-shear/${t.id}`}
                  editHref={`/projects/${id}/tests/direct-shear/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.cohesionKpa != null
                    ? `c=${t.cohesionKpa.toFixed(1)} kPa  φ=${t.frictionAngleDeg?.toFixed(1) ?? '—'}°`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'ds', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">CBR (NF P94-078)</h2>
            <Link href={`/projects/${id}/tests/cbr/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {cbrTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {cbrTests.map(t => {
                const best = t.intensities.find(i => i.blows === 55);
                return (
                  <TestRow
                    key={t.id}
                    href={`/projects/${id}/tests/cbr/${t.id}`}
                    editHref={`/projects/${id}/tests/cbr/${t.id}/edit`}
                    status={t.status}
                    label={t.reference ?? new Date(t.createdAt).toLocaleDateString('fr-CA')}
                    value={best?.cbrIndex != null
                      ? `CBR@55 coups = ${best.cbrIndex.toFixed(1)}%`
                      : '—'}
                    onDelete={() => setPendingDelete({ type: 'cbr', testId: t.id })}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Perméabilité (D-2434)</h2>
            <Link href={`/projects/${id}/tests/permeability/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {permTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {permTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/permeability/${t.id}`}
                  editHref={`/projects/${id}/tests/permeability/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.kAt20cCms != null
                    ? `k₂₀ = ${t.kAt20cCms.toExponential(2)} cm/s`
                    : t.kCms != null ? `k = ${t.kCms.toExponential(2)} cm/s` : '—'}
                  onDelete={() => setPendingDelete({ type: 'perm', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Consolidation (D-2435)</h2>
            <Link href={`/projects/${id}/tests/consolidation/new`}>
              <Button variant="primary">+ Ajouter</Button>
            </Link>
          </div>
          {consolTests.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun essai enregistré.</p>
          ) : (
            <div className="space-y-2">
              {consolTests.map(t => (
                <TestRow
                  key={t.id}
                  href={`/projects/${id}/tests/consolidation/${t.id}`}
                  editHref={`/projects/${id}/tests/consolidation/${t.id}/edit`}
                  status={t.status}
                  aiFlag={t.aiFlag}
                  label={new Date(t.createdAt).toLocaleDateString('fr-CA')}
                  value={t.cc != null
                    ? `Cc=${t.cc.toFixed(3)}  σ'p=${t.sigmaPKpa?.toFixed(0) ?? '—'} kPa`
                    : '—'}
                  onDelete={() => setPendingDelete({ type: 'consol', testId: t.id })}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
