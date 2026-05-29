'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useUcTest, useUpdateUcTestStatus } from '@/hooks/useUcTests';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};

export default function UcTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useUcTest(testId);
  const updateStatus = useUpdateUcTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  const chartData = test.readings
    .filter(r => r.strainPct != null && r.stressKpa != null)
    .map(r => ({ strain: r.strainPct, stress: r.stressKpa }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Compression non confinée (D-2166)</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/unconfined-compression/${testId}/edit`)}>Modifier</Button>
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${test.aiFlag === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-semibold">{test.aiFlag === 'ERROR' ? 'Erreur' : 'Avertissement'}:</span> {test.aiFlagMessage}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{test.quKpa != null ? `${test.quKpa.toFixed(1)}` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">qu (kPa)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{test.suKpa != null ? `${test.suKpa.toFixed(1)}` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Su = qu/2 (kPa)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{test.failureStrainPct != null ? `${test.failureStrainPct.toFixed(2)}%` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Déformation à rupture</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-gray-700">{test.failureMode ?? '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Mode de rupture</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Courbe contrainte-déformation</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="strain" type="number" domain={['auto', 'auto']} name="Déformation (%)"
              label={{ value: 'Déformation axiale (%)', position: 'insideBottom', offset: -10 }} />
            <YAxis label={{ value: 'Contrainte (kPa)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(1)} kPa` : v} labelFormatter={(l: any) => typeof l === 'number' ? `ε = ${l.toFixed(2)}%` : l} />
            <Line dataKey="stress" stroke="#0057A8" dot={false} strokeWidth={2} name="Contrainte (kPa)" />
            {test.failureStrainPct != null && (
              <ReferenceLine x={test.failureStrainPct} stroke="#E87722" strokeDasharray="4 4"
                label={{ value: `qu=${test.quKpa?.toFixed(1)} kPa`, fill: '#E87722', fontSize: 11 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Paramètres de l&apos;essai</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-gray-500">H₀:</span> <span className="font-medium">{test.initialHeightMm} mm</span></div>
          <div><span className="text-gray-500">d₀:</span> <span className="font-medium">{test.initialDiameterMm} mm</span></div>
          <div><span className="text-gray-500">Facteur anneau:</span> <span className="font-medium">{test.calibrationFactorNPerDiv} N/div</span></div>
          <div><span className="text-gray-500">Facteur cadran:</span> <span className="font-medium">{test.dialGaugeFactorMmPerDiv} mm/div</span></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Lectures</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Déf. (div)</th>
                <th className={col}>Anneau (div)</th>
                <th className={col}>Déf. (mm)</th>
                <th className={col}>Charge (N)</th>
                <th className={col}>ε (%)</th>
                <th className={col}>σ (kPa)</th>
              </tr>
            </thead>
            <tbody>
              {test.readings.map((r, i) => {
                const isPeak = test.failureStrainPct != null && r.strainPct != null &&
                  Math.abs(r.strainPct - test.failureStrainPct) < 0.01;
                return (
                  <tr key={r.id} className={isPeak ? 'bg-brand-50 font-semibold' : 'hover:bg-gray-50'}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    <td className={`${col} text-right`}>{r.deformationDiv}</td>
                    <td className={`${col} text-right`}>{r.provingRingDiv}</td>
                    <td className={`${col} text-right text-gray-500`}>{r.deformationMm?.toFixed(3) ?? '—'}</td>
                    <td className={`${col} text-right text-gray-500`}>{r.loadN?.toFixed(1) ?? '—'}</td>
                    <td className={`${col} text-right text-gray-500`}>{r.strainPct?.toFixed(3) ?? '—'}%</td>
                    <td className={`${col} text-right ${isPeak ? 'text-brand-700' : 'text-gray-700'}`}>{r.stressKpa?.toFixed(1) ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
