'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateProctorTest, ProctorPointInput } from '@/hooks/useProctorTests';
import { useSgTestsByProject } from '@/hooks/useSgTests';

export default function NewProctorTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreateProctorTest();
  const { data: sgTests = [] } = useSgTestsByProject(projectId as string);
  const [gsPrefilled, setGsPrefilled] = useState(false);

  const [method, setMethod] = useState<'STANDARD' | 'MODIFIED'>('STANDARD');
  const [moldVolumeCm3, setMoldVolumeCm3] = useState('944');
  const [moldMassG, setMoldMassG] = useState('');
  const [specificGravity, setSpecificGravity] = useState('2.70');

  useEffect(() => {
    if (!gsPrefilled && sgTests.length > 0) {
      const latest = sgTests.find(t => t.gsAverage != null) ?? sgTests[0];
      if (latest?.gsAverage != null) {
        setSpecificGravity(String(latest.gsAverage.toFixed(4)));
        setGsPrefilled(true);
      }
    }
  }, [sgTests, gsPrefilled]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [points, setPoints] = useState<Array<{ massMoldSoilG: string; waterContentPct: string }>>([
    { massMoldSoilG: '', waterContentPct: '' },
    { massMoldSoilG: '', waterContentPct: '' },
    { massMoldSoilG: '', waterContentPct: '' },
    { massMoldSoilG: '', waterContentPct: '' },
    { massMoldSoilG: '', waterContentPct: '' },
  ]);

  const moldMass = parseFloat(moldMassG) || 0;
  const moldVol = parseFloat(moldVolumeCm3) || 944;
  const gs = parseFloat(specificGravity) || 2.70;

  function calcDryUnit(massMoldSoil: string, wPct: string): number | null {
    const m = parseFloat(massMoldSoil);
    const w = parseFloat(wPct);
    if (!m || isNaN(w) || !moldMass || !moldVol) return null;
    const gammaT = ((m - moldMass) / moldVol) * 9.81;
    return gammaT / (1 + w / 100);
  }

  function calcZav(w: number): number {
    return (gs * 9.81) / (1 + gs * w / 100);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!moldMassG || parseFloat(moldMassG) <= 0) { setError('La masse du moule est requise.'); return; }

    const validPoints: ProctorPointInput[] = points
      .filter(p => p.massMoldSoilG && p.waterContentPct)
      .map(p => ({ massMoldSoilG: parseFloat(p.massMoldSoilG), waterContentPct: parseFloat(p.waterContentPct) }));

    if (validPoints.length < 3) { setError('Au moins 3 points de compactage sont requis.'); return; }

    try {
      const test = await createTest.mutateAsync({
        projectId,
        method,
        moldVolumeCm3: moldVol,
        moldMassG: moldMass,
        specificGravity: gs,
        notes: notes || undefined,
        points: validPoints,
      });
      router.push(`/projects/${projectId}/tests/proctor/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    }
  }

  const col = 'border border-gray-200 px-3 py-2 text-sm';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Proctor (D-698/D-1557)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Méthode</label>
              <select value={method} onChange={e => setMethod(e.target.value as 'STANDARD' | 'MODIFIED')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="STANDARD">Standard (D-698)</option>
                <option value="MODIFIED">Modifié (D-1557)</option>
              </select>
            </div>
            <Input label="Volume moule (cm³)" type="number" step="0.01" required
              value={moldVolumeCm3} onChange={e => setMoldVolumeCm3(e.target.value)} placeholder="ex: 944" />
            <Input label="Masse moule vide (g)" type="number" step="0.1" required
              value={moldMassG} onChange={e => setMoldMassG(e.target.value)} placeholder="ex: 4250" />
            <Input label="Poids Spécifique (Gs)" type="number" step="0.001"
              value={specificGravity} onChange={e => setSpecificGravity(e.target.value)} placeholder="2.70" />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Points de compactage</h2>
            <Button type="button" variant="secondary" onClick={() => setPoints(p => [...p, { massMoldSoilG: '', waterContentPct: '' }])}>+ Ajouter</Button>
          </div>
          <p className="text-sm text-gray-500">Minimum 5 points recommandés (au moins 2 de chaque côté du pic).</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                <th className={col}>Masse moule+sol (g)</th>
                <th className={col}>Teneur en eau (%)</th>
                <th className={col}>γd (kN/m³)</th>
                <th className={col}>ZAV (kN/m³)</th>
                <th className={col}></th>
              </tr>
            </thead>
            <tbody>
              {points.map((pt, i) => {
                const gd = calcDryUnit(pt.massMoldSoilG, pt.waterContentPct);
                const w = parseFloat(pt.waterContentPct);
                const zav = !isNaN(w) && w >= 0 ? calcZav(w) : null;
                return (
                  <tr key={i}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    <td className={col}><input type="number" step="0.1" value={pt.massMoldSoilG}
                      onChange={e => setPoints(p => p.map((x, j) => j === i ? { ...x, massMoldSoilG: e.target.value } : x))}
                      className="w-28 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={col}><input type="number" step="0.1" value={pt.waterContentPct}
                      onChange={e => setPoints(p => p.map((x, j) => j === i ? { ...x, waterContentPct: e.target.value } : x))}
                      className="w-20 border-0 outline-none text-right bg-transparent" /></td>
                    <td className={`${col} text-right font-medium text-brand-700`}>{gd != null ? gd.toFixed(2) : '—'}</td>
                    <td className={`${col} text-right text-gray-400`}>{zav != null ? zav.toFixed(2) : '—'}</td>
                    <td className={col}>{points.length > 3 && <button type="button" onClick={() => setPoints(p => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={createTest.isPending}>{createTest.isPending ? 'Enregistrement...' : 'Enregistrer le test'}</Button>
        </div>
      </form>
    </div>
  );
}
