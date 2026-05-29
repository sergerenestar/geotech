/**
 * ASTM D-2434: Standard Test Method for Measurement of Hydraulic Conductivity of Saturated Porous Materials Using a Rigid-Wall, Gravity-Type Permeameter
 */

export interface ConstantHeadReading {
  h1Cm: number;
  h2Cm: number;
  durationS: number;
  vwCm3: number;
  specimenLengthCm: number;
  specimenAreaCm2: number;
}

export interface FallingHeadReading {
  h1Cm: number;
  h2Cm: number;
  durationS: number;
  tubeDiameterCm: number;
  specimenLengthCm: number;
  specimenAreaCm2: number;
}

/** ASTM D-2434 Constant Head: k = (Q × L) / (A × h × t) — not yet implemented — Sprint 5 */
export function calcConstantHeadPermeability(
  _readings: ConstantHeadReading[],
  _temperatureC: number
): { kCmS: number; k20cCmS: number } {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/** ASTM D-2434 Falling Head: k = (a × L / A × t) × ln(h1/h2) — not yet implemented — Sprint 5 */
export function calcFallingHeadPermeability(
  _readings: FallingHeadReading[],
  _temperatureC: number
): { kCmS: number; k20cCmS: number } {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
