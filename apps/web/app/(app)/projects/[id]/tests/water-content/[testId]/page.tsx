'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useWcTest, useUpdateWcTestStatus } from '@/hooks/useWcTests';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'],
  IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
  APPROVED: [],
  REJECTED: ['IN_PROGRESS'],
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
};

const AI_FLAG_STYLES: Record<string, string> = {
  NONE: 'bg-green-50 border-green-200 text-green-800',
  WARNING: 'bg-amber-50 border-amber-200 text-amber-800',
  ERROR: 'bg-red-50 border-red-200 text-red-800',
};

const AI_FLAG_LABELS: Record<string, string> = {
  NONE: 'Aucune anomalie détectée',
  WARNING: 'Avertissement IA',
  ERROR: 'Erreur IA',
};

export default function WcTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useWcTest(testId);
  const updateStatus = useUpdateWcTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  async function handleStatusChange(newStatus: string) {
    await updateStatus.mutateAsync({ testId, status: newStatus });
  }

  const col = 'border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Teneur en eau (D-2216)</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${AI_FLAG_STYLES[test.aiFlag]}`}>
          <span className="font-semibold">{AI_FLAG_LABELS[test.aiFlag]}:</span> {test.aiFlagMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-brand-700">
            {test.averageWaterContentPct != null ? `${test.averageWaterContentPct}%` : '—'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Teneur en eau moyenne</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-gray-700">{test.determinations.length}</div>
          <div className="text-sm text-gray-500 mt-1">Déterminations</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-gray-700">{test.temperatureC != null ? `${test.temperatureC}°C` : '—'}</div>
          <div className="text-sm text-gray-500 mt-1">Température</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Déterminations</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Masse cont. (g)</th>
                <th className={col}>Masse cont.+sol humide (g)</th>
                <th className={col}>Masse cont.+sol sec (g)</th>
                <th className={col}>Masse eau (g)</th>
                <th className={col}>Masse sol sec (g)</th>
                <th className={col}>w%</th>
              </tr>
            </thead>
            <tbody>
              {test.determinations.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className={`${col} text-center text-gray-500`}>{d.determinationNumber}</td>
                  <td className={`${col} text-right`}>{d.massContainerG}</td>
                  <td className={`${col} text-right`}>{d.massContainerWetSoilG}</td>
                  <td className={`${col} text-right`}>{d.massContainerDrySoilG}</td>
                  <td className={`${col} text-right text-gray-500`}>{d.massWaterG}</td>
                  <td className={`${col} text-right text-gray-500`}>{d.massDrySoilG}</td>
                  <td className={`${col} text-right font-medium ${d.waterContentPct > 100 ? 'text-amber-600' : 'text-gray-900'}`}>
                    {d.waterContentPct}%
                  </td>
                </tr>
              ))}
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
              <Button
                key={s}
                variant={s === 'APPROVED' ? 'primary' : 'secondary'}
                onClick={() => handleStatusChange(s)}
                disabled={updateStatus.isPending}
              >
                {STATUS_LABELS[s] ?? s}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
