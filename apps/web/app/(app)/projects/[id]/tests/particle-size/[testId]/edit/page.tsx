'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { usePsTest, useUpdatePsTest, SieveResultInput } from '@/hooks/usePsTests';

const STANDARD_SIEVES = [
  { label: '2"', openingMm: 50.0 },
  { label: '3/4"', openingMm: 19.0 },
  { label: '3/8"', openingMm: 9.5 },
  { label: 'No. 4', openingMm: 4.75 },
  { label: 'No. 10', openingMm: 2.00 },
  { label: 'No. 40', openingMm: 0.425 },
  { label: 'No. 100', openingMm: 0.150 },
  { label: 'No. 200', openingMm: 0.075 },
];

export default function EditPsTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = usePsTest(testId);
  const updateTest = useUpdatePsTest();

  const [totalDryMassG, setTotalDryMassG] = useState('');
  const [specificGravity, setSpecificGravity] = useState('2.70');
  const [notes, setNotes] = useState('');
  const [sieveRows, setSieveRows] = useState(STANDARD_SIEVES.map(s => ({ ...s, massRetainedG: '' })));
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setTotalDryMassG(String(test.totalDryMassG));
      setSpecificGravity(String(test.specificGravity ?? 2.70));
      setNotes(test.notes ?? '');
      setSieveRows(STANDARD_SIEVES.map(s => {
        const existing = test.sieveResults.find(r => r.sieveLabel === s.label);
        return { ...s, massRetainedG: existing ? String(existing.massRetainedG) : '' };
      }));
      setReady(true);
    }
  }, [test, ready]);

  function updateSieveRow(i: number, val: string) {
    setSieveRows(rows => rows.map((r, idx) => idx === i ? { ...r, massRetainedG: val } : r));
  }

  const totalDry = parseFloat(totalDryMassG) || 0;
  const filledRows = sieveRows.filter(r => r.massRetainedG !== '');
  let cumRetained = 0;
  const computed = sieveRows.map(r => {
    if (!r.massRetainedG) return { ...r, pctRetained: null, pctFiner: null };
    const pct = totalDry > 0 ? (parseFloat(r.massRetainedG) / totalDry) * 100 : null;
    if (pct != null) cumRetained += pct;
    return { ...r, pctRetained: pct, pctFiner: pct != null ? 100 - cumRetained : null };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!totalDryMassG || parseFloat(totalDryMassG) <= 0) {
      setError('La masse totale sèche est requise.');
      return;
    }

    const sieveResults: SieveResultInput[] = sieveRows
      .filter(r => r.massRetainedG !== '')
      .map(r => ({
        sieveLabel: r.label,
        openingMm: r.openingMm,
        massRetainedG: parseFloat(r.massRetainedG),
      }));

    if (sieveResults.length === 0) {
      setError('Au moins un résultat de tamis est requis.');
      return;
    }

    try {
      await updateTest.mutateAsync({
        testId,
        payload: {
          projectId,
          testType: 'SIEVE',
          totalDryMassG: parseFloat(totalDryMassG),
          specificGravity: parseFloat(specificGravity) || 2.70,
          notes: notes || undefined,
          sieveResults,
        },
      });
      router.push(`/projects/${projectId}/tests/particle-size/${testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  const col = 'border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Analyse granulométrique (D-422)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Masse totale sèche (g)"
              type="number" step="0.1" required
              value={totalDryMassG}
              onChange={e => setTotalDryMassG(e.target.value)}
            />
            <Input
              label="Densité relative (Gs)"
              type="number" step="0.001"
              value={specificGravity}
              onChange={e => setSpecificGravity(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Analyse par tamisage</h2>
          <p className="text-sm text-gray-500">Laisser vide les tamis non utilisés. Les pourcentages sont calculés en temps réel.</p>
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
                {computed.map((row, i) => (
                  <tr key={i} className={row.massRetainedG ? '' : 'opacity-50'}>
                    <td className={`${col} font-medium`}>{row.label}</td>
                    <td className={`${col} text-center text-gray-500`}>{row.openingMm}</td>
                    <td className={col}>
                      <input
                        type="number" step="0.01" min="0"
                        value={row.massRetainedG}
                        onChange={e => updateSieveRow(i, e.target.value)}
                        className="w-28 border-0 outline-none text-right bg-transparent"
                        placeholder="0.00"
                      />
                    </td>
                    <td className={`${col} text-right text-gray-500`}>
                      {row.pctRetained != null ? `${row.pctRetained.toFixed(1)}%` : '—'}
                    </td>
                    <td className={`${col} text-right font-medium ${
                      row.openingMm === 4.75 ? 'text-blue-700' :
                      row.openingMm === 0.075 ? 'text-violet-700' : 'text-gray-700'
                    }`}>
                      {row.pctFiner != null ? `${row.pctFiner.toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                ))}
                {filledRows.length > 0 && totalDry > 0 && (
                  <tr className="bg-gray-50 font-semibold text-xs">
                    <td colSpan={2} className={`${col} text-right text-gray-600`}>Récupération totale</td>
                    <td className={`${col} text-right`}>
                      {filledRows.reduce((s, r) => s + parseFloat(r.massRetainedG || '0'), 0).toFixed(1)} g
                    </td>
                    <td colSpan={2} className={`${col} text-gray-400`}>
                      {((filledRows.reduce((s, r) => s + parseFloat(r.massRetainedG || '0'), 0) / totalDry) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={updateTest.isPending}>
            {updateTest.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
