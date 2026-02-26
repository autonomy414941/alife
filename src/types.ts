export interface Genome {
  metabolism: number;
  harvest: number;
  aggression: number;
}

export interface TaxonTimelinePoint {
  tick: number;
  population: number;
  births: number;
  deaths: number;
}

export interface TaxonHistory {
  id: number;
  firstSeenTick: number;
  extinctTick: number | null;
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
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
  populationTroughDepth: number;
  populationTroughTicks: number;
  delayedPopulationShockDepth: number;
  preDisturbanceTurnoverRate: number;
  postDisturbanceTurnoverRate: number;
  turnoverSpike: number;
  extinctionBurstDepth: number;
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
  age: number;
  genome: Genome;
}

export interface AgentSeed {
  x: number;
  y: number;
  energy: number;
  genome: Genome;
  age?: number;
  lineage?: number;
  species?: number;
}

export interface SimulationConfig {
  width: number;
  height: number;
  maxResource: number;
  resourceRegen: number;
  seasonalCycleLength: number;
  seasonalRegenAmplitude: number;
  seasonalFertilityContrastAmplitude: number;
  disturbanceInterval: number;
  disturbanceEnergyLoss: number;
  disturbanceResourceLoss: number;
  disturbanceRadius: number;
  disturbanceRefugiaFraction: number;
  biomeBands: number;
  biomeContrast: number;
  decompositionBase: number;
  decompositionEnergyFraction: number;
  initialAgents: number;
  initialEnergy: number;
  metabolismCostBase: number;
  moveCost: number;
  dispersalPressure: number;
  dispersalRadius: number;
  localityRadius: number;
  habitatPreferenceStrength: number;
  habitatPreferenceMutation: number;
  specializationMetabolicCost: number;
  predationPressure: number;
  trophicForagingPenalty: number;
  trophicMutation: number;
  defenseMitigation: number;
  defenseForagingPenalty: number;
  defenseMutation: number;
  harvestCap: number;
  reproduceThreshold: number;
  reproduceProbability: number;
  offspringEnergyFraction: number;
  mutationAmount: number;
  speciationThreshold: number;
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

export interface ExperimentRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
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

export interface SimulationRunExport {
  generatedAt: string;
  analyticsWindow: number;
  summaries: StepSummary[];
  analytics: EvolutionAnalyticsSnapshot[];
  history: EvolutionHistorySnapshot;
}
