export interface Genome {
  metabolism: number;
  harvest: number;
  aggression: number;
  harvestEfficiency2?: number;
}

export interface GenomeV2 {
  traits: Map<string, number>;
}

export interface TaxonTimelinePoint {
  tick: number;
  population: number;
  births: number;
  deaths: number;
}

export interface TaxonFounderContext {
  habitatMean: number;
  habitatBin: number;
  localCrowdingMean: number;
  localCrowdingBin: number;
  founderCount: number;
}

export interface TaxonHistory {
  id: number;
  firstSeenTick: number;
  extinctTick: number | null;
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
  founderContext?: TaxonFounderContext;
  timeline: TaxonTimelinePoint[];
}

export interface EvolutionHistorySnapshot {
  clades: TaxonHistory[];
  species: TaxonHistory[];
  extinctClades: number;
  extinctSpecies: number;
}

export interface DurationStats {
  count: number;
  mean: number;
  max: number;
}

export interface TurnoverWindow {
  startTick: number;
  endTick: number;
  size: number;
}

export interface SpeciesTurnoverAnalytics {
  speciationsInWindow: number;
  extinctionsInWindow: number;
  speciationRate: number;
  extinctionRate: number;
  turnoverRate: number;
  netDiversificationRate: number;
  extinctLifespan: DurationStats;
  activeAge: DurationStats;
}

export interface TaxonTurnoverAnalytics {
  originationsInWindow: number;
  extinctionsInWindow: number;
  originationRate: number;
  extinctionRate: number;
  turnoverRate: number;
  netDiversificationRate: number;
  extinctLifespan: DurationStats;
  activeAge: DurationStats;
}

export interface LocalityStateAnalytics {
  occupiedCells: number;
  occupiedCellFraction: number;
  meanDominantSpeciesShare: number;
  dominantSpeciesShareStdDev: number;
  meanSpeciesRichness: number;
}

export interface LocalityTurnoverAnalytics {
  transitions: number;
  changedDominantCellFractionMean: number;
  changedDominantCellFractionStdDev: number;
  perCellDominantTurnoverMean: number;
  perCellDominantTurnoverStdDev: number;
  perCellDominantTurnoverMax: number;
}

export interface LocalityRadiusAnalytics {
  radius: number;
  meanDominantSpeciesShare: number;
  dominantSpeciesShareStdDev: number;
  meanSpeciesRichness: number;
  centerDominantAlignment: number;
}

export interface LocalityRadiusTurnoverAnalytics {
  radius: number;
  transitions: number;
  changedDominantCellFractionMean: number;
  changedDominantCellFractionStdDev: number;
  perCellDominantTurnoverMean: number;
  perCellDominantTurnoverStdDev: number;
  perCellDominantTurnoverMax: number;
}

export interface StrategyAxisAnalytics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  weightedMean: number;
}

export interface StrategyAnalytics {
  activeSpecies: number;
  habitatPreference: StrategyAxisAnalytics;
  trophicLevel: StrategyAxisAnalytics;
  defenseLevel: StrategyAxisAnalytics;
}

export interface ForcingAnalytics {
  cycleLength: number;
  phase: number;
  wave: number;
  regenMultiplier: number;
  fertilityContrastMultiplier: number;
}

export interface DisturbanceAnalytics {
  interval: number;
  phaseOffset: number;
  energyLoss: number;
  resourceLoss: number;
  radius: number;
  refugiaFraction: number;
  eventsInWindow: number;
  lastEventTick: number;
  lastEventPopulationShock: number;
  lastEventResourceShock: number;
  lastEventAffectedCellFraction: number;
  lastEventRefugiaCellFraction: number;
}

export interface ResilienceAnalytics {
  recoveryTicks: number;
  recoveryProgress: number;
  recoveryRelapses: number;
  sustainedRecoveryTicks: number;
  populationTroughDepth: number;
  populationTroughTicks: number;
  delayedPopulationShockDepth: number;
  preDisturbanceTurnoverRate: number;
  postDisturbanceTurnoverRate: number;
  turnoverSpike: number;
  extinctionBurstDepth: number;
  memoryEventCount: number;
  memoryRecoveredEventFraction: number;
  memoryRelapseEventFraction: number;
  memoryStabilityIndexMean: number;
  latestEventSeasonalPhase: number;
  latestEventRecoveryLagTicks: number;
  memoryRecoveryLagTicksMean: number;
  memoryEventPhaseMean: number;
  memoryEventPhaseConcentration: number;
}

export interface EvolutionAnalyticsSnapshot {
  tick: number;
  window: TurnoverWindow;
  species: SpeciesTurnoverAnalytics;
  clades: TaxonTurnoverAnalytics;
  strategy: StrategyAnalytics;
  forcing: ForcingAnalytics;
  disturbance: DisturbanceAnalytics;
  resilience: ResilienceAnalytics;
  locality: LocalityStateAnalytics;
  localityTurnover: LocalityTurnoverAnalytics;
  localityRadius: LocalityRadiusAnalytics;
  localityRadiusTurnover: LocalityRadiusTurnoverAnalytics;
}

export interface Agent {
  id: number;
  lineage: number;
  species: number;
  x: number;
  y: number;
  energy: number;
  energyPrimary?: number;
  energySecondary?: number;
  age: number;
  genome: Genome;
  genomeV2?: GenomeV2;
  internalState?: Map<string, number>;
}

export interface AgentSeed {
  x: number;
  y: number;
  energy: number;
  energyPrimary?: number;
  energySecondary?: number;
  genome: Genome;
  genomeV2?: GenomeV2;
  internalState?: Map<string, number>;
  age?: number;
  lineage?: number;
  species?: number;
}

export interface SimulationConfig {
  width: number;
  height: number;
  maxResource: number;
  maxResource2: number;
  resourceRegen: number;
  resource2Regen: number;
  seasonalCycleLength: number;
  seasonalRegenAmplitude: number;
  seasonalFertilityContrastAmplitude: number;
  disturbanceInterval: number;
  disturbancePhaseOffset: number;
  disturbanceEnergyLoss: number;
  disturbanceResourceLoss: number;
  disturbanceRadius: number;
  disturbanceRefugiaFraction: number;
  biomeBands: number;
  biomeContrast: number;
  decompositionBase: number;
  decompositionEnergyFraction: number;
  decompositionSpilloverFraction: number;
  initialAgents: number;
  initialEnergy: number;
  metabolismCostBase: number;
  moveCost: number;
  dispersalPressure: number;
  dispersalRadius: number;
  localityRadius: number;
  habitatPreferenceStrength: number;
  habitatPreferenceMutation: number;
  cladeHabitatCoupling: number;
  adaptiveCladeHabitatMemoryRate: number;
  cladeInteractionCoupling: number;
  specializationMetabolicCost: number;
  predationPressure: number;
  trophicForagingPenalty: number;
  trophicMutation: number;
  defenseMitigation: number;
  defenseForagingPenalty: number;
  defenseMutation: number;
  lineageEncounterRestraint: number;
  lineageDispersalCrowdingPenalty: number;
  lineageHarvestCrowdingPenalty: number;
  lineageOffspringSettlementCrowdingPenalty: number;
  newCladeSettlementCrowdingGraceTicks: number;
  newCladeEncounterRestraintGraceBoost: number;
  offspringSettlementEcologyScoring: boolean;
  disturbanceSettlementOpeningTicks: number;
  disturbanceSettlementOpeningBonus: number;
  disturbanceSettlementOpeningLineageAbsentOnly: boolean;
  cladogenesisTraitNoveltyThreshold: number;
  cladogenesisEcologyAdvantageThreshold: number;
  harvestCap: number;
  reproduceThreshold: number;
  reproduceProbability: number;
  offspringEnergyFraction: number;
  reproductionMinPrimaryFraction: number;
  reproductionMinSecondaryFraction: number;
  mutationAmount: number;
  speciationThreshold: number;
  cladogenesisThreshold: number;
  maxAge: number;
}

export interface StepSummary {
  tick: number;
  population: number;
  births: number;
  deaths: number;
  meanEnergy: number;
  meanGenome: Genome;
  activeClades: number;
  activeSpecies: number;
  dominantSpeciesShare: number;
  selectionDifferential: Genome;
  cladeExtinctions: number;
  speciesExtinctions: number;
  cumulativeExtinctClades: number;
  cumulativeExtinctSpecies: number;
  genomeV2LociCount?: number;
  genomeV2ExplicitTraitCount?: number;
  genomeV2ExtendedTraitAgentFraction?: number;
}

export interface SimulationSnapshot {
  tick: number;
  population: number;
  meanEnergy: number;
  activeClades: number;
  activeSpecies: number;
  dominantSpeciesShare: number;
  extinctClades: number;
  extinctSpecies: number;
  agents: Agent[];
}

export interface SimulationRunSeries {
  summaries: StepSummary[];
  analytics: EvolutionAnalyticsSnapshot[];
}

export interface NumericAggregate {
  mean: number;
  min: number;
  max: number;
}

export type SubstrateSpecializationBand = 'primaryBiased' | 'mixed' | 'secondaryBiased';

export interface SubstrateSpecializationBandMetrics {
  population: number;
  populationFraction: number;
  meanPrimaryEnergyShare: number;
  meanSecondaryEnergyShare: number;
}

export interface SubstrateSpecializationBandAggregate {
  populationFraction: NumericAggregate;
  meanPrimaryEnergyShare: NumericAggregate;
  meanSecondaryEnergyShare: NumericAggregate;
}

export interface CladeSubstrateDependence {
  lineage: number;
  population: number;
  populationFraction: number;
  meanPrimaryEnergyShare: number;
  meanSecondaryEnergyShare: number;
  meanHarvestEfficiency2: number;
  meanSecondaryHarvestShare: number;
}

export interface SubstrateObservabilityMetrics {
  meanPrimaryEnergyShare: number;
  meanSecondaryEnergyShare: number;
  meanHarvestEfficiency2: number;
  meanSecondaryHarvestShare: number;
  specializationStrata: Record<SubstrateSpecializationBand, SubstrateSpecializationBandMetrics>;
  cladeSubstrateDependence: CladeSubstrateDependence[];
}

export interface SubstrateObservabilityAggregate {
  meanPrimaryEnergyShare: NumericAggregate;
  meanSecondaryEnergyShare: NumericAggregate;
  meanHarvestEfficiency2: NumericAggregate;
  meanSecondaryHarvestShare: NumericAggregate;
  specializationStrata: Record<SubstrateSpecializationBand, SubstrateSpecializationBandAggregate>;
}

export interface ExperimentRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  finalResilienceStabilityIndex: number;
  finalResilienceMemoryStabilityIndex: number;
  finalResilienceRelapseEventFraction: number;
  finalSummary: StepSummary;
  finalAnalytics: EvolutionAnalyticsSnapshot;
}

export interface ExperimentAggregateSummary {
  runs: number;
  extinctRuns: number;
  extinctionRate: number;
  stepsExecuted: NumericAggregate;
  finalPopulation: NumericAggregate;
  finalMeanEnergy: NumericAggregate;
  finalActiveClades: NumericAggregate;
  finalActiveSpecies: NumericAggregate;
  finalDominantSpeciesShare: NumericAggregate;
  finalSpeciesSpeciationRate: NumericAggregate;
  finalSpeciesExtinctionRate: NumericAggregate;
  finalSpeciesNetDiversificationRate: NumericAggregate;
  finalResilienceStabilityIndex: NumericAggregate;
  finalResilienceMemoryStabilityIndex: NumericAggregate;
  finalResilienceRelapseEventFraction: NumericAggregate;
}

export interface SimulationExperimentConfig {
  runs: number;
  steps: number;
  analyticsWindow: number;
  seed: number;
  seedStep: number;
  stopWhenExtinct: boolean;
}

export interface SimulationExperimentExport {
  generatedAt: string;
  config: SimulationExperimentConfig;
  runs: ExperimentRunSummary[];
  aggregate: ExperimentAggregateSummary;
}

export interface PairedDeltaAggregate extends NumericAggregate {
  positiveFraction: number;
}

export interface BlockMeanUncertainty {
  mean: number;
  standardError: number;
  ci95Low: number;
  ci95High: number;
}

export interface DisturbanceGridCellPairedDeltas {
  resilienceStabilityDelta: PairedDeltaAggregate;
  memoryStabilityDelta: PairedDeltaAggregate;
  relapseEventReduction: PairedDeltaAggregate;
  turnoverSpikeReduction: PairedDeltaAggregate;
  pathDependenceGain: PairedDeltaAggregate;
  latestRecoveryLagReduction: PairedDeltaAggregate;
  memoryRecoveryLagReduction: PairedDeltaAggregate;
}

export interface DisturbanceGridCellTimingDiagnostics {
  globalLatestEventPhaseMean: number;
  localLatestEventPhaseMean: number;
  globalMemoryEventPhaseConcentrationMean: number;
  localMemoryEventPhaseConcentrationMean: number;
}

export interface DisturbanceGridCellReproducibility {
  blocks: number;
  hypothesisSupportFraction: number;
  pathDependenceGainPositiveBlockFraction: number;
  relapseEventReductionPositiveBlockFraction: number;
  resilienceStabilityPositiveFraction: NumericAggregate;
  memoryStabilityPositiveFraction: NumericAggregate;
  relapseEventReductionPositiveFraction: NumericAggregate;
  turnoverSpikeReductionPositiveFraction: NumericAggregate;
  pathDependenceGainPositiveFraction: NumericAggregate;
  latestRecoveryLagReductionPositiveFraction: NumericAggregate;
  memoryRecoveryLagReductionPositiveFraction: NumericAggregate;
  pathDependenceGainBlockMeanUncertainty: BlockMeanUncertainty;
  memoryStabilityDeltaBlockMeanUncertainty: BlockMeanUncertainty;
  relapseEventReductionBlockMeanUncertainty: BlockMeanUncertainty;
}

export interface DisturbanceFootprintMetadata {
  totalCells: number;
  targetedCells: number;
  affectedCells: number;
}

export interface DisturbanceGridCellSummary {
  interval: number;
  amplitude: number;
  phase: number;
  global: ExperimentAggregateSummary;
  local: ExperimentAggregateSummary;
  pairedDeltas: DisturbanceGridCellPairedDeltas;
  timingDiagnostics: DisturbanceGridCellTimingDiagnostics;
  reproducibility: DisturbanceGridCellReproducibility;
  hypothesisSupport: boolean;
}

export type PathDependenceGainCi95Classification = 'robustPositive' | 'ambiguous' | 'robustNegative';
export type PathDependenceGainCi95Decision = 'supported' | 'noSupport';

export interface PathDependenceGainCi95ClassificationCounts {
  robustPositive: number;
  ambiguous: number;
  robustNegative: number;
}

export interface PathDependenceGainCi95RankedCell {
  interval: number;
  amplitude: number;
  phase: number;
  mean: number;
  ci95Low: number;
  ci95High: number;
  classification: PathDependenceGainCi95Classification;
}

export interface DisturbanceGridStudySummary {
  cells: number;
  supportedCells: number;
  supportFraction: number;
  hypothesisSupportFractionAcrossBlocks: NumericAggregate;
  pathDependenceGainPositiveBlockFraction: NumericAggregate;
  relapseEventReductionPositiveBlockFraction: NumericAggregate;
  pathDependenceGainCi95ClassificationCounts: PathDependenceGainCi95ClassificationCounts;
  pathDependenceGainCi95RobustPositiveFraction: number;
  pathDependenceGainCi95Decision: PathDependenceGainCi95Decision;
  pathDependenceGainCi95LowerBoundTopCells: PathDependenceGainCi95RankedCell[];
  memoryStabilityDelta: NumericAggregate;
  relapseEventReduction: NumericAggregate;
  pathDependenceGain: NumericAggregate;
  latestRecoveryLagReduction: NumericAggregate;
  memoryRecoveryLagReduction: NumericAggregate;
  globalMemoryEventPhaseConcentration: NumericAggregate;
  localMemoryEventPhaseConcentration: NumericAggregate;
}

export interface DisturbanceGridStudyConfig {
  runs: number;
  steps: number;
  analyticsWindow: number;
  seed: number;
  seedStep: number;
  seedBlocks: number;
  blockSeedStride: number;
  stopWhenExtinct: boolean;
  intervals: number[];
  amplitudes: number[];
  phases: number[];
  localRadius: number;
  localRefugiaFraction: number;
}

export interface DisturbanceGridStudyExport {
  generatedAt: string;
  config: DisturbanceGridStudyConfig;
  cells: DisturbanceGridCellSummary[];
  summary: DisturbanceGridStudySummary;
}

export interface DisturbanceLocalitySweepCell {
  radius: number;
  refugiaFraction: number;
  footprint: DisturbanceFootprintMetadata;
  global: ExperimentAggregateSummary;
  local: ExperimentAggregateSummary;
  pairedDeltas: DisturbanceGridCellPairedDeltas;
  timingDiagnostics: DisturbanceGridCellTimingDiagnostics;
  reproducibility: DisturbanceGridCellReproducibility;
  hypothesisSupport: boolean;
  classification: PathDependenceGainCi95Classification;
}

export interface DisturbanceLocalitySweepSummary {
  cells: number;
  supportedCells: number;
  supportFraction: number;
  pathDependenceGainCi95ClassificationCounts: PathDependenceGainCi95ClassificationCounts;
  pathDependenceGainCi95RobustPositiveFraction: number;
  pathDependenceGainCi95Decision: PathDependenceGainCi95Decision;
}

export interface DisturbanceLocalitySweepConfig {
  runs: number;
  steps: number;
  analyticsWindow: number;
  seed: number;
  seedStep: number;
  seedBlocks: number;
  blockSeedStride: number;
  stopWhenExtinct: boolean;
  interval: number;
  amplitude: number;
  phase: number;
  localRadii: number[];
  localRefugiaFractions: number[];
}

export interface DisturbanceLocalitySweepExport {
  generatedAt: string;
  config: DisturbanceLocalitySweepConfig;
  cells: DisturbanceLocalitySweepCell[];
  summary: DisturbanceLocalitySweepSummary;
}

export interface SimulationRunExport {
  generatedAt: string;
  analyticsWindow: number;
  summaries: StepSummary[];
  analytics: EvolutionAnalyticsSnapshot[];
  history: EvolutionHistorySnapshot;
}

export interface SpeciesActivityWindow {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  newSpecies: number;
  cumulativeActivity: number;
  normalizedCumulativeActivity: number;
  newActivity: number;
  newAbundanceWeightedActivity: number;
}

export interface SpeciesActivityProbeDefinition {
  component: 'species';
  activityUnit: 'activeSpeciesTick';
  cumulativeActivity: string;
  normalizedCumulativeActivity: string;
  newActivity: string;
  newAbundanceWeightedActivity: string;
  activeSpeciesAreaUnderCurve: string;
  innovationMedianLifespan: string;
  regimeSwitchCount: string;
}

export interface SpeciesActivityPersistenceSweepDefinition {
  raw: SpeciesActivityProbeDefinition;
  observedLifetime: string;
  persistentNewActivity: string;
  persistentNewAbundanceWeightedActivity: string;
  censoredWindow: string;
}

export interface SpeciesActivityProbeConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seed: number;
  stopWhenExtinct: boolean;
}

export interface SpeciesActivityProbeSummary {
  stepsExecuted: number;
  totalSpecies: number;
  postBurnInWindows: number;
  postBurnInWindowsWithNewActivity: number;
  postBurnInNewSpecies: number;
  postBurnInNewActivityMean: number;
  postBurnInNewActivityMin: number;
  postBurnInNewActivityMax: number;
  postBurnInNewAbundanceWeightedActivityMean: number;
  postBurnInNewAbundanceWeightedActivityMin: number;
  postBurnInNewAbundanceWeightedActivityMax: number;
  finalCumulativeActivity: number;
  finalNormalizedCumulativeActivity: number;
  finalNewActivity: number;
  finalNewAbundanceWeightedActivity: number;
  activeSpeciesAreaUnderCurve: number;
  innovationMedianLifespan: number;
  regimeSwitchCount: number;
}

export interface SpeciesActivityProbeExport {
  generatedAt: string;
  definition: SpeciesActivityProbeDefinition;
  config: SpeciesActivityProbeConfig;
  finalSummary: StepSummary;
  windows: SpeciesActivityWindow[];
  summary: SpeciesActivityProbeSummary;
}

export interface SpeciesActivityPersistenceSweepConfig extends SpeciesActivityProbeConfig {
  minSurvivalTicks: number[];
}

export interface SpeciesActivityPersistenceWindow {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  censored: boolean;
  newSpecies: number;
  rawNewActivity: number;
  rawNewAbundanceWeightedActivity: number;
  persistentNewSpecies: number | null;
  persistentNewActivity: number | null;
  persistentNewAbundanceWeightedActivity: number | null;
}

export interface SpeciesActivityPersistenceSummary {
  minSurvivalTicks: number;
  postBurnInWindows: number;
  censoredPostBurnInWindows: number;
  evaluablePostBurnInWindows: number;
  postBurnInWindowsWithPersistentNewActivity: number;
  postBurnInPersistentNewSpecies: number;
  postBurnInPersistentNewActivityMean: number;
  postBurnInPersistentNewActivityMin: number;
  postBurnInPersistentNewActivityMax: number;
  postBurnInPersistentNewAbundanceWeightedActivityMean: number;
  postBurnInPersistentNewAbundanceWeightedActivityMin: number;
  postBurnInPersistentNewAbundanceWeightedActivityMax: number;
  finalPersistentNewActivity: number | null;
  finalPersistentNewAbundanceWeightedActivity: number | null;
  finalWindowCensored: boolean;
}

export interface SpeciesActivityPersistenceThresholdResult {
  minSurvivalTicks: number;
  windows: SpeciesActivityPersistenceWindow[];
  summary: SpeciesActivityPersistenceSummary;
}

export interface SpeciesActivityPersistenceSweepExport {
  generatedAt: string;
  definition: SpeciesActivityPersistenceSweepDefinition;
  config: SpeciesActivityPersistenceSweepConfig;
  finalSummary: StepSummary;
  rawSummary: SpeciesActivityProbeSummary;
  thresholds: SpeciesActivityPersistenceThresholdResult[];
}

export interface SpeciesActivitySeedPanelDefinition {
  raw: SpeciesActivityProbeDefinition;
  observedLifetime: string;
  persistentNewActivity: string;
  censoredWindow: string;
  persistentWindowFraction: string;
  allEvaluableWindowsPositive: string;
}

export interface SpeciesActivitySeedPanelConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
}

export interface SpeciesActivitySeedPanelThresholdSeedResult {
  minSurvivalTicks: number;
  summary: SpeciesActivityPersistenceSummary;
  persistentWindowFraction: number;
  allEvaluableWindowsPositive: boolean;
}

export interface SpeciesActivitySeedPanelSeedResult {
  seed: number;
  finalSummary: StepSummary;
  rawSummary: SpeciesActivityProbeSummary;
  thresholds: SpeciesActivitySeedPanelThresholdSeedResult[];
}

export interface SpeciesActivitySeedPanelThresholdAggregate {
  minSurvivalTicks: number;
  seeds: number;
  seedsWithEvaluableWindows: number;
  seedsWithAllEvaluableWindowsPositive: number;
  minPersistentWindowFraction: number;
  meanPersistentWindowFraction: number;
  maxPersistentWindowFraction: number;
  minPersistentActivityMean: number;
  meanPersistentActivityMean: number;
  maxPersistentActivityMean: number;
  minPersistentAbundanceWeightedActivityMean: number;
  meanPersistentAbundanceWeightedActivityMean: number;
  maxPersistentAbundanceWeightedActivityMean: number;
}

export interface SpeciesActivitySeedPanelExport {
  generatedAt: string;
  definition: SpeciesActivitySeedPanelDefinition;
  config: SpeciesActivitySeedPanelConfig;
  seedResults: SpeciesActivitySeedPanelSeedResult[];
  aggregates: SpeciesActivitySeedPanelThresholdAggregate[];
}

export interface CladeActivityWindow {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  newClades: number;
  cumulativeActivity: number;
  normalizedCumulativeActivity: number;
  newActivity: number;
  newAbundanceWeightedActivity: number;
}

export interface CladeActivityProbeDefinition {
  component: 'clades';
  activityUnit: 'activeCladeTick';
  cumulativeActivity: string;
  normalizedCumulativeActivity: string;
  newActivity: string;
  newAbundanceWeightedActivity: string;
  activeCladeAreaUnderCurve: string;
  innovationMedianLifespan: string;
  regimeSwitchCount: string;
}

export interface CladeActivityPersistenceSweepDefinition {
  raw: CladeActivityProbeDefinition;
  observedLifetime: string;
  persistentNewActivity: string;
  persistentNewAbundanceWeightedActivity: string;
  censoredWindow: string;
}

export interface CladeActivityProbeConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seed: number;
  stopWhenExtinct: boolean;
}

export interface CladeActivityProbeSummary {
  stepsExecuted: number;
  totalClades: number;
  postBurnInWindows: number;
  postBurnInWindowsWithNewActivity: number;
  postBurnInNewClades: number;
  postBurnInNewActivityMean: number;
  postBurnInNewActivityMin: number;
  postBurnInNewActivityMax: number;
  postBurnInNewAbundanceWeightedActivityMean: number;
  postBurnInNewAbundanceWeightedActivityMin: number;
  postBurnInNewAbundanceWeightedActivityMax: number;
  finalCumulativeActivity: number;
  finalNormalizedCumulativeActivity: number;
  finalNewActivity: number;
  finalNewAbundanceWeightedActivity: number;
  activeCladeAreaUnderCurve: number;
  innovationMedianLifespan: number;
  regimeSwitchCount: number;
}

export interface CladeActivityPersistenceSweepConfig extends CladeActivityProbeConfig {
  minSurvivalTicks: number[];
}

export interface CladeActivityPersistenceWindow {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  censored: boolean;
  newClades: number;
  rawNewActivity: number;
  rawNewAbundanceWeightedActivity: number;
  persistentNewClades: number | null;
  persistentNewActivity: number | null;
  persistentNewAbundanceWeightedActivity: number | null;
}

export interface CladeActivityPersistenceSummary {
  minSurvivalTicks: number;
  postBurnInWindows: number;
  censoredPostBurnInWindows: number;
  evaluablePostBurnInWindows: number;
  postBurnInWindowsWithPersistentNewActivity: number;
  postBurnInPersistentNewClades: number;
  postBurnInPersistentNewActivityMean: number;
  postBurnInPersistentNewActivityMin: number;
  postBurnInPersistentNewActivityMax: number;
  postBurnInPersistentNewAbundanceWeightedActivityMean: number;
  postBurnInPersistentNewAbundanceWeightedActivityMin: number;
  postBurnInPersistentNewAbundanceWeightedActivityMax: number;
  finalPersistentNewActivity: number | null;
  finalPersistentNewAbundanceWeightedActivity: number | null;
  finalWindowCensored: boolean;
}

export interface CladeActivityPersistenceThresholdResult {
  minSurvivalTicks: number;
  windows: CladeActivityPersistenceWindow[];
  summary: CladeActivityPersistenceSummary;
}

export interface CladeActivityPersistenceSweepExport {
  generatedAt: string;
  definition: CladeActivityPersistenceSweepDefinition;
  config: CladeActivityPersistenceSweepConfig;
  finalSummary: StepSummary;
  rawSummary: CladeActivityProbeSummary;
  thresholds: CladeActivityPersistenceThresholdResult[];
}

export interface CladeActivitySeedPanelDefinition {
  raw: CladeActivityProbeDefinition;
  observedLifetime: string;
  persistentNewActivity: string;
  censoredWindow: string;
  persistentWindowFraction: string;
  allEvaluableWindowsPositive: string;
}

export interface CladeActivitySeedPanelConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
}

export interface CladeActivitySeedPanelThresholdSeedResult {
  minSurvivalTicks: number;
  summary: CladeActivityPersistenceSummary;
  persistentWindowFraction: number;
  allEvaluableWindowsPositive: boolean;
}

export interface CladeActivitySeedPanelSeedResult {
  seed: number;
  finalSummary: StepSummary;
  rawSummary: CladeActivityProbeSummary;
  thresholds: CladeActivitySeedPanelThresholdSeedResult[];
}

export interface CladeActivitySeedPanelThresholdAggregate {
  minSurvivalTicks: number;
  seeds: number;
  seedsWithEvaluableWindows: number;
  seedsWithAllEvaluableWindowsPositive: number;
  minPersistentWindowFraction: number;
  meanPersistentWindowFraction: number;
  maxPersistentWindowFraction: number;
  minPersistentActivityMean: number;
  meanPersistentActivityMean: number;
  maxPersistentActivityMean: number;
  minPersistentAbundanceWeightedActivityMean: number;
  meanPersistentAbundanceWeightedActivityMean: number;
  maxPersistentAbundanceWeightedActivityMean: number;
}

export interface CladeActivitySeedPanelExport {
  generatedAt: string;
  definition: CladeActivitySeedPanelDefinition;
  config: CladeActivitySeedPanelConfig;
  seedResults: CladeActivitySeedPanelSeedResult[];
  aggregates: CladeActivitySeedPanelThresholdAggregate[];
}

export interface CladeSpeciesCountSummary {
  activeClades: number;
  activeSpecies: number;
  totalClades: number;
  totalSpecies: number;
  activeCladeToSpeciesRatio: number;
  totalCladeToSpeciesRatio: number;
}

export interface CladeSpeciesCountAggregate {
  activeClades: NumericAggregate;
  activeSpecies: NumericAggregate;
  totalClades: NumericAggregate;
  totalSpecies: NumericAggregate;
  activeCladeToSpeciesRatio: NumericAggregate;
  totalCladeToSpeciesRatio: NumericAggregate;
}

export interface CladeActivityCladogenesisSweepDefinition {
  seedPanel: CladeActivitySeedPanelDefinition;
  activeClades: string;
  activeSpecies: string;
  totalClades: string;
  totalSpecies: string;
  activeCladeToSpeciesRatio: string;
  totalCladeToSpeciesRatio: string;
}

export interface CladeActivityCladogenesisSweepConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface CladeActivityCladogenesisSweepSeedResult {
  seed: number;
  finalSummary: StepSummary;
  rawSummary: CladeActivityProbeSummary;
  thresholds: CladeActivitySeedPanelThresholdSeedResult[];
  counts: CladeSpeciesCountSummary;
}

export interface CladeActivityCladogenesisSweepThresholdResult {
  cladogenesisThreshold: number;
  seedResults: CladeActivityCladogenesisSweepSeedResult[];
  activityAggregates: CladeActivitySeedPanelThresholdAggregate[];
  countAggregates: CladeSpeciesCountAggregate;
}

export interface CladeActivityCladogenesisSweepExport {
  generatedAt: string;
  definition: CladeActivityCladogenesisSweepDefinition;
  config: CladeActivityCladogenesisSweepConfig;
  thresholdResults: CladeActivityCladogenesisSweepThresholdResult[];
}

export interface CladeActivityCladogenesisHorizonSweepConfig {
  steps: number[];
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface CladeActivityCladogenesisHorizonSweepPoint {
  steps: number;
  thresholdResults: CladeActivityCladogenesisSweepThresholdResult[];
}

export interface CladeActivityCladogenesisHorizonSweepExport {
  generatedAt: string;
  definition: CladeActivityCladogenesisSweepDefinition;
  config: CladeActivityCladogenesisHorizonSweepConfig;
  horizons: CladeActivityCladogenesisHorizonSweepPoint[];
}

export interface CladeSpeciesActivityCouplingDefinition {
  species: SpeciesActivitySeedPanelDefinition;
  clade: CladeActivitySeedPanelDefinition;
  cladeToSpeciesPersistentWindowFraction: string;
  persistentWindowFractionDelta: string;
  cladeToSpeciesPersistentActivityMeanRatio: string;
  persistentActivityMeanDelta: string;
  cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio: string;
  persistentAbundanceWeightedActivityMeanDelta: string;
}

export interface CladeSpeciesActivityCouplingConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface CladeSpeciesActivityCouplingThresholdSeedResult {
  minSurvivalTicks: number;
  species: SpeciesActivitySeedPanelThresholdSeedResult;
  clade: CladeActivitySeedPanelThresholdSeedResult;
  cladeToSpeciesPersistentWindowFraction: number | null;
  persistentWindowFractionDelta: number;
  cladeToSpeciesPersistentActivityMeanRatio: number | null;
  persistentActivityMeanDelta: number;
  cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio: number | null;
  persistentAbundanceWeightedActivityMeanDelta: number;
}

export interface CladeSpeciesActivityCouplingSeedResult {
  seed: number;
  finalSummary: StepSummary;
  speciesRawSummary: SpeciesActivityProbeSummary;
  cladeRawSummary: CladeActivityProbeSummary;
  thresholds: CladeSpeciesActivityCouplingThresholdSeedResult[];
}

export interface CladeSpeciesActivityCouplingRatioAggregate {
  definedSeeds: number;
  mean: number | null;
  min: number | null;
  max: number | null;
}

export interface CladeSpeciesActivityCouplingThresholdAggregate {
  minSurvivalTicks: number;
  species: SpeciesActivitySeedPanelThresholdAggregate;
  clade: CladeActivitySeedPanelThresholdAggregate;
  cladeToSpeciesPersistentWindowFraction: CladeSpeciesActivityCouplingRatioAggregate;
  persistentWindowFractionDelta: NumericAggregate;
  cladeToSpeciesPersistentActivityMeanRatio: CladeSpeciesActivityCouplingRatioAggregate;
  persistentActivityMeanDelta: NumericAggregate;
  cladeToSpeciesPersistentAbundanceWeightedActivityMeanRatio: CladeSpeciesActivityCouplingRatioAggregate;
  persistentAbundanceWeightedActivityMeanDelta: NumericAggregate;
}

export interface CladeSpeciesActivityCouplingThresholdResult {
  cladogenesisThreshold: number;
  seedResults: CladeSpeciesActivityCouplingSeedResult[];
  aggregates: CladeSpeciesActivityCouplingThresholdAggregate[];
}

export interface CladeSpeciesActivityCouplingExport {
  generatedAt: string;
  definition: CladeSpeciesActivityCouplingDefinition;
  config: CladeSpeciesActivityCouplingConfig;
  thresholdResults: CladeSpeciesActivityCouplingThresholdResult[];
}

export interface TaxonBirthSchedulePoint {
  tick: number;
  births: number;
}

export interface TaxonFounderHabitatSchedulePoint {
  tick: number;
  habitatBin: number;
  births: number;
}

export interface TaxonFounderHabitatCrowdingSchedulePoint {
  tick: number;
  habitatBin: number;
  localCrowdingBin: number;
  births: number;
}

export type MatchedNullFounderContext = 'none' | 'founderHabitatBin' | 'founderHabitatAndCrowdingBin';

export interface CladeActivityRelabelNullDefinition {
  actual: CladeActivitySeedPanelDefinition;
  matchedNull: CladeActivitySeedPanelDefinition;
  matchedSchedule: string;
  matchedFounderContext: string;
  relabeling: string;
  diagnostics: string;
  dominantLossMode: string;
  actualToNullPersistentWindowFractionRatio: string;
  persistentWindowFractionDeltaVsNull: string;
  actualToNullPersistentActivityMeanRatio: string;
  persistentActivityMeanDeltaVsNull: string;
  actualToNullPersistentAbundanceWeightedActivityMeanRatio: string;
  persistentAbundanceWeightedActivityMeanDeltaVsNull: string;
}

export interface CladeActivityRelabelNullStudyConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
  matchedNullFounderContext: MatchedNullFounderContext;
}

export type CladeActivityRelabelNullLossMode =
  | 'matchedOrBetter'
  | 'founderSuppression'
  | 'persistenceFailure'
  | 'activeCladeDeficit';

export interface CladeActivityRelabelNullSeedDiagnostics {
  finalPopulation: number;
  actualActiveClades: number;
  matchedNullActiveClades: number;
  activeCladeDeltaVsNull: number;
  actualRawNewCladeActivityMean: number;
  matchedNullRawNewCladeActivityMean: number;
  rawNewCladeActivityMeanDeltaVsNull: number;
  actualPersistentActivityMean: number;
  matchedNullPersistentActivityMean: number;
  persistentActivityMeanDeltaVsNull: number;
  persistencePenaltyVsRawDelta: number;
  dominantLossMode: CladeActivityRelabelNullLossMode;
}

export interface CladeActivityRelabelNullAggregateDiagnostics {
  finalPopulation: NumericAggregate;
  actualActiveClades: NumericAggregate;
  matchedNullActiveClades: NumericAggregate;
  activeCladeDeltaVsNull: NumericAggregate;
  actualRawNewCladeActivityMean: NumericAggregate;
  matchedNullRawNewCladeActivityMean: NumericAggregate;
  rawNewCladeActivityMeanDeltaVsNull: NumericAggregate;
  actualPersistentActivityMean: NumericAggregate;
  matchedNullPersistentActivityMean: NumericAggregate;
  persistentActivityMeanDeltaVsNull: NumericAggregate;
  persistencePenaltyVsRawDelta: NumericAggregate;
  dominantLossMode: CladeActivityRelabelNullLossMode;
}

export interface CladeActivityRelabelNullDiagnosticSnapshot {
  finalPopulationMean: number;
  actualActiveCladesMean: number;
  matchedNullActiveCladesMean: number | null;
  activeCladeDeltaVsNullMean: number | null;
  rawNewCladeActivityMeanDeltaVsNullMean: number;
  persistencePenaltyVsRawDeltaMean: number;
  dominantLossMode: CladeActivityRelabelNullLossMode;
}

export interface CladeActivityRelabelNullThresholdSeedResult {
  minSurvivalTicks: number;
  actual: CladeActivitySeedPanelThresholdSeedResult;
  matchedNull: CladeActivitySeedPanelThresholdSeedResult;
  actualToNullPersistentWindowFractionRatio: number | null;
  persistentWindowFractionDeltaVsNull: number;
  actualToNullPersistentActivityMeanRatio: number | null;
  persistentActivityMeanDeltaVsNull: number;
  actualToNullPersistentAbundanceWeightedActivityMeanRatio: number | null;
  persistentAbundanceWeightedActivityMeanDeltaVsNull: number;
  diagnostics: CladeActivityRelabelNullSeedDiagnostics;
}

export interface CladeActivityRelabelNullSeedResult {
  seed: number;
  relabelSeed: number;
  finalSummary: StepSummary;
  actualSubstrateMetrics: SubstrateObservabilityMetrics;
  actualRawSummary: CladeActivityProbeSummary;
  actualSpeciesRawSummary: SpeciesActivityProbeSummary;
  matchedNullRawSummary: CladeActivityProbeSummary;
  nonSpeciesConditionedNullRawSummary?: CladeActivityProbeSummary;
  actualBirthSchedule: TaxonBirthSchedulePoint[];
  matchedNullBirthSchedule: TaxonBirthSchedulePoint[];
  birthScheduleMatched: boolean;
  actualFounderHabitatSchedule: TaxonFounderHabitatSchedulePoint[];
  matchedNullFounderHabitatSchedule: TaxonFounderHabitatSchedulePoint[];
  founderHabitatScheduleMatched: boolean | null;
  actualFounderHabitatCrowdingSchedule: TaxonFounderHabitatCrowdingSchedulePoint[];
  matchedNullFounderHabitatCrowdingSchedule: TaxonFounderHabitatCrowdingSchedulePoint[];
  founderHabitatCrowdingScheduleMatched: boolean | null;
  actualSpeciesThresholds: SpeciesActivitySeedPanelThresholdSeedResult[];
  nonSpeciesConditionedNullFinalActiveClades?: number;
  nonSpeciesConditionedNullThresholds?: CladeActivitySeedPanelThresholdSeedResult[];
  thresholds: CladeActivityRelabelNullThresholdSeedResult[];
}

export interface CladeActivityRelabelNullThresholdAggregate {
  minSurvivalTicks: number;
  actual: CladeActivitySeedPanelThresholdAggregate;
  matchedNull: CladeActivitySeedPanelThresholdAggregate;
  actualSubstrateMetrics: SubstrateObservabilityAggregate;
  actualToNullPersistentWindowFractionRatio: CladeSpeciesActivityCouplingRatioAggregate;
  persistentWindowFractionDeltaVsNull: NumericAggregate;
  actualToNullPersistentActivityMeanRatio: CladeSpeciesActivityCouplingRatioAggregate;
  persistentActivityMeanDeltaVsNull: NumericAggregate;
  actualToNullPersistentAbundanceWeightedActivityMeanRatio: CladeSpeciesActivityCouplingRatioAggregate;
  persistentAbundanceWeightedActivityMeanDeltaVsNull: NumericAggregate;
  diagnostics: CladeActivityRelabelNullAggregateDiagnostics;
}

export interface CladeActivityRelabelNullThresholdResult {
  cladogenesisThreshold: number;
  seedResults: CladeActivityRelabelNullSeedResult[];
  aggregates: CladeActivityRelabelNullThresholdAggregate[];
}

export interface CladeActivityRelabelNullStudyExport {
  generatedAt: string;
  definition: CladeActivityRelabelNullDefinition;
  config: CladeActivityRelabelNullStudyConfig;
  thresholdResults: CladeActivityRelabelNullThresholdResult[];
}

export interface CladeActivityRelabelNullCladeHabitatCouplingSweepDefinition {
  study: CladeActivityRelabelNullDefinition;
  cladeHabitatCoupling: string;
  birthScheduleMatchedAllSeeds: string;
  actualToNullPersistentWindowFractionRatioMean: string;
  persistentWindowFractionDeltaVsNullMean: string;
  actualToNullPersistentActivityMeanRatioMean: string;
  persistentActivityMeanDeltaVsNullMean: string;
  actualToNullPersistentAbundanceWeightedActivityMeanRatioMean: string;
  persistentAbundanceWeightedActivityMeanDeltaVsNullMean: string;
}

export interface CladeActivityRelabelNullCladeHabitatCouplingSweepConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number;
  cladogenesisThreshold: number;
  cladeHabitatCouplingValues: number[];
}

export interface CladeActivityRelabelNullCladeHabitatCouplingSweepResult {
  cladeHabitatCoupling: number;
  seedResults: CladeActivityRelabelNullSeedResult[];
  aggregate: CladeActivityRelabelNullThresholdAggregate;
  birthScheduleMatchedAllSeeds: boolean;
  actualToNullPersistentWindowFractionRatioMean: number | null;
  persistentWindowFractionDeltaVsNullMean: number;
  actualToNullPersistentActivityMeanRatioMean: number | null;
  persistentActivityMeanDeltaVsNullMean: number;
  actualToNullPersistentAbundanceWeightedActivityMeanRatioMean: number | null;
  persistentAbundanceWeightedActivityMeanDeltaVsNullMean: number;
}

export interface CladeActivityRelabelNullCladeHabitatCouplingSweepExport {
  generatedAt: string;
  definition: CladeActivityRelabelNullCladeHabitatCouplingSweepDefinition;
  config: CladeActivityRelabelNullCladeHabitatCouplingSweepConfig;
  results: CladeActivityRelabelNullCladeHabitatCouplingSweepResult[];
}

export interface CladeActivityRelabelNullCladeInteractionCouplingSweepDefinition {
  study: CladeActivityRelabelNullDefinition;
  cladeInteractionCoupling: string;
  birthScheduleMatchedAllSeeds: string;
  actualToNullPersistentWindowFractionRatioMean: string;
  persistentWindowFractionDeltaVsNullMean: string;
  actualToNullPersistentActivityMeanRatioMean: string;
  persistentActivityMeanDeltaVsNullMean: string;
  actualToNullPersistentAbundanceWeightedActivityMeanRatioMean: string;
  persistentAbundanceWeightedActivityMeanDeltaVsNullMean: string;
}

export interface CladeActivityRelabelNullCladeInteractionCouplingSweepConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number;
  cladogenesisThreshold: number;
  cladeInteractionCouplingValues: number[];
}

export interface CladeActivityRelabelNullCladeInteractionCouplingSweepResult {
  cladeInteractionCoupling: number;
  seedResults: CladeActivityRelabelNullSeedResult[];
  aggregate: CladeActivityRelabelNullThresholdAggregate;
  birthScheduleMatchedAllSeeds: boolean;
  actualToNullPersistentWindowFractionRatioMean: number | null;
  persistentWindowFractionDeltaVsNullMean: number;
  actualToNullPersistentActivityMeanRatioMean: number | null;
  persistentActivityMeanDeltaVsNullMean: number;
  actualToNullPersistentAbundanceWeightedActivityMeanRatioMean: number | null;
  persistentAbundanceWeightedActivityMeanDeltaVsNullMean: number;
}

export interface CladeActivityRelabelNullCladeInteractionCouplingSweepExport {
  generatedAt: string;
  definition: CladeActivityRelabelNullCladeInteractionCouplingSweepDefinition;
  config: CladeActivityRelabelNullCladeInteractionCouplingSweepConfig;
  results: CladeActivityRelabelNullCladeInteractionCouplingSweepResult[];
}

export interface SpeciesActivityHorizonSweepConfig {
  steps: number[];
  windowSize: number;
  burnIn: number;
  seed: number;
  stopWhenExtinct: boolean;
}

export interface SpeciesActivityHorizonSweepPoint extends SpeciesActivityProbeSummary {
  steps: number;
}

export interface SpeciesActivityHorizonSweepExport {
  generatedAt: string;
  definition: SpeciesActivityProbeDefinition;
  config: SpeciesActivityHorizonSweepConfig;
  horizons: SpeciesActivityHorizonSweepPoint[];
}
