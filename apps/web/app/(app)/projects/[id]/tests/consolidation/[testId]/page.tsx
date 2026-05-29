'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useConsolTest, useUpdateConsolTestStatus } from '@/hooks/useConsolTests';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['IN_PROGRESS'], IN_PROGRESS: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'IN_PROGRESS'], APPROVED: [], REJECTED: ['IN_PROGRESS'],
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', IN_PROGRESS: 'En cours',
  PENDING_REVIEW: 'En révision', APPROVED: 'Approuvé', REJECTED: 'Rejeté',
};
const LOAD_TYPE_LABELS: Record<string, string> = {
  LOADING: 'Chargement', UNLOADING: 'Déchargement', RELOADING: 'Rechargement',
};
const STAGE_COLORS = ['#0057A8', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

function fmt(v: number | undefined | null, dec = 2): string {
  return v != null ? v.toFixed(dec) : '—';
}

export default function ConsolTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useConsolTest(testId);
  const updateStatus = useUpdateConsolTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const transitions = STATUS_TRANSITIONS[test.status] ?? [];

  // e-log(σ') curve data
  const eLogData = test.stages
    .filter(s => s.eFinal != null && s.sigmaVKpa > 0)
    .map(s => ({
      logSigma: Math.log10(s.sigmaVKpa),
      sigmaLabel: s.sigmaVKpa.toFixed(0),
      e: s.eFinal,
      type: s.loadType,
    }));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Consolidation (D-2435)</h1>
          <p className="text-sm text-gray-500">
            Drainage {test.drainageType === 'DOUBLE' ? 'double' : 'simple'} · Créé le {new Date(test.createdAt).toLocaleDateString('fr-CA')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={test.status} label={STATUS_LABELS[test.status] ?? test.status} />
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/consolidation/${testId}/edit`)}>
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

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{fmt(test.cc, 3)}</div>
          <div className="text-xs text-gray-500 mt-1">Cc (indice de compression)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{fmt(test.cs, 3)}</div>
          <div className="text-xs text-gray-500 mt-1">Cs (indice de gonflement)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-brand-700">{fmt(test.sigmaPKpa, 0)} kPa</div>
          <div className="text-xs text-gray-500 mt-1">σ&apos;p (préconsolidation)</div>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Courbe e-log σ&apos;</h2>
        <p className="text-xs text-gray-400">Axe X: log₁₀(σ&apos;v) — les paliers de chargement sont tracés</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={eLogData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="logSigma" type="number" domain={['auto', 'auto']}
              tickFormatter={v => `${Math.pow(10, v).toFixed(0)}`}
              label={{ value: 'σ\'v (kPa)', position: 'insideBottom', offset: -10 }} />
            <YAxis label={{ value: 'e', angle: -90, position: 'insideLeft' }} domain={['auto', 'auto']} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => typeof v === 'number' ? v.toFixed(4) : String(v)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(l: any) => `σ'=${Math.pow(10, Number(l)).toFixed(0)} kPa`} />
            <Line type="linear" dataKey="e" stroke="#0057A8" strokeWidth={2} dot={{ fill: '#0057A8', r: 4 }} name="e" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Paramètres de l&apos;éprouvette</h2>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Diamètre:</span> <span className="font-medium">{fmt(test.specimenDiameterMm)} mm</span></div>
          <div><span className="text-gray-500">H₀:</span> <span className="font-medium">{fmt(test.initialHeightMm)} mm</span></div>
          <div><span className="text-gray-500">e₀:</span> <span className="font-medium">{fmt(test.initialVoidRatio, 3)}</span></div>
          <div><span className="text-gray-500">Gs:</span> <span className="font-medium">{fmt(test.specificGravity, 3)}</span></div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Résultats par palier</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>Palier</th>
              <th className={col}>Type</th>
              <th className={col}>σ&apos;v (kPa)</th>
              <th className={col}>e final</th>
              <th className={col}>cv (m²/an)</th>
              <th className={col}>mv (m²/kN)</th>
              <th className={col}>t50 (min)</th>
              <th className={col}>Lectures</th>
            </tr>
          </thead>
          <tbody>
            {test.stages.map((stage, si) => (
              <tr key={stage.id} className="hover:bg-gray-50">
                <td className={`${col} font-medium`} style={{ color: STAGE_COLORS[si % 6] }}>Palier {si + 1}</td>
                <td className={`${col} text-gray-600`}>{LOAD_TYPE_LABELS[stage.loadType] ?? stage.loadType}</td>
                <td className={`${col} text-right`}>{fmt(stage.sigmaVKpa, 0)}</td>
                <td className={`${col} text-right font-medium text-brand-700`}>{fmt(stage.eFinal, 4)}</td>
                <td className={`${col} text-right`}>{fmt(stage.cvM2Yr, 4)}</td>
                <td className={`${col} text-right`}>{stage.mvM2Kn != null ? stage.mvM2Kn.toExponential(3) : '—'}</td>
                <td className={`${col} text-right text-gray-500`}>{fmt(stage.t50Min, 2)}</td>
                <td className={`${col} text-center text-gray-500`}>{stage.readings.length}</td>
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
