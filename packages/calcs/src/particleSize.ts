/**
 * ASTM D-422: Standard Test Method for Particle-Size Analysis of Soils
 */

export interface SieveReading {
  openingMm: number;
  massRetainedG: number;
}

export interface ParticleSizeResult {
  d10Mm: number;
  d30Mm: number;
  d60Mm: number;
  cu: number;
  cc: number;
  clayPct: number;
  siltAndClayPct: number;
  fineSandPct: number;
  mediumSandPct: number;
  coarseSandPct: number;
  fineGravelPct: number;
  coarseGravelPct: number;
  uscsSymbol: string;
  aashtoSymbol: string;
}

/** ASTM D-422: not yet implemented — Sprint 3 */
export function calcParticleSize(
  _sieveReadings: SieveReading[],
  _totalSpecimenMassG: number
): ParticleSizeResult {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** Cu = D60 / D10 */
export function calcUniformityCoefficient(_d10: number, _d60: number): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** Cc = D30² / (D10 × D60) */
export function calcCurvatureCoefficient(
  _d10: number,
  _d30: number,
  _d60: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** USCS classification per ASTM D-2487 */
export function classifyUSCS(
  _ll: number,
  _pi: number,
  _finesPct: number,
  _sandPct: number,
  _gravelPct: number,
  _cu: number,
  _cc: number
): string {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** AASHTO classification per ASTM D-3282 */
export function classifyAASHTO(
  _ll: number,
  _pi: number,
  _finesPct: number,
  _sandPct: number,
  _gravelPct: number
): string {
  throw new Error('Not implemented — scheduled for Sprint 3');
}
