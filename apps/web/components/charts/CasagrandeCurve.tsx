'use client';

import {
  ScatterChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label, ComposedChart,
} from 'recharts';

interface CasagrandePoint {
  blowCount: number;
  waterContentPct: number;
  pointNumber: number;
}

interface Props {
  points: CasagrandePoint[];
  llPct?: number;
}

function logRegression(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 2) return null;
  const xs = pts.map(p => Math.log10(p.x));
  const ys = pts.map(p => p.y);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  if (den === 0) return null;
  const A = num / den;
  const B = yMean - A * xMean;
  return { A, B };
}

export default function CasagrandeCurve({ points, llPct }: Props) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Aucun point Casagrande disponible.</p>;
  }

  const scatterData = points.map(p => ({
    x: Math.log10(p.blowCount),
    y: Number(p.waterContentPct),
    blows: p.blowCount,
  }));

  const reg = logRegression(points.map(p => ({ x: p.blowCount, y: Number(p.waterContentPct) })));

  const blowRange = [1, 5, 10, 15, 20, 25, 30, 40, 50];
  const lineData = reg
    ? blowRange.map(b => ({
        x: Math.log10(b),
        fit: reg.A * Math.log10(b) + reg.B,
      }))
    : [];

  const allX = scatterData.map(p => p.x);
  const xMin = Math.min(...allX, Math.log10(10)) - 0.1;
  const xMax = Math.max(...allX, Math.log10(40)) + 0.1;

  const ticks = [5, 10, 15, 20, 25, 30, 40, 50]
    .map(v => Math.log10(v))
    .filter(t => t >= xMin - 0.1 && t <= xMax + 0.1);

  const yValues = scatterData.map(p => p.y);
  const yMin = Math.floor(Math.min(...yValues) - 5);
  const yMax = Math.ceil(Math.max(...yValues) + 5);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart margin={{ top: 16, right: 24, bottom: 48, left: 56 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

        <XAxis
          dataKey="x"
          type="number"
          domain={[xMin, xMax]}
          ticks={ticks}
          tickFormatter={v => `${Math.round(Math.pow(10, v))}`}
          tick={{ fontSize: 11 }}
          name="Coups"
        >
          <Label
            value="Nombre de coups (N)"
            position="insideBottom"
            offset={-32}
            style={{ fontSize: 12, fill: '#374151' }}
          />
        </XAxis>

        <YAxis domain={[yMin, yMax]} tickFormatter={v => `${v}%`} width={48} tick={{ fontSize: 11 }}>
          <Label
            value="Teneur en eau w%"
            angle={-90}
            position="insideLeft"
            offset={-40}
            style={{ fontSize: 12, fill: '#374151' }}
          />
        </YAxis>

        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) =>
            name === 'fit' ? [`${Number(v).toFixed(1)}%`, 'Droite de régression'] : [`${Number(v).toFixed(1)}%`, 'w%']
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(v: any) => `N = ${Math.round(Math.pow(10, Number(v)))} coups`}
          contentStyle={{ fontSize: 12 }}
        />

        {/* Best-fit line */}
        {lineData.length > 0 && (
          <Line
            data={lineData}
            type="monotone"
            dataKey="fit"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
          />
        )}

        {/* LL reference at 25 blows */}
        <ReferenceLine
          x={Math.log10(25)}
          stroke="#f59e0b"
          strokeWidth={2}
          label={{
            value: llPct != null ? `LL = ${Number(llPct).toFixed(1)}%` : 'N=25',
            position: 'insideTopRight',
            fontSize: 11,
            fill: '#d97706',
          }}
        />

        {/* Measured points */}
        <Scatter
          data={scatterData}
          fill="#4F7DF3"
          stroke="#fff"
          strokeWidth={1.5}
          r={5}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
