/**
 * ASTM D-2435: Standard Test Methods for One-Dimensional Consolidation Properties of Soils
 * Using Incremental Loading
 *
 * The oedometer test applies incremental vertical loads to a laterally confined ring specimen.
 * At each load stage the specimen height is recorded over time until primary consolidation ends.
 * From the e-log p curve the following parameters are derived:
 *
 *   Cc — Compression Index: slope of the normally consolidated (NC) portion of the e-log p curve.
 *        Higher Cc → more compressible soil.
 *   Cs — Swelling / Recompression Index: slope of the unload-reload loop (Cs ≈ Cc / 5–10).
 *   σ'c (Pc) — Preconsolidation Pressure: stress at which the NC and OC curves intersect
 *              (estimated by Casagrande's graphical method).
 *
 * Coefficient of Consolidation Cv is calculated for each load stage by two methods:
 *   √t method (Taylor):   Cv = (0.848 × Hdr²) / t₉₀
 *   log-t method (Casagrande): Cv = (0.197 × Hdr²) / t₅₀
 * where Hdr = drainage path = H/2 for double drainage.
 *
 * All functions are stubs — implementation scheduled for Sprint 5.
 */

/** Input for a single incremental load stage. */
export interface ConsolLoadStageInput {
  /** Applied vertical pressure for this stage (kPa). */
  pressure: number;
  /** Time to 90% primary consolidation by the √t method (minutes), if measured. */
  t90Min?: number;
  /** Time to 50% primary consolidation by the log-t method (minutes), if measured. */
  t50Min?: number;
  /** Dial gauge reading at start of stage (mm × 10⁻³ or consistent unit). */
  d0: number;
  /** Dial gauge reading at 50% consolidation (optional, for log-t Cv). */
  d50?: number;
  /** Dial gauge reading at end of primary consolidation. */
  d100: number;
  /** Specimen height at start of this stage (cm). */
  initialHeightCm: number;
}

/** Consolidated result including key compressibility parameters. */
export interface ConsolResult {
  /** Compression Index Cc (dimensionless slope on e-log p). */
  cc: number;
  /** Swelling/Recompression Index Cs. */
  cs: number;
  /** Preconsolidation pressure in ton/ft² (legacy lab unit). */
  pcTonFt2: number;
  /** Preconsolidation pressure in kPa. */
  pcKpa: number;
  /** Per-stage void ratio and Cv values. */
  stageResults: {
    pressure: number;
    /** Void ratio e = (e₀ − Δe) at end of this load stage. */
    voidRatioE: number;
    /** Cv from √t method (cm²/s), if t90 was measured. */
    cvFromT90?: number;
    /** Cv from log-t method (cm²/s), if t50 was measured. */
    cvFromT50?: number;
  }[];
}

/**
 * Calculates the full e-log p curve and derives Cc, Cs, and preconsolidation pressure.
 * Not yet implemented — Sprint 5.
 *
 * @param stages - Incremental load stage measurements.
 * @param gs - Specific gravity of soil solids (dimensionless).
 * @param drySoilMassG - Oven-dried mass of the specimen (g), used to compute initial void ratio.
 * @param specimenDiameterCm - Internal diameter of the consolidation ring (cm).
 */
export function calcConsolidation(
  _stages: ConsolLoadStageInput[],
  _gs: number,
  _drySoilMassG: number,
  _specimenDiameterCm: number
): ConsolResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/**
 * Coefficient of consolidation by the square-root-of-time (Taylor) method.
 * Formula: Cv = (0.848 × Hdr²) / t₉₀
 * where 0.848 = time factor T₉₀ for 90% consolidation (double drainage).
 * Not yet implemented — Sprint 5.
 */
export function calcCvFromT90(
  _t90Min: number,
  _drainagePathCm: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/**
 * Coefficient of consolidation by the log-time (Casagrande) method.
 * Formula: Cv = (0.197 × Hdr²) / t₅₀
 * where 0.197 = time factor T₅₀ for 50% consolidation (double drainage).
 * Not yet implemented — Sprint 5.
 */
export function calcCvFromT50(
  _t50Min: number,
  _drainagePathCm: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
