'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useLlTest, useUpdateLlTest, CasagrandePointInput, PlDeterminationInput } from '@/hooks/useLlTests';

function calcWc(cont: number, wet: number, dry: number): number | null {
  const mDry = dry - cont;
  if (mDry <= 0) return null;
  return ((wet - dry) / mDry) * 100;
}

export default function EditLlTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useLlTest(testId);
  const updateTest = useUpdateLlTest();

  const [method, setMethod] = useState<'MULTI_POINT' | 'ONE_POINT'>('MULTI_POINT');
  const [notes, setNotes] = useState('');
  const [casagrandeRows, setCasagrandeRows] = useState<Array<{ blowCount: string; cont: string; wet: string; dry: string }>>([]);
  const [plRows, setPlRows] = useState<Array<{ cont: string; wet: string; dry: string }>>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setMethod((test.method as 'MULTI_POINT' | 'ONE_POINT') ?? 'MULTI_POINT');
      setNotes(test.notes ?? '');
      setCasagrandeRows(test.casagrandePoints.map(p => ({
        blowCount: String(p.blowCount),
        cont: String(p.massContainerG),
        wet: String(p.massContainerWetSoilG),
        dry: String(p.massContainerDrySoilG),
      })));
      setPlRows(test.plDeterminations.map(d => ({
        cont: String(d.massContainerG),
        wet: String(d.massContainerWetSoilG),
        dry: String(d.massContainerDrySoilG),
      })));
      setReady(true);
    }
  }, [test, ready]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const casagrandePoints: CasagrandePointInput[] = casagrandeRows
      .filter(r => r.blowCount && r.cont && r.wet && r.dry)
      .map(r => ({ blowCount: parseInt(r.blowCount), massContainerG: parseFloat(r.cont), massContainerWetSoilG: parseFloat(r.wet), massContainerDrySoilG: parseFloat(r.dry) }));
    const plDeterminations: PlDeterminationInput[] = plRows
      .filter(r => r.cont && r.wet && r.dry)
      .map(r => ({ massContainerG: parseFloat(r.cont), massContainerWetSoilG: parseFloat(r.wet), massContainerDrySoilG: parseFloat(r.dry) }));
    if (casagrandePoints.length === 0) { setError('Au moins un point Casagrande est requis.'); return; }
    if (plDeterminations.length < 2) { setError('Au moins 2 déterminations LP sont requises.'); return; }
    try {
      await updateTest.mutateAsync({ testId, payload: { projectId, method, notes: notes || undefined, casagrandePoints, plDeterminations } });
      router.push(`/projects/${projectId}/tests/liquid-limit/${testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  const col = 'border border-gray-200 px-2 py-1';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Limites d&apos;Atterberg (D-4318)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
              <select value={method} onChange={e => setMethod(e.target.value as 'MULTI_POINT' | 'ONE_POINT')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="MULTI_POINT">Multi-points</option>
                <option value="ONE_POINT">Un seul point</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Points Casagrande (Limite liquide)</h2>
            <Button type="button" variant="secondary" onClick={() => setCasagrandeRows(r => [...r, { blowCount: '', cont: '', wet: '', dry: '' }])}>+ Ajouter</Button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Coups</th>
                <th className={col}>Masse cont. (g)</th>
                <th className={col}>Cont.+humide (g)</th>
                <th className={col}>Cont.+sec (g)</th>
                <th className={col}>w%</th>
                <th className={col}></th>
              </tr>
            </thead>
            <tbody>
              {casagrandeRows.map((row, i) => {
                const wc = row.cont && row.wet && row.dry ? calcWc(+row.cont, +row.wet, +row.dry) : null;
                return (
                  <tr key={i}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    <td className={col}><input type="number" value={row.blowCount} onChange={e => setCasagrandeRows(r => r.map((x, j) => j === i ? { ...x, blowCount: e.target.value } : x))} className="w-16 border-0 outline-none text-center bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={row.cont} onChange={e => setCasagrandeRows(r => r.map((x, j) => j === i ? { ...x, cont: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={row.wet} onChange={e => setCasagrandeRows(r => r.map((x, j) => j === i ? { ...x, wet: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={row.dry} onChange={e => setCasagrandeRows(r => r.map((x, j) => j === i ? { ...x, dry: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={`${col} text-right font-medium text-brand-700`}>{wc != null ? `${wc.toFixed(1)}%` : '—'}</td>
                    <td className={col}>{casagrandeRows.length > 1 && <button type="button" onClick={() => setCasagrandeRows(r => r.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Déterminations LP (Limite plastique)</h2>
            <Button type="button" variant="secondary" onClick={() => setPlRows(r => [...r, { cont: '', wet: '', dry: '' }])}>+ Ajouter</Button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Masse cont. (g)</th>
                <th className={col}>Cont.+humide (g)</th>
                <th className={col}>Cont.+sec (g)</th>
                <th className={col}>w%</th>
                <th className={col}></th>
              </tr>
            </thead>
            <tbody>
              {plRows.map((row, i) => {
                const wc = row.cont && row.wet && row.dry ? calcWc(+row.cont, +row.wet, +row.dry) : null;
                return (
                  <tr key={i}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    <td className={col}><input type="number" step="0.01" value={row.cont} onChange={e => setPlRows(r => r.map((x, j) => j === i ? { ...x, cont: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={row.wet} onChange={e => setPlRows(r => r.map((x, j) => j === i ? { ...x, wet: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={row.dry} onChange={e => setPlRows(r => r.map((x, j) => j === i ? { ...x, dry: e.target.value } : x))} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={`${col} text-right font-medium text-brand-700`}>{wc != null ? `${wc.toFixed(1)}%` : '—'}</td>
                    <td className={col}>{plRows.length > 1 && <button type="button" onClick={() => setPlRows(r => r.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={updateTest.isPending}>{updateTest.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</Button>
        </div>
      </form>
    </div>
  );
}
