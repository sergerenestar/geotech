'use client';

import { useEffect, useState } from 'react';

interface Row {
  massContainerG: string;
  massContainerWetSoilG: string;
  massContainerDrySoilG: string;
}

interface CalcRow extends Row {
  massWaterG: number | null;
  massDrySoilG: number | null;
  waterContentPct: number | null;
}

function calc(row: Row): CalcRow {
  const c = parseFloat(row.massContainerG);
  const w = parseFloat(row.massContainerWetSoilG);
  const d = parseFloat(row.massContainerDrySoilG);
  if (isNaN(c) || isNaN(w) || isNaN(d)) return { ...row, massWaterG: null, massDrySoilG: null, waterContentPct: null };
  const mw = w - d;
  const md = d - c;
  const wc = md > 0 ? (mw / md) * 100 : null;
  return { ...row, massWaterG: +mw.toFixed(3), massDrySoilG: +md.toFixed(3), waterContentPct: wc !== null ? +wc.toFixed(3) : null };
}

interface Props {
  onChange: (rows: { massContainerG: number; massContainerWetSoilG: number; massContainerDrySoilG: number }[]) => void;
  initialRows?: { massContainerG: number; massContainerWetSoilG: number; massContainerDrySoilG: number }[];
}

export default function WcDeterminationTable({ onChange, initialRows }: Props) {
  const [rows, setRows] = useState<Row[]>(
    initialRows && initialRows.length > 0
      ? initialRows.map(r => ({
          massContainerG: String(r.massContainerG),
          massContainerWetSoilG: String(r.massContainerWetSoilG),
          massContainerDrySoilG: String(r.massContainerDrySoilG),
        }))
      : [{ massContainerG: '', massContainerWetSoilG: '', massContainerDrySoilG: '' }]
  );

  const calcRows = rows.map(calc);

  useEffect(() => {
    const valid = calcRows
      .filter(r => r.massWaterG !== null && r.massDrySoilG !== null)
      .map(r => ({
        massContainerG: parseFloat(r.massContainerG),
        massContainerWetSoilG: parseFloat(r.massContainerWetSoilG),
        massContainerDrySoilG: parseFloat(r.massContainerDrySoilG),
      }));
    onChange(valid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function update(i: number, field: keyof Row, value: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, { massContainerG: '', massContainerWetSoilG: '', massContainerDrySoilG: '' }]);
  }

  function removeRow(i: number) {
    setRows(prev => prev.filter((_, idx) => idx !== i));
  }

  const avg = calcRows.filter(r => r.waterContentPct !== null).map(r => r.waterContentPct!);
  const avgWc = avg.length > 0 ? (avg.reduce((a, b) => a + b, 0) / avg.length).toFixed(3) : null;

  const col = 'border border-gray-200 px-2 py-1 text-sm';
  const inp = 'w-full bg-transparent text-right focus:outline-none';

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className={`${col} text-left`}>#</th>
              <th className={col}>Masse cont. (g)</th>
              <th className={col}>Masse cont.+sol humide (g)</th>
              <th className={col}>Masse cont.+sol sec (g)</th>
              <th className={col}>Masse eau (g)</th>
              <th className={col}>Masse sol sec (g)</th>
              <th className={col}>w% calculé</th>
              <th className={col}></th>
            </tr>
          </thead>
          <tbody>
            {calcRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className={`${col} text-center text-gray-500`}>{i + 1}</td>
                {(['massContainerG', 'massContainerWetSoilG', 'massContainerDrySoilG'] as const).map(field => (
                  <td key={field} className={col}>
                    <input
                      type="number"
                      step="0.001"
                      value={row[field]}
                      onChange={e => update(i, field, e.target.value)}
                      className={inp}
                      placeholder="0.000"
                    />
                  </td>
                ))}
                <td className={`${col} text-right text-gray-500`}>{row.massWaterG ?? '—'}</td>
                <td className={`${col} text-right text-gray-500`}>{row.massDrySoilG ?? '—'}</td>
                <td className={`${col} text-right font-medium ${row.waterContentPct !== null && row.waterContentPct > 100 ? 'text-amber-600' : 'text-gray-800'}`}>
                  {row.waterContentPct !== null ? `${row.waterContentPct}%` : '—'}
                </td>
                <td className={col}>
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 px-1">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {avgWc && (
            <tfoot>
              <tr className="bg-brand-50 font-semibold">
                <td colSpan={6} className={`${col} text-right text-gray-600`}>Teneur en eau moyenne</td>
                <td className={`${col} text-right text-brand-700`}>{avgWc}%</td>
                <td className={col}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-brand-600 hover:text-brand-800 underline"
      >
        + Ajouter une détermination
      </button>
    </div>
  );
}
