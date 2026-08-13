/**
 * Particle-Size Analysis
 *
 * Covers sieve analysis (mechanical) per ASTM D-422 / NF P94-056.
 * Combined with hydrometer data (ASTM D-7928) for the fine fraction.
 *
 * Characteristic diameters on the cumulative passing curve:
 *   D10 — effective size (10% finer by mass)
 *   D30 — used in Cc
 *   D60 — used in Cu and Cc
 *
 * Classification driven by USCS (ASTM D-2487) and AASHTO (D-3282).
 *
 * Sieve sets and specification bands for Cameroon context sourced from:
 *   j.ajcbm.20261001.13 (CECABASE 300 study, Table 2) and
 *   Analyse_Granulometrique_FR.xlsx
 */

/** One sieve reading: opening size and mass retained on that sieve. */
export interface SieveReading {
  /** Nominal sieve opening in millimetres (e.g. 8.0, 5.0, 4.0, 2.0, 0.063). */
  openingMm: number;
  /** Mass of soil retained on this sieve in grams. */
  massRetainedG: number;
}

/** Computed result for a single sieve row. */
export interface SieveResult extends SieveReading {
  /** Percentage retained on this sieve. */
  pctRetained: number;
  /** Cumulative percentage passing (finer than this opening). */
  pctFiner: number;
}

/** Full grain-size distribution result including classification symbols. */
export interface ParticleSizeResult {
  /** Calculated sieve results sorted descending by opening. */
  sieveResults: SieveResult[];
  /** D10 diameter in mm (10% finer). Null when not interpolable. */
  d10Mm: number | null;
  /** D30 diameter in mm. Null when not interpolable. */
  d30Mm: number | null;
  /** D60 diameter in mm. Null when not interpolable. */
  d60Mm: number | null;
  /** Coefficient of Uniformity Cu = D60 / D10. Null when D10 unavailable. */
  cu: number | null;
  /** Coefficient of Curvature Cc = D30² / (D10 × D60). Null when any D unavailable. */
  cc: number | null;
  /** Percentage of particles ≥ 4.75 mm (gravel fraction). */
  pctGravel: number | null;
  /** Percentage of particles 0.075–4.75 mm (sand fraction). */
  pctSand: number | null;
  /** Percentage of particles < 0.075 mm (silt + clay / fines). */
  pctFines: number | null;
  /** USCS symbol (e.g. "GW", "SP", "SW-SM"). */
  uscsSymbol: string | null;
  /** USCS name (e.g. "Well-Graded Sand"). */
  uscsName: string | null;
}

/**
 * Calculates total dry mass from sample mass and water content.
 * Formula: Ms = M / (1 + w/100)
 */
export function calcTotalDryMass(sampleMassG: number, waterContentPct: number): number {
  if (waterContentPct < 0) throw new Error('Water content cannot be negative');
  return sampleMassG / (1 + waterContentPct / 100);
}

/**
 * Coefficient of Uniformity: Cu = D60 / D10.
 * Cu < 4 → poorly graded gravel; Cu < 6 → poorly graded sand (ASTM D-2487).
 */
export function calcUniformityCoefficient(d10: number, d60: number): number {
  if (d10 <= 0) throw new Error('D10 must be positive');
  return d60 / d10;
}

/**
 * Coefficient of Curvature: Cc = D30² / (D10 × D60).
 * 1 ≤ Cc ≤ 3 is one criterion for well-graded (ASTM D-2487).
 */
export function calcCurvatureCoefficient(d10: number, d30: number, d60: number): number {
  if (d10 <= 0 || d60 <= 0) throw new Error('D10 and D60 must be positive');
  return (d30 * d30) / (d10 * d60);
}

/**
 * Log-linear interpolation to find diameter at a given cumulative passing percentage.
 * Points must be sorted descending by openingMm (highest opening = highest pctFiner first).
 */
function interpolateDiameter(points: SieveResult[], targetPct: number): number | null {
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];     // larger opening, higher pctFiner
    const p1 = points[i + 1]; // smaller opening, lower pctFiner
    if (p0.pctFiner >= targetPct && p1.pctFiner <= targetPct) {
      const pRange = p0.pctFiner - p1.pctFiner;
      if (Math.abs(pRange) < 1e-9) return p0.openingMm;
      const logD0 = Math.log10(p0.openingMm);
      const logD1 = Math.log10(p1.openingMm);
      const fraction = (targetPct - p0.pctFiner) / (p1.pctFiner - p0.pctFiner);
      return Math.pow(10, logD0 + fraction * (logD1 - logD0));
    }
  }
  return null;
}

/**
 * Find the pct_finer value at a boundary opening by exact match or nearest sieve.
 */
function pctFinerAt(results: SieveResult[], boundaryMm: number): number | null {
  const exact = results.find(r => Math.abs(r.openingMm - boundaryMm) < 0.001);
  if (exact) return exact.pctFiner;
  // Use nearest sieve
  let nearest: SieveResult | null = null;
  let minDiff = Infinity;
  for (const r of results) {
    const diff = Math.abs(r.openingMm - boundaryMm);
    if (diff < minDiff) { minDiff = diff; nearest = r; }
  }
  return nearest ? nearest.pctFiner : null;
}

/**
 * Full ASTM D-422 / NF P94-056 particle size calculation.
 * Computes per-sieve percentages, characteristic diameters, fractions, and USCS symbol.
 */
export function calcParticleSize(
  sieveReadings: SieveReading[],
  totalSpecimenMassG: number
): ParticleSizeResult {
  if (!sieveReadings || sieveReadings.length === 0) {
    throw new Error('At least one sieve reading is required');
  }
  if (totalSpecimenMassG <= 0) {
    throw new Error('Total specimen mass must be positive');
  }

  // Sort descending by opening (largest sieve first)
  const sorted = [...sieveReadings].sort((a, b) => b.openingMm - a.openingMm);

  let cumRetained = 0;
  const sieveResults: SieveResult[] = sorted.map(r => {
    const pctRetained = (r.massRetainedG / totalSpecimenMassG) * 100;
    cumRetained += pctRetained;
    return {
      ...r,
      pctRetained: Math.round(pctRetained * 1000) / 1000,
      pctFiner: Math.max(0, Math.round((100 - cumRetained) * 1000) / 1000),
    };
  });

  // Characteristic diameters via log-linear interpolation
  const d10Mm = interpolateDiameter(sieveResults, 10);
  const d30Mm = interpolateDiameter(sieveResults, 30);
  const d60Mm = interpolateDiameter(sieveResults, 60);

  const cu = d10Mm && d60Mm && d10Mm > 0 ? calcUniformityCoefficient(d10Mm, d60Mm) : null;
  const cc = d10Mm && d30Mm && d60Mm && d10Mm > 0 && d60Mm > 0
    ? calcCurvatureCoefficient(d10Mm, d30Mm, d60Mm)
    : null;

  // Soil fractions (ASTM D-422 boundaries: gravel ≥ 4.75 mm, fines < 0.075 mm)
  const GRAVEL_BOUNDARY = 4.75;
  const FINES_BOUNDARY = 0.075;

  const pctFinerAtGravel = pctFinerAt(sieveResults, GRAVEL_BOUNDARY);
  const pctFinerAtFines = pctFinerAt(sieveResults, FINES_BOUNDARY);

  const pctGravel = pctFinerAtGravel != null ? Math.max(0, 100 - pctFinerAtGravel) : null;
  const pctFines = pctFinerAtFines != null ? Math.max(0, pctFinerAtFines) : null;
  const pctSand = pctGravel != null && pctFines != null
    ? Math.max(0, 100 - pctGravel - pctFines)
    : null;

  // USCS classification (simplified — full classification requires LL/PI from Atterberg)
  const uscs = classifyUSCSFromGrainSize(pctGravel, pctSand, pctFines, cu, cc);

  return { sieveResults, d10Mm, d30Mm, d60Mm, cu, cc, pctGravel, pctSand, pctFines, ...uscs };
}

function classifyUSCSFromGrainSize(
  pctGravel: number | null,
  pctSand: number | null,
  pctFines: number | null,
  cu: number | null,
  cc: number | null
): { uscsSymbol: string | null; uscsName: string | null } {
  if (pctGravel == null || pctSand == null || pctFines == null) {
    return { uscsSymbol: null, uscsName: null };
  }

  const coarse = 100 - pctFines;
  const isGravel = coarse > 0 && pctGravel / coarse > 0.5;
  const base = isGravel ? 'G' : 'S';

  if (pctFines < 5) {
    const wellGraded = cuAndCcOk(isGravel, cu, cc);
    if (wellGraded) {
      return {
        uscsSymbol: `${base}W`,
        uscsName: isGravel ? 'Well-Graded Gravel' : 'Well-Graded Sand',
      };
    }
    return {
      uscsSymbol: `${base}P`,
      uscsName: isGravel ? 'Poorly-Graded Gravel' : 'Poorly-Graded Sand',
    };
  }

  if (pctFines > 12) {
    return {
      uscsSymbol: `${base}-F`,
      uscsName: `${isGravel ? 'Gravel' : 'Sand'} with Fines (plasticity data required)`,
    };
  }

  // Borderline 5–12%: dual symbol
  const wOrP = cuAndCcOk(isGravel, cu, cc) ? 'W' : 'P';
  return {
    uscsSymbol: `${base}${wOrP}-${base}M`,
    uscsName: `${isGravel ? 'Gravel' : 'Sand'} with Silt (borderline)`,
  };
}

function cuAndCcOk(isGravel: boolean, cu: number | null, cc: number | null): boolean {
  if (cu == null || cc == null) return false;
  const cuThreshold = isGravel ? 4 : 6;
  return cu >= cuThreshold && cc >= 1 && cc <= 3;
}

/**
 * Unified Soil Classification System symbol per ASTM D-2487.
 * Requires both grain-size data (Cu, Cc, fractions) and Atterberg limits (LL, PI).
 */
export function classifyUSCS(
  ll: number,
  pi: number,
  finesPct: number,
  sandPct: number,
  gravelPct: number,
  cu: number,
  cc: number
): string {
  const coarse = 100 - finesPct;
  const isGravel = coarse > 0 && gravelPct / coarse > 0.5;
  const base = isGravel ? 'G' : 'S';

  if (finesPct < 5) {
    return cuAndCcOk(isGravel, cu, cc) ? `${base}W` : `${base}P`;
  }

  if (finesPct > 12) {
    // Plasticity-based suffix
    const suffix = ll < 50
      ? (pi > 0.73 * (ll - 20) ? 'C' : 'M')
      : (pi > 0.73 * (ll - 20) ? 'C' : 'M');
    return `${base}${suffix}`;
  }

  // Borderline: dual symbol
  const wOrP = cuAndCcOk(isGravel, cu, cc) ? 'W' : 'P';
  const suffix = ll < 50
    ? (pi > 0.73 * (ll - 20) ? 'C' : 'M')
    : (pi > 0.73 * (ll - 20) ? 'C' : 'M');
  return `${base}${wOrP}-${base}${suffix}`;
}

/**
 * AASHTO classification group symbol per ASTM D-3282 / AASHTO M 145.
 * Used for highway sub-grade assessment (A-1 best, A-7 worst).
 */
export function classifyAASHTO(
  ll: number,
  pi: number,
  finesPct: number,
  sandPct: number,
  gravelPct: number
): string {
  // A-1: predominantly gravel or sand, low fines
  if (finesPct <= 15 && pi <= 6) return 'A-1-a';
  if (finesPct <= 25 && pi <= 6) return 'A-1-b';

  // A-3: fine sand
  if (finesPct <= 10 && pi === 0) return 'A-3';

  // A-2 group: granular with more fines
  if (finesPct <= 35) {
    if (ll <= 40 && pi <= 10) return 'A-2-4';
    if (ll > 40 && pi <= 10) return 'A-2-5';
    if (ll <= 40 && pi > 10) return 'A-2-6';
    return 'A-2-7';
  }

  // A-4 to A-7: silt-clay materials
  if (ll <= 40 && pi <= 10) return 'A-4';
  if (ll > 40 && pi <= 10) return 'A-5';
  if (ll <= 40 && pi > 10) return 'A-6';

  // A-7: high plasticity
  if (pi > ll - 30) return 'A-7-5';
  return 'A-7-6';
}
