/**
 * ASTM D-2166: Standard Test Method for Unconfined Compressive Strength of Cohesive Soil
 */

export interface UcReading {
  deformationDiv: number;
  provingRingDiv: number;
  deformationFactorMmPerDiv: number;
  provingRingFactorNPerDiv: number;
  initialHeightMm: number;
  initialAreaMm2: number;
}

export interface UcResult {
  readings: (UcReading & {
    normalDeformationMm: number;
    axialStrain: number;
    correctedAreaMm2: number;
    stressKpa: number;
  })[];
  quKpa: number;
  suKpa: number;
}

/** ASTM D-2166: corrected area A = A0 / (1 - ε), stress = Load / A — not yet implemented — Sprint 5 */
export function calcUnconfinedCompression(_readings: UcReading[]): UcResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
