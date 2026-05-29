'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label, Legend,
} from 'recharts';

interface SievePoint {
  sieveLabel: string;
  openingMm: number;
  pctFiner: number;
}

export interface CctpPoint {
  sieveMm: number;
  minPct: number;
  maxPct: number;
}

// Default CCTP envelope for GNT (NF P94-056 / French road spec)
export const GNT_CCTP: CctpPoint[] = [
  { sieveMm: 40,   minPct: 95,  maxPct: 100 },
  { sieveMm: 20,   minPct: 60,  maxPct: 85  },
  { sieveMm: 10,   minPct: 40,  maxPct: 65  },
  { sieveMm: 2,    minPct: 15,  maxPct: 35  },
  { sieveMm: 0.5,  minPct: 5,   maxPct: 18  },
  { sieveMm: 0.08, minPct: 0,   maxPct: 8   },
];

const TICK_VALUES_MM = [50, 40, 31.5, 20, 10, 5, 2, 1, 0.5, 0.25, 0.08, 0.01, 0.002];

function fmtMm(mm: number): string {
  if (mm >= 10) return `${Math.round(mm)}`;
  if (mm >= 1)  return `${mm}`;
  return `${mm}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#4F7DF3" stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={9} fill="#6b7280">{payload.label}</text>
    </g>
  );
}

interface Props {
  sieveResults: SievePoint[];
  cctpEnvelope?: CctpPoint[];
  showCctp?: boolean;
}

export default function GrainSizeCurve({ sieveResults, cctpEnvelope, showCctp = false }: Props) {
  const points = sieveResults
    .filter(r => r.pctFiner != null)
    .sort((a, b) => b.openingMm - a.openingMm)
    .map(r => ({
      x: Math.log10(Number(r.openingMm)),
      y: Number(r.pctFiner),
      label: r.sieveLabel,
    }));

  const envelope = cctpEnvelope ?? (showCctp ? GNT_CCTP : []);
  const cctpMin = envelope
    .sort((a, b) => b.sieveMm - a.sieveMm)
    .map(p => ({ x: Math.log10(p.sieveMm), cctpMin: p.minPct }));
  const cctpMax = envelope
    .sort((a, b) => b.sieveMm - a.sieveMm)
    .map(p => ({ x: Math.log10(p.sieveMm), cctpMax: p.maxPct }));

  if (points.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Aucune donnée de tamisage disponible.</p>;
  }

  const allX = [...points.map(p => p.x), ...envelope.map(p => Math.log10(p.sieveMm))];
  const xMin = Math.min(...allX) - 0.15;
  const xMax = Math.max(...allX) + 0.15;

  const ticks = TICK_VALUES_MM
    .map(v => Math.log10(v))
    .filter(t => t >= xMin - 0.1 && t <= xMax + 0.1);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <LineChart margin={{ top: 16, right: 24, bottom: 48, left: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        <XAxis
          dataKey="x"
          type="number"
          domain={[xMin, xMax]}
          reversed
          ticks={ticks}
          tickFormatter={v => fmtMm(Math.pow(10, v))}
          tick={{ fontSize: 11 }}
        >
          <Label
            value="Diamètre des particules (mm)"
            position="insideBottom"
            offset={-32}
            style={{ fontSize: 12, fill: '#374151' }}
          />
        </XAxis>

        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} width={48} tick={{ fontSize: 11 }}>
          <Label
            value="% Passant"
            angle={-90}
            position="insideLeft"
            offset={-40}
            style={{ fontSize: 12, fill: '#374151' }}
          />
        </YAxis>

        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => {
            if (typeof v !== 'number') return [v, name];
            if (name === 'cctpMin') return [`${v.toFixed(1)}%`, 'CCTP MIN'];
            if (name === 'cctpMax') return [`${v.toFixed(1)}%`, 'CCTP MAX'];
            return [`${v.toFixed(1)}%`, '% Passant'];
          }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(v: any) => `D = ${Math.pow(10, Number(v)).toFixed(4)} mm`}
          contentStyle={{ fontSize: 12 }}
        />

        {(showCctp || (cctpEnvelope && cctpEnvelope.length > 0)) && (
          <Legend verticalAlign="top" />
        )}

        {/* Gravel / Sand boundary at 4.75 mm */}
        <ReferenceLine
          x={Math.log10(4.75)}
          stroke="#94a3b8"
          strokeDasharray="5 3"
          label={{ value: 'Gravier | Sable', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
        />

        {/* Sand / Fines boundary at 0.075 or 0.08 mm */}
        <ReferenceLine
          x={Math.log10(0.08)}
          stroke="#94a3b8"
          strokeDasharray="5 3"
          label={{ value: 'Sable | Fines', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
        />

        {/* CCTP MIN envelope */}
        {envelope.length > 0 && (
          <Line
            data={cctpMin}
            type="monotone"
            dataKey="cctpMin"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            name="CCTP MIN"
          />
        )}

        {/* CCTP MAX envelope */}
        {envelope.length > 0 && (
          <Line
            data={cctpMax}
            type="monotone"
            dataKey="cctpMax"
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            name="CCTP MAX"
          />
        )}

        {/* Measured curve */}
        <Line
          data={points}
          type="monotone"
          dataKey="y"
          stroke="#4F7DF3"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 6 }}
          connectNulls
          name="Courbe mesurée"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
