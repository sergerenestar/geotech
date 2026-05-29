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

// Key NF sieves for the recap table (mm)
const KEY_SIEVES = [40, 20, 10, 2, 0.5, 0.08];

interface Project {
  id: string;
  projectCode: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
}

function hrbClassify(ll: number, ip: number, pct200: number): string {
  if (pct200 <= 35) {
    if (ip <= 6 && ll <= 40) return 'A-1-b';
    if (ip <= 10 && ll <= 40) return 'A-2-4';
    return 'A-2-6';
  }
  if (ll <= 40) {
    if (ip <= 10) return 'A-4';
    return 'A-6';
  }
  if (ip <= 11) return 'A-5';
  return 'A-7-5';
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

export default function ProjectSynthesisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => apiRequest<{ data: Project }>(`/api/projects/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: wcTests = [] } = useWcTestsByProject(id);
  const { data: llTests = [] } = useLlTestsByProject(id);
  const { data: psTests = [] } = usePsTestsByProject(id);
  const { data: proctorTests = [] } = useProctorTestsByProject(id);
  const { data: sgTests = [] } = useSgTestsByProject(id);
  const { data: cbrTests = [] } = useCbrTestsByProject(id);

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

  const cbr55 = latestCbr?.intensities?.find(i => i.blows === 55);
  const cbr25 = latestCbr?.intensities?.find(i => i.blows === 25);
  const cbr10 = latestCbr?.intensities?.find(i => i.blows === 10);

  // Granulometry passing % at key sieves
  const sieveData: Record<number, number | null> = {};
  if (latestPs?.sieveResults) {
    for (const sieve of KEY_SIEVES) {
      const match = latestPs.sieveResults
        .sort((a: any, b: any) => Math.abs(a.openingMm - sieve) - Math.abs(b.openingMm - sieve))[0];
      sieveData[sieve] = match && Math.abs(match.openingMm - sieve) < 1 ? match.pctFiner : null;
    }
  }

  // HRB classification
  const pct200 = sieveData[0.08] ?? sieveData[0.075] ?? null;
  const hrb = ll != null && ip != null && pct200 != null
    ? hrbClassify(ll, ip, pct200)
    : null;

  const today = new Date().toLocaleDateString('fr-CA');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 print:p-4 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Fiche de synthèse géotechnique</h1>
        <div className="flex gap-2">
          <PDFDownloadLink
            document={
              <SynthesisPdf data={{
                project,
                gs, wnat, ll, pl, ip,
                gdmaxTm3, gdmaxKn, omc,
                proctorMethod: latestProctor?.method,
                cbr55, cbr25, cbr10,
                sieveData,
                hrb,
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

      {/* Project header */}
      <Card className="p-6 print:shadow-none print:border print:border-gray-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Projet</p>
            <h2 className="text-xl font-bold text-gray-900">{project?.projectCode} — {project?.name}</h2>
            {project?.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Date d'impression : {today}</p>
            {hrb && <p className="mt-1 text-base font-bold text-brand-700">Classification HRB : {hrb}</p>}
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
              <Row label="Densité relative des grains (Gs)" value={gs?.toFixed(3)} />
              <Row label="Teneur en eau naturelle (Wnat)" value={wnat?.toFixed(1)} unit="%" />
              <Row label="Limite de liquidité (LL)" value={ll?.toFixed(1)} unit="%" highlight />
              <Row label="Limite de plasticité (LP)" value={pl?.toFixed(1)} unit="%" />
              <Row label="Indice de plasticité (IP)" value={ip?.toFixed(1)} unit="%" highlight />
            </tbody>
          </table>
        </Card>

        {/* Compactage Proctor */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Essai Proctor (NF P94-093)
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="Densité sèche max (DSM)" value={gdmaxTm3?.toFixed(3)} unit="T/m³" highlight />
              <Row label="DSM (kN/m³)" value={gdmaxKn?.toFixed(2)} unit="kN/m³" />
              <Row label="Teneur en eau optimale (OPM)" value={omc?.toFixed(1)} unit="%" highlight />
              <Row label="Méthode" value={latestProctor?.method === 'MODIFIED' ? 'Modifié (NF P94-093)' : 'Normal (NF P94-093)'} />
            </tbody>
          </table>
        </Card>

        {/* CBR */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Essai CBR (NF P94-078)
          </h3>
          <table className="w-full">
            <tbody>
              <Row label="CBR @ 55 coups (2.5 mm)" value={cbr55?.cbr25mm?.toFixed(1)} unit="%" highlight />
              <Row label="CBR @ 55 coups (5.0 mm)" value={cbr55?.cbr50mm?.toFixed(1)} unit="%" />
              <Row label="CBR retenu @ 55 coups" value={cbr55?.cbrIndex?.toFixed(1)} unit="%" highlight />
              <Row label="CBR @ 25 coups" value={cbr25?.cbrIndex?.toFixed(1)} unit="%" />
              <Row label="CBR @ 10 coups" value={cbr10?.cbrIndex?.toFixed(1)} unit="%" />
              <Row label="Gonflement max (96h)" value={
                cbr55?.swellingReadings?.find((r: any) => r.hours === 96)?.swellingPct?.toFixed(3)
              } unit="%" />
            </tbody>
          </table>
        </Card>

        {/* Granulométrie */}
        <Card className="p-5 print:shadow-none print:border print:border-gray-300">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
            Granulométrie (NF P94-056) — % passant
          </h3>
          <table className="w-full">
            <tbody>
              {KEY_SIEVES.map(mm => (
                <Row
                  key={mm}
                  label={`Tamis ${mm >= 1 ? mm + ' mm' : mm + ' mm (0.08)'}`}
                  value={sieveData[mm]?.toFixed(1)}
                  unit="%"
                  highlight={[40, 10, 0.08].includes(mm)}
                />
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Conformité réglementaire */}
      <Card className="p-5 print:shadow-none print:border print:border-gray-300">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b">
          Vérification de conformité — GNT couche de base
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {['Paramètre', 'Valeur mesurée', 'Exigence CCTP', 'Verdict'].map(h => (
                  <th key={h} className="border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  param: '% passant 0.08 mm',
                  value: pct200 != null ? `${pct200.toFixed(1)}%` : '—',
                  spec: '≤ 8%',
                  ok: pct200 != null ? pct200 <= 8 : null,
                },
                {
                  param: 'Indice de plasticité (IP)',
                  value: ip != null ? `${ip.toFixed(1)}%` : '—',
                  spec: '≤ 6% (couche de base)',
                  ok: ip != null ? ip <= 6 : null,
                },
                {
                  param: 'CBR @ 55 coups',
                  value: cbr55?.cbrIndex != null ? `${cbr55.cbrIndex.toFixed(1)}%` : '—',
                  spec: '≥ 80%',
                  ok: cbr55?.cbrIndex != null ? cbr55.cbrIndex >= 80 : null,
                },
                {
                  param: 'DSM Proctor',
                  value: gdmaxTm3 != null ? `${gdmaxTm3.toFixed(3)} T/m³` : '—',
                  spec: '≥ 2.0 T/m³ (GNT dense)',
                  ok: gdmaxTm3 != null ? gdmaxTm3 >= 2.0 : null,
                },
                {
                  param: '% passant 40 mm',
                  value: sieveData[40] != null ? `${sieveData[40]!.toFixed(1)}%` : '—',
                  spec: '95% – 100% (CCTP)',
                  ok: sieveData[40] != null ? sieveData[40]! >= 95 && sieveData[40]! <= 100 : null,
                },
                {
                  param: '% passant 0.5 mm',
                  value: sieveData[0.5] != null ? `${sieveData[0.5]!.toFixed(1)}%` : '—',
                  spec: '5% – 18% (CCTP)',
                  ok: sieveData[0.5] != null ? sieveData[0.5]! >= 5 && sieveData[0.5]! <= 18 : null,
                },
              ].map(row => (
                <tr key={row.param} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2 font-medium">{row.param}</td>
                  <td className="border border-gray-200 px-3 py-2 text-right font-semibold">{row.value}</td>
                  <td className="border border-gray-200 px-3 py-2 text-gray-500 text-xs">{row.spec}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.ok === null ? (
                      <span className="text-gray-400 text-xs">N/D</span>
                    ) : row.ok ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Conforme</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">✗ Non conforme</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * Spécifications selon CCTP type GNT 0/40 pour couche de base routière. Adapter selon le cahier des charges du projet.
        </p>
      </Card>

      {/* Print footer */}
      <div className="hidden print:block text-xs text-gray-400 text-center pt-4 border-t">
        GeoTech Lab — {project?.projectCode} — Fiche de synthèse générée le {today}
      </div>
    </div>
  );
}
