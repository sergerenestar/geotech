'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useDsTest, useUpdateDsTest } from '@/hooks/useDsTests';

type Reading = { dispDiv: string; prDiv: string };
type Stage = { normalStress: string; readings: Reading[] };

export default function EditDsTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useDsTest(testId);
  const updateTest = useUpdateDsTest();

  const [boxWidth, setBoxWidth] = useState('60');
  const [boxLength, setBoxLength] = useState('60');
  const [specimenHeight, setSpecimenHeight] = useState('');
  const [dialFactor, setDialFactor] = useState('0.01');
  const [calibFactor, setCalibFactor] = useState('');
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setBoxWidth(String(test.boxWidthMm));
      setBoxLength(String(test.boxLengthMm));
      setSpecimenHeight(test.specimenHeightMm != null ? String(test.specimenHeightMm) : '');
      setDialFactor(String(test.dialFactorMmPerDiv));
      setCalibFactor(String(test.calibrationFactorNPerDiv));
      setNotes(test.notes ?? '');
      setStages(test.stages.map(s => ({
        normalStress: String(s.normalStressKpa),
        readings: s.readings.map(r => ({
          dispDiv: String(r.displacementDiv),
          prDiv: String(r.provingRingDiv),
        })),
      })));
      setReady(true);
    }
  }, [test, ready]);

  const bw = parseFloat(boxWidth) || 60;
  const bl = parseFloat(boxLength) || 60;
  const boxArea = bw * bl;
  const df = parseFloat(dialFactor) || 0.01;
  const cf = parseFloat(calibFactor) || 0;

  function calcStress(prDiv: string): number | null {
    const pd = parseFloat(prDiv);
    if (isNaN(pd) || !cf || !boxArea) return null;
    return (pd * cf / boxArea) * 1000;
  }

  function addReading(si: number) {
    setStages(ss => ss.map((s, i) => i === si ? { ...s, readings: [...s.readings, { dispDiv: '', prDiv: '' }] } : s));
  }
  function updateReading(si: number, ri: number, field: 'dispDiv' | 'prDiv', val: string) {
    setStages(ss => ss.map((s, i) => i === si ? { ...s, readings: s.readings.map((r, j) => j === ri ? { ...r, [field]: val } : r) } : s));
  }
  function updateNormalStress(si: number, val: string) {
    setStages(ss => ss.map((s, i) => i === si ? { ...s, normalStress: val } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!calibFactor) { setError('Le facteur de calibration est requis.'); return; }
    const validStages = stages.filter(s => s.normalStress && s.readings.some(r => r.dispDiv && r.prDiv));
    if (validStages.length < 2) { setError('Au moins 2 étapes valides sont requises.'); return; }
    try {
      await updateTest.mutateAsync({
        testId,
        payload: {
          projectId,
          boxWidthMm: bw,
          boxLengthMm: bl,
          specimenHeightMm: specimenHeight ? parseFloat(specimenHeight) : undefined,
          dialFactorMmPerDiv: df,
          calibrationFactorNPerDiv: cf,
          notes: notes || undefined,
          stages: validStages.map(s => ({
            normalStressKpa: parseFloat(s.normalStress),
            readings: s.readings.filter(r => r.dispDiv && r.prDiv).map(r => ({
              displacementDiv: parseFloat(r.dispDiv),
              provingRingDiv: parseFloat(r.prDiv),
            })),
          })),
        },
      });
      router.push(`/projects/${projectId}/tests/direct-shear/${testId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  const col = 'border border-gray-200 px-2 py-1 text-sm';
  const STAGE_COLORS = ['text-blue-700', 'text-emerald-700', 'text-violet-700'];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Cisaillement direct (D-3080)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Paramètres de la boîte de cisaillement</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Largeur boîte (mm)" type="number" step="0.1" value={boxWidth} onChange={e => setBoxWidth(e.target.value)} />
            <Input label="Longueur boîte (mm)" type="number" step="0.1" value={boxLength} onChange={e => setBoxLength(e.target.value)} />
            <Input label="Hauteur éprouvette (mm)" type="number" step="0.1" value={specimenHeight} onChange={e => setSpecimenHeight(e.target.value)} placeholder="optionnel" />
            <Input label="Facteur cadran (mm/div)" type="number" step="0.001" value={dialFactor} onChange={e => setDialFactor(e.target.value)} />
            <Input label="Facteur anneau (N/div)" type="number" step="0.01" required value={calibFactor} onChange={e => setCalibFactor(e.target.value)} placeholder="ex: 2.50" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Aire de cisaillement: {boxArea.toFixed(0)} mm²</p>
        </Card>

        {stages.map((stage, si) => {
          const stressValues = stage.readings.map(r => calcStress(r.prDiv)).filter(Boolean) as number[];
          const peakStress = stressValues.length ? Math.max(...stressValues) : null;
          return (
            <Card key={si} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-800">Étape {si + 1}</h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">σn (kPa) *</label>
                    <input
                      type="number" step="1" required
                      value={stage.normalStress}
                      onChange={e => updateNormalStress(si, e.target.value)}
                      placeholder="ex: 50"
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
                <Button type="button" variant="secondary" onClick={() => addReading(si)}>+ Lecture</Button>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <th className={`${col} text-left`}>#</th>
                    <th className={col}>Dépl. (div)</th>
                    <th className={col}>Anneau (div)</th>
                    <th className={col}>Dépl. (mm)</th>
                    <th className={col}>τ (kPa)</th>
                    <th className={col}></th>
                  </tr>
                </thead>
                <tbody>
                  {stage.readings.map((r, ri) => {
                    const dispMm = r.dispDiv ? (parseFloat(r.dispDiv) * df).toFixed(3) : '—';
                    const tau = calcStress(r.prDiv);
                    const isPeak = tau != null && peakStress != null && Math.abs(tau - peakStress) < 0.001;
                    return (
                      <tr key={ri} className={isPeak ? 'bg-brand-50' : ''}>
                        <td className={`${col} text-center text-gray-400`}>{ri + 1}</td>
                        <td className={col}><input type="number" step="1" value={r.dispDiv} onChange={e => updateReading(si, ri, 'dispDiv', e.target.value)} className="w-16 border-0 outline-none text-right bg-transparent" /></td>
                        <td className={col}><input type="number" step="1" value={r.prDiv} onChange={e => updateReading(si, ri, 'prDiv', e.target.value)} className="w-16 border-0 outline-none text-right bg-transparent" /></td>
                        <td className={`${col} text-right text-gray-500`}>{dispMm}</td>
                        <td className={`${col} text-right font-medium ${isPeak ? STAGE_COLORS[si % 3] : 'text-gray-700'}`}>{tau != null ? tau.toFixed(1) : '—'}</td>
                        <td className={col}>{stage.readings.length > 1 && <button type="button" onClick={() => setStages(ss => ss.map((s, i) => i === si ? { ...s, readings: s.readings.filter((_, j) => j !== ri) } : s))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {peakStress != null && (
                  <tfoot>
                    <tr className="font-semibold bg-gray-50">
                      <td colSpan={4} className={`${col} text-right text-gray-600`}>τ pic</td>
                      <td className={`${col} text-right ${STAGE_COLORS[si % 3]}`}>{peakStress.toFixed(1)} kPa</td>
                      <td className={col}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </Card>
          );
        })}

        <Button type="button" variant="secondary" onClick={() => setStages(ss => [...ss, { normalStress: '', readings: [{ dispDiv: '', prDiv: '' }] }])}>
          + Ajouter une étape
        </Button>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={updateTest.isPending}>{updateTest.isPending ? 'Enregistrement...' : 'Enregistrer les modifications'}</Button>
        </div>
      </form>
    </div>
  );
}
