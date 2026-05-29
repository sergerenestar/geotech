'use client';

import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { usePsTest, useUpdatePsTestStatus } from '@/hooks/usePsTests';
import GrainSizeCurve from '@/components/charts/GrainSizeCurve';
import { useState } from 'react';

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

export default function PsTestResultsPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = usePsTest(testId);
  const updateStatus = useUpdatePsTestStatus();

  if (isLoading) return <div className="p-6 text-gray-500">Chargement...</div>;
  if (!test) return <div className="p-6 text-red-500">Test introuvable.</div>;

  const transitions = STATUS_TRANSITIONS[test.status] ?? [];
  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const [showCctp, setShowCctp] = useState(false);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Résultats — Analyse granulométrique (D-422)</h1>
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
          <div className="text-2xl font-bold text-gray-700">
            {test.pctGravel != null ? `${test.pctGravel.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Gravier (&gt;4.75 mm)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">
            {test.pctSand != null ? `${test.pctSand.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Sable (0.075–4.75 mm)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">
            {test.pctFines != null ? `${test.pctFines.toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Fines (&lt;0.075 mm)</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-gray-900">{test.uscsSymbol ?? '—'}</div>
          <div className="text-xs text-gray-500 mt-1">{test.uscsName ?? 'USCS'}</div>
        </Card>
      </div>

      {(test.d10Mm != null || test.d30Mm != null || test.d60Mm != null || test.cu != null || test.cc != null) && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'D₁₀', value: test.d10Mm, unit: 'mm' },
            { label: 'D₃₀', value: test.d30Mm, unit: 'mm' },
            { label: 'D₆₀', value: test.d60Mm, unit: 'mm' },
            { label: 'Cᵤ', value: test.cu, unit: '' },
            { label: 'Cc', value: test.cc, unit: '' },
          ].map(item => (
            <Card key={item.label} className="p-3 text-center">
              <div className="text-lg font-bold text-brand-700">
                {item.value != null ? `${item.value.toFixed(item.unit === 'mm' ? 4 : 2)}${item.unit}` : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Courbe granulométrique</h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCctp}
              onChange={e => setShowCctp(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Enveloppe CCTP (GNT)
          </label>
        </div>
        <GrainSizeCurve sieveResults={test.sieveResults} showCctp={showCctp} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Résultats par tamis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>Tamis</th>
                <th className={col}>Ouverture (mm)</th>
                <th className={col}>Masse retenue (g)</th>
                <th className={col}>% retenu</th>
                <th className={col}>% passant</th>
              </tr>
            </thead>
            <tbody>
              {test.sieveResults
                .slice()
                .sort((a, b) => b.openingMm - a.openingMm)
                .map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className={`${col} font-medium`}>{s.sieveLabel}</td>
                    <td className={`${col} text-center text-gray-500`}>{s.openingMm}</td>
                    <td className={`${col} text-right`}>{s.massRetainedG.toFixed(2)}</td>
                    <td className={`${col} text-right text-gray-500`}>
                      {s.pctRetained != null ? `${s.pctRetained.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`${col} text-right font-medium ${
                      s.openingMm === 4.75 ? 'text-blue-700' :
                      s.openingMm === 0.075 ? 'text-violet-700' : 'text-gray-700'
                    }`}>
                      {s.pctFiner != null ? `${s.pctFiner.toFixed(1)}%` : '—'}
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
