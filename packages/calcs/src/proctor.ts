/**
 * ASTM D-698: Standard Test Methods for Laboratory Compaction Characteristics of Soil (Standard Effort)
 * ASTM D-1557: Standard Test Methods for Laboratory Compaction Characteristics of Soil (Modified Effort)
 *
 * The Proctor compaction test determines the relationship between water content and dry density
 * for a given compaction energy. The technician compacts at least 5 water-content points,
 * each in a standard mold, and plots the resulting compaction curve. The peak defines:
 *   - Optimum Moisture Content (OMC / OPM) — water content at maximum dry density.
 *   - Maximum Dry Density (MDD / γd_max) — peak of the parabolic curve.
 *
 * The Zero Air Voids (ZAV) line is overlaid to verify no points plot above it (physically
 * impossible). D-698 = Standard Effort (594 kJ/m³); D-1557 = Modified Effort (2700 kJ/m³).
 *
 * All functions are stubs — implementation scheduled for Sprint 4.
 */

/** One compaction point: water content and measured wet unit weight. */
export interface ProctorPoint {
  /** Water content of the compacted specimen (%). */
  waterContentPct: number;
  /** Wet (bulk) unit weight of the compacted specimen (kN/m³). */
  wetUnitWeightKnM3: number;
}

/** Proctor curve result: OMC, MDD, and back-calculated dry density per point. */
export interface ProctorResult {
  /** Optimum Moisture Content — water content at the peak of the compaction curve (%). */
  optimumMoistureContentPct: number;
  /** Maximum Dry Density at the curve peak (g/cm³). */
  maxDryDensityGCm3: number;
  /** Per-point dry density values for plotting the compaction curve. */
  curvePoints: { waterContentPct: number; dryDensityGCm3: number }[];
}

/**
 * Fits a compaction curve through the measured points and returns OMC and MDD.
 * Typically fit with a 2nd-degree polynomial; the vertex is the OMC/MDD pair.
 * Not yet implemented — Sprint 4.
 */
export function calcProctorCurve(
  _points: ProctorPoint[],
  _moldVolumeCm3: number
): ProctorResult {
  throw new Error('Not implemented — scheduled for Sprint 4');
}

/**
 * Zero Air Voids dry density at a given water content.
 *
 * Formula: γd_ZAV = (Gs × γw) / (1 + Gs × w/100)
 * where γw = 9.81 kN/m³ (unit weight of water), Gs = specific gravity of soil solids.
 *
 * Points on the compaction curve must plot below this line — a measured point above it
 * would indicate a calculation or measurement error.
 * Not yet implemented — Sprint 4.
 */
export function calcZeroAirVoidsDensity(
  _waterContentPct: number,
  _gs: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 4');
}
