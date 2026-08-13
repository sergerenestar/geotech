'use client';
/**
 * Lab Manager project view.
 *
 * This component implements the LM's workspace for a single project:
 * - Left panel: list of test catalogue entries, separated into "active" (tests awaiting
 *   the LM's action) and "completed" (tests already forwarded or approved).
 * - Right panel: assignment form (technician, priority, deadline) and workflow approval
 *   controls for the selected test, plus the result list and comment thread.
 *
 * Design notes:
 * - `TEST_META` and `RESULT_RENDER` are module-level constants mapping TestType enum names
 *   to display labels and result-summary formatters, keeping the JSX declarative.
 * - `hashColor` generates a stable avatar background from a name string so each technician
 *   gets a consistent colour across sessions without storing a preference.
 * - `WF_ACTIVE` / `WF_COMPLETED` arrays define which workflow statuses the LM considers
 *   "active" vs "done" — independent of the technician's view.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useTechnicians } from '@/hooks/useAdminUsers';
import CasagrandeCurve from '@/components/charts/CasagrandeCurve';
import GrainSizeCurve from '@/components/charts/GrainSizeCurve';
import {
  ComposedChart, Scatter, Line, LineChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { useWcTestsByProject } from '@/hooks/useWcTests';
import { useLlTestsByProject } from '@/hooks/useLlTests';
import { usePsTestsByProject } from '@/hooks/usePsTests';
import { useProctorTestsByProject } from '@/hooks/useProctorTests';
import { useSgTestsByProject } from '@/hooks/useSgTests';
import { useUcTestsByProject } from '@/hooks/useUcTests';
import { useDsTestsByProject } from '@/hooks/useDsTests';
import { useCbrTestsByProject } from '@/hooks/useCbrTests';
import { usePermTestsByProject } from '@/hooks/usePermTests';
import { useConsolTestsByProject } from '@/hooks/useConsolTests';
import {
  useManagerApprove, useManagerReject, useTestComments,
  type WorkflowComment,
} from '@/hooks/useTestWorkflow';

interface WorkflowTest {
  id: string;
  testType: string;
  testTypeName: string;
  testNorm: string;
  status: string;
  workflowStatus?: string;
  technicianId?: string;
  technicianName?: string;
  priority?: string;
  deadline?: string;
  category?: string;
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
  status: string;
}

const TEST_META: Record<string, { name: string; norm: string; cat: string; icon: string; bg: string; ic: string; path: string }> = {
  WATER_CONTENT:          { name: 'Teneur en eau',    norm: 'D-2216',       cat: 'Identification', icon: 'ti-droplet',         bg: '#e0f2f9', ic: '#0e7490', path: 'water-content'          },
  LIQUID_LIMIT:           { name: 'Atterberg',         norm: 'D-4318',       cat: 'Identification', icon: 'ti-chart-line',      bg: '#e0f2f9', ic: '#0e7490', path: 'liquid-limit'           },
  PARTICLE_SIZE:          { name: 'Granulométrie',     norm: 'NF/D-422',     cat: 'Identification', icon: 'ti-filter',          bg: '#e0f2f9', ic: '#0e7490', path: 'particle-size'          },
  PROCTOR:                { name: 'Proctor',           norm: 'D-698/D-1557', cat: 'Compactage',     icon: 'ti-wave-square',     bg: '#fef3c7', ic: '#d97706', path: 'proctor'                },
  SPECIFIC_GRAVITY:       { name: 'Densité relative',  norm: 'D-854',        cat: 'Compactage',     icon: 'ti-cube',            bg: '#fef3c7', ic: '#d97706', path: 'specific-gravity'       },
  UNCONFINED_COMPRESSION: { name: 'Compression UC',    norm: 'D-2166',       cat: 'Résistance',     icon: 'ti-arrows-vertical', bg: '#fce7f3', ic: '#9d174d', path: 'unconfined-compression' },
  DIRECT_SHEAR:           { name: 'Cisaillement',      norm: 'D-3080',       cat: 'Résistance',     icon: 'ti-cut',             bg: '#fce7f3', ic: '#9d174d', path: 'direct-shear'           },
  CBR:                    { name: 'CBR',               norm: 'NF P94-078',   cat: 'Résistance',     icon: 'ti-weight',          bg: '#fce7f3', ic: '#9d174d', path: 'cbr'                    },
  PERMEABILITY:           { name: 'Perméabilité',      norm: 'D-2434',       cat: 'Résistance',     icon: 'ti-waves',           bg: '#fce7f3', ic: '#9d174d', path: 'permeability'           },
  CONSOLIDATION:          { name: 'Consolidation',     norm: 'D-2435',       cat: 'Résistance',     icon: 'ti-layers',          bg: '#fce7f3', ic: '#9d174d', path: 'consolidation'          },
};

const RESULT_RENDER: Record<string, (t: any) => string> = {
  WATER_CONTENT:          (t) => t.averageWaterContentPct != null ? `w=${t.averageWaterContentPct.toFixed(1)}%` : '—',
  LIQUID_LIMIT:           (t) => t.llPct != null ? `LL=${t.llPct.toFixed(1)}% LP=${t.plPct?.toFixed(1) ?? '—'}% IP=${t.piPct?.toFixed(1) ?? '—'}%` : '—',
  PARTICLE_SIZE:          (t) => t.uscsSymbol ? `${t.uscsSymbol} — G:${t.pctGravel?.toFixed(0) ?? '?'}% S:${t.pctSand?.toFixed(0) ?? '?'}% F:${t.pctFines?.toFixed(0) ?? '?'}%` : '—',
  PROCTOR:                (t) => t.gdMaxKnM3 != null ? `γd=${t.gdMaxKnM3.toFixed(2)} kN/m³ OPM=${t.omcPct?.toFixed(1) ?? '—'}%` : '—',
  SPECIFIC_GRAVITY:       (t) => t.gsAverage != null ? `Gs=${t.gsAverage.toFixed(3)}` : '—',
  UNCONFINED_COMPRESSION: (t) => t.quKpa != null ? `qu=${t.quKpa.toFixed(1)} kPa Su=${t.suKpa?.toFixed(1) ?? '—'} kPa` : '—',
  DIRECT_SHEAR:           (t) => t.cohesionKpa != null ? `c=${t.cohesionKpa.toFixed(1)} kPa φ=${t.frictionAngleDeg?.toFixed(1) ?? '—'}°` : '—',
  CBR:                    (t) => { const b = t.intensities?.find((i: any) => i.blows === 55); return b?.cbrIndex != null ? `CBR@55 = ${b.cbrIndex.toFixed(1)}%` : '—'; },
  PERMEABILITY:           (t) => t.kAt20cCms != null ? `k₂₀=${t.kAt20cCms.toExponential(2)} cm/s` : t.kCms != null ? `k=${t.kCms.toExponential(2)} cm/s` : '—',
  CONSOLIDATION:          (t) => t.cc != null ? `Cc=${t.cc.toFixed(3)} σ'p=${t.sigmaPKpa?.toFixed(0) ?? '—'} kPa` : '—',
};

const WF_ACTIVE: string[]    = ['ASSIGNED', 'IN_PROGRESS', 'REJECTED_TO_TECH', 'PENDING_MANAGER_REVIEW', 'REJECTED_TO_MANAGER'];
const WF_COMPLETED: string[] = ['PENDING_PM_REVIEW', 'APPROVED'];

function workflowDot(ws?: string) {
  const map: Record<string, string> = {
    ASSIGNED:               '#94a3b8',
    IN_PROGRESS:            '#f59e0b',
    PENDING_MANAGER_REVIEW: '#60a5fa',
    REJECTED_TO_MANAGER:    '#ef4444',
    PENDING_PM_REVIEW:      '#a78bfa',
    APPROVED:               '#10b981',
    REJECTED_TO_TECH:       '#f97316',
  };
  return map[ws ?? ''] ?? '#cbd0d8';
}

function workflowPill(ws?: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING_MANAGER_REVIEW: { label: 'À réviser',       bg: '#dbeafe', color: '#1e40af' },
    REJECTED_TO_MANAGER:    { label: 'Retourné par PM', bg: '#fee2e2', color: '#991b1b' },
    PENDING_PM_REVIEW:      { label: 'Chez le PM',      bg: '#ede9fe', color: '#5b21b6' },
    APPROVED:               { label: 'Approuvé',        bg: '#d1fae5', color: '#065f46' },
  };
  const s = map[ws ?? ''] ?? { label: ws ?? '—', bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

function resultStatusChip(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    PENDING_REVIEW: { label: 'En révision', bg: '#fef3c7', color: '#92400e' },
    FLAGGED:        { label: 'Signalé IA',  bg: '#ffedd5', color: '#9a3412' },
    APPROVED:       { label: 'Approuvé',    bg: '#d1fae5', color: '#065f46' },
    REJECTED:       { label: 'Rejeté',      bg: '#fee2e2', color: '#991b1b' },
    LOCKED:         { label: 'Verrouillé',  bg: '#f1f5f9', color: '#64748b' },
  };
  const s = map[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#ede9fe', text: '#5b21b6' },
];
function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0e7490', fontFamily: 'monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{sub}</div>}
      <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function DetailTable({ cols, rows }: { cols: string[]; rows: (string | number | null | undefined)[][] }) {
  const td: React.CSSProperties = { border: '1px solid #e2e8f0', padding: '3px 7px', fontSize: 10, textAlign: 'right', whiteSpace: 'nowrap' };
  const th: React.CSSProperties = { ...td, background: '#f8fafc', color: '#64748b', fontWeight: 600, textAlign: 'center', fontSize: 9 };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead><tr>{cols.map(c => <th key={c} style={th}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ ...td, color: cell == null ? '#94a3b8' : '#1c2333' }}>
                  {cell == null ? '—' : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AiFlag({ r }: { r: any }) {
  if (!r.aiFlag || r.aiFlag === 'NONE') return null;
  const isErr = r.aiFlag === 'ERROR';
  return (
    <div style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 5, fontSize: 10, background: isErr ? '#fee2e2' : '#ffedd5', color: isErr ? '#991b1b' : '#9a3412', border: `1px solid ${isErr ? '#fca5a5' : '#fed7aa'}` }}>
      <strong>{isErr ? 'Erreur IA' : 'Avertissement IA'}:</strong> {r.aiFlagMessage}
    </div>
  );
}

function fmt(v: number | undefined | null, dec = 2): string {
  return v != null ? Number(v).toFixed(dec) : '—';
}

function TestResultDetail({ testType, r }: { testType: string; r: any }) {
  const grid4: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 };
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, marginBottom: 10 };
  const secLabel: React.CSSProperties = { fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 };

  if (testType === 'WATER_CONTENT') {
    const dets: any[] = r.determinations ?? [];
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid3}>
          <StatCard label="Teneur en eau moy." value={r.averageWaterContentPct != null ? `${Number(r.averageWaterContentPct).toFixed(1)}%` : '—'} />
          <StatCard label="Déterminations" value={String(dets.length)} />
          <StatCard label="Température" value={r.temperatureC != null ? `${r.temperatureC}°C` : '—'} />
        </div>
        {dets.length > 0 && (
          <>
            <div style={secLabel}>Déterminations</div>
            <DetailTable
              cols={['#', 'Cont. (g)', 'Cont.+Humide (g)', 'Cont.+Sec (g)', 'M. eau (g)', 'M. sol sec (g)', 'w%']}
              rows={dets.map(d => [
                d.determinationNumber,
                fmt(d.massContainerG),
                fmt(d.massContainerWetSoilG),
                fmt(d.massContainerDrySoilG),
                fmt(d.massWaterG),
                fmt(d.massDrySoilG),
                d.waterContentPct != null ? `${Number(d.waterContentPct).toFixed(1)}%` : null,
              ])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'LIQUID_LIMIT') {
    const pts: any[] = r.casagrandePoints ?? [];
    const pls: any[] = r.plDeterminations ?? [];
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid4}>
          <StatCard label="Limite liquide LL" value={r.llPct != null ? `${Number(r.llPct).toFixed(1)}%` : '—'} />
          <StatCard label="Limite plastique LP" value={r.plPct != null ? `${Number(r.plPct).toFixed(1)}%` : '—'} />
          <StatCard label="Indice plasticité IP" value={r.piPct != null ? `${Number(r.piPct).toFixed(1)}%` : '—'} />
          <StatCard label="USCS" value={r.uscsSymbol ?? '—'} sub={r.uscsName ?? undefined} />
        </div>
        {r.rSquared != null && (
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
            R² = {Number(r.rSquared).toFixed(3)}
            {r.rSquared < 0.90 && <span style={{ color: '#d97706', marginLeft: 6 }}>⚠ Ajustement faible</span>}
          </div>
        )}
        {pts.length > 0 && (
          <>
            <div style={secLabel}>Courbe de fluidité (Casagrande)</div>
            <div style={{ marginBottom: 10 }}>
              <CasagrandeCurve points={pts} llPct={r.llPct} />
            </div>
            <div style={secLabel}>Points Casagrande</div>
            <DetailTable
              cols={['#', 'Coups (N)', 'Cont. (g)', 'Cont.+Humide (g)', 'Cont.+Sec (g)', 'w%']}
              rows={pts.map(p => [
                p.pointNumber,
                p.blowCount,
                fmt(p.massContainerG),
                fmt(p.massContainerWetSoilG),
                fmt(p.massContainerDrySoilG),
                p.waterContentPct != null ? `${Number(p.waterContentPct).toFixed(1)}%` : null,
              ])}
            />
          </>
        )}
        {pls.length > 0 && (
          <>
            <div style={{ ...secLabel, marginTop: 8 }}>Limite plastique — Déterminations</div>
            <DetailTable
              cols={['#', 'Cont. (g)', 'Cont.+Humide (g)', 'Cont.+Sec (g)', 'w%']}
              rows={[
                ...pls.map(d => [
                  d.determinationNumber,
                  fmt(d.massContainerG),
                  fmt(d.massContainerWetSoilG),
                  fmt(d.massContainerDrySoilG),
                  d.waterContentPct != null ? `${Number(d.waterContentPct).toFixed(1)}%` : null,
                ]),
                ['Moy.', '', '', '', r.plPct != null ? `${Number(r.plPct).toFixed(1)}%` : '—'],
              ]}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'PARTICLE_SIZE') {
    const sieves: any[] = r.sieveResults ?? [];
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid4}>
          <StatCard label="% Gravier" value={r.pctGravel != null ? `${Number(r.pctGravel).toFixed(1)}%` : '—'} />
          <StatCard label="% Sable" value={r.pctSand != null ? `${Number(r.pctSand).toFixed(1)}%` : '—'} />
          <StatCard label="% Fines" value={r.pctFines != null ? `${Number(r.pctFines).toFixed(1)}%` : '—'} />
          <StatCard label="USCS" value={r.uscsSymbol ?? '—'} sub={r.uscsName ?? undefined} />
        </div>
        {r.cu != null && (
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
            Cu = {fmt(r.cu, 2)} · Cc = {fmt(r.cc, 2)}
          </div>
        )}
        {sieves.length > 0 && (
          <>
            <div style={secLabel}>Courbe granulométrique</div>
            <div style={{ marginBottom: 10 }}>
              <GrainSizeCurve sieveResults={sieves} />
            </div>
            <div style={secLabel}>Résultats tamis</div>
            <DetailTable
              cols={['Tamis', 'Ouverture (mm)', '% Passant']}
              rows={sieves.map(s => [
                s.sieveLabel,
                s.openingMm,
                s.pctFiner != null ? `${Number(s.pctFiner).toFixed(1)}%` : null,
              ])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'PROCTOR') {
    const pts: any[] = r.points ?? [];
    const gs = r.specificGravity ?? 2.70;
    const gdMaxTm3 = r.gdMaxKnM3 != null ? (r.gdMaxKnM3 / 9.81).toFixed(3) : null;
    const scatterData = pts.map((p: any) => ({ w: p.waterContentPct, gd: p.dryUnitWeightKnM3 ?? 0 }));
    const wVals = pts.map((p: any) => p.waterContentPct);
    const wMin = wVals.length ? Math.min(...wVals) - 2 : 0;
    const wMax = wVals.length ? Math.max(...wVals) + 5 : 30;
    const zavData = Array.from({ length: 30 }, (_, i) => {
      const w = wMin + (i / 29) * (wMax - wMin);
      return { w: +w.toFixed(2), zav100: +((gs * 9.81) / (1 + gs * w / 100)).toFixed(3), zav90: +((0.9 * gs * 9.81) / (1 + 0.9 * gs * w / 100)).toFixed(3) };
    });
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid4}>
          <StatCard label="γd max (T/m³)" value={gdMaxTm3 ?? '—'} sub={r.gdMaxKnM3 != null ? `${Number(r.gdMaxKnM3).toFixed(2)} kN/m³` : undefined} />
          <StatCard label="OPM (%)" value={r.omcPct != null ? `${Number(r.omcPct).toFixed(1)}%` : '—'} />
          <StatCard label="R²" value={r.rSquared != null ? Number(r.rSquared).toFixed(3) : '—'} />
          <StatCard label="Méthode" value={r.method === 'STANDARD' ? 'D-698' : 'D-1557'} />
        </div>
        {pts.length > 0 && (
          <>
            <div style={secLabel}>Courbe de compactage</div>
            <div style={{ marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="w" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'w (%)', position: 'insideBottom', offset: -14, fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'γd (kN/m³)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => typeof v === 'number' ? v.toFixed(3) : v} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                  <Scatter name="Points mesurés" data={scatterData} dataKey="gd" fill="#0057A8" />
                  <Line name={`ZAV Sr=100% (Gs=${gs})`} data={zavData} dataKey="zav100" dot={false} stroke="#94a3b8" strokeDasharray="5 5" type="monotone" />
                  <Line name="ZAV Sr=90%" data={zavData} dataKey="zav90" dot={false} stroke="#c4b5fd" strokeDasharray="3 5" type="monotone" />
                  {r.omcPct != null && <ReferenceLine x={r.omcPct} stroke="#E87722" strokeDasharray="4 4" label={{ value: `OPM=${Number(r.omcPct).toFixed(1)}%`, fill: '#E87722', fontSize: 10 }} />}
                  {r.gdMaxKnM3 != null && <ReferenceLine y={r.gdMaxKnM3} stroke="#0057A8" strokeDasharray="4 4" label={{ value: `DSM=${gdMaxTm3}`, fill: '#0057A8', fontSize: 10 }} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={secLabel}>Points de compactage</div>
            <DetailTable
              cols={['#', 'w%', 'γt (kN/m³)', 'γd (kN/m³)']}
              rows={pts.map((p: any, i: number) => [i + 1, fmt(p.waterContentPct, 1), fmt(p.totalUnitWeightKnM3), fmt(p.dryUnitWeightKnM3)])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'SPECIFIC_GRAVITY') {
    const dets: any[] = r.determinations ?? [];
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={{ ...grid2, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <StatCard label="Gs moyen" value={r.gsAverage != null ? Number(r.gsAverage).toFixed(3) : '—'} />
          <StatCard label="Déterminations" value={String(dets.length)} />
          <StatCard label="Température" value={r.temperatureC != null ? `${r.temperatureC}°C` : '—'} />
        </div>
        {dets.length > 0 && (
          <>
            <div style={secLabel}>Déterminations</div>
            <DetailTable
              cols={['#', 'M. sol sec (g)', 'M. picno (g)', 'M. picno+eau+sol (g)', 'M. picno+eau (g)', 'Gs']}
              rows={dets.map((d: any) => [
                d.determinationNumber,
                fmt(d.massDrySoilG),
                fmt(d.massPycnometerG),
                fmt(d.massPycnometerWaterSoilG),
                fmt(d.massPycnometerWaterG),
                d.gs != null ? Number(d.gs).toFixed(3) : null,
              ])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'UNCONFINED_COMPRESSION') {
    const readings: any[] = (r.readings ?? []).filter((rd: any) => rd.strainPct != null && rd.stressKpa != null).map((rd: any) => ({ strain: rd.strainPct, stress: rd.stressKpa }));
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid4}>
          <StatCard label="qu (kPa)" value={r.quKpa != null ? Number(r.quKpa).toFixed(1) : '—'} />
          <StatCard label="Su = qu/2 (kPa)" value={r.suKpa != null ? Number(r.suKpa).toFixed(1) : '—'} />
          <StatCard label="Déformation rupture" value={r.failureStrainPct != null ? `${Number(r.failureStrainPct).toFixed(2)}%` : '—'} />
          <StatCard label="Mode de rupture" value={r.failureMode ?? '—'} />
        </div>
        {readings.length > 0 && (
          <>
            <div style={secLabel}>Courbe contrainte-déformation</div>
            <div style={{ marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={readings} margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="strain" tick={{ fontSize: 10 }} label={{ value: 'Déformation (%)', position: 'insideBottom', offset: -14, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'σ (kPa)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(1)} kPa` : v} />
                  <Line type="monotone" dataKey="stress" stroke="#0057A8" dot={false} strokeWidth={2} />
                  {r.failureStrainPct != null && <ReferenceLine x={r.failureStrainPct} stroke="#E87722" strokeDasharray="4 4" />}
                  {r.quKpa != null && <ReferenceLine y={r.quKpa} stroke="#E87722" strokeDasharray="4 4" label={{ value: `qu=${Number(r.quKpa).toFixed(1)}`, fill: '#E87722', fontSize: 10 }} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'DIRECT_SHEAR') {
    const stages: any[] = r.stages ?? [];
    const mohrPts = stages.filter((s: any) => s.peakShearStressKpa != null).map((s: any) => ({ sigma: s.normalStressKpa, tau: s.peakShearStressKpa }));
    let mohrLine: { sigma: number; tauLine: number }[] = [];
    if (r.cohesionKpa != null && r.frictionAngleDeg != null && mohrPts.length >= 2) {
      const tanPhi = Math.tan((r.frictionAngleDeg * Math.PI) / 180);
      const c = r.cohesionKpa;
      const xs = mohrPts.map((p: any) => p.sigma);
      const xMin = Math.max(0, Math.min(...xs) - 20);
      const xMax = Math.max(...xs) + 20;
      mohrLine = [{ sigma: xMin, tauLine: c + tanPhi * xMin }, { sigma: xMax, tauLine: c + tanPhi * xMax }];
    }
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid3}>
          <StatCard label="Cohésion c" value={r.cohesionKpa != null ? `${Number(r.cohesionKpa).toFixed(1)} kPa` : '—'} />
          <StatCard label="Angle frottement φ" value={r.frictionAngleDeg != null ? `${Number(r.frictionAngleDeg).toFixed(1)}°` : '—'} />
          <StatCard label="R² (Mohr-Coulomb)" value={r.rSquared != null ? Number(r.rSquared).toFixed(3) : '—'} />
        </div>
        {mohrPts.length > 0 && (
          <>
            <div style={secLabel}>Enveloppe de Mohr-Coulomb</div>
            <div style={{ marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sigma" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10 }} label={{ value: 'σ normale (kPa)', position: 'insideBottom', offset: -14, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'τ cisaillement (kPa)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(1)} kPa` : v} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                  {mohrLine.length > 0 && <Line name={`τ = ${fmt(r.cohesionKpa,1)} + σ·tan(${fmt(r.frictionAngleDeg,1)}°)`} data={mohrLine} type="linear" dataKey="tauLine" stroke="#94a3b8" strokeDasharray="5 3" dot={false} />}
                  <Scatter name="Paliers (pic)" data={mohrPts} fill="#0057A8" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {stages.length > 0 && (
          <>
            <div style={secLabel}>Paliers</div>
            <DetailTable
              cols={['#', 'σ normale (kPa)', 'τ pic (kPa)', 'τ résid. (kPa)']}
              rows={stages.map((s: any, i: number) => [i + 1, fmt(s.normalStressKpa), fmt(s.peakShearStressKpa), fmt(s.residualShearStressKpa)])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'CBR') {
    const intensities: any[] = r.intensities ?? [];
    const cbr55 = intensities.find((i: any) => i.blows === 55);
    const cbr25 = intensities.find((i: any) => i.blows === 25);
    const cbr10 = intensities.find((i: any) => i.blows === 10);
    const allMm: number[] = Array.from(new Set(intensities.flatMap((i: any) => (i.penetrationReadings ?? []).map((pr: any) => pr.penetrationMm)))).sort((a, b) => a - b);
    const CBRCOLS: Record<number, string> = { 55: '#1d6eb5', 25: '#e06b00', 10: '#1a9654' };
    const chartData = allMm.map(mm => {
      const row: Record<string, any> = { mm };
      for (const iv of intensities) {
        const rd = (iv.penetrationReadings ?? []).find((pr: any) => Math.abs(pr.penetrationMm - mm) < 0.001);
        row[`b${iv.blows}`] = rd?.loadKn ?? null;
      }
      return row;
    });
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid3}>
          <StatCard label="CBR @ 55 coups" value={cbr55?.cbrIndex != null ? `${Number(cbr55.cbrIndex).toFixed(1)}%` : '—'} />
          <StatCard label="CBR @ 25 coups" value={cbr25?.cbrIndex != null ? `${Number(cbr25.cbrIndex).toFixed(1)}%` : '—'} />
          <StatCard label="CBR @ 10 coups" value={cbr10?.cbrIndex != null ? `${Number(cbr10.cbrIndex).toFixed(1)}%` : '—'} />
        </div>
        {chartData.length > 0 && (
          <>
            <div style={secLabel}>Courbes de pénétration</div>
            <div style={{ marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mm" type="number" domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: 'Enfoncement (mm)', position: 'insideBottom', offset: -14, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'Charge (kN)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => typeof v === 'number' ? `${v.toFixed(2)} kN` : v} labelFormatter={(l: any) => `${l} mm`} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine y={13.24} stroke="#999" strokeDasharray="5 3" />
                  <ReferenceLine y={19.96} stroke="#bbb" strokeDasharray="5 3" />
                  {intensities.map((iv: any) => (
                    <Line key={iv.blows} type="monotone" dataKey={`b${iv.blows}`} name={`${iv.blows} coups`} stroke={CBRCOLS[iv.blows] ?? '#666'} dot={false} strokeWidth={2} connectNulls />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'PERMEABILITY') {
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid2}>
          <StatCard label={`k à ${r.waterTemperatureC ?? '?'}°C (cm/s)`} value={r.kCms != null ? Number(r.kCms).toExponential(3) : '—'} />
          <StatCard label="k corrigé à 20°C (cm/s)" value={r.kAt20cCms != null ? Number(r.kAt20cCms).toExponential(3) : '—'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, fontSize: 10, color: '#475569', marginBottom: 8 }}>
          <div><span style={{ color: '#94a3b8' }}>Type:</span> {r.testType === 'CONSTANT_HEAD' ? 'Charge constante' : 'Charge variable'}</div>
          <div><span style={{ color: '#94a3b8' }}>Ø:</span> {fmt(r.specimenDiameterMm)} mm</div>
          <div><span style={{ color: '#94a3b8' }}>L:</span> {fmt(r.specimenLengthMm)} mm</div>
        </div>
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  if (testType === 'CONSOLIDATION') {
    const stages: any[] = r.stages ?? [];
    const eLogData = stages.filter((s: any) => s.eFinal != null && s.sigmaVKpa > 0).map((s: any) => ({
      logSigma: +Math.log10(s.sigmaVKpa).toFixed(4),
      sigma: s.sigmaVKpa,
      e: s.eFinal,
      type: s.loadType,
    }));
    const LOAD_COLORS: Record<string, string> = { LOADING: '#0057A8', UNLOADING: '#10b981', RELOADING: '#8b5cf6' };
    return (
      <div style={{ paddingTop: 10 }}>
        <AiFlag r={r} />
        <div style={grid3}>
          <StatCard label="Cc (compression)" value={r.cc != null ? Number(r.cc).toFixed(3) : '—'} />
          <StatCard label="Cs (gonflement)" value={r.cs != null ? Number(r.cs).toFixed(3) : '—'} />
          <StatCard label="σ'p (kPa)" value={r.sigmaPKpa != null ? Number(r.sigmaPKpa).toFixed(0) : '—'} />
        </div>
        {eLogData.length > 0 && (
          <>
            <div style={secLabel}>Courbe e — log σ'</div>
            <div style={{ marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={eLogData} margin={{ top: 8, right: 16, bottom: 28, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="logSigma" type="number" tick={{ fontSize: 10 }} tickFormatter={(v: any) => `${Math.pow(10, v).toFixed(0)}`} label={{ value: "σ'v (kPa) — échelle log", position: 'insideBottom', offset: -14, fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} label={{ value: 'Indice des vides e', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <Tooltip formatter={(v: any, n: any) => [typeof v === 'number' ? v.toFixed(4) : v, n === 'e' ? 'e' : n]} labelFormatter={(v: any) => `σ' = ${Math.pow(10, v).toFixed(1)} kPa`} />
                  {r.sigmaPKpa != null && <ReferenceLine x={Math.log10(r.sigmaPKpa)} stroke="#E87722" strokeDasharray="4 4" label={{ value: `σ'p=${Number(r.sigmaPKpa).toFixed(0)}`, fill: '#E87722', fontSize: 10 }} />}
                  {Object.entries(LOAD_COLORS).map(([lt, color]) => {
                    const pts = eLogData.filter((p: any) => p.type === lt);
                    return pts.length > 0 ? <Line key={lt} data={pts} type="linear" dataKey="e" stroke={color} dot={{ r: 3, fill: color }} strokeWidth={2} name={lt === 'LOADING' ? 'Chargement' : lt === 'UNLOADING' ? 'Déchargement' : 'Rechargement'} connectNulls /> : null;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {stages.length > 0 && (
          <>
            <div style={secLabel}>Paliers</div>
            <DetailTable
              cols={['σ\'v (kPa)', 'Type', 'e initial', 'e final', 'Cv (m²/an)']}
              rows={stages.map((s: any) => [
                fmt(s.sigmaVKpa, 0),
                s.loadType === 'LOADING' ? 'Charg.' : s.loadType === 'UNLOADING' ? 'Decharg.' : 'Recharg.',
                fmt(s.eInitial, 4),
                fmt(s.eFinal, 4),
                s.cvM2Year != null ? Number(s.cvM2Year).toExponential(2) : null,
              ])}
            />
          </>
        )}
        {r.notes && <div style={{ fontSize: 10, color: '#475569', marginTop: 6, fontStyle: 'italic' }}>{r.notes}</div>}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, fontSize: 10, color: '#94a3b8' }}>
      Détail non disponible pour ce type d'essai.
    </div>
  );
}

function CommentThread({ testId }: { testId: string }) {
  const { data: comments = [] } = useTestComments(testId);
  if (!comments.length) return null;

  const actionLabel: Record<string, string> = {
    SUBMITTED:        'Soumis',
    MANAGER_APPROVED: 'Approuvé (LM)',
    MANAGER_REJECTED: 'Retourné technicien',
    PM_APPROVED:      'Approuvé (PM)',
    PM_REJECTED:      'Retourné par PM',
  };
  return (
    <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
      <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
        Fil de révision
      </div>
      {comments.map((c: WorkflowComment) => (
        <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 10 }}>
          <span style={{ width: 130, flexShrink: 0, color: '#475569', fontWeight: 500 }}>
            {actionLabel[c.action] ?? c.action}
          </span>
          <span style={{ color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
            {new Date(c.createdAt).toLocaleDateString('fr-CA')}
          </span>
          {c.comment && <span style={{ color: '#475569', flex: 1 }}>{c.comment}</span>}
        </div>
      ))}
    </div>
  );
}

export default function LmProjectView({ projectId }: { projectId: string }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab]           = useState<'active' | 'completed'>('active');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [technicianId, setTechnicianId]     = useState('');
  const [priority, setPriority]             = useState('Normale');
  const [deadline, setDeadline]             = useState('');
  const [rejectingId, setRejectingId]       = useState<string | null>(null);
  const [rejectNotes, setRejectNotes]       = useState('');
  const [approveNotes, setApproveNotes]     = useState('');
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);

  const approveMutation = useManagerApprove();
  const rejectMutation  = useManagerReject();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn:  () => apiRequest<{ data: Project }>(`/api/projects/${projectId}`).then(r => r.data),
    enabled:  !!accessToken && !!projectId,
  });

  const { data: workflowTests = [], refetch: refetchTests } = useQuery({
    queryKey: ['project-workflow-tests', projectId],
    queryFn:  () =>
      apiRequest<{ data: WorkflowTest[] }>(`/api/projects/${projectId}/tests`)
        .then(r => r.data)
        .catch(() => [] as WorkflowTest[]),
    enabled:  !!accessToken && !!projectId,
  });

  const { data: techList = [] } = useTechnicians();

  const { data: wcResults     = [] } = useWcTestsByProject(projectId);
  const { data: llResults     = [] } = useLlTestsByProject(projectId);
  const { data: psResults     = [] } = usePsTestsByProject(projectId);
  const { data: prResults     = [] } = useProctorTestsByProject(projectId);
  const { data: sgResults     = [] } = useSgTestsByProject(projectId);
  const { data: ucResults     = [] } = useUcTestsByProject(projectId);
  const { data: dsResults     = [] } = useDsTestsByProject(projectId);
  const { data: cbrResults    = [] } = useCbrTestsByProject(projectId);
  const { data: permResults   = [] } = usePermTestsByProject(projectId);
  const { data: consolResults = [] } = useConsolTestsByProject(projectId);

  function getResults(testType: string): any[] {
    switch (testType) {
      case 'WATER_CONTENT':          return wcResults;
      case 'LIQUID_LIMIT':           return llResults;
      case 'PARTICLE_SIZE':          return psResults;
      case 'PROCTOR':                return prResults;
      case 'SPECIFIC_GRAVITY':       return sgResults;
      case 'UNCONFINED_COMPRESSION': return ucResults;
      case 'DIRECT_SHEAR':           return dsResults;
      case 'CBR':                    return cbrResults;
      case 'PERMEABILITY':           return permResults;
      case 'CONSOLIDATION':          return consolResults;
      default:                       return [];
    }
  }

  const assignMutation = useMutation({
    mutationFn: ({ testId, body }: { testId: string; body: object }) =>
      apiRequest(`/api/projects/${projectId}/tests/${testId}/assign`, {
        method: 'PATCH',
        body:   JSON.stringify(body),
      }),
    onSuccess: () => {
      refetchTests();
      queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
    },
  });

  const enrichedTests = workflowTests.map(t => ({
    ...t,
    technicianName: t.technicianId
      ? (() => { const tech = techList.find((tc: any) => tc.id === t.technicianId); return tech ? `${tech.firstName} ${tech.lastName}` : undefined; })()
      : undefined,
  }));

  const activeTests    = enrichedTests.filter(t => !t.workflowStatus || WF_ACTIVE.includes(t.workflowStatus));
  const completedTests = enrichedTests.filter(t => t.workflowStatus && WF_COMPLETED.includes(t.workflowStatus));
  const listTests      = activeTab === 'active' ? activeTests : completedTests;

  const selectedTest = enrichedTests.find(t => t.id === selectedTestId) ?? listTests[0] ?? null;

  function handleSelectTest(t: WorkflowTest & { technicianName?: string }) {
    setSelectedTestId(t.id);
    setTechnicianId(t.technicianId ?? '');
    setPriority(t.priority ?? 'Normale');
    setDeadline(t.deadline ?? '');
    setRejectingId(null);
    setRejectNotes('');
    setApproveNotes('');
  }

  function handleSave() {
    if (!selectedTest) return;
    assignMutation.mutate({ testId: selectedTest.id, body: { technicianId, priority, deadline } });
  }

  function handleApprove(testId: string) {
    approveMutation.mutate({ testId, notes: approveNotes }, {
      onSuccess: () => {
        setApproveNotes('');
        queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
      },
    });
  }

  function handleReject(testId: string) {
    rejectMutation.mutate({ testId, notes: rejectNotes }, {
      onSuccess: () => {
        setRejectingId(null);
        setRejectNotes('');
        queryClient.invalidateQueries({ queryKey: ['project-workflow-tests', projectId] });
      },
    });
  }

  const techAssignmentCount: Record<string, number> = {};
  enrichedTests.forEach(t => {
    if (t.technicianId) techAssignmentCount[t.technicianId] = (techAssignmentCount[t.technicianId] ?? 0) + 1;
  });

  return (
    <div style={{ display: 'flex', margin: -24, height: 'calc(100vh - 68px)', overflow: 'hidden' }}>

      {/* ── Left — Test list ── */}
      <div style={{ width: 220, minWidth: 220, borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Tabs */}
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#475569', marginBottom: 6 }}>
            {project?.projectCode} · {enrichedTests.length} essai{enrichedTests.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', gap: 2, background: '#e2e8f0', borderRadius: 5, padding: 2 }}>
            {(['active', 'completed'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '3px 0', borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: 10,
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? '#1c2333' : '#64748b',
                  fontFamily: 'inherit',
                }}>
                {tab === 'active' ? `Actifs (${activeTests.length})` : `Terminés (${completedTests.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {listTests.length === 0 && (
            <div style={{ padding: '24px 14px', fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
              {activeTab === 'active' ? 'Aucun essai en attente de révision.' : 'Aucun essai terminé.'}
            </div>
          )}
          {listTests.map(t => {
            const meta     = TEST_META[t.testType] ?? { name: t.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const isActive = (selectedTest?.id ?? listTests[0]?.id) === t.id;
            const dotColor = workflowDot(t.workflowStatus);
            const assigned = !!t.technicianId;
            return (
              <div key={t.id} onClick={() => handleSelectTest(t)}
                style={{ padding: '8px 12px', borderLeft: `3px solid ${isActive ? '#0e7490' : 'transparent'}`, background: isActive ? '#e0f2f9' : 'transparent', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#1c2333' }}>{meta.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: assigned ? '#065f46' : '#92400e' }}>
                    {t.technicianName ?? 'Non assigné'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technician availability (active tab only) */}
        {activeTab === 'active' && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Techniciens
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {techList.slice(0, 5).map((tech: any) => {
                const color = hashColor(`${tech.firstName}${tech.lastName}`);
                const count = techAssignmentCount[tech.id] ?? 0;
                return (
                  <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: count > 0 ? '#475569' : '#94a3b8' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, color: color.text, flexShrink: 0 }}>
                      {initials(tech.firstName, tech.lastName)}
                    </div>
                    {tech.firstName} {tech.lastName} · {count > 0 ? `${count} essai${count > 1 ? 's' : ''}` : 'libre'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Right — Detail area ── */}
      <div style={{ flex: 1, background: '#f4f5f7', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {!selectedTest ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
              Sélectionnez un essai.
            </div>
          ) : (() => {
            const meta      = TEST_META[selectedTest.testType] ?? { name: selectedTest.testType, norm: '', cat: '', icon: 'ti-flask', bg: '#f1f5f9', ic: '#64748b' };
            const results   = getResults(selectedTest.testType);
            const renderFn  = RESULT_RENDER[selectedTest.testType] ?? (() => '—');
            const ws        = selectedTest.workflowStatus;
            const isCompleted = activeTab === 'completed';
            const canAct    = !isCompleted && (ws === 'PENDING_MANAGER_REVIEW' || ws === 'REJECTED_TO_MANAGER');

            return (
              <>
                {/* Assignment card (active tab only) */}
                {activeTab === 'active' && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 5, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className={`ti ${meta.icon}`} style={{ fontSize: 15, color: meta.ic }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1c2333', flex: 1 }}>{meta.name}</div>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{meta.norm}</span>
                      {workflowPill(ws)}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      {[
                        { label: 'Technicien', content: (
                          <select value={technicianId} onChange={e => setTechnicianId(e.target.value)}
                            style={{ flex: 1, border: `1px solid ${technicianId ? '#10b981' : '#e2e8f0'}`, borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: technicianId ? '#f0fdf4' : '#f8fafc', outline: 'none' }}>
                            <option value="">— Choisir —</option>
                            {techList.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                          </select>
                        )},
                        { label: 'Priorité', content: (
                          <select value={priority} onChange={e => setPriority(e.target.value)}
                            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }}>
                            <option>Normale</option><option>Haute</option><option>Urgente</option>
                          </select>
                        )},
                        { label: 'Échéance', content: (
                          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                            style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', color: '#1c2333', background: '#f8fafc', outline: 'none' }} />
                        )},
                      ].map(row => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: '#475569', width: 100, flexShrink: 0 }}>{row.label}</span>
                          {row.content}
                        </div>
                      ))}
                      <button onClick={handleSave} disabled={assignMutation.isPending}
                        style={{ background: '#0e7490', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {assignMutation.isPending ? '...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Workflow approval card */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Résultats · {results.length}
                    </span>
                    {workflowPill(ws)}
                  </div>
                  <div style={{ padding: '8px 14px' }}>
                    {results.length === 0 ? (
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Aucun résultat soumis.</p>
                    ) : (
                      results.map((r: any) => {
                        const date = new Date(r.createdAt).toLocaleDateString('fr-CA');
                        const viewUrl = `/projects/${projectId}/tests/${meta.path}/${r.id}`;
                        const isExpanded = expandedResultId === r.id;
                        return (
                          <div key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 5, marginBottom: 8, overflow: 'hidden' }}>
                            {/* Row header — click to expand */}
                            <div
                              onClick={() => setExpandedResultId(isExpanded ? null : r.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '7px 10px', cursor: 'pointer', background: isExpanded ? '#f0f9ff' : '#fff', userSelect: 'none' }}
                            >
                              {resultStatusChip(r.status)}
                              <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>{date}</span>
                              {r.aiFlag && r.aiFlag !== 'NONE' && (
                                <span style={{ fontSize: 9, background: '#ffedd5', color: '#9a3412', padding: '1px 6px', borderRadius: 10, border: '1px solid #fed7aa', flexShrink: 0 }}>
                                  ⚠ IA {r.aiFlag}
                                </span>
                              )}
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#1c2333', fontFamily: 'monospace', flex: 1 }}>
                                {renderFn(r)}
                              </span>
                              <span style={{ fontSize: 10, color: '#0e7490', flexShrink: 0 }}>
                                {isExpanded ? '▲ Réduire' : '▼ Détails'}
                              </span>
                            </div>
                            {/* Expanded detail */}
                            {isExpanded && (
                              <div style={{ padding: '0 10px 10px 10px', borderTop: '1px solid #e2e8f0', background: '#fafcff' }}>
                                <TestResultDetail testType={selectedTest.testType} r={r} />
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                                  <Link href={viewUrl}>
                                    <button style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, border: '1px solid #0e7490', background: '#f0f9ff', color: '#0e7490', cursor: 'pointer', fontFamily: 'inherit' }}>
                                      Ouvrir la page complète
                                    </button>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Workflow actions (active only, correct status only) */}
                    {canAct && rejectingId !== selectedTest.id && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 6 }}>
                          <input
                            value={approveNotes}
                            onChange={e => setApproveNotes(e.target.value)}
                            placeholder="Note d'approbation (optionnel)..."
                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleApprove(selectedTest.id)}
                            disabled={approveMutation.isPending}
                            style={{ background: '#12B76A', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {approveMutation.isPending ? '...' : 'Approuver → PM'}
                          </button>
                          <button
                            onClick={() => { setRejectingId(selectedTest.id); setRejectNotes(''); }}
                            style={{ background: 'transparent', color: '#D92D20', border: '1px solid #D92D20', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Retourner au technicien
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rejection form */}
                    {canAct && rejectingId === selectedTest.id && (
                      <div style={{ marginTop: 8 }}>
                        <textarea
                          value={rejectNotes}
                          onChange={e => setRejectNotes(e.target.value)}
                          placeholder="Motif du retour (obligatoire)..."
                          rows={3}
                          style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            onClick={() => handleReject(selectedTest.id)}
                            disabled={rejectMutation.isPending || !rejectNotes.trim()}
                            style={{ background: '#D92D20', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {rejectMutation.isPending ? '...' : 'Confirmer le retour'}
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectNotes(''); }}
                            style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 4, padding: '5px 14px', fontSize: 11, cursor: 'pointer', color: '#64748b', fontFamily: 'inherit' }}>
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comment thread */}
                    <CommentThread testId={selectedTest.id} />
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
