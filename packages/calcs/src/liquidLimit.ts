/**
 * ASTM D-4318: Standard Test Methods for Liquid Limit, Plastic Limit, and Plasticity Index of Soils
 *
 * The Liquid Limit (LL) is the water content at which a soil passes from the plastic to the
 * liquid state, defined as the 25-blow closure point on the Casagrande flow curve.
 * The Plastic Limit (PL) is the minimum water content at which the soil can be rolled into
 * 3.2 mm threads without crumbling.
 * The Plasticity Index (PI = LL − PL) quantifies the plastic range and is used in USCS
 * classification and Casagrande's A-line chart.
 *
 * All functions are stubs — implementation scheduled for Sprint 3.
 */

/** A single Casagrande cup determination: blow count and three container masses. */
export interface LlDetermination {
  /** Number of blows to close the groove (target range 6–40 per ASTM D-4318 §8.3). */
  blows: number;
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
}

/** A single plastic-limit thread-rolling determination (no blow count required). */
export interface PlDetermination {
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
}

/** Full Atterberg limits result including optional derived indices. */
export interface LiquidLimitResult {
  /** Liquid Limit as a percentage (25-blow point on the flow curve). */
  liquidLimitPct: number;
  /** Plastic Limit as a percentage (average of thread-rolling determinations). */
  plasticLimitPct: number;
  /** Plasticity Index: LL − PL. */
  plasticityIndexPct: number;
  /** Activity index A = PI / clay% — only present when clay% is supplied. */
  activity?: number;
  /** Liquidity Index LI = (w − PL) / PI — only present when in-situ w is supplied. */
  liquidityIndex?: number;
}

/** ASTM D-4318: not yet implemented — Sprint 3 */
export function calcLiquidLimit(
  _llDeterminations: LlDetermination[],
  _plDeterminations: PlDetermination[]
): LiquidLimitResult {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/**
 * Plasticity Index: PI = LL − PL (ASTM D-4318 §10.2).
 * Not yet implemented — Sprint 3.
 */
export function calcPlasticityIndex(ll: number, pl: number): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/**
 * Activity index per Skempton (1953): A = PI / clay%.
 * Used to classify clay mineralogy (A < 0.75 inactive, 0.75–1.25 normal, > 1.25 active).
 * Not yet implemented — Sprint 3.
 */
export function calcActivity(_pi: number, _clayPct: number): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/**
 * Liquidity Index: LI = (w − PL) / (LL − PL).
 * LI = 0 at PL (stiff), LI = 1 at LL (very soft/liquid). Values outside [0,1] are possible
 * for over-consolidated or desiccated clays.
 * Not yet implemented — Sprint 3.
 */
export function calcLiquidityIndex(
  _w: number,
  _pl: number,
  _ll: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}
