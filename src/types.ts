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

export interface EvolutionAnalyticsSnapshot {
  tick: number;
  window: TurnoverWindow;
  species: SpeciesTurnoverAnalytics;
  clades: TaxonTurnoverAnalytics;
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
  initialAgents: number;
  initialEnergy: number;
  metabolismCostBase: number;
  moveCost: number;
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
