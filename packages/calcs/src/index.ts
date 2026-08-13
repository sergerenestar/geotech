/**
 * @packageDocumentation
 * Pure TypeScript ASTM calculation functions shared by the web app, mobile app, and test suites.
 *
 * These functions run **client-side only** to drive live data-entry previews.
 * The server (each test service's *CalculationService) independently recalculates
 * the same formulas and is the authoritative source of truth persisted to the database.
 *
 * Implemented sprints: waterContent (D-2216).
 * Stubs (Sprint 3+): liquidLimit, particleSize, proctor, specificGravity,
 *                    permeability, unconfinedCompression, directShear, consolidation.
 */

export * from './waterContent';
export * from './liquidLimit';
export * from './proctor';
export * from './specificGravity';
export * from './particleSize';
export * from './permeability';
export * from './unconfinedCompression';
export * from './directShear';
export * from './consolidation';
