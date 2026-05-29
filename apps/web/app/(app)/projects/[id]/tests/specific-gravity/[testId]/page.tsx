'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useSgTest, useUpdateSgTestStatus } from '@/hooks/useSgTests';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};

export default function SgTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useSgTest(testId);
  const updateStatus = useUpdateSgTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Densité relative (D-854)</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/specific-gravity/${testId}/edit`)}>Modifier</Button>
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${test.aiFlag === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-semibold">{test.aiFlag === 'ERROR' ? 'Erreur' : 'Avertissement'}:</span> {test.aiFlagMessage}
        </div>
      )}

      <Card className="p-8 text-center">
        <div className="text-5xl font-bold text-brand-700">
          {test.gsAverage != null ? test.gsAverage.toFixed(3) : '—'}
        </div>
        <div className="text-sm text-gray-500 mt-2">Gs moyen (corrigé à 20°C)</div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Déterminations</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>#</th>
              <th className={col}>Flacon</th>
              <th className={col}>M sol sec (g)</th>
              <th className={col}>M flacon+eau (g)</th>
              <th className={col}>M flacon+sol+eau (g)</th>
              <th className={col}>Temp (°C)</th>
              <th className={col}>K</th>
              <th className={col}>Gs(T)</th>
              <th className={col}>Gs(20°C)</th>
            </tr>
          </thead>
          <tbody>
            {test.determinations.map((d, i) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                <td className={`${col} text-center`}>{d.flaskNumber ?? '—'}</td>
                <td className={`${col} text-right`}>{d.massDrySoilG.toFixed(4)}</td>
                <td className={`${col} text-right`}>{d.massFlaskWaterG.toFixed(4)}</td>
                <td className={`${col} text-right`}>{d.massFlaskSoilWaterG.toFixed(4)}</td>
                <td className={`${col} text-right`}>{d.temperatureC.toFixed(1)}</td>
                <td className={`${col} text-right text-gray-500`}>{d.kFactor != null ? d.kFactor.toFixed(4) : '—'}</td>
                <td className={`${col} text-right text-gray-500`}>{d.gsAtTemp != null ? d.gsAtTemp.toFixed(4) : '—'}</td>
                <td className={`${col} text-right font-medium text-brand-700`}>{d.gs20 != null ? d.gs20.toFixed(4) : '—'}</td>
              </tr>
            ))}
          </tbody>
          {test.gsAverage != null && (
            <tfoot>
              <tr className="bg-brand-50 font-semibold">
                <td colSpan={8} className={`${col} text-right text-gray-600`}>Gs moyen (20°C)</td>
                <td className={`${col} text-right text-brand-700`}>{test.gsAverage.toFixed(4)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </Card>

      {test.notes && <Card className="p-4"><h3 className="text-sm font-semibold text-gray-600 mb-1">Notes</h3><p className="text-sm text-gray-800">{test.notes}</p></Card>}

      {transitions.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Changer le statut</h3>
          <div className="flex gap-2 flex-wrap">
            {transitions.map(s => (
              <Button key={s} variant={s === 'APPROVED' ? 'primary' : 'secondary'}
                onClick={() => updateStatus.mutateAsync({ testId, status: s })} disabled={updateStatus.isPending}>
                {STATUS_LABELS[s] ?? s}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
