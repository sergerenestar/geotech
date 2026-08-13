/**
 * ASTM D-2434: Standard Test Method for Measurement of Hydraulic Conductivity of Saturated
 * Porous Materials Using a Rigid-Wall, Gravity-Type Permeameter
 *
 * Two permeameter methods are supported:
 *
 * **Constant Head** (granular soils, k > 10⁻⁴ cm/s):
 *   A constant hydraulic head difference h = h1 − h2 is maintained across a specimen of
 *   length L and cross-sectional area A. The volume of water Q collected in time t gives:
 *     k = (Q × L) / (A × h × t)
 *
 * **Falling Head** (cohesive/fine-grained soils, k < 10⁻⁴ cm/s):
 *   Head falls from h1 to h2 in a standpipe of area a across a specimen of area A:
 *     k = (a × L / (A × t)) × ln(h1 / h2)
 *
 * The raw k at test temperature is corrected to the reference temperature of 20 °C using the
 * ratio of water viscosities: k₂₀ = k_T × (η_T / η₂₀).
 *
 * All functions are stubs — implementation scheduled for Sprint 5.
 */

/** One constant-head reading: collected volume and hydraulic head measurements. */
export interface ConstantHeadReading {
  /** Upstream head (cm). */
  h1Cm: number;
  /** Downstream head (cm). */
  h2Cm: number;
  /** Duration of collection (s). */
  durationS: number;
  /** Volume of water collected during the interval (cm³). */
  vwCm3: number;
  /** Specimen length along flow direction (cm). */
  specimenLengthCm: number;
  /** Specimen cross-sectional area (cm²). */
  specimenAreaCm2: number;
}

/** One falling-head reading: initial and final head heights and elapsed time. */
export interface FallingHeadReading {
  /** Initial head height above outlet (cm). */
  h1Cm: number;
  /** Final head height above outlet (cm). */
  h2Cm: number;
  /** Elapsed time for head to fall from h1 to h2 (s). */
  durationS: number;
  /** Internal diameter of the standpipe burette (cm). */
  tubeDiameterCm: number;
  specimenLengthCm: number;
  specimenAreaCm2: number;
}

/**
 * Constant-head hydraulic conductivity.
 * k = (Q × L) / (A × h × t); corrected to 20 °C using viscosity ratio.
 * Not yet implemented — Sprint 5.
 *
 * @returns kCmS — hydraulic conductivity at test temperature; k20cCmS — corrected to 20 °C.
 */
export function calcConstantHeadPermeability(
  _readings: ConstantHeadReading[],
  _temperatureC: number
): { kCmS: number; k20cCmS: number } {
  throw new Error('Not implemented — scheduled for Sprint 5');
}

/**
 * Falling-head hydraulic conductivity.
 * k = (a × L / (A × t)) × ln(h1 / h2); corrected to 20 °C using viscosity ratio.
 * Not yet implemented — Sprint 5.
 *
 * @returns kCmS — hydraulic conductivity at test temperature; k20cCmS — corrected to 20 °C.
 */
export function calcFallingHeadPermeability(
  _readings: FallingHeadReading[],
  _temperatureC: number
): { kCmS: number; k20cCmS: number } {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
