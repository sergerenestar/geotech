import { describe, it, expect } from 'vitest';
import { calcLiquidLimit, calcPlasticityIndex, calcActivity, calcLiquidityIndex } from './liquidLimit';

describe('calcLiquidLimit — ASTM D-4318 (Sprint 3)', () => {
  it.todo('calculates LL from flow curve at 25 blows');
  it.todo('calculates PL as average of plastic limit determinations');
  it.todo('PI = LL - PL');
  it.todo('Activity = PI / Clay%');
  it.todo('Liquidity Index = (w - PL) / (LL - PL)');
  it.todo('requires minimum 3 LL determinations');
  it.todo('requires minimum 2 PL determinations');
});
