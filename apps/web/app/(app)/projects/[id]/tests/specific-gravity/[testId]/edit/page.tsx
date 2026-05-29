'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSgTest, useUpdateSgTest, SgDeterminationInput } from '@/hooks/useSgTests';

const K_TABLE: [number, number][] = [
  [15, 0.9986], [16, 0.9989], [17, 0.9992], [18, 0.9994], [19, 0.9997],
  [20, 1.0000], [21, 1.0003], [22, 1.0006], [23, 1.0009], [24, 1.0012],
  [25, 1.0016], [26, 1.0019], [27, 1.0023], [28, 1.0026], [29, 1.0030], [30, 1.0034],
];

function getK(tempC: number): number {
  if (tempC <= 15) return 0.9986;
  if (tempC >= 30) return 1.0034;
  const lo = K_TABLE.findLast(([t]) => t <= tempC)!;
  const hi = K_TABLE.find(([t]) => t > tempC)!;
  const frac = (tempC - lo[0]) / (hi[0] - lo[0]);
  return lo[1] + frac * (hi[1] - lo[1]);
}

function calcGs(massDry: number, massFlaskWater: number, massFlaskSoilWater: number, tempC: number): { gsAtTemp: number; gs20: number } | null {
  const denom = massDry + massFlaskWater - massFlaskSoilWater;
  if (!denom || denom <= 0) return null;
  const gsAtTemp = massDry / denom;
  const k = getK(tempC);
  return { gsAtTemp, gs20: gsAtTemp * k };
}

export default function EditSgTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useSgTest(testId);
  const updateTest = useUpdateSgTest();

  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<Array<{ flask: string; massDry: string; massFlaskWater: string; massFlaskSoilWater: string; temp: string }>>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setNotes(test.notes ?? '');
      setRows(test.determinations.map(d => ({
        flask: d.flaskNumber ?? '',
        massDry: String(d.massDrySoilG),
        massFlaskWater: String(d.massFlaskWaterG),
        massFlaskSoilWater: String(d.massFlaskSoilWaterG),
        temp: String(d.temperatureC),
      })));
      setReady(true);
    }
  }, [test, ready]);

  function update(i: number, field: string, val: string) {
    setRows(r => r.map((x, j) => j === i ? { ...x, [field]: val } : x));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const determinations: SgDeterminationInput[] = rows
      .filter(r => r.massDry && r.massFlaskWater && r.massFlaskSoilWater && r.temp)
      .map(r => ({
        flaskNumber: r.flask || undefined,
        massDrySoilG: parseFloat(r.massDry),
        massFlaskWaterG: parseFloat(r.massFlaskWater),
        massFlaskSoilWaterG: parseFloat(r.massFlaskSoilWater),
        temperatureC: parseFloat(r.temp),
      }));
    if (determinations.length < 2) { setError('Au moins 2 déterminations sont requises.'); return; }
    try {
      await updateTest.mutateAsync({ testId, payload: { projectId, notes: notes || undefined, determinations } });
      router.push(`/projects/${projectId}/tests/specific-gravity/${testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  const col = 'border border-gray-200 px-2 py-1 text-sm';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Densité relative (D-854)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Déterminations (pycnomètre)</h2>
            <Button type="button" variant="secondary" onClick={() => setRows(r => [...r, { flask: '', massDry: '', massFlaskWater: '', massFlaskSoilWater: '', temp: '20' }])}>+ Ajouter</Button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Flacon</th>
                <th className={col}>M sol sec (g)</th>
                <th className={col}>M flacon+eau (g)</th>
                <th className={col}>M flacon+sol+eau (g)</th>
                <th className={col}>Temp (°C)</th>
                <th className={col}>Gs(T)</th>
                <th className={col}>Gs(20°C)</th>
                <th className={col}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const md = parseFloat(r.massDry), mfw = parseFloat(r.massFlaskWater), mfsw = parseFloat(r.massFlaskSoilWater), t = parseFloat(r.temp);
                const res = (md && mfw && mfsw && !isNaN(t)) ? calcGs(md, mfw, mfsw, t) : null;
                return (
                  <tr key={i}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    <td className={col}><input type="text" value={r.flask} onChange={e => update(i, 'flask', e.target.value)} className="w-14 border-0 outline-none bg-transparent text-center" /></td>
                    <td className={col}><input type="number" step="0.01" value={r.massDry} onChange={e => update(i, 'massDry', e.target.value)} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={r.massFlaskWater} onChange={e => update(i, 'massFlaskWater', e.target.value)} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.01" value={r.massFlaskSoilWater} onChange={e => update(i, 'massFlaskSoilWater', e.target.value)} className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.1" value={r.temp} onChange={e => update(i, 'temp', e.target.value)} className="w-14 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={`${col} text-right text-gray-500`}>{res ? res.gsAtTemp.toFixed(3) : '—'}</td>
                    <td className={`${col} text-right font-medium text-brand-700`}>{res ? res.gs20.toFixed(3) : '—'}</td>
                    <td className={col}>{rows.length > 2 && <button type="button" onClick={() => setRows(r => r.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
            {rows.some(r => r.massDry && r.massFlaskWater && r.massFlaskSoilWater) && (() => {
              const gs20s = rows.map(r => {
                const md = parseFloat(r.massDry), mfw = parseFloat(r.massFlaskWater), mfsw = parseFloat(r.massFlaskSoilWater), t = parseFloat(r.temp);
                const res = (md && mfw && mfsw && !isNaN(t)) ? calcGs(md, mfw, mfsw, t) : null;
                return res?.gs20;
              }).filter(Boolean) as number[];
              if (gs20s.length < 2) return null;
              const avg = gs20s.reduce((a, b) => a + b, 0) / gs20s.length;
              return (
                <tfoot>
                  <tr className="bg-brand-50 font-semibold">
                    <td colSpan={7} className={`${col} text-right text-gray-600`}>Gs moyen (20°C)</td>
                    <td className={`${col} text-right text-brand-700`}>{avg.toFixed(3)}</td>
                    <td className={col}></td>
                  </tr>
                </tfoot>
              );
            })()}
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
