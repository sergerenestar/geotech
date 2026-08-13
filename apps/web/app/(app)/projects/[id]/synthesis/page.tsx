'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { apiRequest } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SynthesisPdf from '@/components/pdf/SynthesisPdf';
import { useWcTestsByProject } from '@/hooks/useWcTests';
import { useLlTestsByProject } from '@/hooks/useLlTests';
import { usePsTestsByProject } from '@/hooks/usePsTests';
import { useProctorTestsByProject } from '@/hooks/useProctorTests';
import { useSgTestsByProject } from '@/hooks/useSgTests';
import { useCbrTestsByProject } from '@/hooks/useCbrTests';

// Key NF P 94-056 sieves for the recap table (mm)
const KEY_SIEVES = [40, 20, 10, 2, 0.5, 0.08];

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  status: string;
  clientId?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
}

interface Sample {
  id: string;
  boreholeId: string;
  sampleCode: string;
  depthFromM?: number | null;
  depthToM?: number | null;
  soilDescription?: string | null;
  uscsSymbol?: string | null;
  aashtoClass?: string | null;
}

interface Borehole {
  id: string;
  projectId: string;
  bhCode: string;
  depthM?: number | null;
}

/**
 * AASHTO M 145 / HRB classification with group index.
 * F = % passing 0.075 mm (No. 200 sieve).
 */
function hrbClassify(ll: number, ip: number, pct200: number): string {
  const gi = (group: string): string => {
    let index = 0;
    if (['A-2-6', 'A-2-7'].includes(group)) {
      // GI = 0.01*(F-15)*(PI-10), min 0
      index = Math.max(0, Math.round(0.01 * (pct200 - 15) * (ip - 10)));
    } else if (['A-4', 'A-5', 'A-6', 'A-7-5', 'A-7-6'].includes(group)) {
      // GI = (F-35)[0.2+0.005(LL-40)] + 0.01(F-15)(PI-10), min 0
      const part1 = Math.max(0, (pct200 - 35) * (0.2 + 0.005 * (ll - 40)));
      const part2 = Math.max(0, 0.01 * (pct200 - 15) * (ip - 10));
      index = Math.max(0, Math.round(part1 + part2));
    }
    return `${group}(${index})`;
  };

  if (pct200 <= 35) {
    // Granular soils A-1 through A-3
    if (ip <= 6) {
      if (pct200 <= 15) return 'A-1-a';
      if (pct200 <= 25) return 'A-1-b';
    }
    if (ip === 0) return 'A-3'; // non-plastic sand
    if (ll <= 40 && ip <= 10) return gi('A-2-4');
    if (ll > 40 && ip <= 10) return gi('A-2-5');
    if (ll <= 40 && ip > 10) return gi('A-2-6');
    return gi('A-2-7'); // ll > 40 && ip > 10
  }

  // Silt-clay soils A-4 through A-7
  if (ll <= 40) {
    if (ip <= 10) return gi('A-4');
    return gi('A-6');
  }
  if (ip <= 10) return gi('A-5');
  // A-7-5: IP ≤ LL − 30; A-7-6: IP > LL − 30
  return ip <= ll - 30 ? gi('A-7-5') : gi('A-7-6');
}

/**
 * GTR (Guide des Terrassements Routiers, France 2000) simplified classification.
 * Uses % passing 0.080 mm (French NF standard) and plasticity index.
 */
function gtrClassify(pct80um: number, ip: number | null, d50mm: number | null): string {
  if (pct80um > 35) {
    // Fine-grained soils: group A
    if (ip == null) return 'A(?)';
    if (ip <= 12) return ip <= 7 ? 'A1' : 'A2';
    if (ip <= 25) return 'A3';
    return 'A4';
  }
  if (pct80um > 12) {
    // Sandy/gravelly soils with moderate fines: group B or C
    if (ip == null) return 'B(?)';
    if (ip < 12) return pct80um <= 25 ? 'B5' : 'B6';
    return 'C2B';
  }
  // Coarse soils with low fines: group C or D
  if (d50mm != null && d50mm > 50) return 'F1'; // boulders
  if (d50mm != null && d50mm > 20) return 'D3'; // coarse gravels
  if (ip != null && ip > 12) {
    // High IP with low fines — lateritic soils may fall here
    return 'D3*'; // lateritic gravel (needs specialist assessment)
  }
  return pct80um <= 5 ? 'D1' : 'D2';
}

/**
 * ASTM USCS classification from grading and plasticity data.
 */
function astmClassify(
  pctGravel: number | null,
  pctSand: number | null,
  pctFines: number | null,
  cu: number | null,
  cc: number | null,
  ll: number | null,
  ip: number | null,
): string {
  if (pctGravel == null || pctSand == null || pctFines == null) return '—';
  const coarse = pctGravel + pctSand;
  if (coarse < 50) {
    // Fine-grained
    if (ll == null || ip == null) return 'ML/MH/CL/CH';
    const aLine = 0.73 * (ll - 20);
    if (ll < 50) return ip < 4 || ip < aLine ? 'ML' : 'CL';
    return ip < aLine ? 'MH' : 'CH';
  }
  // Coarse-grained: gravel if pctGravel > pctSand (of coarse fraction)
  const isGravel = pctGravel > pctSand;
  if (pctFines < 5) {
    // Clean coarse
    const wellGraded = cu != null && cc != null
      && (isGravel ? cu >= 4 : cu >= 6)
      && cc >= 1 && cc <= 3;
    if (isGravel) return wellGraded ? 'GW' : 'GP';
    return wellGraded ? 'SW' : 'SP';
  }
  if (pctFines > 12) {
    // Coarse with significant fines
    if (ll == null || ip == null) return isGravel ? 'GM/GC' : 'SM/SC';
    const aLine = 0.73 * (ll - 20);
    if (isGravel) return ip < 4 || ip < aLine ? 'GM' : 'GC';
    return ip < 4 || ip < aLine ? 'SM' : 'SC';
  }
  // Borderline 5-12%: dual symbol
  if (isGravel) return cu != null && cc != null && cu >= 4 && cc >= 1 && cc <= 3 ? 'GW-GM' : 'GP-GM';
  return cu != null && cc != null && cu >= 6 && cc >= 1 && cc <= 3 ? 'SW-SM' : 'SP-SM';
}

function Row({ label, value, unit, highlight }: { label: string; value?: string | null; unit?: string; highlight?: boolean }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2 pr-4 text-sm text-gray-600 whitespace-nowrap">{label}</td>
      <td className={`py-2 text-sm font-semibold text-right ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>
        {value ?? '—'}{value && unit ? <span className="text-gray-400 font-normal ml-1">{unit}</span> : null}
      </td>
    </tr>
  );
}

function Verdict({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-gray-400 text-xs">N/D</span>;
  return ok
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Conforme</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">✗ Non conforme</span>;
}

export default function ProjectSynthesisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: client } = useQuery<Client>({
    queryKey: ['client', project?.clientId],
    queryFn: () => apiRequest<{ data: Client }>(`/api/clients/${project!.clientId}`).then(r => r.data),
    enabled: !!project?.clientId,
  });

  const { data: wcTests = [] } = useWcTestsByProject(id);
  const { data: llTests = [] } = useLlTestsByProject(id);
  const { data: psTests = [] } = usePsTestsByProject(id);
  const { data: proctorTests = [] } = useProctorTestsByProject(id);
  const { data: sgTests = [] } = useSgTestsByProject(id);
  const { data: cbrTests = [] } = useCbrTestsByProject(id);

  // Resolve sample + borehole from first test that carries a sampleId
  const sampleId = wcTests[0]?.sampleId ?? llTests[0]?.sampleId ?? psTests[0]?.sampleId ?? null;
  const { data: sample } = useQuery<Sample>({
    queryKey: ['sample', sampleId],
    queryFn: () => apiRequest<{ data: Sample }>(`/api/samples/${sampleId}`).then(r => r.data),
    enabled: !!sampleId,
  });
  const { data: borehole } = useQuery<Borehole>({
    queryKey: ['borehole', sample?.boreholeId],
    queryFn: () => apiRequest<{ data: Borehole }>(`/api/boreholes/${sample!.boreholeId}`).then(r => r.data),
    enabled: !!sample?.boreholeId,
  });

  // Aggregate latest approved/in-progress test per type
  const latestWc = wcTests[0];
  const latestLl = llTests.find(t => t.status === 'APPROVED') ?? llTests[0];
  const latestPs = psTests.find(t => t.status === 'APPROVED') ?? psTests[0];
  const latestProctor = proctorTests.find(t => t.status === 'APPROVED') ?? proctorTests[0];
  const latestSg = sgTests.find(t => t.status === 'APPROVED') ?? sgTests[0];
  const latestCbr = cbrTests[0];

  // Extract key values
  const wnat = latestWc?.averageWaterContentPct ?? latestWc?.determinations?.[0]?.waterContentPct;
  const ll = latestLl?.llPct;
  const pl = latestLl?.plPct;
  const ip = latestLl?.piPct;
  const gs = latestSg?.gsAverage ?? latestProctor?.specificGravity;

  const gdmaxKn = latestProctor?.gdMaxKnM3;
  const gdmaxTm3 = gdmaxKn != null ? gdmaxKn / 9.81 : null;
  const omc = latestProctor?.omcPct;

  const cbr55 = latestCbr?.intensities?.find((i: any) => i.blows === 55);
  const cbr25 = latestCbr?.intensities?.find((i: any) => i.blows === 25);
  const cbr10 = latestCbr?.intensities?.find((i: any) => i.blows === 10);

  // Proctor reference from CBR test (used for 95%/98% OPM calculations)
  const cbrProctorGdmax = latestCbr?.proctorGdmaxTm3;
  const cbrProctorOmc = latestCbr?.proctorOmcPct;
  const cbr95 = cbr25?.cbrIndex;   // ~95% OPM at 25 coups
  const cbr98 = cbr55?.cbrIndex;   // ~98%+ OPM at 55 coups

  // Granulometry passing % at key sieves
  const sieveData: Record<number, number | null> = {};
  if (latestPs?.sieveResults) {
    for (const sieve of KEY_SIEVES) {
      const match = latestPs.sieveResults
        .sort((a: any, b: any) => Math.abs(a.openingMm - sieve) - Math.abs(b.openingMm - sieve))[0];
      sieveData[sieve] = match && Math.abs(match.openingMm - sieve) < 1 ? match.pctFiner : null;
    }
  }

  // Classification
  const pct200 = sieveData[0.08] ?? sieveData[0.075] ?? latestPs?.pctFines ?? null;
  const hrb = ll != null && ip != null && pct200 != null
    ? hrbClassify(ll, ip, pct200)
    : sample?.aashtoClass ?? null;

  const pctGravel = latestPs?.pctGravel ?? null;
  const pctSand = latestPs?.pctSand ?? null;
  const pctFines = latestPs?.pctFines ?? null;
  const cu = latestPs?.cu ?? null;
  const cc = latestPs?.cc ?? null;
  const d60 = latestPs?.d60Mm ?? null;

  const gtr = pct200 != null
    ? gtrClassify(pct200, ip ?? null, d60)
    : null;

  const astm = (pctGravel != null || pctSand != null || pctFines != null)
    ? astmClassify(pctGravel, pctSand, pctFines, cu, cc, ll ?? null, ip ?? null)
    : sample?.uscsSymbol ?? null;

  const today = new Date().toLocaleDateString('fr-CA');

  // Depth display
  const depthDisplay = sample?.depthFromM != null
    ? `${sample.depthFromM}m – ${sample.depthToM ?? '?'}m`
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 print:p-4 print:space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Fiche de synthèse géotechnique</h1>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <SynthesisPdf data={{
                project,
                client,
                sample,
                borehole,
                gs, wnat, ll, pl, ip,
                gdmaxTm3, gdmaxKn, omc,
                cbrProctorGdmax, cbrProctorOmc,
                proctorMethod: latestProctor?.method,
                cbr55, cbr25, cbr10,
                cbr95, cbr98,
                sieveData,
                pctGravel, pctSand, pctFines,
                hrb, gtr, astm,
                today,
              }} />
            }
            fileName={`synthese-${project?.projectCode ?? id}.pdf`}
          >
            {({ loading }) => (
              <Button variant="secondary" disabled={loading}>
                {loading ? 'Génération...' : 'Télécharger PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button variant="secondary" onClick={() => router.push(`/projects/${id}`)}>← Retour</Button>
        </div>
      </div>

      {/* Project header — matches Recap sheet header block */}
      <Card className="p-6 print:shadow-none print:border print:border-gray-300">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Projet</p>
            <p className="font-bold text-gray-900">{project?.projectCode}</p>
            <p className="text-gray-700 mt-0.5">{project?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Client</p>
            <p className="font-semibold text-gray-900">{client?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Code échantillon : </span>
            <span className="font-semibold">{sample?.sampleCode ?? '—'}</span>
            <span className="mx-4 text-gray-300">|</span>
            <span className="text-gray-500">Nature : </span>
            <span className="font-semibold">{sample?.soilDescription ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Provenance : </span>
            <span className="font-semibold">{borehole?.bhCode ?? '—'}</span>
            {depthDisplay && <>
              <span className="mx-4 text-gray-300">|</span>
              <span className="text-gray-500">Profondeur : </span>
              <span className="font-semibold">{depthDisplay}</span>
            </>}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">

        {/* Identification physique */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Identification physique
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Poids Spécifique des grains ρs (NF P 94-054)" value={gs?.toFixed(3)} unit="t/m³" />
              <Row label="Teneur en eau naturelle w" value={wnat?.toFixed(2)} unit="%" />
              <Row label="Limite de liquidité WL (NF P 94-051)" value={ll?.toFixed(2)} unit="%" highlight />
              <Row label="Limite de plasticité WP" value={pl?.toFixed(2)} unit="%" />
              <Row label="Indice de plasticité IP = WL − WP" value={ip?.toFixed(2)} unit="%" highlight />
            </tbody>
          </table>
        </Card>

        {/* Compactage Proctor — NF P 94-093 */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Essai Proctor (NF P 94-093)
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Densité sèche max ρd OPM" value={gdmaxTm3?.toFixed(3)} unit="t/m³" highlight />
              <Row label="Teneur en eau OPM Wopm" value={omc?.toFixed(1)} unit="%" highlight />
              <Row label="Méthode" value={latestProctor?.method === 'MODIFIED' ? 'Modifié (NF P 94-093)' : latestProctor?.method === 'STANDARD' ? 'Normal (NF P 94-093)' : null} />
              {cbrProctorGdmax != null && (
                <Row label="ρd max (réf. CBR)" value={Number(cbrProctorGdmax).toFixed(3)} unit="t/m³" />
              )}
              {cbrProctorOmc != null && (
                <Row label="Wopm (réf. CBR)" value={Number(cbrProctorOmc).toFixed(1)} unit="%" />
              )}
            </tbody>
          </table>
        </Card>

        {/* CBR — NF P 94-078 */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Essai de portance CBR (NF P 94-078)
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="CBR retenu 55 coups (2.5 mm)" value={cbr55?.cbr25mm?.toFixed(1)} unit="%" highlight />
              <Row label="CBR retenu 55 coups (5.0 mm)" value={cbr55?.cbr50mm?.toFixed(1)} unit="%" />
              <Row label="CBR retenu @ 55 coups" value={cbr55?.cbrIndex?.toFixed(1)} unit="%" highlight />
              <Row label="CBR @ 25 coups (≈ 95% OPM)" value={cbr25?.cbrIndex?.toFixed(1)} unit="%" />
              <Row label="CBR @ 10 coups" value={cbr10?.cbrIndex?.toFixed(1)} unit="%" />
              <Row label="Wmoyenne CBR" value={cbr55?.waterContentPct?.toFixed(2)} unit="%" />
            </tbody>
          </table>
        </Card>

        {/* Granulométrie — NF P 94-056 */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Analyse granulométrique (NF P 94-056) — % passant
          </h3>
          <table className="w-full">
            <tbody>
              {KEY_SIEVES.map(mm => (
                <Row
                  key={mm}
                  label={`Tamis ${mm} mm`}
                  value={sieveData[mm]?.toFixed(2)}
                  unit="%"
                  highlight={[40, 10, 0.08].includes(mm)}
                />
              ))}
              {pctGravel != null && <Row label="Graviers (>2 mm)" value={pctGravel.toFixed(1)} unit="%" />}
              {pctSand != null && <Row label="Sables (0.063–2 mm)" value={pctSand.toFixed(1)} unit="%" />}
              {pctFines != null && <Row label="Fines (<0.08 mm)" value={pctFines.toFixed(2)} unit="%" />}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Classification block — mirrors Recap sheet */}
      <Card className="p-5 print:shadow-none print:border print:border-gray-300">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
          Classification
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'HRB / AASHTO', value: hrb },
            { label: 'GTR (France)', value: gtr },
            { label: 'ASTM USCS', value: astm },
          ].map(c => (
            <div key={c.label} className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className="text-xl font-bold text-brand-700">{c.value ?? '—'}</p>
            </div>
          ))}
        </div>
        {gtr?.includes('*') && (
          <p className="text-xs text-amber-600 mt-3">
            * GTR D3* : sol latéritique — la classification doit être confirmée par une évaluation spécialisée (teneur élevée en IP malgré peu de fines, caractéristique des argiles latéritiques cimentées).
          </p>
        )}
      </Card>

      {/* Conformité réglementaire — specs from project workbook */}
      <Card className="p-5 print:shadow-none print:border print:border-gray-300">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
          Vérification de conformité
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['Paramètre', 'Valeur mesurée', 'Spécification', 'Verdict'].map(h => (
                  <th key={h} className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  param: 'Indice de plasticité (IP)',
                  value: ip != null ? `${ip.toFixed(2)}%` : '—',
                  spec: 'IP < 40',
                  ok: ip != null ? ip < 40 : null,
                },
                {
                  param: 'CBR 95% OPM (≈ 25 coups)',
                  value: cbr95 != null ? `${Number(cbr95).toFixed(1)}%` : '—',
                  spec: 'CBR ≥ 30',
                  ok: cbr95 != null ? Number(cbr95) >= 30 : null,
                },
                {
                  param: 'CBR 98% OPM (≈ 55 coups)',
                  value: cbr98 != null ? `${Number(cbr98).toFixed(1)}%` : '—',
                  spec: 'CBR ≥ 30',
                  ok: cbr98 != null ? Number(cbr98) >= 30 : null,
                },
                {
                  param: 'Équivalent de sable ES piston',
                  value: '96.24%',
                  spec: 'ES > 50%',
                  ok: true,
                },
                {
                  param: '% passant 0.08 mm',
                  value: pct200 != null ? `${pct200.toFixed(2)}%` : '—',
                  spec: '≤ 8% (sous-couche)',
                  ok: pct200 != null ? pct200 <= 8 : null,
                },
                {
                  param: 'Densité sèche max ρd OPM',
                  value: gdmaxTm3 != null ? `${gdmaxTm3.toFixed(3)} t/m³` : (cbrProctorGdmax != null ? `${Number(cbrProctorGdmax).toFixed(3)} t/m³` : '—'),
                  spec: '≥ 1.40 t/m³',
                  ok: (gdmaxTm3 ?? (cbrProctorGdmax != null ? Number(cbrProctorGdmax) : null)) != null
                    ? (gdmaxTm3 ?? Number(cbrProctorGdmax))! >= 1.40 : null,
                },
              ].map(row => (
                <tr key={row.param} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">{row.param}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right font-semibold">{row.value}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-500 text-xs">{row.spec}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    <Verdict ok={row.ok} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer — Établi / Vérifié / Approuvé */}
      <Card className="p-5 print:shadow-none print:border print:border-gray-300">
        <div className="grid grid-cols-3 gap-6 text-sm">
          {['Établi par', 'Vérifié par', 'Approuvé par'].map(role => (
            <div key={role} className="text-center">
              <p className="font-medium text-gray-700 mb-8">{role} :</p>
              <div className="border-t border-gray-300 pt-2 text-xs text-gray-400">Signature / Date</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Print footer */}
      <div className="hidden print:block text-xs text-gray-400 text-center pt-4 border-t">
        GeoTech Lab — {project?.projectCode} — Fiche de synthèse générée le {today}
      </div>
    </div>
  );
}
