/**
 * ASTM D-2216: Standard Test Methods for Laboratory Determination of Water (Moisture) Content of Soil and Rock by Mass
 */

export interface WcDetermination {
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
}

export interface WcDeterminationResult extends WcDetermination {
  massWaterG: number;
  massDrySoilG: number;
  waterContentPct: number;
}

export interface WcResult {
  determinations: WcDeterminationResult[];
  averageWaterContentPct: number;
}

/** ASTM D-2216: w% = (M_water / M_dry_soil) × 100 */
export function calcWaterContentDetermination(
  determination: WcDetermination
): WcDeterminationResult {
  const massWaterG =
    determination.massContainerWetSoilG - determination.massContainerDrySoilG;
  const massDrySoilG =
    determination.massContainerDrySoilG - determination.massContainerG;
  const waterContentPct = (massWaterG / massDrySoilG) * 100;
  return { ...determination, massWaterG, massDrySoilG, waterContentPct };
}

/** ASTM D-2216: calculates all determinations and returns the average water content */
export function calcWaterContent(
  determinations: WcDetermination[]
): WcResult {
  if (determinations.length === 0) {
    throw new Error('At least one determination is required');
  }
  const results = determinations.map(calcWaterContentDetermination);
  const sum = results.reduce((acc, r) => acc + r.waterContentPct, 0);
  const averageWaterContentPct = Math.round((sum / results.length) * 1000) / 1000;
  return { determinations: results, averageWaterContentPct };
}
