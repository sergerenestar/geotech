'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreatePermTest } from '@/hooks/usePermTests';

type Reading = {
  flowVolumeMl: string;
  initialHeadCm: string;
  finalHeadCm: string;
  elapsedTimeS: string;
};

export default function NewPermTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreatePermTest();

  const [testType, setTestType] = useState<'CONSTANT_HEAD' | 'FALLING_HEAD'>('CONSTANT_HEAD');
  const [diameterMm, setDiameterMm] = useState('');
  const [lengthMm, setLengthMm] = useState('');
  const [tempC, setTempC] = useState('20');
  const [headCm, setHeadCm] = useState('');
  const [standpipeArea, setStandpipeArea] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [readings, setReadings] = useState<Reading[]>([
    { flowVolumeMl: '', initialHeadCm: '', finalHeadCm: '', elapsedTimeS: '' },
  ]);

  const d = parseFloat(diameterMm) || 0;
  const l = parseFloat(lengthMm) || 0;
  const aCm2 = d > 0 ? Math.PI * Math.pow(d / 20, 2) : 0;
  const lCm = l / 10;

  function calcK(r: Reading): number | null {
    const t = parseFloat(r.elapsedTimeS);
    if (!aCm2 || !lCm || !t || t <= 0) return null;
    if (testType === 'CONSTANT_HEAD') {
      const q = parseFloat(r.flowVolumeMl);
      const h = parseFloat(headCm);
      if (!q || !h) return null;
      return (q * lCm) / (aCm2 * h * t);
    } else {
      const a = parseFloat(standpipeArea);
      const h1 = parseFloat(r.initialHeadCm);
      const h2 = parseFloat(r.finalHeadCm);
      if (!a || !h1 || !h2 || h2 <= 0) return null;
      return (a * lCm) / (aCm2 * t) * Math.log(h1 / h2);
    }
  }

  function addReading() {
    setReadings(rs => [...rs, { flowVolumeMl: '', initialHeadCm: '', finalHeadCm: '', elapsedTimeS: '' }]);
  }

  function updateReading(i: number, field: keyof Reading, val: string) {
    setReadings(rs => rs.map((r, j) => j === i ? { ...r, [field]: val } : r));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!diameterMm || !lengthMm) { setError('Diamètre et longueur de l\'éprouvette requis.'); return; }
    const validReadings = readings.filter(r => r.elapsedTimeS);
    if (validReadings.length === 0) { setError('Au moins une lecture est requise.'); return; }
    try {
      const test = await createTest.mutateAsync({
        projectId,
        testType,
        specimenDiameterMm: parseFloat(diameterMm),
        specimenLengthMm: parseFloat(lengthMm),
        waterTemperatureC: parseFloat(tempC) || 20,
        headCm: headCm ? parseFloat(headCm) : undefined,
        standpipeAreaCm2: standpipeArea ? parseFloat(standpipeArea) : undefined,
        notes: notes || undefined,
        readings: validReadings.map(r => ({
          flowVolumeMl: r.flowVolumeMl ? parseFloat(r.flowVolumeMl) : undefined,
          initialHeadCm: r.initialHeadCm ? parseFloat(r.initialHeadCm) : undefined,
          finalHeadCm: r.finalHeadCm ? parseFloat(r.finalHeadCm) : undefined,
          elapsedTimeS: parseFloat(r.elapsedTimeS),
        })),
      });
      router.push(`/projects/${projectId}/tests/permeability/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    }
  }

  const col = 'border border-gray-200 px-2 py-1 text-sm';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Perméabilité (D-2434)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Type d&apos;essai</h2>
          <div className="flex gap-4">
            {(['CONSTANT_HEAD', 'FALLING_HEAD'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="testType" value={type}
                  checked={testType === type}
                  onChange={() => setTestType(type)}
                  className="accent-brand-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  {type === 'CONSTANT_HEAD' ? 'Charge constante' : 'Charge variable'}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Éprouvette & conditions</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Diamètre (mm)" type="number" step="0.1" required value={diameterMm} onChange={e => setDiameterMm(e.target.value)} />
            <Input label="Longueur (mm)" type="number" step="0.1" required value={lengthMm} onChange={e => setLengthMm(e.target.value)} />
            <Input label="Température eau (°C)" type="number" step="0.1" value={tempC} onChange={e => setTempC(e.target.value)} />
            {testType === 'CONSTANT_HEAD' && (
              <Input label="Charge hydraulique h (cm)" type="number" step="0.1" value={headCm} onChange={e => setHeadCm(e.target.value)} />
            )}
            {testType === 'FALLING_HEAD' && (
              <Input label="Aire tube manomètre a (cm²)" type="number" step="0.01" value={standpipeArea} onChange={e => setStandpipeArea(e.target.value)} />
            )}
          </div>
          {aCm2 > 0 && (
            <p className="text-sm text-gray-500">
              Aire section: {aCm2.toFixed(3)} cm² | Longueur: {lCm.toFixed(2)} cm
            </p>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Lectures</h2>
            <Button type="button" variant="secondary" onClick={addReading}>+ Lecture</Button>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                <th className={`${col} text-left`}>#</th>
                {testType === 'CONSTANT_HEAD' ? (
                  <th className={col}>Volume Q (mL)</th>
                ) : (
                  <>
                    <th className={col}>h1 (cm)</th>
                    <th className={col}>h2 (cm)</th>
                  </>
                )}
                <th className={col}>Durée t (s)</th>
                <th className={col}>k (cm/s)</th>
                <th className={col}></th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r, i) => {
                const k = calcK(r);
                return (
                  <tr key={i}>
                    <td className={`${col} text-center text-gray-400`}>{i + 1}</td>
                    {testType === 'CONSTANT_HEAD' ? (
                      <td className={col}>
                        <input type="number" step="0.1" value={r.flowVolumeMl}
                          onChange={e => updateReading(i, 'flowVolumeMl', e.target.value)}
                          className="w-20 border-0 outline-none text-right bg-transparent" />
                      </td>
                    ) : (
                      <>
                        <td className={col}>
                          <input type="number" step="0.1" value={r.initialHeadCm}
                            onChange={e => updateReading(i, 'initialHeadCm', e.target.value)}
                            className="w-16 border-0 outline-none text-right bg-transparent" />
                        </td>
                        <td className={col}>
                          <input type="number" step="0.1" value={r.finalHeadCm}
                            onChange={e => updateReading(i, 'finalHeadCm', e.target.value)}
                            className="w-16 border-0 outline-none text-right bg-transparent" />
                        </td>
                      </>
                    )}
                    <td className={col}>
                      <input type="number" step="1" value={r.elapsedTimeS}
                        onChange={e => updateReading(i, 'elapsedTimeS', e.target.value)}
                        className="w-20 border-0 outline-none text-right bg-transparent" />
                    </td>
                    <td className={`${col} text-right font-medium text-brand-700`}>
                      {k != null ? k.toExponential(2) : '—'}
                    </td>
                    <td className={col}>
                      {readings.length > 1 && (
                        <button type="button" onClick={() => setReadings(rs => rs.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </Card>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
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
