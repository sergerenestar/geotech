/**
 * ASTM D-3080: Standard Test Method for Direct Shear Test of Soils Under Consolidated Drained Conditions
 *
 * A specimen is sheared along a pre-defined horizontal plane under a known normal stress σ.
 * At least three stages are run at different normal stresses. For each stage the peak horizontal
 * force (shear stress τ_peak) is recorded.
 *
 * The Mohr-Coulomb failure criterion is fit by linear regression through the (σ, τ) points:
 *   τ = c + σ × tan(φ)
 * where c is cohesion (kPa) and φ is the effective friction angle (degrees).
 *
 * The coefficient of determination R² indicates how well the data fit a straight line
 * (R² close to 1 = good linear failure envelope).
 *
 * All functions are stubs — implementation scheduled for Sprint 5.
 */

/** Peak shear data from one direct-shear stage. */
export interface DsStageResult {
  /** Applied normal stress on the shear plane (kPa). */
  normalStressKpa: number;
  /** Peak shear stress recorded for this stage (kPa). */
  peakShearStressKpa: number;
}

/** Mohr-Coulomb envelope parameters from linear regression over all stages. */
export interface MohrCoulombResult {
  /** y-intercept of the failure envelope: cohesion c (kPa).
   *  For clean sands/gravels c ≈ 0; for clays c > 0. */
  cohesionKpa: number;
  /** Slope angle of the failure envelope: friction angle φ (degrees). */
  frictionAngleDeg: number;
  /** Coefficient of determination R² for the linear fit. */
  rSquared: number;
}

/**
 * Fits the Mohr-Coulomb failure envelope using least-squares linear regression.
 * τ = c + σ × tan(φ).
 * Returns c (kPa), φ (degrees), and R².
 * Not yet implemented — Sprint 5.
 */
export function calcMohrCoulomb(
  _stages: DsStageResult[]
): MohrCoulombResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
