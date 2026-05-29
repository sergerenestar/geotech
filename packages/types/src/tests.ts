export type TestStatus =
  | 'PENDING_REVIEW'
  | 'FLAGGED'
  | 'APPROVED'
  | 'REJECTED'
  | 'LOCKED';

export interface AiFlag {
  field: string;
  condition: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  astmReference?: string;
}

// M01 — Water Content (ASTM D-2216)
export interface WcReading {
  containerLabel: string;
  massContainerG: number;
  massContainerWetSoilG: number;
  massContainerDrySoilG: number;
  massWaterG?: number;
  massDrySoilG?: number;
  waterContentPct?: number;
}

export interface WaterContentTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  unit: 'GR' | 'KG';
  readings: WcReading[];
  averageWaterContentPct?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M02 — Liquid & Plastic Limit (ASTM D-4318)
export interface LlReading {
  containerLabel: string;
  blows: number;
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
  waterContentPct?: number;
}

export interface PlReading {
  containerLabel: string;
  massContainerG: number;
  massContainerWetG: number;
  massContainerDryG: number;
  waterContentPct?: number;
}

export interface LiquidLimitTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  llReadings: LlReading[];
  liquidLimitPct?: number;
  plReadings: PlReading[];
  plasticLimitPct?: number;
  plasticityIndexPct?: number;
  activity?: number;
  liquidityIndex?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M03 — Proctor (ASTM D-698 / D-1557)
export interface ProctorPoint {
  massWetG: number;
  waterContentPct: number;
  dryDensityGCm3?: number;
}

export interface ProctorTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  type: 'STANDARD' | 'MODIFIED';
  moldVolumeCm3: number;
  points: ProctorPoint[];
  optimumMoistureContentPct?: number;
  maxDryDensityGCm3?: number;
  oversizeCorrectionApplied: boolean;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M04 — Specific Gravity (ASTM D-854)
export interface SgReading {
  flaskNo: string;
  massPycnometerG: number;
  massPycnometerDrySoilG: number;
  massPycnometerSoilWaterG: number;
  massPycnometerWaterG: number;
  temperatureC: number;
  kFactor: number;
  gs?: number;
}

export interface SpecificGravityTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  readings: SgReading[];
  averageGs?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M05 — Particle Size (ASTM D-422)
export interface SieveReading {
  sieveNo: string;
  openingMm: number;
  massRetainedG: number;
  cumulativeRetainedPct?: number;
  finerPct?: number;
}

export interface HydrometerReading {
  timeMin: number;
  readingR: number;
  finerPct?: number;
  k20c?: number;
}

export interface ParticleSizeTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  totalSpecimenMassG: number;
  sieveReadings: SieveReading[];
  hydrometerReadings?: HydrometerReading[];
  hydrometerInputs?: {
    gs: number;
    dryMassG: number;
    meniscusFm: number;
    zeroFz: number;
  };
  d10Mm?: number;
  d30Mm?: number;
  d60Mm?: number;
  cu?: number;
  cc?: number;
  clayPct?: number;
  siltAndClayPct?: number;
  fineSandPct?: number;
  mediumSandPct?: number;
  coarseSandPct?: number;
  fineGravelPct?: number;
  coarseGravelPct?: number;
  uscsSymbol?: string;
  aashtoSymbol?: string;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M06 — Permeability (ASTM D-2434)
export interface PermReading {
  h1Cm: number;
  h2Cm: number;
  durationS: number;
  vwCm3: number;
  kCmS?: number;
  k20cCmS?: number;
}

export interface PermeabilityTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  method: 'CONSTANT_HEAD' | 'FALLING_HEAD';
  specimenLengthCm: number;
  specimenDiameterCm: number;
  massTubeFittingsG: number;
  massTubeFittingsSpecimenG: number;
  gs: number;
  temperatureC: number;
  volumeCm3?: number;
  dryDensityGCm3?: number;
  voidRatio?: number;
  readings: PermReading[];
  averageKCmS?: number;
  averageK20cCmS?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M07 — Unconfined Compression (ASTM D-2166)
export interface UcReading {
  deformationDiv: number;
  normalDeformationMm?: number;
  provingRingDiv: number;
  normalLoadKn?: number;
  axialStrain?: number;
  stressKpa?: number;
}

export interface UnconfinedCompressionTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  moistureContentPct: number;
  specimenDiameterCm: number;
  provingRingCalibrationFactor: number;
  readings: UcReading[];
  quKpa?: number;
  suKpa?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M08 — Direct Shear (ASTM D-3080)
export interface DsStageReading {
  horizontalDispMm: number;
  shearStressKpa: number;
  verticalDispMm?: number;
}

export interface DsStage {
  testId: string;
  normalStressKpa: number;
  readings: DsStageReading[];
  peakShearStressKpa?: number;
}

export interface DirectShearTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  stages: DsStage[];
  cohesionKpa?: number;
  frictionAngleDeg?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}

// M09 — Consolidation (ASTM D-2435)
export interface ConsolReading {
  timeMin: number;
  dialReading: number;
}

export interface ConsolLoadStage {
  stageType: 'LOADING' | 'UNLOADING';
  pressure: number;
  readings: ConsolReading[];
  t90Min?: number;
  t50Min?: number;
  d0?: number;
  d50?: number;
  d100?: number;
  cvFromT90?: number;
  cvFromT50?: number;
  voidRatioE?: number;
}

export interface ConsolidationTest {
  id: number;
  sampleId: number;
  projectId: number;
  boreholeId: number;
  specimenDiameterCm: number;
  initialHeightCm: number;
  initialDialReading: number;
  gs: number;
  drySoilMassG: number;
  loadStages: ConsolLoadStage[];
  cc?: number;
  cs?: number;
  pcPreconsolidationTonFt2?: number;
  pcPreconsolidationKpa?: number;
  status: TestStatus;
  aiFlags?: AiFlag[];
  performedBy: number;
  performedAt: string;
  createdAt: string;
}
