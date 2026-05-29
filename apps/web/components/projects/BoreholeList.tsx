'use client';

import { useState } from 'react';

interface Sample {
  id: string;
  sampleCode: string;
  depthFromM: number;
  depthToM: number;
  soilDescription: string;
  uscsSymbol: string;
}

interface Borehole {
  id: string;
  bhCode: string;
  depthM: number;
  samples?: Sample[];
}

interface BoreholeListProps {
  boreholes: Borehole[];
}

function SampleRow({ sample }: { sample: Sample }) {
  return (
    <div className="ml-6 pl-4 border-l border-gray-200 py-1">
      <span className="text-xs font-mono text-gray-600">{sample.sampleCode}</span>
      <span className="text-xs text-gray-400 ml-2">
        {sample.depthFromM}m – {sample.depthToM}m
      </span>
      {sample.uscsSymbol && (
        <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
          {sample.uscsSymbol}
        </span>
      )}
      {sample.soilDescription && (
        <p className="text-xs text-gray-500 mt-0.5">{sample.soilDescription}</p>
      )}
    </div>
  );
}

function BoreholeRow({ borehole }: { borehole: Borehole }) {
  const [expanded, setExpanded] = useState(false);
  const hasSamples = borehole.samples && borehole.samples.length > 0;

  return (
    <div className="border border-gray-100 rounded-lg mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-gray-800">{borehole.bhCode}</span>
          {borehole.depthM && (
            <span className="text-xs text-gray-500">{borehole.depthM}m</span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {hasSamples ? `${borehole.samples!.length} éch.` : 'Aucun échantillon'}
          <span className="ml-2">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>
      {expanded && hasSamples && (
        <div className="pb-2">
          {borehole.samples!.map(s => <SampleRow key={s.id} sample={s} />)}
        </div>
      )}
    </div>
  );
}

export default function BoreholeList({ boreholes }: BoreholeListProps) {
  if (boreholes.length === 0) {
    return <p className="text-sm text-gray-400 py-4">Aucun forage enregistré.</p>;
  }
  return (
    <div>
      {boreholes.map(b => <BoreholeRow key={b.id} borehole={b} />)}
    </div>
  );
}
