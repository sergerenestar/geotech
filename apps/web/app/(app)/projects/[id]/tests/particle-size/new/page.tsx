'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreatePsTest, SieveResultInput } from '@/hooks/usePsTests';
import { useWcTestsByProject } from '@/hooks/useWcTests';
import { MATERIAL_TYPES, MaterialType, SieveDef } from '@/lib/materialTypes';
import { calcParticleSize, ParticleSizeResult } from '@geotech/calcs';
import GrainSizeCurve, { CctpPoint } from '@/components/charts/GrainSizeCurve';

// NF P94-056 full sieve set for custom selection
const NF_SIEVES: SieveDef[] = [
  { label: '40 mm',    openingMm: 40.000 },
  { label: '31.5 mm',  openingMm: 31.500 },
  { label: '25 mm',    openingMm: 25.000 },
  { label: '20 mm',    openingMm: 20.000 },
  { label: '16 mm',    openingMm: 16.000 },
  { label: '14 mm',    openingMm: 14.000 },
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
  { label: '0.063 mm', openingMm: 0.063  },
];

const ASTM_SIEVES: SieveDef[] = [
  { label: '2"',      openingMm: 50.800 },
  { label: '1"',      openingMm: 25.400 },
  { label: '3/4"',    openingMm: 19.050 },
  { label: '3/8"',    openingMm: 9.525  },
  { label: 'No. 4',   openingMm: 4.750  },
  { label: 'No. 10',  openingMm: 2.000  },
  { label: 'No. 40',  openingMm: 0.425  },
  { label: 'No. 100', openingMm: 0.150  },
  { label: 'No. 200', openingMm: 0.075  },
];

type CustomStandard = 'NF' | 'ASTM';

interface SieveRow extends SieveDef {
  massRetainedG: string;
}

function buildRows(sieves: SieveDef[]): SieveRow[] {
  return sieves.map(s => ({ ...s, massRetainedG: '' }));
}

export default function NewPsTestPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreatePsTest();
  const { data: wcTests = [] } = useWcTestsByProject(projectId as string);
  const [wcPrefilled, setWcPrefilled] = useState(false);

  const [sampleMassG, setSampleMassG] = useState('');
  const [waterContentPct, setWaterContentPct] = useState('');
  const [specificGravity, setSpecificGravity] = useState('2.70');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Material type selection — null = custom
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [customStandard, setCustomStandard] = useState<CustomStandard>('NF');

  const [sieveRows, setSieveRows] = useState<SieveRow[]>(buildRows(NF_SIEVES));

  useEffect(() => {
    if (!wcPrefilled && wcTests.length > 0) {
      const latest = wcTests[0];
      const wc = latest.averageWaterContentPct ?? latest.determinations?.[0]?.waterContentPct;
      if (wc != null) {
        setWaterContentPct(String(wc.toFixed(2)));
        setWcPrefilled(true);
      }
    }
  }, [wcTests, wcPrefilled]);

  function selectMaterial(mat: MaterialType | null) {
    setSelectedMaterial(mat);
    if (mat) {
      setSieveRows(buildRows(mat.sieves));
    } else {
      setSieveRows(buildRows(customStandard === 'NF' ? NF_SIEVES : ASTM_SIEVES));
    }
  }

  function switchCustomStandard(std: CustomStandard) {
    setCustomStandard(std);
    setSieveRows(buildRows(std === 'NF' ? NF_SIEVES : ASTM_SIEVES));
  }

  function updateSieveRow(i: number, val: string) {
    setSieveRows(rows => rows.map((r, idx) => idx === i ? { ...r, massRetainedG: val } : r));
  }

  const sm = parseFloat(sampleMassG);
  const wc = parseFloat(waterContentPct);
  const totalDryMassG = !isNaN(sm) && sm > 0 && !isNaN(wc) && wc >= 0
    ? (sm / (1 + wc / 100)).toFixed(2)
    : '';
  const totalDry = parseFloat(totalDryMassG) || 0;

  const filledRows = sieveRows.filter(r => r.massRetainedG !== '');
  let cumRetained = 0;
  const computed = sieveRows.map(r => {
    if (!r.massRetainedG) return { ...r, pctRetained: null, pctFiner: null };
    const pct = totalDry > 0 ? (parseFloat(r.massRetainedG) / totalDry) * 100 : null;
    if (pct != null) cumRetained += pct;
    const pctFiner = pct != null ? 100 - cumRetained : null;
    return { ...r, pctRetained: pct, pctFiner };
  });

  // D10/D30/D60/Cu/Cc via calcParticleSize
  let psResult: ParticleSizeResult | null = null;
  if (filledRows.length >= 2 && totalDry > 0) {
    try {
      psResult = calcParticleSize(
        filledRows.map(r => ({ openingMm: r.openingMm, massRetainedG: parseFloat(r.massRetainedG) })),
        totalDry,
      );
    } catch { /* insufficient data */ }
  }

  // Module de finesse (NF EN 13043): requires retained % at 0.16, 0.315, 0.63, 1.25, 2.5, 5 mm
  const FM_SIEVE_MM = [0.16, 0.315, 0.63, 1.25, 2.5, 5.0];
  const mfValues = FM_SIEVE_MM.map(target =>
    computed.find(r => Math.abs(r.openingMm - target) < 0.001)?.pctFiner != null
      ? 100 - computed.find(r => Math.abs(r.openingMm - target) < 0.001)!.pctFiner!
      : null
  );
  const mf = mfValues.every(v => v != null)
    ? (mfValues as number[]).reduce((a, b) => a + b, 0) / 100
    : null;

  // Chart data — only rows with a computed pctFiner
  const chartPoints = computed
    .filter(r => r.pctFiner != null)
    .map(r => ({ sieveLabel: r.label, openingMm: r.openingMm, pctFiner: r.pctFiner as number }));

  // CCTP spec envelope from material spec bands (% passing min/max)
  const cctpEnvelope: CctpPoint[] = (selectedMaterial?.sieves ?? [])
    .filter((s): s is SieveDef & { specMin: number; specMax: number } =>
      s.specMin != null && s.specMax != null)
    .map(s => ({ sieveMm: s.openingMm, minPct: s.specMin, maxPct: s.specMax }));

  function conformityClass(pctFiner: number | null, sieve: SieveDef): string {
    if (pctFiner == null || sieve.specMin == null || sieve.specMax == null) return '';
    if (pctFiner >= sieve.specMin && pctFiner <= sieve.specMax) return 'text-green-700 font-semibold';
    return 'text-red-600 font-semibold';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!sampleMassG || parseFloat(sampleMassG) <= 0) {
      setError("Le poids de l'échantillon est requis.");
      return;
    }
    if (waterContentPct === '' || isNaN(parseFloat(waterContentPct)) || parseFloat(waterContentPct) < 0) {
      setError('La teneur en eau est requise.');
      return;
    }
    if (!totalDryMassG || parseFloat(totalDryMassG) <= 0) {
      setError('La masse totale sèche calculée est invalide.');
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
        sampleMassG: parseFloat(sampleMassG),
        waterContentPct: parseFloat(waterContentPct),
        totalDryMassG: parseFloat(totalDryMassG),
        specificGravity: parseFloat(specificGravity) || 2.70,
        materialType: selectedMaterial?.key,
        applicableNorm: selectedMaterial?.norm,
        notes: notes || undefined,
        sieveResults,
      });
      router.push(`/projects/${projectId}/tests/particle-size/${test.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du test.');
    }
  }

  const col = 'border border-gray-200 px-3 py-2 text-sm';
  const hasSpecs = selectedMaterial?.sieves.some(s => s.specMin != null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouvel essai — Analyse granulométrique</h1>
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Material type selector */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Type de matériau</h2>
          <p className="text-sm text-gray-500">
            Le choix du matériau détermine la série de tamis et la norme applicable.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MATERIAL_TYPES.map(mat => (
              <button
                key={mat.key}
                type="button"
                onClick={() => selectMaterial(mat)}
                className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                  selectedMaterial?.key === mat.key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-800">{mat.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{mat.norm}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Tamis : {mat.sieves.map(s => s.label).join(' — ')}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectMaterial(null)}
              className={`text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                selectedMaterial === null
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-800">Personnalisé</div>
              <div className="text-xs text-gray-500 mt-0.5">NF P94-056 ou ASTM D-422</div>
              <div className="text-xs text-gray-400 mt-1">Série de tamis complète</div>
            </button>
          </div>

          {/* Custom standard toggle — only shown when no material is selected */}
          {selectedMaterial === null && (
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1 bg-gray-50 text-sm w-fit">
              {(['NF', 'ASTM'] as CustomStandard[]).map(s => (
                <button key={s} type="button"
                  onClick={() => switchCustomStandard(s)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    customStandard === s
                      ? 'bg-white shadow text-brand-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {s === 'NF' ? 'NF P94-056' : 'ASTM D-422'}
                </button>
              ))}
            </div>
          )}

          {selectedMaterial && (
            <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-3 py-2">
              <span className="font-semibold">{selectedMaterial.label}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">{selectedMaterial.norm}</span>
            </div>
          )}
        </Card>

        {/* General info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations générales</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Poids de l'échantillon (g)"
              type="number" step="0.1" required
              value={sampleMassG}
              onChange={e => setSampleMassG(e.target.value)}
              placeholder="ex: 600.0"
            />
            <Input
              label="Teneur en eau (%)"
              type="number" step="0.01" required
              value={waterContentPct}
              onChange={e => setWaterContentPct(e.target.value)}
              placeholder="ex: 12.5"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Masse totale sèche (g) — calculée
              </label>
              <input
                type="text" readOnly
                value={totalDryMassG !== '' ? `${totalDryMassG} g` : '—'}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 cursor-default"
              />
            </div>
            <Input
              label="Poids Spécifique (Gs)"
              type="number" step="0.001"
              value={specificGravity}
              onChange={e => setSpecificGravity(e.target.value)}
              placeholder="2.70"
            />
            <div className="col-span-2">
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

        {/* Sieve table */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Analyse par tamisage</h2>
            {selectedMaterial && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {selectedMaterial.norm}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Laisser vide les tamis non utilisés. Les pourcentages sont calculés en temps réel.
            {hasSpecs && (
              <span className="ml-1 text-green-700">
                ✓ Vert = dans la plage de spécification · Rouge = hors spécification
              </span>
            )}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className={`${col} text-left`}>Tamis</th>
                  <th className={col}>Ouverture (mm)</th>
                  <th className={col}>Masse retenue (g)</th>
                  <th className={col}>% retenu</th>
                  <th className={col}>% passant</th>
                  {hasSpecs && <th className={col}>Spécification</th>}
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
                    <td className={`${col} text-right ${conformityClass(row.pctFiner, row)}`}>
                      {row.pctFiner != null ? `${row.pctFiner.toFixed(1)}%` : '—'}
                    </td>
                    {hasSpecs && (
                      <td className={`${col} text-center text-gray-400 text-xs`}>
                        {row.specMin != null && row.specMax != null
                          ? `${row.specMin}–${row.specMax}%`
                          : '—'}
                      </td>
                    )}
                  </tr>
                ))}
                {filledRows.length > 0 && totalDry > 0 && (
                  <tr className="bg-gray-50 font-semibold text-xs">
                    <td colSpan={2} className={`${col} text-right text-gray-600`}>Récupération totale</td>
                    <td className={`${col} text-right`}>
                      {filledRows.reduce((s, r) => s + parseFloat(r.massRetainedG || '0'), 0).toFixed(1)} g
                    </td>
                    <td colSpan={hasSpecs ? 3 : 2} className={`${col} text-gray-400`}>
                      {((filledRows.reduce((s, r) => s + parseFloat(r.massRetainedG || '0'), 0) / totalDry) * 100).toFixed(1)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Derived indices */}
        {selectedMaterial?.derivedIndices === 'D_COEFFICIENTS' && filledRows.length >= 2 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Indices calculés</h2>
            {psResult ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'D10 (mm)', value: psResult.d10Mm != null ? psResult.d10Mm.toFixed(4) : '—' },
                  { label: 'D30 (mm)', value: psResult.d30Mm != null ? psResult.d30Mm.toFixed(4) : '—' },
                  { label: 'D60 (mm)', value: psResult.d60Mm != null ? psResult.d60Mm.toFixed(4) : '—' },
                  { label: 'Cu = D60/D10', value: psResult.cu != null ? psResult.cu.toFixed(2) : '—' },
                  { label: 'Cc = D30²/(D10·D60)', value: psResult.cc != null ? psResult.cc.toFixed(2) : '—' },
                  { label: 'USCS', value: psResult.uscsSymbol ?? '—' },
                  { label: '% Gravier (≥4.75 mm)', value: psResult.pctGravel != null ? `${psResult.pctGravel.toFixed(1)}%` : '—' },
                  { label: '% Sable (0.075–4.75 mm)', value: psResult.pctSand != null ? `${psResult.pctSand.toFixed(1)}%` : '—' },
                  { label: '% Fines (<0.075 mm)', value: psResult.pctFines != null ? `${psResult.pctFines.toFixed(1)}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
                  </div>
                ))}
                {psResult.uscsName && (
                  <div className="col-span-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800">
                    Classification USCS : <span className="font-semibold">{psResult.uscsSymbol}</span> — {psResult.uscsName}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Données insuffisantes pour calculer D10/D30/D60 (minimum 2 tamis requis).</p>
            )}
          </Card>
        )}

        {selectedMaterial?.derivedIndices === 'MODULE_FINESSE' && filledRows.length >= 2 && (
          <Card className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Indices calculés</h2>
            <div className="bg-gray-50 rounded-lg p-3 w-56">
              <div className="text-xs text-gray-500">Module de finesse</div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5">
                {mf != null ? mf.toFixed(2) : '— (tamis FM 0.16–5 mm requis)'}
              </div>
            </div>
          </Card>
        )}

        {/* Grain-size distribution curve */}
        {chartPoints.length >= 2 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Courbe granulométrique
              {selectedMaterial && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  — {selectedMaterial.label} · {selectedMaterial.norm}
                </span>
              )}
            </h2>
            <GrainSizeCurve
              sieveResults={chartPoints}
              cctpEnvelope={cctpEnvelope.length > 0 ? cctpEnvelope : undefined}
              showCctp={cctpEnvelope.length > 0}
            />
          </Card>
        )}

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
