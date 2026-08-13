/**
 * Granulometric material types sourced from:
 *  - Excel: Analyse_Granulometrique_FR.xlsx  (sieve sets per material)
 *  - PDF: j.ajcbm.20261001.13 Table 2        (specification bands for 0/4 sand)
 * Standards: NF EN 13043 / XP P 18-545 (aggregates), NF EN 12697-1 (bituminous mixtures),
 *            NF P 94-056 (soils — sieve), NF P 94-057 (soils — hydrometer)
 */

export interface SieveDef {
  label: string;
  openingMm: number;
  /** Grading specification band (% passing). Null when not defined by standard. */
  specMin?: number;
  specMax?: number;
}

/** Which derived indices the form should compute and display for a given material. */
export type DerivedIndicesType = 'D_COEFFICIENTS' | 'MODULE_FINESSE' | 'TENEUR_LIANT' | null;

export interface MaterialType {
  key: string;
  label: string;
  norm: string;
  sieves: SieveDef[];
  derivedIndices: DerivedIndicesType;
}

// Sieve series and specification bands from PDF Table 2 (0/4 sand, BBEM3 project, Cameroon)
export const MATERIAL_TYPES: MaterialType[] = [
  {
    key: 'SABLE_CONCASSE_0_4',
    label: 'Sable concassé 0/4 mm',
    norm: 'NF EN 13043 / XP P 18-545',
    derivedIndices: 'MODULE_FINESSE',
    sieves: [
      { label: '8 mm',     openingMm: 8.000, specMin: 100, specMax: 100 },
      { label: '5 mm',     openingMm: 5.000, specMin: 98,  specMax: 100 },
      { label: '4 mm',     openingMm: 4.000, specMin: 85,  specMax: 99  },
      { label: '2 mm',     openingMm: 2.000, specMin: 55,  specMax: 81  },
      { label: '0.063 mm', openingMm: 0.063, specMin: 10,  specMax: 20  },
    ],
  },
  {
    key: 'GRAVILLON_4_6',
    label: 'Gravillon concassé 4/6 mm',
    norm: 'NF EN 13043 / XP P 18-545',
    derivedIndices: 'MODULE_FINESSE',
    sieves: [
      { label: '8 mm',     openingMm: 8.000 },
      { label: '5 mm',     openingMm: 5.000 },
      { label: '4 mm',     openingMm: 4.000 },
      { label: '2 mm',     openingMm: 2.000 },
      { label: '0.063 mm', openingMm: 0.063 },
    ],
  },
  {
    key: 'GRAVILLON_6_10',
    label: 'Gravillon concassé 6/10 mm',
    norm: 'NF EN 13043 / XP P 18-545',
    derivedIndices: 'MODULE_FINESSE',
    sieves: [
      { label: '8 mm',     openingMm: 8.000 },
      { label: '5 mm',     openingMm: 5.000 },
      { label: '4 mm',     openingMm: 4.000 },
      { label: '2 mm',     openingMm: 2.000 },
      { label: '0.063 mm', openingMm: 0.063 },
    ],
  },
  {
    key: 'ENROBE_EB10_BBME3',
    label: 'Mélange EB10–BBME3 (extrait)',
    norm: 'NF EN 12697-1',
    derivedIndices: 'TENEUR_LIANT',
    sieves: [
      { label: '14 mm',    openingMm: 14.000 },
      { label: '10 mm',    openingMm: 10.000 },
      { label: '5 mm',     openingMm: 5.000  },
      { label: '2 mm',     openingMm: 2.000  },
      { label: '0.5 mm',   openingMm: 0.500  },
      { label: '0.063 mm', openingMm: 0.063  },
    ],
  },
  {
    key: 'SOL_FIN',
    label: 'Sol fin / Argile / Limon',
    norm: 'NF P 94-056',
    derivedIndices: 'D_COEFFICIENTS',
    sieves: [
      { label: '2 mm',     openingMm: 2.000  },
      { label: '0.5 mm',   openingMm: 0.500  },
      { label: '0.2 mm',   openingMm: 0.200  },
      { label: '0.08 mm',  openingMm: 0.080  },
      { label: '0.05 mm',  openingMm: 0.050  },
      { label: '0.02 mm',  openingMm: 0.020  },
      { label: '0.005 mm', openingMm: 0.005  },
    ],
  },
  {
    key: 'GRAVE_TOUT_VENANT',
    label: 'Grave / Gravier / Tout-venant',
    norm: 'NF P 94-056',
    derivedIndices: 'D_COEFFICIENTS',
    sieves: [
      { label: '50 mm',   openingMm: 50.000 },
      { label: '31.5 mm', openingMm: 31.500 },
      { label: '20 mm',   openingMm: 20.000 },
      { label: '10 mm',   openingMm: 10.000 },
      { label: '5 mm',    openingMm: 5.000  },
      { label: '2 mm',    openingMm: 2.000  },
      { label: '0.5 mm',  openingMm: 0.500  },
      { label: '0.08 mm', openingMm: 0.080  },
    ],
  },
];

export const MATERIAL_TYPE_MAP: Record<string, MaterialType> = Object.fromEntries(
  MATERIAL_TYPES.map(m => [m.key, m])
);

export function getMaterialType(key: string | undefined): MaterialType | undefined {
  if (!key) return undefined;
  return MATERIAL_TYPE_MAP[key];
}
