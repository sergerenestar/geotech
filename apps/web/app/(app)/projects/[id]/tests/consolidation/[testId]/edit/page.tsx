'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useConsolTest, useUpdateConsolTest } from '@/hooks/useConsolTests';

type Reading = { timeMin: string; dialMm: string };
type Stage = { loadType: 'LOADING' | 'UNLOADING' | 'RELOADING'; sigmaKpa: string; readings: Reading[] };

const LOAD_TYPE_LABELS = { LOADING: 'Chargement', UNLOADING: 'Déchargement', RELOADING: 'Rechargement' };
const STAGE_COLORS = ['text-blue-700', 'text-emerald-700', 'text-violet-700', 'text-amber-700', 'text-rose-700', 'text-indigo-700'];

export default function EditConsolTestPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading } = useConsolTest(testId);
  const updateTest = useUpdateConsolTest();

  const [diameterMm, setDiameterMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [e0, setE0] = useState('');
  const [gs, setGs] = useState('2.7');
  const [drainageType, setDrainageType] = useState<'DOUBLE' | 'SINGLE'>('DOUBLE');
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (test && !ready) {
      setDiameterMm(String(test.specimenDiameterMm));
      setHeightMm(String(test.initialHeightMm));
      setE0(String(test.initialVoidRatio));
      setGs(String(test.specificGravity));
      setDrainageType(test.drainageType);
      setNotes(test.notes ?? '');
      setStages(test.stages.map(s => ({
        loadType: s.loadType,
        sigmaKpa: String(s.sigmaVKpa),
        readings: s.readings.map(r => ({
          timeMin: String(r.timeMin),
          dialMm: String(r.dialReadingMm),
        })),
      })));
      setReady(true);
    }
  }, [test, ready]);

  function updateStageField(si: number, field: 'loadType' | 'sigmaKpa', val: string) {
    setStages(ss => ss.map((s, i) => i === si ? { ...s, [field]: val } : s));
  }

  function updateReading(si: number, ri: number, field: 'timeMin' | 'dialMm', val: string) {
    setStages(ss => ss.map((s, i) => i === si ? {
      ...s,
      readings: s.readings.map((r, j) => j === ri ? { ...r, [field]: val } : r),
    } : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validStages = stages.filter(s => s.sigmaKpa && s.readings.some(r => r.dialMm));
    if (validStages.length === 0) { setError('Au moins un palier valide est requis.'); return; }
    try {
      await updateTest.mutateAsync({
        testId,
        payload: {
          projectId,
          specimenDiameterMm: parseFloat(diameterMm),
          initialHeightMm: parseFloat(heightMm),
          initialVoidRatio: parseFloat(e0),
          specificGravity: parseFloat(gs) || 2.7,
          drainageType,
          notes: notes || undefined,
          stages: validStages.map(s => ({
            loadType: s.loadType,
            sigmaVKpa: parseFloat(s.sigmaKpa),
            readings: s.readings
              .filter(r => r.timeMin !== '' && r.dialMm !== '')
              .map((r, idx) => ({
                readingNumber: idx + 1,
                timeMin: parseFloat(r.timeMin),
                dialReadingMm: parseFloat(r.dialMm),
              })),
          })),
        },
      });
      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    }
  }

  if (isLoading || !ready) return <div className="p-6 text-gray-400">Chargement...</div>;

  const col = 'border border-gray-200 px-2 py-1 text-sm';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Modifier — Consolidation (D-2435)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Éprouvette</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Diamètre (mm)" type="number" step="0.1" required value={diameterMm} onChange={e => setDiameterMm(e.target.value)} />
            <Input label="Hauteur initiale H₀ (mm)" type="number" step="0.01" required value={heightMm} onChange={e => setHeightMm(e.target.value)} />
            <Input label="e₀" type="number" step="0.001" required value={e0} onChange={e => setE0(e.target.value)} />
            <Input label="Gs" type="number" step="0.001" value={gs} onChange={e => setGs(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drainage</label>
              <div className="flex gap-4 mt-2">
                {(['DOUBLE', 'SINGLE'] as const).map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={d} checked={drainageType === d} onChange={() => setDrainageType(d)} className="accent-brand-600" />
                    <span className="text-sm text-gray-700">{d === 'DOUBLE' ? 'Double' : 'Simple'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {stages.map((stage, si) => (
          <Card key={si} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className={`text-lg font-semibold ${STAGE_COLORS[si % 6]}`}>Palier {si + 1}</h2>
                <select value={stage.loadType} onChange={e => updateStageField(si, 'loadType', e.target.value as 'LOADING' | 'UNLOADING' | 'RELOADING')}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  {Object.entries(LOAD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">σ&apos;v (kPa)</label>
                  <input type="number" step="1" required value={stage.sigmaKpa}
                    onChange={e => updateStageField(si, 'sigmaKpa', e.target.value)}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary"
                  onClick={() => setStages(ss => ss.map((s, i) => i === si ? { ...s, readings: [...s.readings, { timeMin: '', dialMm: '' }] } : s))}>
                  + Lecture
                </Button>
                {stages.length > 1 && (
                  <Button type="button" variant="secondary" onClick={() => setStages(ss => ss.filter((_, i) => i !== si))}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className={`${col} text-left`}>#</th>
                  <th className={col}>Temps (min)</th>
                  <th className={col}>Lecture jauge (mm)</th>
                  <th className={col}></th>
                </tr>
              </thead>
              <tbody>
                {stage.readings.map((r, ri) => (
                  <tr key={ri}>
                    <td className={`${col} text-center text-gray-400`}>{ri + 1}</td>
                    <td className={col}>
                      <input type="number" step="0.01" value={r.timeMin}
                        onChange={e => updateReading(si, ri, 'timeMin', e.target.value)}
                        className="w-20 border-0 outline-none text-right bg-transparent" />
                    </td>
                    <td className={col}>
                      <input type="number" step="0.001" value={r.dialMm}
                        onChange={e => updateReading(si, ri, 'dialMm', e.target.value)}
                        className="w-24 border-0 outline-none text-right bg-transparent" />
                    </td>
                    <td className={col}>
                      {stage.readings.length > 2 && (
                        <button type="button" onClick={() => setStages(ss => ss.map((s, i) => i === si ? { ...s, readings: s.readings.filter((_, j) => j !== ri) } : s))}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}

        <Button type="button" variant="secondary"
          onClick={() => setStages(ss => [...ss, { loadType: 'LOADING', sigmaKpa: '', readings: [{ timeMin: '0', dialMm: '' }, { timeMin: '1440', dialMm: '' }] }])}>
          + Ajouter un palier
        </Button>

        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </Card>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
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
