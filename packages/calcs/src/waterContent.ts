/**
 * ASTM D-2216: Standard Test Methods for Laboratory Determination of Water (Moisture) Content of Soil and Rock by Mass
 *
 * A test specimen is weighed wet, dried in a 110 ± 5 °C oven, then weighed again.
 * The technician records three masses (container alone, container+wet soil, container+dry soil)
 * for each determination. At least two parallel determinations are required; the result reported
 * is their arithmetic mean.
 */

/** Raw measurements recorded by the technician for a single determination. */
export interface WcDetermination {
  /** Mass of the empty container in grams. */
  massContainerG: number;
  /** Mass of container + wet soil specimen before oven drying (g). */
  massContainerWetSoilG: number;
  /** Mass of container + oven-dried soil specimen (g). */
  massContainerDrySoilG: number;
}

/** Single-determination result with derived quantities appended. */
export interface WcDeterminationResult extends WcDetermination {
  /** Mass of evaporated water: M_wet − M_dry (g). */
  massWaterG: number;
  /** Mass of the oven-dried soil solids: M_dry − M_container (g). */
  massDrySoilG: number;
  /** Gravimetric water content as a percentage: (M_water / M_dry) × 100. */
  waterContentPct: number;
}

/** Aggregated result for a complete water-content test (one or more determinations). */
export interface WcResult {
  determinations: WcDeterminationResult[];
  /** Arithmetic mean of all determination water contents, rounded to 3 decimal places (%). */
  averageWaterContentPct: number;
}

/**
 * Calculates water content for a single determination.
 *
 * Formula (ASTM D-2216 §9.2):
 *   w% = (M_water / M_dry_soil) × 100
 *
 * @param determination - Raw mass readings from one tare container.
 * @returns Derived masses and water content appended to the input.
 */
export function calcWaterContentDetermination(
  determination: WcDetermination
): WcDeterminationResult {
  const massWaterG = determination.massContainerWetSoilG - determination.massContainerDrySoilG;
  const massDrySoilG = determination.massContainerDrySoilG - determination.massContainerG;
  const waterContentPct = (massWaterG / massDrySoilG) * 100;
  return { ...determination, massWaterG, massDrySoilG, waterContentPct };
}

/**
 * Calculates all determinations and returns their average water content.
 *
 * The average is rounded to 3 decimal places to match lab report precision.
 * Throws if the determinations array is empty — at least one record is required
 * by ASTM D-2216 §8.3.
 *
 * @param determinations - One or more raw determination objects.
 * @returns Full per-determination results plus the averaged water content.
 */
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
