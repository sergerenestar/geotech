/**
 * ASTM D-2435: Standard Test Methods for One-Dimensional Consolidation Properties of Soils Using Incremental Loading
 */

export interface ConsolLoadStageInput {
  pressure: number;
  t90Min?: number;
  t50Min?: number;
  d0: number;
  d50?: number;
  d100: number;
  initialHeightCm: number;
}

export interface ConsolResult {
  cc: number;
  cs: number;
  pcTonFt2: number;
  pcKpa: number;
  stageResults: {
    pressure: number;
    voidRatioE: number;
    cvFromT90?: number;
    cvFromT50?: number;
  }[];
}

/** ASTM D-2435: Cv by log-time and square root of time methods — not yet implemented — Sprint 5 */
export function calcConsolidation(
  _stages: ConsolLoadStageInput[],
  _gs: number,
  _drySoilMassG: number,
  _specimenDiameterCm: number
): ConsolResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/** Cv (√t method): Cv = (0.848 × Hdr²) / t90 */
export function calcCvFromT90(
  _t90Min: number,
  _drainagePathCm: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/** Cv (log-t method): Cv = (0.197 × Hdr²) / t50 */
export function calcCvFromT50(
  _t50Min: number,
  _drainagePathCm: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
