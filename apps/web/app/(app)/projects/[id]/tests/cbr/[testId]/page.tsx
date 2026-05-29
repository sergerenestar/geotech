'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ComposedChart, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer, Scatter,
} from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useCbrTest, CbrIntensityResponse } from '@/hooks/useCbrTests';

const INTENSITY_COLORS: Record<number, string> = {
  55: '#1d6eb5',
  25: '#e06b00',
  10: '#1a9654',
};

const STD_LOAD_25MM = 13.24;
const STD_LOAD_50MM = 19.96;
const SWELLING_HOURS = [0, 24, 48, 72, 96];

function PenetrationChart({ intensities }: { intensities: CbrIntensityResponse[] }) {
  const allMm = Array.from(new Set(
    intensities.flatMap(i => i.penetrationReadings.map(r => r.penetrationMm))
  )).sort((a, b) => a - b);

  const data = allMm.map(mm => {
    const row: Record<string, number | null> = { mm };
    for (const intensity of intensities) {
      const reading = intensity.penetrationReadings.find(r => Math.abs(r.penetrationMm - mm) < 0.001);
      row[`blows_${intensity.blows}`] = reading?.loadKn ?? null;
    }
    return row;
  });

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Courbes de pénétration (charge kN vs enfoncement mm)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mm" type="number" domain={[0, 10]} tickFormatter={(v: any) => `${v} mm`} label={{ value: 'Enfoncement (mm)', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Charge (kN)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(2)} kN` : v} labelFormatter={(l: any) => `${l} mm`} />
          <Legend verticalAlign="top" />
          <ReferenceLine y={STD_LOAD_25MM} stroke="#999" strokeDasharray="5 3" label={{ value: '13.24 kN (2.5mm std)', position: 'right', fontSize: 10 }} />
          <ReferenceLine y={STD_LOAD_50MM} stroke="#bbb" strokeDasharray="5 3" label={{ value: '19.96 kN (5mm std)', position: 'right', fontSize: 10 }} />
          {intensities.map(i => (
            <Line
              key={i.blows}
              type="monotone"
              dataKey={`blows_${i.blows}`}
              name={`${i.blows} coups`}
              stroke={INTENSITY_COLORS[i.blows] ?? '#666'}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SynthesisChart({ intensities, proctorGdmax }: { intensities: CbrIntensityResponse[]; proctorGdmax?: number }) {
  const data = intensities
    .filter(i => i.dryDensityTm3 != null && i.cbrIndex != null)
    .map(i => ({ gd: i.dryDensityTm3, cbr: i.cbrIndex }))
    .sort((a, b) => (a.gd ?? 0) - (b.gd ?? 0));

  if (data.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Courbe de synthèse — γd (T/m³) vs CBR (%)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="cbr" type="number" label={{ value: 'Indice CBR (%)', position: 'insideBottom', offset: -5 }} />
          <YAxis dataKey="gd" type="number" label={{ value: 'γd (T/m³)', angle: -90, position: 'insideLeft' }} domain={['auto', 'auto']} />
          <Tooltip formatter={(v: any) => typeof v === 'number' ? v.toFixed(3) : v} />
          {proctorGdmax && (
            <ReferenceLine y={proctorGdmax} stroke="#e06b00" strokeDasharray="5 3"
              label={{ value: `DSM = ${proctorGdmax} T/m³`, position: 'right', fontSize: 10, fill: '#e06b00' }} />
          )}
          <Scatter dataKey="gd" fill="#1d6eb5" line={{ stroke: '#1d6eb5', strokeWidth: 2 }} name="γd vs CBR" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SwellingChart({ intensities }: { intensities: CbrIntensityResponse[] }) {
  const data = SWELLING_HOURS.map(h => {
    const row: Record<string, number | null> = { hours: h };
    for (const intensity of intensities) {
      const reading = intensity.swellingReadings.find(r => r.hours === h);
      row[`blows_${intensity.blows}`] = reading?.swellingPct ?? null;
    }
    return row;
  });

  const hasData = intensities.some(i => i.swellingReadings.length > 0);
  if (!hasData) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Gonflement par immersion (%)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hours" type="number" ticks={SWELLING_HOURS} tickFormatter={(v: any) => `${v}h`} label={{ value: 'Durée immersion', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Gonflement (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(3)} %` : v} />
          <Legend verticalAlign="top" />
          {intensities.map(i => (
            <Line
              key={i.blows}
              type="monotone"
              dataKey={`blows_${i.blows}`}
              name={`${i.blows} coups`}
              stroke={INTENSITY_COLORS[i.blows] ?? '#666'}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CbrTestResultPage() {
  const { id: projectId, testId } = useParams<{ id: string; testId: string }>();
  const router = useRouter();
  const { data: test, isLoading, error } = useCbrTest(testId);

  if (isLoading) return <div className="p-8 text-gray-500">Chargement…</div>;
  if (error || !test) return <div className="p-8 text-red-500">Essai introuvable.</div>;

  const hasPenetration = test.intensities.some(i => i.penetrationReadings.length > 0);
  const hasSwelling = test.intensities.some(i => i.swellingReadings.length > 0);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            CBR — {test.reference ?? test.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            NF P94-078 · Gs = {test.specificGravity} · Coeff. anneau = {test.ringCoefficient}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}/tests/cbr/${testId}/edit`)}>Modifier</Button>
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectId}`)}>← Retour</Button>
        </div>
      </div>

      {/* Synthesis table */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Tableau de synthèse</h2>
        {test.proctorGdmaxTm3 && (
          <p className="text-sm text-gray-600 mb-3">
            Proctor de référence : DSM = <strong>{test.proctorGdmaxTm3} T/m³</strong>
            {' '}({(test.proctorGdmaxTm3 * 9.81).toFixed(2)} kN/m³)
            {test.proctorOmcPct && <> · OPM = <strong>{test.proctorOmcPct}%</strong></>}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['Coups', 'γd (T/m³)', 'w (%)', 'Id compactage (%)', 'CBR 2.5mm (%)', 'CBR 5.0mm (%)', 'CBR retenu (%)'].map(h => (
                  <th key={h} className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 uppercase text-center">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {test.intensities.map(i => (
                <tr key={i.blows} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 text-center font-bold" style={{ color: INTENSITY_COLORS[i.blows] }}>{i.blows}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{i.dryDensityTm3?.toFixed(3) ?? '—'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{i.waterContentPct?.toFixed(1) ?? '—'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{i.compactionDegreePct?.toFixed(1) ?? '—'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{i.cbr25mm?.toFixed(1) ?? '—'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{i.cbr50mm?.toFixed(1) ?? '—'}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-brand-700">
                    {i.cbrIndex?.toFixed(1) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts */}
      <Card className="p-6 space-y-6">
        <h2 className="text-base font-semibold text-gray-800">Graphiques</h2>
        {hasPenetration && <PenetrationChart intensities={test.intensities} />}
        {hasPenetration && <hr className="border-gray-100" />}
        <SynthesisChart intensities={test.intensities} proctorGdmax={test.proctorGdmaxTm3} />
        {hasSwelling && <hr className="border-gray-100" />}
        {hasSwelling && <SwellingChart intensities={test.intensities} />}
        {!hasPenetration && !hasSwelling && test.intensities.every(i => i.cbrIndex == null) && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucune donnée graphique — saisissez les lectures de pénétration pour voir les courbes.
          </p>
        )}
      </Card>

      {/* Raw penetration data */}
      {hasPenetration && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Données de pénétration brutes</h2>
          <div className="overflow-x-auto">
            <table className="text-sm border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-xs text-gray-600 uppercase">mm</th>
                  {test.intensities.map(i => (
                    <>
                      <th key={`r-${i.blows}`} className="border border-gray-200 px-2 py-1 text-xs text-gray-600 uppercase" style={{ color: INTENSITY_COLORS[i.blows] }}>
                        {i.blows} — lect.
                      </th>
                      <th key={`l-${i.blows}`} className="border border-gray-200 px-2 py-1 text-xs text-gray-600 uppercase" style={{ color: INTENSITY_COLORS[i.blows] }}>
                        {i.blows} — kN
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(
                  test.intensities.flatMap(i => i.penetrationReadings.map(r => r.penetrationMm))
                )).sort((a, b) => a - b).map(mm => (
                  <tr key={mm} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-1 text-center text-gray-700">{mm.toFixed(3)}</td>
                    {test.intensities.map(i => {
                      const r = i.penetrationReadings.find(p => Math.abs(p.penetrationMm - mm) < 0.001);
                      return (
                        <>
                          <td key={`r-${i.blows}`} className="border border-gray-200 px-2 py-1 text-right text-gray-600">{r?.ringReading?.toFixed(2) ?? '—'}</td>
                          <td key={`l-${i.blows}`} className="border border-gray-200 px-2 py-1 text-right font-medium">{r?.loadKn?.toFixed(3) ?? '—'}</td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
