'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateUcTest } from '@/hooks/useUcTests';

export default function NewUcTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreateUcTest();

  const [h0, setH0] = useState('');
  const [d0, setD0] = useState('');
  const [dialFactor, setDialFactor] = useState('0.01');
  const [calibFactor, setCalibFactor] = useState('');
  const [failureMode, setFailureMode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [readings, setReadings] = useState<Array<{ defDiv: string; prDiv: string }>>([
    { defDiv: '', prDiv: '' },
  ]);

  const H0 = parseFloat(h0) || 0;
  const D0 = parseFloat(d0) || 0;
  const df = parseFloat(dialFactor) || 0.01;
  const cf = parseFloat(calibFactor) || 0;
  const A0 = D0 > 0 ? Math.PI * Math.pow(D0 / 10, 2) / 4 : 0; // cm²

  function calcRow(defDiv: string, prDiv: string) {
    const dd = parseFloat(defDiv), pd = parseFloat(prDiv);
    if (isNaN(dd) || isNaN(pd) || !H0 || !A0 || !cf) return null;
    const defMm = dd * df;
    const loadN = pd * cf;
    const strain = (defMm / H0) * 100;
    const ACorrected = A0 / (1 - strain / 100);
    const stress = loadN / (ACorrected * 10);
    return { defMm, loadN, strain, stress };
  }

  const computed = readings.map(r => calcRow(r.defDiv, r.prDiv));
  const maxStress = computed.reduce((m, r) => (r && r.stress > (m ?? 0) ? r.stress : m), null as number | null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!h0 || !d0 || !calibFactor) { setError('Hauteur, diamètre et facteur de calibration sont requis.'); return; }
    const validReadings = readings.filter(r => r.defDiv && r.prDiv).map(r => ({
      deformationDiv: parseFloat(r.defDiv),
      provingRingDiv: parseFloat(r.prDiv),
    }));
    if (validReadings.length < 3) { setError('Au moins 3 lectures sont requises.'); return; }
    try {
      const test = await createTest.mutateAsync({
        projectId,
        initialHeightMm: parseFloat(h0),
        initialDiameterMm: parseFloat(d0),
        dialGaugeFactorMmPerDiv: parseFloat(dialFactor),
        calibrationFactorNPerDiv: parseFloat(calibFactor),
        failureMode: failureMode || undefined,
        notes: notes || undefined,
        readings: validReadings,
      });
      router.push(`/projects/${projectId}/tests/unconfined-compression/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    }
  }

  const col = 'border border-gray-200 px-2 py-1 text-sm';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Compression non confinée (D-2166)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Paramètres de l&apos;éprouvette</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Hauteur initiale H₀ (mm)" type="number" step="0.1" required value={h0} onChange={e => setH0(e.target.value)} placeholder="ex: 76.0" />
            <Input label="Diamètre initial d₀ (mm)" type="number" step="0.1" required value={d0} onChange={e => setD0(e.target.value)} placeholder="ex: 38.0" />
            <Input label="Facteur cadran (mm/div)" type="number" step="0.001" value={dialFactor} onChange={e => setDialFactor(e.target.value)} placeholder="0.01" />
            <Input label="Facteur anneau (N/div)" type="number" step="0.01" required value={calibFactor} onChange={e => setCalibFactor(e.target.value)} placeholder="ex: 2.50" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de rupture</label>
              <select value={failureMode} onChange={e => setFailureMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— sélectionner —</option>
                <option value="SHEAR_PLANE">Plan de cisaillement</option>
                <option value="BULGING">Renflement</option>
                <option value="CRUMBLING">Effritement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          {A0 > 0 && <p className="text-sm text-gray-500">A₀ = {A0.toFixed(3)} cm²</p>}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Lectures de chargement</h2>
            <Button type="button" variant="secondary" onClick={() => setReadings(r => [...r, { defDiv: '', prDiv: '' }])}>+ Ajouter</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className={`${col} text-left`}>#</th>
                  <th className={col}>Déform. (div)</th>
                  <th className={col}>Anneau (div)</th>
                  <th className={col}>Déform. (mm)</th>
                  <th className={col}>Charge (N)</th>
                  <th className={col}>Déform. (%)</th>
                  <th className={col}>Contrainte (kPa)</th>
                  <th className={col}></th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => {
                  const c = computed[i];
                  const isPeak = c && maxStress != null && Math.abs(c.stress - maxStress) < 0.001;
                  return (
                    <tr key={i} className={isPeak ? 'bg-brand-50' : ''}>
                      <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                      <td className={col}><input type="number" step="1" value={r.defDiv} onChange={e => setReadings(rs => rs.map((x, j) => j === i ? { ...x, defDiv: e.target.value } : x))} className="w-16 border-0 outline-none text-right bg-transparent" /></td>
                      <td className={col}><input type="number" step="1" value={r.prDiv} onChange={e => setReadings(rs => rs.map((x, j) => j === i ? { ...x, prDiv: e.target.value } : x))} className="w-16 border-0 outline-none text-right bg-transparent" /></td>
                      <td className={`${col} text-right text-gray-500`}>{c ? c.defMm.toFixed(2) : '—'}</td>
                      <td className={`${col} text-right text-gray-500`}>{c ? c.loadN.toFixed(1) : '—'}</td>
                      <td className={`${col} text-right text-gray-500`}>{c ? c.strain.toFixed(2) + '%' : '—'}</td>
                      <td className={`${col} text-right font-medium ${isPeak ? 'text-brand-700' : 'text-gray-700'}`}>{c ? c.stress.toFixed(1) : '—'}</td>
                      <td className={col}>{readings.length > 1 && <button type="button" onClick={() => setReadings(rs => rs.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
              {maxStress != null && (
                <tfoot>
                  <tr className="bg-brand-50 font-semibold">
                    <td colSpan={6} className={`${col} text-right text-gray-600`}>qu (résistance maximale)</td>
                    <td className={`${col} text-right text-brand-700`}>{maxStress.toFixed(1)} kPa</td>
                    <td className={col}></td>
                  </tr>
                  <tr className="bg-brand-50 font-semibold">
                    <td colSpan={6} className={`${col} text-right text-gray-600`}>Su = qu / 2</td>
                    <td className={`${col} text-right text-brand-700`}>{(maxStress / 2).toFixed(1)} kPa</td>
                    <td className={col}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
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
