/**
 * ASTM D-3080: Standard Test Method for Direct Shear Test of Soils Under Consolidated Drained Conditions
 */

export interface DsStageResult {
  normalStressKpa: number;
  peakShearStressKpa: number;
}

export interface MohrCoulombResult {
  cohesionKpa: number;
  frictionAngleDeg: number;
  rSquared: number;
}

/** ASTM D-3080: Mohr-Coulomb linear regression — not yet implemented — Sprint 5 */
export function calcMohrCoulomb(
  _stages: DsStageResult[]
): MohrCoulombResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
