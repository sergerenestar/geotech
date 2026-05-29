'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useLlTest, useUpdateLlTestStatus } from '@/hooks/useLlTests';
import CasagrandeCurve from '@/components/charts/CasagrandeCurve';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'],
  IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS'],
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};

const AI_FLAG_STYLES: Record<string, string> = {
  NONE: 'bg-green-50 border-green-200 text-green-800',
  WARNING: 'bg-amber-50 border-amber-200 text-amber-800',
  ERROR: 'bg-red-50 border-red-200 text-red-800',
};

export default function LlTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useLlTest(testId);
  const updateStatus = useUpdateLlTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const transitions = STATUS_TRANSITIONS[test.status] ?? [];
  const col = 'border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Limites d&apos;Atterberg (D-4318)</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${AI_FLAG_STYLES[test.aiFlag]}`}>
          <span className="font-semibold">{test.aiFlag === 'ERROR' ? 'Erreur IA' : 'Avertissement IA'}:</span>{' '}
          {test.aiFlagMessage}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-brand-700">
            {test.llPct != null ? `${test.llPct.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Limite liquide (LL)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-gray-700">
            {test.plPct != null ? `${test.plPct.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Limite plastique (LP)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-gray-700">
            {test.piPct != null ? `${test.piPct.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Indice de plasticité (IP)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-gray-900">
            {test.uscsSymbol ?? '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">{test.uscsName ?? 'Classification USCS'}</div>
        </Card>
      </div>

      {(test.rSquared != null || test.liquidityIndex != null || test.activity != null) && (
        <div className="grid grid-cols-3 gap-4">
          {test.rSquared != null && (
            <Card className="p-4 text-center">
              <div className={`text-2xl font-bold ${test.rSquared < 0.90 ? 'text-amber-600' : 'text-green-600'}`}>
                {test.rSquared.toFixed(3)}
              </div>
              <div className="text-xs text-gray-500 mt-1">R² (ajustement courbe)</div>
            </Card>
          )}
          {test.liquidityIndex != null && (
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-700">{test.liquidityIndex.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Indice de liquidité (IL)</div>
            </Card>
          )}
          {test.activity != null && (
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-700">{test.activity.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Activité (A)</div>
            </Card>
          )}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Courbe de fluidité (Casagrande)</h2>
        <CasagrandeCurve points={test.casagrandePoints} llPct={test.llPct} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Points Casagrande — Courbe de fluidité</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Coups (N)</th>
                <th className={col}>Masse cont. (g)</th>
                <th className={col}>Cont.+humide (g)</th>
                <th className={col}>Cont.+sec (g)</th>
                <th className={col}>w%</th>
              </tr>
            </thead>
            <tbody>
              {test.casagrandePoints.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className={`${col} text-center text-gray-500`}>{p.pointNumber}</td>
                  <td className={`${col} text-center font-medium`}>{p.blowCount}</td>
                  <td className={`${col} text-right`}>{p.massContainerG}</td>
                  <td className={`${col} text-right`}>{p.massContainerWetSoilG}</td>
                  <td className={`${col} text-right`}>{p.massContainerDrySoilG}</td>
                  <td className={`${col} text-right font-medium text-brand-700`}>
                    {p.waterContentPct != null ? `${p.waterContentPct.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Limite plastique — Déterminations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Masse cont. (g)</th>
                <th className={col}>Cont.+humide (g)</th>
                <th className={col}>Cont.+sec (g)</th>
                <th className={col}>w%</th>
              </tr>
            </thead>
            <tbody>
              {test.plDeterminations.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className={`${col} text-center text-gray-500`}>{d.determinationNumber}</td>
                  <td className={`${col} text-right`}>{d.massContainerG}</td>
                  <td className={`${col} text-right`}>{d.massContainerWetSoilG}</td>
                  <td className={`${col} text-right`}>{d.massContainerDrySoilG}</td>
                  <td className={`${col} text-right font-medium text-brand-700`}>
                    {d.waterContentPct != null ? `${d.waterContentPct.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className={`${col} text-right text-gray-600`}>Limite plastique moyenne</td>
                <td className={`${col} text-right text-brand-700`}>
                  {test.plPct != null ? `${test.plPct.toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {test.notes && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-1">Notes</h3>
          <p className="text-sm text-gray-800">{test.notes}</p>
        </Card>
      )}

      {transitions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Changer le statut</h3>
          <div className="flex gap-2 flex-wrap">
            {transitions.map(s => (
              <Button key={s} variant={s === 'APPROVED' ? 'primary' : 'secondary'}
                onClick={() => updateStatus.mutateAsync({ testId, status: s })}
                disabled={updateStatus.isPending}>
                {STATUS_LABELS[s] ?? s}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
