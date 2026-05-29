import { describe, it, expect } from 'vitest';
import { calcWaterContent, calcWaterContentDetermination } from './waterContent';

describe('calcWaterContent — ASTM D-2216', () => {
  it('calculates w% correctly against Dartis Soil Lab demo dataset (sample A-2-6)', () => {
    // Known dataset: container 16.10 g, wet+container 48.35 g, dry+container 39.86 g
    // Expected w% = (48.35 - 39.86) / (39.86 - 16.10) × 100 = 35.73%
    const result = calcWaterContentDetermination({
      massContainerG: 16.10,
      massContainerWetSoilG: 48.35,
      massContainerDrySoilG: 39.86,
    });
    expect(result.massWaterG).toBeCloseTo(8.49, 2);
    expect(result.massDrySoilG).toBeCloseTo(23.76, 2);
    expect(result.waterContentPct).toBeCloseTo(35.73, 1);
  });

  it('returns average water content across multiple determinations', () => {
    const result = calcWaterContent([
      { massContainerG: 16.10, massContainerWetSoilG: 48.35, massContainerDrySoilG: 39.86 },
      { massContainerG: 15.50, massContainerWetSoilG: 45.00, massContainerDrySoilG: 37.20 },
    ]);
    expect(result.determinations).toHaveLength(2);
    expect(result.averageWaterContentPct).toBeGreaterThan(0);
  });

  it('throws when no determinations provided', () => {
    expect(() => calcWaterContent([])).toThrow('At least one determination is required');
  });

  it('mass of water = wet mass − dry mass', () => {
    const r = calcWaterContentDetermination({
      massContainerG: 10,
      massContainerWetSoilG: 50,
      massContainerDrySoilG: 40,
    });
    expect(r.massWaterG).toBe(10);
    expect(r.massDrySoilG).toBe(30);
    expect(r.waterContentPct).toBeCloseTo(33.333, 2);
  });
});
