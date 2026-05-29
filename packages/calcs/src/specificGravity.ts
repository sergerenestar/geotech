/**
 * ASTM D-854: Standard Test Methods for Specific Gravity of Soil Solids by Water Pycnometer
 */

export interface SgDetermination {
  massPycnometerG: number;
  massPycnometerDrySoilG: number;
  massPycnometerSoilWaterG: number;
  massPycnometerWaterG: number;
  kFactor: number;
}

export interface SgResult {
  gs: number;
  averageGs: number;
}

/** ASTM D-854: Gs = (Ms / (Ms + Mfw - Msfw)) × k — not yet implemented — Sprint 4 */
export function calcSpecificGravity(
  _determinations: SgDetermination[]
): SgResult {
  throw new Error('Not implemented — scheduled for Sprint 4');
}
