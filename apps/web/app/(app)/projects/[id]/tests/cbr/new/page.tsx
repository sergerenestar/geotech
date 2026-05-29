'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateCbrTest, CbrIntensityInput, SwellingInput, PenetrationInput } from '@/hooks/useCbrTests';

const BLOW_LEVELS = [55, 25, 10] as const;
const SWELLING_HOURS = [0, 24, 48, 72, 96];
const PENETRATION_MM = [0, 0.635, 1.27, 1.905, 2.54, 3.175, 3.81, 4.445, 5.08, 6.35, 7.62, 8.89, 10.16];

type IntensityState = {
  massMoldG: string;
  massWetG: string;
  massDryG: string;
  cbr25mm: string;
  cbr50mm: string;
  swelling: Record<number, string>;
  penetration: Record<number, string>;
};

function emptyIntensity(): IntensityState {
  const swelling: Record<number, string> = {};
  SWELLING_HOURS.forEach(h => { swelling[h] = ''; });
  const penetration: Record<number, string> = {};
  PENETRATION_MM.forEach(mm => { penetration[mm] = ''; });
  return { massMoldG: '', massWetG: '', massDryG: '', cbr25mm: '', cbr50mm: '', swelling, penetration };
}

export default function NewCbrTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreateCbrTest();

  const [reference, setReference] = useState('');
  const [specificGravity, setSpecificGravity] = useState('2.657');
  const [proctorGdmax, setProctorGdmax] = useState('');
  const [proctorOmc, setProctorOmc] = useState('');
  const [ringCoeff, setRingCoeff] = useState('0.318');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [intensities, setIntensities] = useState<Record<number, IntensityState>>({
    55: emptyIntensity(),
    25: emptyIntensity(),
    10: emptyIntensity(),
  });

  function updateIntensity(blows: number, field: keyof IntensityState, value: string) {
    setIntensities(prev => ({
      ...prev,
      [blows]: { ...prev[blows], [field]: value },
    }));
  }

  function updateSwelling(blows: number, hours: number, value: string) {
    setIntensities(prev => ({
      ...prev,
      [blows]: { ...prev[blows], swelling: { ...prev[blows].swelling, [hours]: value } },
    }));
  }

  function updatePenetration(blows: number, mm: number, value: string) {
    setIntensities(prev => ({
      ...prev,
      [blows]: { ...prev[blows], penetration: { ...prev[blows].penetration, [mm]: value } },
    }));
  }

  function calcWaterContent(intensity: IntensityState): number | null {
    const mold = parseFloat(intensity.massMoldG);
    const wet = parseFloat(intensity.massWetG);
    const dry = parseFloat(intensity.massDryG);
    if (isNaN(mold) || isNaN(wet) || isNaN(dry) || dry <= mold) return null;
    return ((wet - dry) / (dry - mold)) * 100;
  }

  function calcDryDensity(intensity: IntensityState): number | null {
    const mold = parseFloat(intensity.massMoldG);
    const dry = parseFloat(intensity.massDryG);
    const moldVol = 2332; // cm³ — standard CBR mold NF P94-078
    if (isNaN(mold) || isNaN(dry) || dry <= mold) return null;
    return (dry - mold) / moldVol;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const gs = parseFloat(specificGravity);
    if (isNaN(gs) || gs <= 0) { setError('La densité relative Gs est requise.'); return; }

    const intensityPayload: CbrIntensityInput[] = BLOW_LEVELS.map(blows => {
      const intensity = intensities[blows];
      const swellingReadings: SwellingInput[] = SWELLING_HOURS
        .filter(h => intensity.swelling[h] !== '')
        .map(h => ({ hours: h, readingMm: parseFloat(intensity.swelling[h]) || undefined }));

      const penetrationReadings: PenetrationInput[] = PENETRATION_MM
        .filter(mm => intensity.penetration[mm] !== '')
        .map(mm => ({
          penetrationMm: mm,
          ringReading: parseFloat(intensity.penetration[mm]) || undefined,
        }));

      return {
        blows,
        massMoldG: parseFloat(intensity.massMoldG) || undefined,
        massWetG: parseFloat(intensity.massWetG) || undefined,
        massDryG: parseFloat(intensity.massDryG) || undefined,
        cbr25mm: parseFloat(intensity.cbr25mm) || undefined,
        cbr50mm: parseFloat(intensity.cbr50mm) || undefined,
        swellingReadings: swellingReadings.length > 0 ? swellingReadings : undefined,
        penetrationReadings: penetrationReadings.length > 0 ? penetrationReadings : undefined,
      } as CbrIntensityInput;
    });

    try {
      const test = await createTest.mutateAsync({
        projectId,
        reference: reference || undefined,
        specificGravity: gs,
        proctorGdmaxTm3: parseFloat(proctorGdmax) || undefined,
        proctorOmcPct: parseFloat(proctorOmc) || undefined,
        ringCoefficient: parseFloat(ringCoeff) || 0.318,
        notes: notes || undefined,
        intensities: intensityPayload,
      });
      router.push(`/projects/${projectId}/tests/cbr/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    }
  }

  const th = 'border border-gray-200 px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 uppercase whitespace-nowrap';
  const td = 'border border-gray-200 px-2 py-1 text-sm';

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai CBR (NF P94-078)</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Référence" value={reference} onChange={e => setReference(e.target.value)} placeholder="GNT-IC-2026" />
            <Input label="Densité relative Gs" type="number" step="0.001" required value={specificGravity} onChange={e => setSpecificGravity(e.target.value)} />
            <Input label="Coefficient anneau (kN/div)" type="number" step="0.0001" value={ringCoeff} onChange={e => setRingCoeff(e.target.value)} placeholder="0.318" />
            <Input label="DSM Proctor réf. (T/m³)" type="number" step="0.001" value={proctorGdmax} onChange={e => setProctorGdmax(e.target.value)} placeholder="1.637" />
            <Input label="OPM Proctor réf. (%)" type="number" step="0.1" value={proctorOmc} onChange={e => setProctorOmc(e.target.value)} placeholder="20.4" />
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </Card>

        {/* One block per intensity level */}
        {BLOW_LEVELS.map(blows => {
          const intensity = intensities[blows];
          const wc = calcWaterContent(intensity);
          const gd = calcDryDensity(intensity);
          const gdmax = parseFloat(proctorGdmax);
          const compDeg = gd && !isNaN(gdmax) && gdmax > 0 ? (gd / gdmax) * 100 : null;

          return (
            <Card key={blows} className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Intensité — <span className="text-brand-600">{blows} coups</span>
              </h2>

              {/* Compaction characteristics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Input label="Masse moule (g)" type="number" step="0.1"
                    value={intensity.massMoldG} onChange={e => updateIntensity(blows, 'massMoldG', e.target.value)} />
                </div>
                <div>
                  <Input label="Masse moule + sol humide (g)" type="number" step="0.1"
                    value={intensity.massWetG} onChange={e => updateIntensity(blows, 'massWetG', e.target.value)} />
                </div>
                <div>
                  <Input label="Masse moule + sol sec (g)" type="number" step="0.1"
                    value={intensity.massDryG} onChange={e => updateIntensity(blows, 'massDryG', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Calculé</p>
                  <p className="text-sm text-gray-600">w = <strong>{wc != null ? wc.toFixed(1) + ' %' : '—'}</strong></p>
                  <p className="text-sm text-gray-600">γd = <strong>{gd != null ? gd.toFixed(3) + ' T/m³' : '—'}</strong></p>
                  <p className="text-sm text-gray-600">Id = <strong>{compDeg != null ? compDeg.toFixed(1) + ' %' : '—'}</strong></p>
                </div>
              </div>

              {/* CBR direct input (alternative to penetration curve) */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="CBR à 2.5mm (%) — optionnel si courbe saisie"
                  type="number" step="0.1"
                  value={intensity.cbr25mm} onChange={e => updateIntensity(blows, 'cbr25mm', e.target.value)} />
                <Input label="CBR à 5.0mm (%) — optionnel si courbe saisie"
                  type="number" step="0.1"
                  value={intensity.cbr50mm} onChange={e => updateIntensity(blows, 'cbr50mm', e.target.value)} />
              </div>

              {/* Swelling readings */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Gonflement par immersion (lecture en mm)</p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {SWELLING_HOURS.map(h => (
                        <th key={h} className={th}>{h}h</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {SWELLING_HOURS.map(h => (
                        <td key={h} className={td}>
                          <input type="number" step="0.01"
                            value={intensity.swelling[h]}
                            onChange={e => updateSwelling(blows, h, e.target.value)}
                            className="w-full border-0 outline-none text-right bg-transparent text-sm" />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Penetration readings */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Courbe de pénétration (lecture anneau en divisions)</p>
                <div className="overflow-x-auto">
                  <table className="text-sm border-collapse" style={{ minWidth: '600px' }}>
                    <thead>
                      <tr>
                        <th className={th}>Course (mm)</th>
                        {PENETRATION_MM.map(mm => (
                          <th key={mm} className={th}>{mm.toFixed(3)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={`${td} text-xs text-gray-500 whitespace-nowrap`}>Lecture anneau</td>
                        {PENETRATION_MM.map(mm => (
                          <td key={mm} className={td}>
                            <input type="number" step="0.01"
                              value={intensity.penetration[mm]}
                              onChange={e => updatePenetration(blows, mm, e.target.value)}
                              className="w-16 border-0 outline-none text-right bg-transparent text-sm" />
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className={`${td} text-xs text-gray-400 whitespace-nowrap`}>Charge (kN)</td>
                        {PENETRATION_MM.map(mm => {
                          const reading = parseFloat(intensity.penetration[mm]);
                          const rc = parseFloat(ringCoeff) || 0.318;
                          const load = !isNaN(reading) ? (reading * rc).toFixed(2) : '—';
                          return <td key={mm} className={`${td} text-right text-gray-400 text-xs`}>{load}</td>;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          );
        })}

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={createTest.isPending}>
            {createTest.isPending ? 'Enregistrement...' : 'Enregistrer le test CBR'}
          </Button>
        </div>
      </form>
    </div>
  );
}
