'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { usePermTest, useUpdatePermTestStatus } from '@/hooks/usePermTests';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};

function fmt(v: number | undefined | null, dec = 2): string {
  return v != null ? v.toFixed(dec) : '—';
}

function fmtExp(v: number | undefined | null): string {
  return v != null ? v.toExponential(3) : '—';
}

export default function PermTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = usePermTest(testId);
  const updateStatus = useUpdatePermTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];
  const testTypeLabel = test.testType === 'CONSTANT_HEAD' ? 'Charge constante' : 'Charge variable';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Perméabilité (D-2434)</h1>
          <p className="text-sm text-gray-500">
            {testTypeLabel} · Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/permeability/${testId}/edit`)}>
            Modifier
          </Button>
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${test.aiFlag === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-semibold">{test.aiFlag === 'ERROR' ? 'Erreur' : 'Avertissement'}:</span> {test.aiFlagMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{fmtExp(test.kCms)} cm/s</div>
          <div className="text-xs text-gray-500 mt-1">k moyen (à {test.waterTemperatureC}°C)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{fmtExp(test.kAt20cCms)} cm/s</div>
          <div className="text-xs text-gray-500 mt-1">k corrigé à 20°C</div>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Paramètres de l&apos;essai</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">Type:</span> <span className="font-medium">{testTypeLabel}</span></div>
          <div><span className="text-gray-500">Diamètre:</span> <span className="font-medium">{fmt(test.specimenDiameterMm)} mm</span></div>
          <div><span className="text-gray-500">Longueur:</span> <span className="font-medium">{fmt(test.specimenLengthMm)} mm</span></div>
          <div><span className="text-gray-500">Température:</span> <span className="font-medium">{fmt(test.waterTemperatureC, 1)} °C</span></div>
          {test.headCm != null && <div><span className="text-gray-500">Charge h:</span> <span className="font-medium">{fmt(test.headCm)} cm</span></div>}
          {test.standpipeAreaCm2 != null && <div><span className="text-gray-500">Aire tube:</span> <span className="font-medium">{fmt(test.standpipeAreaCm2, 3)} cm²</span></div>}
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Lectures</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>#</th>
              {test.testType === 'CONSTANT_HEAD' ? (
                <th className={col}>Q (mL)</th>
              ) : (
                <>
                  <th className={col}>h1 (cm)</th>
                  <th className={col}>h2 (cm)</th>
                </>
              )}
              <th className={col}>t (s)</th>
              <th className={col}>k (cm/s)</th>
            </tr>
          </thead>
          <tbody>
            {test.readings.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className={`${col} text-gray-500`}>{r.readingNumber}</td>
                {test.testType === 'CONSTANT_HEAD' ? (
                  <td className={`${col} text-right`}>{fmt(r.flowVolumeMl)}</td>
                ) : (
                  <>
                    <td className={`${col} text-right`}>{fmt(r.initialHeadCm)}</td>
                    <td className={`${col} text-right`}>{fmt(r.finalHeadCm)}</td>
                  </>
                )}
                <td className={`${col} text-right`}>{fmt(r.elapsedTimeS, 1)}</td>
                <td className={`${col} text-right font-medium text-brand-700`}>{fmtExp(r.kCms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
