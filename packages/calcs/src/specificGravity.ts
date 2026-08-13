/**
 * ASTM D-854: Standard Test Methods for Specific Gravity of Soil Solids by Water Pycnometer
 *
 * Specific gravity (Gs) is the ratio of the mass of a volume of soil solids to the mass of an
 * equal volume of distilled water at 20 °C. Typical values: Gs ≈ 2.60–2.80 for most soils.
 *
 * Procedure: A calibrated pycnometer (volumetric flask) is filled with de-aired water and weighed
 * (Mfw). Oven-dried soil is added, air is removed by heating or vacuum, and the pycnometer is
 * refilled to the calibration mark and weighed again (Msfw). The temperature correction factor k
 * normalises the result to 20 °C.
 *
 * Formula (ASTM D-854 §10.4):
 *   Gs = (Ms / (Ms + Mfw − Msfw)) × k
 * where Ms = mass of dry soil solids = M_pycnometer+soil − M_pycnometer.
 *
 * All functions are stubs — implementation scheduled for Sprint 4.
 */

/** Raw masses from a single pycnometer determination. */
export interface SgDetermination {
  /** Mass of the empty calibrated pycnometer (g). */
  massPycnometerG: number;
  /** Mass of pycnometer + oven-dried soil (g). */
  massPycnometerDrySoilG: number;
  /** Mass of pycnometer + soil + de-aired water filled to calibration mark (g). */
  massPycnometerSoilWaterG: number;
  /** Mass of pycnometer filled to calibration mark with water only, at test temperature (g). */
  massPycnometerWaterG: number;
  /** Temperature correction factor k = ρw_20°C / ρw_T (dimensionless, from ASTM D-854 Table 1). */
  kFactor: number;
}

/** Result: per-determination Gs and the average reported value. */
export interface SgResult {
  /** Specific gravity from this single determination (dimensionless). */
  gs: number;
  /** Average Gs across all determinations, rounded to 3 decimal places. */
  averageGs: number;
}

/**
 * Calculates Gs for each determination and returns the average.
 * Gs = (Ms / (Ms + Mfw − Msfw)) × k
 * Not yet implemented — Sprint 4.
 */
export function calcSpecificGravity(
  _determinations: SgDetermination[]
): SgResult {
  throw new Error('Not implemented — scheduled for Sprint 4');
}
