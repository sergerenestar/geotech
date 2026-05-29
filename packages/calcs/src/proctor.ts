/**
 * ASTM D-698: Standard Test Methods for Laboratory Compaction Characteristics of Soil (Standard Effort)
 * ASTM D-1557: Standard Test Methods for Laboratory Compaction Characteristics of Soil (Modified Effort)
 */

export interface ProctorPoint {
  waterContentPct: number;
  wetUnitWeightKnM3: number;
}

export interface ProctorResult {
  optimumMoistureContentPct: number;
  maxDryDensityGCm3: number;
  curvePoints: { waterContentPct: number; dryDensityGCm3: number }[];
}

/** ASTM D-698 / D-1557: not yet implemented — Sprint 4 */
export function calcProctorCurve(
  _points: ProctorPoint[],
  _moldVolumeCm3: number
): ProctorResult {
  throw new Error('Not implemented — scheduled for Sprint 4');
}

/** Zero Air Voids curve: γd = Gs × γw / (1 + Gs × w/100) */
export function calcZeroAirVoidsDensity(
  _waterContentPct: number,
  _gs: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 4');
}
