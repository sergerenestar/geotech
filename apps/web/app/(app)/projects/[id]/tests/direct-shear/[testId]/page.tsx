'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useDsTest, useUpdateDsTestStatus } from '@/hooks/useDsTests';
import {
  ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};
const STAGE_COLORS = ['#0057A8', '#10b981', '#8b5cf6', '#f59e0b'];

export default function DsTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useDsTest(testId);
  const updateStatus = useUpdateDsTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  // Mohr-Coulomb scatter points
  const mohrPoints = test.stages
    .filter(s => s.peakShearStressKpa != null)
    .map(s => ({ sigma: s.normalStressKpa, tau: s.peakShearStressKpa }));

  // Regression line for Mohr-Coulomb
  let mohrLineData: { sigma: number; tauLine: number }[] = [];
  if (test.cohesionKpa != null && test.frictionAngleDeg != null && mohrPoints.length >= 2) {
    const tanPhi = Math.tan((test.frictionAngleDeg * Math.PI) / 180);
    const c = test.cohesionKpa;
    const xs = mohrPoints.map(p => p.sigma!);
    const xMin = Math.max(0, Math.min(...xs) - 20);
    const xMax = Math.max(...xs) + 20;
    mohrLineData = [
      { sigma: xMin, tauLine: c + tanPhi * xMin },
      { sigma: xMax, tauLine: c + tanPhi * xMax },
    ];
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Cisaillement direct (D-3080)</h1>
          <p className="text-sm text-gray-500">Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/direct-shear/${testId}/edit`)}>Modifier</Button>
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>Retour</Button>
        </div>
      </div>

      {test.aiFlag !== 'NONE' && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${test.aiFlag === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <span className="font-semibold">{test.aiFlag === 'ERROR' ? 'Erreur' : 'Avertissement'}:</span> {test.aiFlagMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{test.cohesionKpa != null ? `${test.cohesionKpa.toFixed(1)} kPa` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Cohésion c</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{test.frictionAngleDeg != null ? `${test.frictionAngleDeg.toFixed(1)}°` : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Angle de frottement φ</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{test.rSquared != null ? test.rSquared.toFixed(3) : '—'}</div>
          <div className="text-xs text-gray-500 mt-1">R² (Mohr-Coulomb)</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800">τ vs déplacement</h2>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="disp" type="number" domain={['auto', 'auto']}
                label={{ value: 'Déplacement (mm)', position: 'insideBottom', offset: -10 }} />
              <YAxis label={{ value: 'τ (kPa)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(1)} kPa` : v} />
              <Legend verticalAlign="top" />
              {test.stages.map((stage, si) => {
                const data = stage.readings
                  .filter(r => r.displacementMm != null && r.shearStressKpa != null)
                  .map(r => ({ disp: r.displacementMm, stress: r.shearStressKpa }));
                return (
                  <Line key={stage.id} data={data} dataKey="stress" stroke={STAGE_COLORS[si % 4]}
                    dot={false} strokeWidth={2} name={`σ=${stage.normalStressKpa} kPa`} type="monotone" />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800">Enveloppe de Mohr-Coulomb</h2>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart margin={{ top: 5, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sigma" type="number" domain={['auto', 'auto']}
                label={{ value: 'σ normale (kPa)', position: 'insideBottom', offset: -10 }} />
              <YAxis label={{ value: 'τ pic (kPa)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Scatter name="τ pic" data={mohrPoints} dataKey="tau" fill="#0057A8" />
              {mohrLineData.length > 0 && (
                <Line data={mohrLineData} dataKey="tauLine" stroke="#D92D20" strokeWidth={2}
                  dot={false} name={`τ = ${test.cohesionKpa?.toFixed(1)} + σ·tan(${test.frictionAngleDeg?.toFixed(1)}°)`} type="linear" />
              )}
              <Legend verticalAlign="top" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Résultats par étape</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>Étape</th>
              <th className={col}>σ normale (kPa)</th>
              <th className={col}>τ pic (kPa)</th>
              <th className={col}>Dépl. à pic (mm)</th>
              <th className={col}>Lectures</th>
            </tr>
          </thead>
          <tbody>
            {test.stages.map((stage, si) => (
              <tr key={stage.id} className="hover:bg-gray-50">
                <td className={`${col} font-medium`} style={{ color: STAGE_COLORS[si % 4] }}>Étape {si + 1}</td>
                <td className={`${col} text-right`}>{stage.normalStressKpa.toFixed(1)}</td>
                <td className={`${col} text-right font-medium text-brand-700`}>{stage.peakShearStressKpa?.toFixed(1) ?? '—'}</td>
                <td className={`${col} text-right text-gray-500`}>{stage.displacementAtPeakMm?.toFixed(3) ?? '—'}</td>
                <td className={`${col} text-center text-gray-500`}>{stage.readings.length}</td>
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
