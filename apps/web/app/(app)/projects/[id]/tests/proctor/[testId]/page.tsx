'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useProctorTest, useUpdateProctorTestStatus } from '@/hooks/useProctorTests';
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};

export default function ProctorTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useProctorTest(testId);
  const updateStatus = useUpdateProctorTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  // Build scatter data + ZAV curves (Sr=100% and Sr=90%)
  const scatterData = test.points.map(p => ({
    w: p.waterContentPct,
    gd: p.dryUnitWeightKnM3 ?? 0,
  }));
  const gs = test.specificGravity ?? 2.70;
  const wMin = Math.min(...test.points.map(p => p.waterContentPct)) - 2;
  const wMax = Math.max(...test.points.map(p => p.waterContentPct)) + 5;
  const zavData = Array.from({ length: 30 }, (_, i) => {
    const w = wMin + (i / 29) * (wMax - wMin);
    const gd100 = (gs * 9.81) / (1 + gs * w / 100);
    const gd90 = (0.9 * gs * 9.81) / (1 + 0.9 * gs * w / 100);
    return { w: +w.toFixed(2), zav100: +gd100.toFixed(3), zav90: +gd90.toFixed(3) };
  });
  // Dual unit display: 1 kN/m³ = 0.10197 T/m³
  const gdMaxTm3 = test.gdMaxKnM3 != null ? (test.gdMaxKnM3 / 9.81).toFixed(3) : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Proctor ({test.method === 'STANDARD' ? 'D-698' : 'D-1557'})</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/proctor/${testId}/edit`)}>Modifier</Button>
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
          <div className="text-2xl font-bold text-brand-700">{gdMaxTm3 ?? '—'}</div>
          <div className="text-xs text-gray-500 mt-1">γd max (T/m³)</div>
          <div className="text-xs text-gray-400">{test.gdMaxKnM3 != null ? `${test.gdMaxKnM3.toFixed(2)} kN/m³` : ''}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{test.omcPct != null ? `${test.omcPct.toFixed(1)}%` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">OPM (%)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{test.rSquared != null ? test.rSquared.toFixed(3) : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">R² (ajustement)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{test.method === 'STANDARD' ? 'Standard' : 'Modifié'}</div>
          <div className="text-xs text-gray-500 mt-1">Méthode</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Courbe de compactage</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="w" type="number" domain={['auto', 'auto']} name="w (%)" label={{ value: 'Teneur en eau (%)', position: 'insideBottom', offset: -10 }} />
            <YAxis domain={['auto', 'auto']} label={{ value: 'γd (kN/m³)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(v: any) => typeof v === 'number' ? v.toFixed(3) : v} />
            <Legend verticalAlign="top" />
            <Scatter name="Points mesurés" data={scatterData} dataKey="gd" fill="#0057A8" />
            <Line name={`ZAV Sr=100% (Gs=${gs})`} data={zavData} dataKey="zav100" dot={false} stroke="#94a3b8" strokeDasharray="5 5" type="monotone" />
            <Line name="ZAV Sr=90%" data={zavData} dataKey="zav90" dot={false} stroke="#c4b5fd" strokeDasharray="3 5" type="monotone" />
            {test.omcPct != null && <ReferenceLine x={test.omcPct} stroke="#E87722" strokeDasharray="4 4" label={{ value: `OPM=${test.omcPct.toFixed(1)}%`, fill: '#E87722', fontSize: 11 }} />}
            {test.gdMaxKnM3 != null && <ReferenceLine y={test.gdMaxKnM3} stroke="#0057A8" strokeDasharray="4 4" label={{ value: `DSM=${gdMaxTm3} T/m³`, fill: '#0057A8', fontSize: 11 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Points de compactage</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>#</th>
              <th className={col}>Masse moule+sol (g)</th>
              <th className={col}>Teneur en eau (%)</th>
              <th className={col}>γt (kN/m³)</th>
              <th className={col}>γd (kN/m³)</th>
            </tr>
          </thead>
          <tbody>
            {test.points.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                <td className={`${col} text-right`}>{p.massMoldSoilG.toFixed(1)}</td>
                <td className={`${col} text-right`}>{p.waterContentPct.toFixed(1)}%</td>
                <td className={`${col} text-right text-gray-500`}>{p.wetUnitWeightKnM3 != null ? p.wetUnitWeightKnM3.toFixed(3) : '—'}</td>
                <td className={`${col} text-right font-medium text-brand-700`}>{p.dryUnitWeightKnM3 != null ? p.dryUnitWeightKnM3.toFixed(3) : '—'}</td>
              </tr>
            ))}
          </tbody>
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
