'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreatePsTest, SieveResultInput } from '@/hooks/usePsTests';

const ASTM_SIEVES = [
  { label: '2"',      openingMm: 50.80 },
  { label: '1"',      openingMm: 25.40 },
  { label: '3/4"',    openingMm: 19.05 },
  { label: '3/8"',    openingMm: 9.525 },
  { label: 'No. 4',   openingMm: 4.750 },
  { label: 'No. 10',  openingMm: 2.000 },
  { label: 'No. 40',  openingMm: 0.425 },
  { label: 'No. 100', openingMm: 0.150 },
  { label: 'No. 200', openingMm: 0.075 },
];

// NF P94-056 sieve series (French standard)
const NF_SIEVES = [
  { label: '40 mm',    openingMm: 40.000 },
  { label: '31.5 mm',  openingMm: 31.500 },
  { label: '25 mm',    openingMm: 25.000 },
  { label: '20 mm',    openingMm: 20.000 },
  { label: '16 mm',    openingMm: 16.000 },
  { label: '12.5 mm',  openingMm: 12.500 },
  { label: '10 mm',    openingMm: 10.000 },
  { label: '8 mm',     openingMm: 8.000  },
  { label: '6.3 mm',   openingMm: 6.300  },
  { label: '5 mm',     openingMm: 5.000  },
  { label: '4 mm',     openingMm: 4.000  },
  { label: '2 mm',     openingMm: 2.000  },
  { label: '1 mm',     openingMm: 1.000  },
  { label: '0.5 mm',   openingMm: 0.500  },
  { label: '0.315 mm', openingMm: 0.315  },
  { label: '0.2 mm',   openingMm: 0.200  },
  { label: '0.08 mm',  openingMm: 0.080  },
];

type SieveStandard = 'NF' | 'ASTM';

export default function NewPsTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreatePsTest();

  const [totalDryMassG, setTotalDryMassG] = useState('');
  const [specificGravity, setSpecificGravity] = useState('2.70');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [standard, setStandard] = useState<SieveStandard>('NF');

  const STANDARD_SIEVES = standard === 'NF' ? NF_SIEVES : ASTM_SIEVES;

  const [sieveRows, setSieveRows] = useState(
    NF_SIEVES.map(s => ({ ...s, massRetainedG: '' }))
  );

  function switchStandard(newStd: SieveStandard) {
    setStandard(newStd);
    setSieveRows((newStd === 'NF' ? NF_SIEVES : ASTM_SIEVES).map(s => ({ ...s, massRetainedG: '' })));
  }

  function updateSieveRow(i: number, val: string) {
    setSieveRows(rows => rows.map((r, idx) => idx === i ? { ...r, massRetainedG: val } : r));
  }

  function getPctRetained(massRetained: number, total: number) {
    if (total <= 0) return null;
    return (massRetained / total) * 100;
  }

  const totalDry = parseFloat(totalDryMassG) || 0;

  const filledRows = sieveRows.filter(r => r.massRetainedG !== '');
  let cumRetained = 0;
  const computed = sieveRows.map(r => {
    if (!r.massRetainedG) return { ...r, pctRetained: null, pctFiner: null };
    const pct = getPctRetained(parseFloat(r.massRetainedG), totalDry);
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
      const test = await createTest.mutateAsync({
        projectId,
        testType: 'SIEVE',
        totalDryMassG: parseFloat(totalDryMassG),
        specificGravity: parseFloat(specificGravity) || 2.70,
        notes: notes || undefined,
        sieveResults,
      });
      router.push(`/projects/${projectId}/tests/particle-size/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du test.');
    }
  }

  const col = 'border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Analyse granulométrique</h1>
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
              placeholder="ex: 500.0"
            />
            <Input
              label="Densité relative (Gs)"
              type="number" step="0.001"
              value={specificGravity}
              onChange={e => setSpecificGravity(e.target.value)}
              placeholder="2.70"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Observations..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Analyse par tamisage</h2>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50 text-sm">
              {(['NF', 'ASTM'] as SieveStandard[]).map(s => (
                <button key={s} type="button"
                  onClick={() => switchStandard(s)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${standard === s ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'NF' ? 'NF P94-056' : 'ASTM D-422'}
                </button>
              ))}
            </div>
          </div>
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
          <Button type="submit" disabled={createTest.isPending}>
            {createTest.isPending ? 'Enregistrement...' : 'Enregistrer le test'}
          </Button>
        </div>
      </form>
    </div>
  );
}
