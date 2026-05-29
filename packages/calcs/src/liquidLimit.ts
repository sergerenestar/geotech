/**
 * ASTM D-4318: Standard Test Methods for Liquid Limit, Plastic Limit, and Plasticity Index of Soils
 */

export interface LlDetermination {
  blows: number;
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
}

export interface PlDetermination {
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
}

export interface LiquidLimitResult {
  liquidLimitPct: number;
  plasticLimitPct: number;
  plasticityIndexPct: number;
  activity?: number;
  liquidityIndex?: number;
}

/** ASTM D-4318: not yet implemented — Sprint 3 */
export function calcLiquidLimit(
  _llDeterminations: LlDetermination[],
  _plDeterminations: PlDetermination[]
): LiquidLimitResult {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** ASTM D-4318: PI = LL - PL */
export function calcPlasticityIndex(ll: number, pl: number): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** Activity = PI / Clay% */
export function calcActivity(_pi: number, _clayPct: number): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}

/** Liquidity Index = (w - PL) / (LL - PL) */
export function calcLiquidityIndex(
  _w: number,
  _pl: number,
  _ll: number
): number {
  throw new Error('Not implemented — scheduled for Sprint 3');
}
