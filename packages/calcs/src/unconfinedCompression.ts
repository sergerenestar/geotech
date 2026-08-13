/**
 * ASTM D-2166: Standard Test Method for Unconfined Compressive Strength of Cohesive Soil
 *
 * An undisturbed or remoulded cylindrical specimen (typically H/D ≈ 2) is loaded axially
 * at a constant strain rate with zero confining pressure. The load is read from a proving ring
 * (dial gauge × proving-ring calibration factor).
 *
 * Because the specimen bulges under load, the cross-sectional area increases with axial strain.
 * The "corrected area" compensates for this:
 *   A_corrected = A₀ / (1 − ε)
 * where ε = axial strain = ΔH / H₀ (dimensionless).
 *
 * Results:
 *   qu = peak unconfined compressive strength (kPa) = peak load / corrected area.
 *   su = undrained shear strength = qu / 2  (Mohr-Coulomb, φ = 0 assumption).
 *
 * All functions are stubs — implementation scheduled for Sprint 5.
 */

/** Raw instrument readings at a single load increment. */
export interface UcReading {
  /** Deformation dial reading (divisions). */
  deformationDiv: number;
  /** Proving ring dial reading (divisions). */
  provingRingDiv: number;
  /** Calibration factor: mm per division on the deformation dial. */
  deformationFactorMmPerDiv: number;
  /** Calibration factor: Newtons per division on the proving ring. */
  provingRingFactorNPerDiv: number;
  /** Initial specimen height (mm). */
  initialHeightMm: number;
  /** Initial specimen cross-sectional area (mm²). */
  initialAreaMm2: number;
}

/** Full stress-strain curve with peak strength indices. */
export interface UcResult {
  /** Per-reading derived values forming the stress-strain curve. */
  readings: (UcReading & {
    /** Absolute axial deformation: deformationDiv × deformationFactorMmPerDiv (mm). */
    normalDeformationMm: number;
    /** Axial strain ε = ΔH / H₀ (dimensionless). */
    axialStrain: number;
    /** Barrelling-corrected area: A₀ / (1 − ε) (mm²). */
    correctedAreaMm2: number;
    /** Applied stress at this increment (kPa). */
    stressKpa: number;
  })[];
  /** Peak unconfined compressive strength qu (kPa). */
  quKpa: number;
  /** Undrained shear strength su = qu / 2 (kPa). */
  suKpa: number;
}

/**
 * Derives the full stress-strain curve and returns qu and su.
 * corrected area A = A0 / (1 − ε), stress = Load / A.
 * Not yet implemented — Sprint 5.
 */
export function calcUnconfinedCompression(_readings: UcReading[]): UcResult {
  throw new Error('Not implemented — scheduled for Sprint 5');
}
