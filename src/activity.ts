import {
  buildActivitySeedPanelThresholdAggregate,
  max,
  mean,
  min
} from './activity-thresholds';
import {
  buildCladeActivityCladogenesisSeedResult,
  buildCladeActivitySeedPanelSeedResult,
  buildCladeSpeciesActivityCouplingSeedResult,
  buildCladeSpeciesActivityCouplingThresholdAggregate,
  buildCladeSpeciesCountAggregate,
  buildSpeciesActivitySeedPanelSeedResult,
  truncateEvolutionHistory
} from './activity-study-results';
import {
  buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult,
  buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult,
  resolveMatchedNullFounderContext
} from './clade-activity-relabel-null-study-helpers';
import { buildCladeActivityRelabelNullThresholdResults } from './clade-activity-relabel-null-study-runner';
import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
  CladeActivityCladogenesisHorizonSweepExport,
  CladeActivityCladogenesisHorizonSweepPoint,
  CladeActivityRelabelNullCladeHabitatCouplingSweepDefinition,
  CladeActivityRelabelNullCladeHabitatCouplingSweepExport,
  CladeActivityRelabelNullCladeHabitatCouplingSweepResult,
  CladeActivityRelabelNullCladeInteractionCouplingSweepDefinition,
  CladeActivityRelabelNullCladeInteractionCouplingSweepExport,
  CladeActivityRelabelNullCladeInteractionCouplingSweepResult,
  CladeActivityRelabelNullDefinition,
  CladeActivityRelabelNullStudyConfig,
  CladeActivityRelabelNullStudyExport,
  CladeActivityRelabelNullThresholdAggregate,
  CladeActivityRelabelNullThresholdResult,
  CladeActivityCladogenesisSweepDefinition,
  CladeActivityCladogenesisSweepExport,
  CladeActivityCladogenesisSweepSeedResult,
  CladeActivityCladogenesisSweepThresholdResult,
  CladeActivityPersistenceSummary,
  CladeActivityPersistenceSweepDefinition,
  CladeActivityPersistenceSweepExport,
  CladeActivityPersistenceThresholdResult,
  CladeActivityPersistenceWindow,
  CladeActivityProbeDefinition,
  CladeActivityProbeSummary,
  CladeActivitySeedPanelDefinition,
  CladeActivitySeedPanelExport,
  CladeActivitySeedPanelSeedResult,
  CladeActivitySeedPanelThresholdAggregate,
  CladeActivitySeedPanelThresholdSeedResult,
  CladeSpeciesCountAggregate,
  CladeSpeciesCountSummary,
  CladeSpeciesActivityCouplingDefinition,
  CladeSpeciesActivityCouplingExport,
  CladeSpeciesActivityCouplingSeedResult,
  CladeSpeciesActivityCouplingThresholdAggregate,
  CladeSpeciesActivityCouplingThresholdSeedResult,
  CladeSpeciesActivityCouplingThresholdResult,
  CladeActivityWindow,
  EvolutionHistorySnapshot,
  SpeciesActivityHorizonSweepExport,
  SpeciesActivityHorizonSweepPoint,
  SpeciesActivityPersistenceSummary,
  SpeciesActivityPersistenceSweepDefinition,
  SpeciesActivityPersistenceSweepExport,
  SpeciesActivityPersistenceThresholdResult,
  SpeciesActivityPersistenceWindow,
  SpeciesActivityProbeDefinition,
  SpeciesActivityProbeExport,
  SpeciesActivityProbeSummary,
  SpeciesActivitySeedPanelDefinition,
  SpeciesActivitySeedPanelExport,
  SpeciesActivitySeedPanelSeedResult,
  SpeciesActivitySeedPanelThresholdAggregate,
  SpeciesActivitySeedPanelThresholdSeedResult,
  SpeciesActivityWindow,
  StepSummary,
  TaxonHistory
} from './types';

export interface AnalyzeSpeciesActivityInput {
  species: TaxonHistory[];
  windowSize: number;
  burnIn?: number;
  maxTick: number;
}

export interface AnalyzeSpeciesActivityResult {
  windows: SpeciesActivityWindow[];
  summary: SpeciesActivityProbeSummary;
}

export interface AnalyzeCladeActivityInput {
  clades: TaxonHistory[];
  windowSize: number;
  burnIn?: number;
  maxTick: number;
}

export interface AnalyzeCladeActivityResult {
  windows: CladeActivityWindow[];
  summary: CladeActivityProbeSummary;
}

export interface AnalyzePersistentSpeciesActivityInput extends AnalyzeSpeciesActivityInput {
  minSurvivalTicks: number;
}

export interface AnalyzePersistentSpeciesActivityResult {
  windows: SpeciesActivityPersistenceWindow[];
  summary: SpeciesActivityPersistenceSummary;
}

export interface AnalyzePersistentCladeActivityInput extends AnalyzeCladeActivityInput {
  minSurvivalTicks: number;
}

export interface AnalyzePersistentCladeActivityResult {
  windows: CladeActivityPersistenceWindow[];
  summary: CladeActivityPersistenceSummary;
}

export interface RunSpeciesActivityProbeInput {
  steps: number;
  windowSize: number;
  burnIn: number;
  seed: number;
  stopWhenExtinct?: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export interface RunSpeciesActivityHorizonSweepInput extends Omit<RunSpeciesActivityProbeInput, 'steps'> {
  steps: number[];
}

export interface RunSpeciesActivityPersistenceSweepInput extends RunSpeciesActivityProbeInput {
  minSurvivalTicks: number[];
}

export interface RunSpeciesActivitySeedPanelInput extends Omit<RunSpeciesActivityProbeInput, 'seed'> {
  seeds: number[];
  minSurvivalTicks: number[];
}

export interface RunCladeActivityPersistenceSweepInput extends RunSpeciesActivityProbeInput {
  minSurvivalTicks: number[];
}

export interface RunCladeActivitySeedPanelInput extends Omit<RunSpeciesActivityProbeInput, 'seed'> {
  seeds: number[];
  minSurvivalTicks: number[];
}

export interface RunCladeActivityCladogenesisSweepInput extends Omit<RunSpeciesActivityProbeInput, 'seed'> {
  seeds: number[];
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface RunCladeActivityCladogenesisHorizonSweepInput
  extends Omit<RunCladeActivityCladogenesisSweepInput, 'steps'> {
  steps: number[];
}

export interface CladeActivityCoarseThresholdBoundaryStudyConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface RunCladeActivityCoarseThresholdBoundaryStudyInput
  extends Partial<CladeActivityCoarseThresholdBoundaryStudyConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export interface CladeActivityCladogenesisHorizonStudyConfig {
  steps: number[];
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface RunCladeActivityCladogenesisHorizonStudyInput
  extends Partial<CladeActivityCladogenesisHorizonStudyConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export interface CladeSpeciesActivityCouplingStudyConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface RunCladeSpeciesActivityCouplingStudyInput extends Partial<CladeSpeciesActivityCouplingStudyConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export interface RunCladeActivityRelabelNullStudyInput extends Partial<CladeActivityRelabelNullStudyConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
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

export interface RunCladeActivityRelabelNullCladeHabitatCouplingSweepInput
  extends Partial<CladeActivityRelabelNullCladeHabitatCouplingSweepConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
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

export interface RunCladeActivityRelabelNullCladeInteractionCouplingSweepInput
  extends Partial<CladeActivityRelabelNullCladeInteractionCouplingSweepConfig> {
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export const DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY: CladeActivityCoarseThresholdBoundaryStudyConfig =
  {
    steps: 2000,
    windowSize: 100,
    burnIn: 200,
    seeds: [20260307, 20260308, 20260309, 20260310],
    stopWhenExtinct: true,
    minSurvivalTicks: [50, 100],
    cladogenesisThresholds: [-1, 0.6, 0.8, 1, 1.2]
  };

export const DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY: CladeActivityCladogenesisHorizonStudyConfig = {
  steps: [2000, 3000, 4000],
  windowSize: 100,
  burnIn: 200,
  seeds: [20260307, 20260308, 20260309, 20260310],
  stopWhenExtinct: true,
  minSurvivalTicks: [50, 100],
  cladogenesisThresholds: [-1, 1, 1.2]
};

export const DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY: CladeSpeciesActivityCouplingStudyConfig = {
  steps: 4000,
  windowSize: 100,
  burnIn: 200,
  seeds: [20260307, 20260308, 20260309, 20260310],
  stopWhenExtinct: true,
  minSurvivalTicks: [50, 100],
  cladogenesisThresholds: [-1, 1, 1.2]
};

export const DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY: CladeActivityRelabelNullStudyConfig = {
  steps: 4000,
  windowSize: 100,
  burnIn: 200,
  seeds: [20260307, 20260308, 20260309, 20260310],
  stopWhenExtinct: true,
  minSurvivalTicks: [50, 100],
  cladogenesisThresholds: [1, 1.2],
  matchedNullFounderContext: 'none'
};

export { buildMatchedSchedulePseudoClades } from './clade-activity-relabel-null-matched-schedule';
export { deriveRelabelSeed, resolveMatchedNullFounderContext } from './clade-activity-relabel-null-study-helpers';

export const DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP: CladeActivityRelabelNullCladeHabitatCouplingSweepConfig =
  {
    steps: 1000,
    windowSize: 100,
    burnIn: 200,
    seeds: [20260307, 20260308, 20260309, 20260310],
    stopWhenExtinct: true,
    minSurvivalTicks: 50,
    cladogenesisThreshold: 1,
    cladeHabitatCouplingValues: [0, 0.25, 0.5, 0.75, 1]
  };

export const DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP: CladeActivityRelabelNullCladeInteractionCouplingSweepConfig =
  {
    steps: 1000,
    windowSize: 100,
    burnIn: 200,
    seeds: [20260307, 20260308, 20260309, 20260310],
    stopWhenExtinct: true,
    minSurvivalTicks: 50,
    cladogenesisThreshold: 1,
    cladeInteractionCouplingValues: [0, 0.25, 0.5, 0.75, 1]
  };

interface AnalyzeTaxonActivityInput {
  taxa: TaxonHistory[];
  windowSize: number;
  burnIn?: number;
  maxTick: number;
}

interface AnalyzeTaxonActivityResult {
  windows: TaxonActivityWindowData[];
  summary: TaxonActivityProbeSummaryData;
}

interface AnalyzePersistentTaxonActivityInput extends AnalyzeTaxonActivityInput {
  minSurvivalTicks: number;
}

interface AnalyzePersistentTaxonActivityResult {
  windows: TaxonActivityPersistenceWindowData[];
  summary: TaxonActivityPersistenceSummaryData;
}

interface RunActivitySimulationInput {
  steps: number;
  seed: number;
  stopWhenExtinct: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  emptyRunError: string;
}

interface TaxonWindowContribution {
  windowIndex: number;
  activityInOriginWindow: number;
  observedLifetime: number;
}

interface TaxonActivityContext {
  activeTaxaByTick: number[];
  contributions: TaxonWindowContribution[];
}

interface TaxonActivityWindowData {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  newTaxa: number;
  cumulativeActivity: number;
  normalizedCumulativeActivity: number;
  newActivity: number;
}

interface TaxonActivityProbeSummaryData {
  stepsExecuted: number;
  totalTaxa: number;
  postBurnInWindows: number;
  postBurnInWindowsWithNewActivity: number;
  postBurnInNewTaxa: number;
  postBurnInNewActivityMean: number;
  postBurnInNewActivityMin: number;
  postBurnInNewActivityMax: number;
  finalCumulativeActivity: number;
  finalNormalizedCumulativeActivity: number;
  finalNewActivity: number;
}

interface TaxonActivityPersistenceWindowData {
  windowIndex: number;
  startTick: number;
  endTick: number;
  size: number;
  postBurnIn: boolean;
  censored: boolean;
  newTaxa: number;
  rawNewActivity: number;
  persistentNewTaxa: number | null;
  persistentNewActivity: number | null;
}

interface TaxonActivityPersistenceSummaryData {
  minSurvivalTicks: number;
  postBurnInWindows: number;
  censoredPostBurnInWindows: number;
  evaluablePostBurnInWindows: number;
  postBurnInWindowsWithPersistentNewActivity: number;
  postBurnInPersistentNewTaxa: number;
  postBurnInPersistentNewActivityMean: number;
  postBurnInPersistentNewActivityMin: number;
  postBurnInPersistentNewActivityMax: number;
  finalPersistentNewActivity: number | null;
  finalWindowCensored: boolean;
}

export const SPECIES_ACTIVITY_PROBE_DEFINITION: SpeciesActivityProbeDefinition = {
  component: 'species',
  activityUnit: 'activeSpeciesTick',
  cumulativeActivity: 'Sum of occupied species-ticks from simulation tick 1 through the end of each window.',
  normalizedCumulativeActivity: 'Cumulative activity divided by elapsed simulation ticks at the end of each window.',
  newActivity:
    'Occupied species-ticks within a window contributed by species whose firstSeenTick falls inside that same window.'
};

export const SPECIES_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION: SpeciesActivityPersistenceSweepDefinition = {
  raw: SPECIES_ACTIVITY_PROBE_DEFINITION,
  observedLifetime:
    'Observed lifetime is extinctTick - firstSeenTick for extinct species and maxTick - firstSeenTick for extant species.',
  persistentNewActivity:
    'Occupied species-ticks within an origin window contributed by species whose observed lifetime reaches the survival threshold.',
  censoredWindow:
    'A window is censored when its end tick plus the survival threshold exceeds the simulation horizon, so late-origin species in that window cannot yet be fully evaluated.'
};

export const SPECIES_ACTIVITY_SEED_PANEL_DEFINITION: SpeciesActivitySeedPanelDefinition = {
  ...SPECIES_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION,
  persistentWindowFraction:
    'For one seed and threshold, the fraction of evaluable post-burn-in windows whose persistentNewActivity is greater than zero.',
  allEvaluableWindowsPositive:
    'For one seed and threshold, true when every evaluable post-burn-in window has persistentNewActivity greater than zero.'
};

export const CLADE_ACTIVITY_PROBE_DEFINITION: CladeActivityProbeDefinition = {
  component: 'clades',
  activityUnit: 'activeCladeTick',
  cumulativeActivity: 'Sum of occupied clade-ticks from simulation tick 1 through the end of each window.',
  normalizedCumulativeActivity: 'Cumulative activity divided by elapsed simulation ticks at the end of each window.',
  newActivity:
    'Occupied clade-ticks within a window contributed by clades whose firstSeenTick falls inside that same window.'
};

export const CLADE_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION: CladeActivityPersistenceSweepDefinition = {
  raw: CLADE_ACTIVITY_PROBE_DEFINITION,
  observedLifetime:
    'Observed lifetime is extinctTick - firstSeenTick for extinct clades and maxTick - firstSeenTick for extant clades.',
  persistentNewActivity:
    'Occupied clade-ticks within an origin window contributed by clades whose observed lifetime reaches the survival threshold.',
  censoredWindow:
    'A window is censored when its end tick plus the survival threshold exceeds the simulation horizon, so late-origin clades in that window cannot yet be fully evaluated.'
};

export const CLADE_ACTIVITY_SEED_PANEL_DEFINITION: CladeActivitySeedPanelDefinition = {
  ...CLADE_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION,
  persistentWindowFraction:
    'For one seed and threshold, the fraction of evaluable post-burn-in windows whose persistentNewActivity is greater than zero.',
  allEvaluableWindowsPositive:
    'For one seed and threshold, true when every evaluable post-burn-in window has persistentNewActivity greater than zero.'
};

export const CLADE_ACTIVITY_CLADOGENESIS_SWEEP_DEFINITION: CladeActivityCladogenesisSweepDefinition = {
  seedPanel: CLADE_ACTIVITY_SEED_PANEL_DEFINITION,
  activeClades: 'Active clade count in the final simulation summary for one seed.',
  activeSpecies: 'Active species count in the final simulation summary for one seed.',
  totalClades: 'Total clades observed across the full simulation history for one seed.',
  totalSpecies: 'Total species observed across the full simulation history for one seed.',
  activeCladeToSpeciesRatio: 'Final activeClades divided by final activeSpecies for one seed.',
  totalCladeToSpeciesRatio: 'Total clades divided by total species observed over the full simulation history for one seed.'
};

export const CLADE_SPECIES_ACTIVITY_COUPLING_DEFINITION: CladeSpeciesActivityCouplingDefinition = {
  species: SPECIES_ACTIVITY_SEED_PANEL_DEFINITION,
  clade: CLADE_ACTIVITY_SEED_PANEL_DEFINITION,
  cladeToSpeciesPersistentWindowFraction:
    'For one seed and survival threshold, clade persistentWindowFraction divided by species persistentWindowFraction. Null when the species fraction is zero.',
  persistentWindowFractionDelta:
    'For one seed and survival threshold, clade persistentWindowFraction minus species persistentWindowFraction.',
  cladeToSpeciesPersistentActivityMeanRatio:
    'For one seed and survival threshold, clade postBurnInPersistentNewActivityMean divided by species postBurnInPersistentNewActivityMean. Null when the species mean is zero.',
  persistentActivityMeanDelta:
    'For one seed and survival threshold, clade postBurnInPersistentNewActivityMean minus species postBurnInPersistentNewActivityMean.'
};

export const CLADE_ACTIVITY_RELABEL_NULL_DEFINITION: CladeActivityRelabelNullDefinition = {
  actual: CLADE_ACTIVITY_SEED_PANEL_DEFINITION,
  matchedNull: CLADE_ACTIVITY_SEED_PANEL_DEFINITION,
  matchedSchedule:
    'For each seed and cladogenesis threshold, the pseudo-clade null preserves the observed clade birth count at every firstSeenTick.',
  matchedFounderContext:
    'matchedNullFounderContext=none matches birth ticks only. matchedNullFounderContext=founderHabitatBin also preserves, at each firstSeenTick, the count of founders in each habitat bin derived from founder habitat means. matchedNullFounderContext=founderHabitatAndCrowdingBin additionally preserves the joint founder habitat-bin and local-crowding-bin schedule.',
  relabeling:
    'Pseudo-clade founders are randomly selected from species born at each matched birth tick, and remaining species are randomly reassigned to pseudo-clades that were already active at the prior tick.',
  diagnostics:
    'Diagnostics compare per-seed raw new-clade activity, persistent activity, final population, and final active clade counts so founder suppression can be separated from post-founding persistence loss.',
  dominantLossMode:
    'matchedOrBetter means the actual clades are not behind the matched null on the tracked signals; founderSuppression means the main deficit appears before the persistence filter; persistenceFailure means the persistence filter widens the deficit; activeCladeDeficit means the final active clade count trails the matched null the most.',
  actualToNullPersistentWindowFractionRatio:
    'For one seed and survival threshold, actual clade persistentWindowFraction divided by matched-null persistentWindowFraction. Null when the matched-null fraction is zero.',
  persistentWindowFractionDeltaVsNull:
    'For one seed and survival threshold, actual clade persistentWindowFraction minus matched-null persistentWindowFraction.',
  actualToNullPersistentActivityMeanRatio:
    'For one seed and survival threshold, actual clade postBurnInPersistentNewActivityMean divided by matched-null postBurnInPersistentNewActivityMean. Null when the matched-null mean is zero.',
  persistentActivityMeanDeltaVsNull:
    'For one seed and survival threshold, actual clade postBurnInPersistentNewActivityMean minus matched-null postBurnInPersistentNewActivityMean.'
};

export const CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP_DEFINITION: CladeActivityRelabelNullCladeHabitatCouplingSweepDefinition =
  {
    study: CLADE_ACTIVITY_RELABEL_NULL_DEFINITION,
    cladeHabitatCoupling:
      'Blend weight applied to clade-level habitat preference during movement and harvest. Zero uses only species habitat preference; one applies the full configured clade coupling.',
    birthScheduleMatchedAllSeeds:
      'True when every seed in the coupling row preserved the actual clade birth schedule in the matched pseudo-clade null.',
    actualToNullPersistentWindowFractionRatioMean:
      'Mean across seeds of actualToNullPersistentWindowFractionRatio for the selected survival threshold.',
    persistentWindowFractionDeltaVsNullMean:
      'Mean across seeds of actual persistentWindowFraction minus matched-null persistentWindowFraction for the selected survival threshold.',
    actualToNullPersistentActivityMeanRatioMean:
      'Mean across seeds of actualToNullPersistentActivityMeanRatio for the selected survival threshold.',
    persistentActivityMeanDeltaVsNullMean:
      'Mean across seeds of actual persistent activity mean minus matched-null persistent activity mean for the selected survival threshold.'
  };

export const CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP_DEFINITION: CladeActivityRelabelNullCladeInteractionCouplingSweepDefinition =
  {
    study: CLADE_ACTIVITY_RELABEL_NULL_DEFINITION,
    cladeInteractionCoupling:
      'Blend weight applied to clade-level trophic and defense interaction traits during foraging and encounters. Zero uses only species interaction traits; one applies the full configured clade coupling.',
    birthScheduleMatchedAllSeeds:
      'True when every seed in the coupling row preserved the actual clade birth schedule in the matched pseudo-clade null.',
    actualToNullPersistentWindowFractionRatioMean:
      'Mean across seeds of actualToNullPersistentWindowFractionRatio for the selected survival threshold.',
    persistentWindowFractionDeltaVsNullMean:
      'Mean across seeds of actual persistentWindowFraction minus matched-null persistentWindowFraction for the selected survival threshold.',
    actualToNullPersistentActivityMeanRatioMean:
      'Mean across seeds of actualToNullPersistentActivityMeanRatio for the selected survival threshold.',
    persistentActivityMeanDeltaVsNullMean:
      'Mean across seeds of actual persistent activity mean minus matched-null persistent activity mean for the selected survival threshold.'
  };

export function analyzeSpeciesActivity(input: AnalyzeSpeciesActivityInput): AnalyzeSpeciesActivityResult {
  const analysis = analyzeTaxonActivity({
    taxa: input.species,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.maxTick
  });

  return {
    windows: analysis.windows.map(toSpeciesActivityWindow),
    summary: toSpeciesActivityProbeSummary(analysis.summary)
  };
}

export function analyzeCladeActivity(input: AnalyzeCladeActivityInput): AnalyzeCladeActivityResult {
  const analysis = analyzeTaxonActivity({
    taxa: input.clades,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.maxTick
  });

  return {
    windows: analysis.windows.map(toCladeActivityWindow),
    summary: toCladeActivityProbeSummary(analysis.summary)
  };
}

export function analyzePersistentSpeciesActivity(
  input: AnalyzePersistentSpeciesActivityInput
): AnalyzePersistentSpeciesActivityResult {
  const analysis = analyzePersistentTaxonActivity({
    taxa: input.species,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.maxTick,
    minSurvivalTicks: input.minSurvivalTicks
  });

  return {
    windows: analysis.windows.map(toSpeciesActivityPersistenceWindow),
    summary: toSpeciesActivityPersistenceSummary(analysis.summary)
  };
}

export function analyzePersistentCladeActivity(
  input: AnalyzePersistentCladeActivityInput
): AnalyzePersistentCladeActivityResult {
  const analysis = analyzePersistentTaxonActivity({
    taxa: input.clades,
    windowSize: input.windowSize,
    burnIn: input.burnIn,
    maxTick: input.maxTick,
    minSurvivalTicks: input.minSurvivalTicks
  });

  return {
    windows: analysis.windows.map(toCladeActivityPersistenceWindow),
    summary: toCladeActivityPersistenceSummary(analysis.summary)
  };
}

export function runSpeciesActivityProbe(input: RunSpeciesActivityProbeInput): SpeciesActivityProbeExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seed = toInteger('seed', input.seed);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;
  const { simulation, finalSummary } = executeActivitySimulation({
    steps,
    seed,
    stopWhenExtinct,
    simulation: input.simulation,
    emptyRunError: 'Species activity probe produced no step data'
  });
  const analysis = analyzeSpeciesActivity({
    species: simulation.history().species,
    windowSize,
    burnIn,
    maxTick: finalSummary.tick
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: SPECIES_ACTIVITY_PROBE_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct
    },
    finalSummary,
    windows: analysis.windows,
    summary: analysis.summary
  };
}

export function runSpeciesActivityPersistenceSweep(
  input: RunSpeciesActivityPersistenceSweepInput
): SpeciesActivityPersistenceSweepExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seed = toInteger('seed', input.seed);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;
  const { simulation, finalSummary } = executeActivitySimulation({
    steps,
    seed,
    stopWhenExtinct,
    simulation: input.simulation,
    emptyRunError: 'Species activity persistence sweep produced no step data'
  });
  const species = simulation.history().species;
  const rawAnalysis = analyzeSpeciesActivity({
    species,
    windowSize,
    burnIn,
    maxTick: finalSummary.tick
  });
  const thresholds: SpeciesActivityPersistenceThresholdResult[] = minSurvivalTicks.map((threshold) => ({
    minSurvivalTicks: threshold,
    ...analyzePersistentSpeciesActivity({
      species,
      windowSize,
      burnIn,
      maxTick: finalSummary.tick,
      minSurvivalTicks: threshold
    })
  }));

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: SPECIES_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct,
      minSurvivalTicks
    },
    finalSummary,
    rawSummary: rawAnalysis.summary,
    thresholds
  };
}

export function runCladeActivityPersistenceSweep(
  input: RunCladeActivityPersistenceSweepInput
): CladeActivityPersistenceSweepExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seed = toInteger('seed', input.seed);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;
  const { simulation, finalSummary } = executeActivitySimulation({
    steps,
    seed,
    stopWhenExtinct,
    simulation: input.simulation,
    emptyRunError: 'Clade activity persistence sweep produced no step data'
  });
  const clades = simulation.history().clades;
  const rawAnalysis = analyzeCladeActivity({
    clades,
    windowSize,
    burnIn,
    maxTick: finalSummary.tick
  });
  const thresholds: CladeActivityPersistenceThresholdResult[] = minSurvivalTicks.map((threshold) => ({
    minSurvivalTicks: threshold,
    ...analyzePersistentCladeActivity({
      clades,
      windowSize,
      burnIn,
      maxTick: finalSummary.tick,
      minSurvivalTicks: threshold
    })
  }));

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_PERSISTENCE_SWEEP_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct,
      minSurvivalTicks
    },
    finalSummary,
    rawSummary: rawAnalysis.summary,
    thresholds
  };
}

export function runSpeciesActivitySeedPanel(input: RunSpeciesActivitySeedPanelInput): SpeciesActivitySeedPanelExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;

  const seedResults: SpeciesActivitySeedPanelSeedResult[] = seeds.map((seed) => {
    const { simulation, finalSummary } = executeActivitySimulation({
      steps,
      seed,
      stopWhenExtinct,
      simulation: input.simulation,
      emptyRunError: 'Species activity seed panel produced no step data'
    });

    return buildSpeciesActivitySeedPanelSeedResult({
      seed,
      finalSummary,
      history: simulation.history(),
      windowSize,
      burnIn,
      minSurvivalTicks
    }, {
      analyzeSpeciesActivitySummary: (analysisInput) => analyzeSpeciesActivity(analysisInput).summary,
      analyzePersistentSpeciesActivitySummary: (analysisInput) =>
        analyzePersistentSpeciesActivity(analysisInput).summary
    });
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: SPECIES_ACTIVITY_SEED_PANEL_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks
    },
    seedResults,
    aggregates: minSurvivalTicks.map((threshold) => buildActivitySeedPanelThresholdAggregate(threshold, seedResults))
  };
}

export function runCladeActivitySeedPanel(input: RunCladeActivitySeedPanelInput): CladeActivitySeedPanelExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;

  const seedResults: CladeActivitySeedPanelSeedResult[] = seeds.map((seed) => {
    const { simulation, finalSummary } = executeActivitySimulation({
      steps,
      seed,
      stopWhenExtinct,
      simulation: input.simulation,
      emptyRunError: 'Clade activity seed panel produced no step data'
    });

    return buildCladeActivitySeedPanelSeedResult({
      seed,
      finalSummary,
      history: simulation.history(),
      windowSize,
      burnIn,
      minSurvivalTicks
    }, {
      analyzeCladeActivitySummary: (analysisInput) => analyzeCladeActivity(analysisInput).summary,
      analyzePersistentCladeActivitySummary: (analysisInput) =>
        analyzePersistentCladeActivity(analysisInput).summary
    });
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_SEED_PANEL_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks
    },
    seedResults,
    aggregates: minSurvivalTicks.map((threshold) => buildActivitySeedPanelThresholdAggregate(threshold, seedResults))
  };
}

export function runCladeActivityCladogenesisSweep(
  input: RunCladeActivityCladogenesisSweepInput
): CladeActivityCladogenesisSweepExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const cladogenesisThresholds = toUniqueFiniteNumberList('cladogenesisThresholds', input.cladogenesisThresholds);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;

  const thresholdResults: CladeActivityCladogenesisSweepThresholdResult[] = cladogenesisThresholds.map(
    (cladogenesisThreshold) => {
      const seedResults: CladeActivityCladogenesisSweepSeedResult[] = seeds.map((seed) => {
        const { simulation, finalSummary } = executeActivitySimulation({
          steps,
          seed,
          stopWhenExtinct,
          simulation: withCladogenesisThreshold(input.simulation, cladogenesisThreshold),
          emptyRunError: 'Clade activity cladogenesis sweep produced no step data'
        });
        return buildCladeActivityCladogenesisSeedResult({
          seed,
          finalSummary,
          history: simulation.history(),
          windowSize,
          burnIn,
          minSurvivalTicks
        }, {
          analyzeCladeActivitySummary: (analysisInput) => analyzeCladeActivity(analysisInput).summary,
          analyzePersistentCladeActivitySummary: (analysisInput) =>
            analyzePersistentCladeActivity(analysisInput).summary
        });
      });

      return {
        cladogenesisThreshold,
        seedResults,
        activityAggregates: minSurvivalTicks.map((threshold) =>
          buildActivitySeedPanelThresholdAggregate(threshold, seedResults)
        ),
        countAggregates: buildCladeSpeciesCountAggregate(seedResults)
      };
    }
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_CLADOGENESIS_SWEEP_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThresholds
    },
    thresholdResults
  };
}

export function runCladeActivityCladogenesisHorizonSweep(
  input: RunCladeActivityCladogenesisHorizonSweepInput
): CladeActivityCladogenesisHorizonSweepExport {
  const stepCounts = toPositiveIntList('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds);
  const minSurvivalTicks = toNonNegativeIntList('minSurvivalTicks', input.minSurvivalTicks);
  const cladogenesisThresholds = toUniqueFiniteNumberList('cladogenesisThresholds', input.cladogenesisThresholds);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;
  const maxSteps = max(stepCounts);
  const thresholdRuns = cladogenesisThresholds.map((cladogenesisThreshold) => ({
    cladogenesisThreshold,
    seedRuns: seeds.map((seed) => {
      const { simulation, summaries } = executeActivitySimulation({
        steps: maxSteps,
        seed,
        stopWhenExtinct,
        simulation: withCladogenesisThreshold(input.simulation, cladogenesisThreshold),
        emptyRunError: 'Clade activity cladogenesis horizon sweep produced no step data'
      });

      return {
        seed,
        summaries,
        history: simulation.history()
      };
    })
  }));

  const horizons: CladeActivityCladogenesisHorizonSweepPoint[] = stepCounts.map((steps) => ({
    steps,
    thresholdResults: thresholdRuns.map(({ cladogenesisThreshold, seedRuns }) => {
      const seedResults = seedRuns.map((seedRun) => {
        const finalSummary =
          seedRun.summaries[Math.min(steps, seedRun.summaries.length) - 1] ??
          seedRun.summaries[seedRun.summaries.length - 1];
        if (!finalSummary) {
          throw new Error('Clade activity cladogenesis horizon sweep produced no step data');
        }

        return buildCladeActivityCladogenesisSeedResult({
          seed: seedRun.seed,
          finalSummary,
          history: truncateEvolutionHistory(seedRun.history, finalSummary.tick),
          windowSize,
          burnIn,
          minSurvivalTicks
        }, {
          analyzeCladeActivitySummary: (analysisInput) => analyzeCladeActivity(analysisInput).summary,
          analyzePersistentCladeActivitySummary: (analysisInput) =>
            analyzePersistentCladeActivity(analysisInput).summary
        });
      });

      return {
        cladogenesisThreshold,
        seedResults,
        activityAggregates: minSurvivalTicks.map((threshold) =>
          buildActivitySeedPanelThresholdAggregate(threshold, seedResults)
        ),
        countAggregates: buildCladeSpeciesCountAggregate(seedResults)
      };
    })
  }));

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_CLADOGENESIS_SWEEP_DEFINITION,
    config: {
      steps: stepCounts,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThresholds
    },
    horizons
  };
}

export function runCladeActivityCoarseThresholdBoundaryStudy(
  input: RunCladeActivityCoarseThresholdBoundaryStudyInput = {}
): CladeActivityCladogenesisSweepExport {
  return runCladeActivityCladogenesisSweep({
    steps: input.steps ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.steps,
    windowSize: input.windowSize ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.windowSize,
    burnIn: input.burnIn ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.burnIn,
    seeds: [...(input.seeds ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.seeds)],
    stopWhenExtinct:
      input.stopWhenExtinct ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.stopWhenExtinct,
    minSurvivalTicks: [
      ...(input.minSurvivalTicks ?? DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.minSurvivalTicks)
    ],
    cladogenesisThresholds: [
      ...(input.cladogenesisThresholds ??
        DEFAULT_CLADE_ACTIVITY_COARSE_THRESHOLD_BOUNDARY_STUDY.cladogenesisThresholds)
    ],
    simulation: input.simulation,
    generatedAt: input.generatedAt
  });
}

export function runCladeActivityCladogenesisHorizonStudy(
  input: RunCladeActivityCladogenesisHorizonStudyInput = {}
): CladeActivityCladogenesisHorizonSweepExport {
  return runCladeActivityCladogenesisHorizonSweep({
    steps: [...(input.steps ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.steps)],
    windowSize: input.windowSize ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.windowSize,
    burnIn: input.burnIn ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.burnIn,
    seeds: [...(input.seeds ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.seeds)],
    stopWhenExtinct: input.stopWhenExtinct ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.stopWhenExtinct,
    minSurvivalTicks: [
      ...(input.minSurvivalTicks ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.minSurvivalTicks)
    ],
    cladogenesisThresholds: [
      ...(input.cladogenesisThresholds ?? DEFAULT_CLADE_ACTIVITY_CLADOGENESIS_HORIZON_STUDY.cladogenesisThresholds)
    ],
    simulation: input.simulation,
    generatedAt: input.generatedAt
  });
}

export function runCladeSpeciesActivityCouplingStudy(
  input: RunCladeSpeciesActivityCouplingStudyInput = {}
): CladeSpeciesActivityCouplingExport {
  const steps = toPositiveInt('steps', input.steps ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.steps);
  const windowSize = toPositiveInt(
    'windowSize',
    input.windowSize ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.windowSize
  );
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.seeds);
  const minSurvivalTicks = toNonNegativeIntList(
    'minSurvivalTicks',
    input.minSurvivalTicks ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.minSurvivalTicks
  );
  const cladogenesisThresholds = toUniqueFiniteNumberList(
    'cladogenesisThresholds',
    input.cladogenesisThresholds ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.cladogenesisThresholds
  );
  const stopWhenExtinct = input.stopWhenExtinct ?? DEFAULT_CLADE_SPECIES_ACTIVITY_COUPLING_STUDY.stopWhenExtinct;

  const thresholdResults: CladeSpeciesActivityCouplingThresholdResult[] = cladogenesisThresholds.map(
    (cladogenesisThreshold) => {
      const seedResults = seeds.map((seed) => {
        const { simulation, finalSummary } = executeActivitySimulation({
          steps,
          seed,
          stopWhenExtinct,
          simulation: withCladogenesisThreshold(input.simulation, cladogenesisThreshold),
          emptyRunError: 'Clade/species activity coupling study produced no step data'
        });

        return buildCladeSpeciesActivityCouplingSeedResult({
          seed,
          finalSummary,
          history: simulation.history(),
          windowSize,
          burnIn,
          minSurvivalTicks
        }, {
          analyzeSpeciesActivitySummary: (analysisInput) => analyzeSpeciesActivity(analysisInput).summary,
          analyzePersistentSpeciesActivitySummary: (analysisInput) =>
            analyzePersistentSpeciesActivity(analysisInput).summary,
          analyzeCladeActivitySummary: (analysisInput) => analyzeCladeActivity(analysisInput).summary,
          analyzePersistentCladeActivitySummary: (analysisInput) =>
            analyzePersistentCladeActivity(analysisInput).summary
        });
      });

      return {
        cladogenesisThreshold,
        seedResults,
        aggregates: minSurvivalTicks.map((threshold) =>
          buildCladeSpeciesActivityCouplingThresholdAggregate(threshold, seedResults)
        )
      };
    }
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_SPECIES_ACTIVITY_COUPLING_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThresholds
    },
    thresholdResults
  };
}

export function runCladeActivityRelabelNullStudy(
  input: RunCladeActivityRelabelNullStudyInput = {}
): CladeActivityRelabelNullStudyExport {
  const steps = toPositiveInt('steps', input.steps ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.steps);
  const windowSize = toPositiveInt(
    'windowSize',
    input.windowSize ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.windowSize
  );
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.burnIn);
  const seeds = toUniqueIntegerList('seeds', input.seeds ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.seeds);
  const minSurvivalTicks = toNonNegativeIntList(
    'minSurvivalTicks',
    input.minSurvivalTicks ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.minSurvivalTicks
  );
  const cladogenesisThresholds = toUniqueFiniteNumberList(
    'cladogenesisThresholds',
    input.cladogenesisThresholds ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.cladogenesisThresholds
  );
  const stopWhenExtinct = input.stopWhenExtinct ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.stopWhenExtinct;
  const matchedNullFounderContext = resolveMatchedNullFounderContext(
    input.matchedNullFounderContext ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.matchedNullFounderContext
  );
  const thresholdResults: CladeActivityRelabelNullThresholdResult[] = buildCladeActivityRelabelNullThresholdResults(
    {
      steps,
      windowSize,
      burnIn,
      seeds,
      minSurvivalTicks,
      cladogenesisThresholds,
      stopWhenExtinct,
      simulation: input.simulation,
      matchedNullFounderContext
    },
    {
      runSimulation: ({ steps, seed, stopWhenExtinct, simulation, emptyRunError }) => {
        const { simulation: resultSimulation, finalSummary } = executeActivitySimulation({
          steps,
          seed,
          stopWhenExtinct,
          simulation,
          emptyRunError
        });

        return {
          history: resultSimulation.history(),
          finalSummary
        };
      },
      analyzeCladeActivitySummary: (analysisInput) => analyzeCladeActivity(analysisInput).summary,
      analyzeSpeciesActivitySummary: (analysisInput) => analyzeSpeciesActivity(analysisInput).summary,
      analyzePersistentCladeActivitySummary: (analysisInput) =>
        analyzePersistentCladeActivity(analysisInput).summary,
      analyzePersistentSpeciesActivitySummary: (analysisInput) =>
        analyzePersistentSpeciesActivity(analysisInput).summary,
      withCladogenesisThreshold
    }
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_RELABEL_NULL_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThresholds,
      matchedNullFounderContext
    },
    thresholdResults
  };
}

export function runCladeActivityRelabelNullCladeHabitatCouplingSweep(
  input: RunCladeActivityRelabelNullCladeHabitatCouplingSweepInput = {}
): CladeActivityRelabelNullCladeHabitatCouplingSweepExport {
  const steps = toPositiveInt(
    'steps',
    input.steps ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.steps
  );
  const windowSize = toPositiveInt(
    'windowSize',
    input.windowSize ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.windowSize
  );
  const burnIn = toNonNegativeInt(
    'burnIn',
    input.burnIn ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.burnIn
  );
  const seeds = toUniqueIntegerList(
    'seeds',
    input.seeds ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.seeds
  );
  const stopWhenExtinct =
    input.stopWhenExtinct ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.stopWhenExtinct;
  const minSurvivalTicks = toNonNegativeInt(
    'minSurvivalTicks',
    input.minSurvivalTicks ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.minSurvivalTicks
  );
  const cladogenesisThreshold = toFiniteNumber(
    'cladogenesisThreshold',
    input.cladogenesisThreshold ??
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladogenesisThreshold
  );
  const cladeHabitatCouplingValues = toUniqueFiniteNumberList(
    'cladeHabitatCouplingValues',
    input.cladeHabitatCouplingValues ??
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP.cladeHabitatCouplingValues
  );

  const results: CladeActivityRelabelNullCladeHabitatCouplingSweepResult[] = cladeHabitatCouplingValues.map(
    (cladeHabitatCoupling) =>
      buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult({
        cladeHabitatCoupling,
        thresholdResults: runCladeActivityRelabelNullStudy({
          steps,
          windowSize,
          burnIn,
          seeds,
          stopWhenExtinct,
          minSurvivalTicks: [minSurvivalTicks],
          cladogenesisThresholds: [cladogenesisThreshold],
          simulation: withCladeHabitatCoupling(input.simulation, cladeHabitatCoupling),
          generatedAt: input.generatedAt
        }).thresholdResults
      })
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_RELABEL_NULL_CLADE_HABITAT_COUPLING_SWEEP_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThreshold,
      cladeHabitatCouplingValues
    },
    results
  };
}

export function runCladeActivityRelabelNullCladeInteractionCouplingSweep(
  input: RunCladeActivityRelabelNullCladeInteractionCouplingSweepInput = {}
): CladeActivityRelabelNullCladeInteractionCouplingSweepExport {
  const steps = toPositiveInt(
    'steps',
    input.steps ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.steps
  );
  const windowSize = toPositiveInt(
    'windowSize',
    input.windowSize ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.windowSize
  );
  const burnIn = toNonNegativeInt(
    'burnIn',
    input.burnIn ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.burnIn
  );
  const seeds = toUniqueIntegerList(
    'seeds',
    input.seeds ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.seeds
  );
  const stopWhenExtinct =
    input.stopWhenExtinct ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.stopWhenExtinct;
  const minSurvivalTicks = toNonNegativeInt(
    'minSurvivalTicks',
    input.minSurvivalTicks ?? DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.minSurvivalTicks
  );
  const cladogenesisThreshold = toFiniteNumber(
    'cladogenesisThreshold',
    input.cladogenesisThreshold ??
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladogenesisThreshold
  );
  const cladeInteractionCouplingValues = toUniqueFiniteNumberList(
    'cladeInteractionCouplingValues',
    input.cladeInteractionCouplingValues ??
      DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP.cladeInteractionCouplingValues
  );

  const results: CladeActivityRelabelNullCladeInteractionCouplingSweepResult[] = cladeInteractionCouplingValues.map(
    (cladeInteractionCoupling) =>
      buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult({
        cladeInteractionCoupling,
        thresholdResults: runCladeActivityRelabelNullStudy({
          steps,
          windowSize,
          burnIn,
          seeds,
          stopWhenExtinct,
          minSurvivalTicks: [minSurvivalTicks],
          cladogenesisThresholds: [cladogenesisThreshold],
          simulation: withCladeInteractionCoupling(input.simulation, cladeInteractionCoupling),
          generatedAt: input.generatedAt
        }).thresholdResults
      })
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: CLADE_ACTIVITY_RELABEL_NULL_CLADE_INTERACTION_COUPLING_SWEEP_DEFINITION,
    config: {
      steps,
      windowSize,
      burnIn,
      seeds,
      stopWhenExtinct,
      minSurvivalTicks,
      cladogenesisThreshold,
      cladeInteractionCouplingValues
    },
    results
  };
}

export function runSpeciesActivityHorizonSweep(
  input: RunSpeciesActivityHorizonSweepInput
): SpeciesActivityHorizonSweepExport {
  const stepCounts = toPositiveIntList('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seed = toInteger('seed', input.seed);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;

  const horizons: SpeciesActivityHorizonSweepPoint[] = stepCounts.map((steps) => {
    const probe = runSpeciesActivityProbe({
      ...input,
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct
    });

    return {
      steps,
      ...probe.summary
    };
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    definition: SPECIES_ACTIVITY_PROBE_DEFINITION,
    config: {
      steps: stepCounts,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct
    },
    horizons
  };
}

function analyzeTaxonActivity(input: AnalyzeTaxonActivityInput): AnalyzeTaxonActivityResult {
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? 0);
  const maxTick = toNonNegativeInt('maxTick', input.maxTick);
  const context = collectTaxonActivityContext(input.taxa, windowSize, maxTick);
  const newActivityByWindow = new Map<number, number>();
  const newTaxaByWindow = new Map<number, number>();

  for (const contribution of context.contributions) {
    newActivityByWindow.set(
      contribution.windowIndex,
      (newActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
    );
    newTaxaByWindow.set(contribution.windowIndex, (newTaxaByWindow.get(contribution.windowIndex) ?? 0) + 1);
  }

  const cumulativeActivityByTick = buildCumulativeActivityByTick(context.activeTaxaByTick);
  const windows: TaxonActivityWindowData[] = [];
  for (let startTick = 1, windowIndex = 0; startTick <= maxTick; startTick += windowSize, windowIndex += 1) {
    const endTick = Math.min(maxTick, startTick + windowSize - 1);
    const cumulativeActivity = cumulativeActivityByTick[endTick];
    windows.push({
      windowIndex,
      startTick,
      endTick,
      size: endTick - startTick + 1,
      postBurnIn: startTick > burnIn,
      newTaxa: newTaxaByWindow.get(windowIndex) ?? 0,
      cumulativeActivity,
      normalizedCumulativeActivity: cumulativeActivity / endTick,
      newActivity: newActivityByWindow.get(windowIndex) ?? 0
    });
  }

  return {
    windows,
    summary: buildTaxonActivitySummary(input.taxa.length, maxTick, windows)
  };
}

function analyzePersistentTaxonActivity(
  input: AnalyzePersistentTaxonActivityInput
): AnalyzePersistentTaxonActivityResult {
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? 0);
  const maxTick = toNonNegativeInt('maxTick', input.maxTick);
  const minSurvivalTicks = toNonNegativeInt('minSurvivalTicks', input.minSurvivalTicks);
  const context = collectTaxonActivityContext(input.taxa, windowSize, maxTick);
  const rawNewActivityByWindow = new Map<number, number>();
  const newTaxaByWindow = new Map<number, number>();
  const persistentNewActivityByWindow = new Map<number, number>();
  const persistentNewTaxaByWindow = new Map<number, number>();

  for (const contribution of context.contributions) {
    rawNewActivityByWindow.set(
      contribution.windowIndex,
      (rawNewActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
    );
    newTaxaByWindow.set(contribution.windowIndex, (newTaxaByWindow.get(contribution.windowIndex) ?? 0) + 1);

    if (contribution.observedLifetime >= minSurvivalTicks) {
      persistentNewActivityByWindow.set(
        contribution.windowIndex,
        (persistentNewActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
      );
      persistentNewTaxaByWindow.set(
        contribution.windowIndex,
        (persistentNewTaxaByWindow.get(contribution.windowIndex) ?? 0) + 1
      );
    }
  }

  const windows: TaxonActivityPersistenceWindowData[] = [];
  for (let startTick = 1, windowIndex = 0; startTick <= maxTick; startTick += windowSize, windowIndex += 1) {
    const endTick = Math.min(maxTick, startTick + windowSize - 1);
    const censored = endTick + minSurvivalTicks > maxTick;
    windows.push({
      windowIndex,
      startTick,
      endTick,
      size: endTick - startTick + 1,
      postBurnIn: startTick > burnIn,
      censored,
      newTaxa: newTaxaByWindow.get(windowIndex) ?? 0,
      rawNewActivity: rawNewActivityByWindow.get(windowIndex) ?? 0,
      persistentNewTaxa: censored ? null : persistentNewTaxaByWindow.get(windowIndex) ?? 0,
      persistentNewActivity: censored ? null : persistentNewActivityByWindow.get(windowIndex) ?? 0
    });
  }

  return {
    windows,
    summary: buildTaxonActivityPersistenceSummary(minSurvivalTicks, windows)
  };
}

function executeActivitySimulation(input: RunActivitySimulationInput): {
  simulation: LifeSimulation;
  summaries: StepSummary[];
  finalSummary: StepSummary;
} {
  const simulation = new LifeSimulation({
    ...input.simulation,
    seed: input.seed
  });
  const summaries: StepSummary[] = [];

  for (let step = 0; step < input.steps; step += 1) {
    const summary = simulation.step();
    summaries.push(summary);
    if (input.stopWhenExtinct && summary.population === 0) {
      break;
    }
  }

  const finalSummary = summaries[summaries.length - 1];
  if (!finalSummary) {
    throw new Error(input.emptyRunError);
  }

  return {
    simulation,
    summaries,
    finalSummary
  };
}

function buildTaxonActivitySummary(
  totalTaxa: number,
  stepsExecuted: number,
  windows: TaxonActivityWindowData[]
): TaxonActivityProbeSummaryData {
  const postBurnInWindows = windows.filter((window) => window.postBurnIn);
  const postBurnInNewActivity = postBurnInWindows.map((window) => window.newActivity);
  const finalWindow = windows[windows.length - 1];

  return {
    stepsExecuted,
    totalTaxa,
    postBurnInWindows: postBurnInWindows.length,
    postBurnInWindowsWithNewActivity: postBurnInWindows.filter((window) => window.newActivity > 0).length,
    postBurnInNewTaxa: postBurnInWindows.reduce((total, window) => total + window.newTaxa, 0),
    postBurnInNewActivityMean: mean(postBurnInNewActivity),
    postBurnInNewActivityMin: min(postBurnInNewActivity),
    postBurnInNewActivityMax: max(postBurnInNewActivity),
    finalCumulativeActivity: finalWindow?.cumulativeActivity ?? 0,
    finalNormalizedCumulativeActivity: finalWindow?.normalizedCumulativeActivity ?? 0,
    finalNewActivity: finalWindow?.newActivity ?? 0
  };
}

function buildTaxonActivityPersistenceSummary(
  minSurvivalTicks: number,
  windows: TaxonActivityPersistenceWindowData[]
): TaxonActivityPersistenceSummaryData {
  const postBurnInWindows = windows.filter((window) => window.postBurnIn);
  const evaluablePostBurnInWindows = postBurnInWindows.filter((window) => !window.censored);
  const postBurnInPersistentNewActivity = evaluablePostBurnInWindows.map(
    (window) => window.persistentNewActivity ?? 0
  );
  const finalWindow = windows[windows.length - 1];

  return {
    minSurvivalTicks,
    postBurnInWindows: postBurnInWindows.length,
    censoredPostBurnInWindows: postBurnInWindows.filter((window) => window.censored).length,
    evaluablePostBurnInWindows: evaluablePostBurnInWindows.length,
    postBurnInWindowsWithPersistentNewActivity: evaluablePostBurnInWindows.filter(
      (window) => (window.persistentNewActivity ?? 0) > 0
    ).length,
    postBurnInPersistentNewTaxa: evaluablePostBurnInWindows.reduce(
      (total, window) => total + (window.persistentNewTaxa ?? 0),
      0
    ),
    postBurnInPersistentNewActivityMean: mean(postBurnInPersistentNewActivity),
    postBurnInPersistentNewActivityMin: min(postBurnInPersistentNewActivity),
    postBurnInPersistentNewActivityMax: max(postBurnInPersistentNewActivity),
    finalPersistentNewActivity: finalWindow?.censored ? null : finalWindow?.persistentNewActivity ?? 0,
    finalWindowCensored: finalWindow?.censored ?? false
  };
}

function toSpeciesActivityWindow(window: TaxonActivityWindowData): SpeciesActivityWindow {
  return {
    windowIndex: window.windowIndex,
    startTick: window.startTick,
    endTick: window.endTick,
    size: window.size,
    postBurnIn: window.postBurnIn,
    newSpecies: window.newTaxa,
    cumulativeActivity: window.cumulativeActivity,
    normalizedCumulativeActivity: window.normalizedCumulativeActivity,
    newActivity: window.newActivity
  };
}

function toCladeActivityWindow(window: TaxonActivityWindowData): CladeActivityWindow {
  return {
    windowIndex: window.windowIndex,
    startTick: window.startTick,
    endTick: window.endTick,
    size: window.size,
    postBurnIn: window.postBurnIn,
    newClades: window.newTaxa,
    cumulativeActivity: window.cumulativeActivity,
    normalizedCumulativeActivity: window.normalizedCumulativeActivity,
    newActivity: window.newActivity
  };
}

function toSpeciesActivityProbeSummary(summary: TaxonActivityProbeSummaryData): SpeciesActivityProbeSummary {
  return {
    stepsExecuted: summary.stepsExecuted,
    totalSpecies: summary.totalTaxa,
    postBurnInWindows: summary.postBurnInWindows,
    postBurnInWindowsWithNewActivity: summary.postBurnInWindowsWithNewActivity,
    postBurnInNewSpecies: summary.postBurnInNewTaxa,
    postBurnInNewActivityMean: summary.postBurnInNewActivityMean,
    postBurnInNewActivityMin: summary.postBurnInNewActivityMin,
    postBurnInNewActivityMax: summary.postBurnInNewActivityMax,
    finalCumulativeActivity: summary.finalCumulativeActivity,
    finalNormalizedCumulativeActivity: summary.finalNormalizedCumulativeActivity,
    finalNewActivity: summary.finalNewActivity
  };
}

function toCladeActivityProbeSummary(summary: TaxonActivityProbeSummaryData): CladeActivityProbeSummary {
  return {
    stepsExecuted: summary.stepsExecuted,
    totalClades: summary.totalTaxa,
    postBurnInWindows: summary.postBurnInWindows,
    postBurnInWindowsWithNewActivity: summary.postBurnInWindowsWithNewActivity,
    postBurnInNewClades: summary.postBurnInNewTaxa,
    postBurnInNewActivityMean: summary.postBurnInNewActivityMean,
    postBurnInNewActivityMin: summary.postBurnInNewActivityMin,
    postBurnInNewActivityMax: summary.postBurnInNewActivityMax,
    finalCumulativeActivity: summary.finalCumulativeActivity,
    finalNormalizedCumulativeActivity: summary.finalNormalizedCumulativeActivity,
    finalNewActivity: summary.finalNewActivity
  };
}

function toSpeciesActivityPersistenceWindow(
  window: TaxonActivityPersistenceWindowData
): SpeciesActivityPersistenceWindow {
  return {
    windowIndex: window.windowIndex,
    startTick: window.startTick,
    endTick: window.endTick,
    size: window.size,
    postBurnIn: window.postBurnIn,
    censored: window.censored,
    newSpecies: window.newTaxa,
    rawNewActivity: window.rawNewActivity,
    persistentNewSpecies: window.persistentNewTaxa,
    persistentNewActivity: window.persistentNewActivity
  };
}

function toCladeActivityPersistenceWindow(
  window: TaxonActivityPersistenceWindowData
): CladeActivityPersistenceWindow {
  return {
    windowIndex: window.windowIndex,
    startTick: window.startTick,
    endTick: window.endTick,
    size: window.size,
    postBurnIn: window.postBurnIn,
    censored: window.censored,
    newClades: window.newTaxa,
    rawNewActivity: window.rawNewActivity,
    persistentNewClades: window.persistentNewTaxa,
    persistentNewActivity: window.persistentNewActivity
  };
}

function toSpeciesActivityPersistenceSummary(
  summary: TaxonActivityPersistenceSummaryData
): SpeciesActivityPersistenceSummary {
  return {
    minSurvivalTicks: summary.minSurvivalTicks,
    postBurnInWindows: summary.postBurnInWindows,
    censoredPostBurnInWindows: summary.censoredPostBurnInWindows,
    evaluablePostBurnInWindows: summary.evaluablePostBurnInWindows,
    postBurnInWindowsWithPersistentNewActivity: summary.postBurnInWindowsWithPersistentNewActivity,
    postBurnInPersistentNewSpecies: summary.postBurnInPersistentNewTaxa,
    postBurnInPersistentNewActivityMean: summary.postBurnInPersistentNewActivityMean,
    postBurnInPersistentNewActivityMin: summary.postBurnInPersistentNewActivityMin,
    postBurnInPersistentNewActivityMax: summary.postBurnInPersistentNewActivityMax,
    finalPersistentNewActivity: summary.finalPersistentNewActivity,
    finalWindowCensored: summary.finalWindowCensored
  };
}

function toCladeActivityPersistenceSummary(
  summary: TaxonActivityPersistenceSummaryData
): CladeActivityPersistenceSummary {
  return {
    minSurvivalTicks: summary.minSurvivalTicks,
    postBurnInWindows: summary.postBurnInWindows,
    censoredPostBurnInWindows: summary.censoredPostBurnInWindows,
    evaluablePostBurnInWindows: summary.evaluablePostBurnInWindows,
    postBurnInWindowsWithPersistentNewActivity: summary.postBurnInWindowsWithPersistentNewActivity,
    postBurnInPersistentNewClades: summary.postBurnInPersistentNewTaxa,
    postBurnInPersistentNewActivityMean: summary.postBurnInPersistentNewActivityMean,
    postBurnInPersistentNewActivityMin: summary.postBurnInPersistentNewActivityMin,
    postBurnInPersistentNewActivityMax: summary.postBurnInPersistentNewActivityMax,
    finalPersistentNewActivity: summary.finalPersistentNewActivity,
    finalWindowCensored: summary.finalWindowCensored
  };
}

function withCladogenesisThreshold(
  simulation: Omit<LifeSimulationOptions, 'seed'> | undefined,
  cladogenesisThreshold: number
): Omit<LifeSimulationOptions, 'seed'> {
  return {
    ...simulation,
    config: {
      ...simulation?.config,
      cladogenesisThreshold
    }
  };
}

function withCladeHabitatCoupling(
  simulation: Omit<LifeSimulationOptions, 'seed'> | undefined,
  cladeHabitatCoupling: number
): Omit<LifeSimulationOptions, 'seed'> {
  return {
    ...simulation,
    config: {
      ...simulation?.config,
      cladeHabitatCoupling
    }
  };
}

function withCladeInteractionCoupling(
  simulation: Omit<LifeSimulationOptions, 'seed'> | undefined,
  cladeInteractionCoupling: number
): Omit<LifeSimulationOptions, 'seed'> {
  return {
    ...simulation,
    config: {
      ...simulation?.config,
      cladeInteractionCoupling
    }
  };
}

function collectTaxonActivityContext(taxa: TaxonHistory[], windowSize: number, maxTick: number): TaxonActivityContext {
  const activeTaxaByTick = Array.from({ length: maxTick + 1 }, () => 0);
  const contributions: TaxonWindowContribution[] = [];

  for (const taxonHistory of taxa) {
    for (const point of taxonHistory.timeline) {
      if (point.tick < 1 || point.tick > maxTick || point.population <= 0) {
        continue;
      }
      activeTaxaByTick[point.tick] += 1;
    }

    if (taxonHistory.firstSeenTick < 1 || taxonHistory.firstSeenTick > maxTick) {
      continue;
    }

    const windowIndex = Math.floor((taxonHistory.firstSeenTick - 1) / windowSize);
    const windowStart = windowIndex * windowSize + 1;
    const windowEnd = Math.min(maxTick, windowStart + windowSize - 1);
    let activityInOriginWindow = 0;

    for (const point of taxonHistory.timeline) {
      if (point.tick < windowStart || point.tick > windowEnd || point.population <= 0) {
        continue;
      }
      activityInOriginWindow += 1;
    }

    contributions.push({
      windowIndex,
      activityInOriginWindow,
      observedLifetime: observedLifetime(taxonHistory, maxTick)
    });
  }

  return {
    activeTaxaByTick,
    contributions
  };
}

function buildCumulativeActivityByTick(activeTaxaByTick: number[]): number[] {
  const cumulativeActivityByTick = Array.from({ length: activeTaxaByTick.length }, () => 0);
  for (let tick = 1; tick < activeTaxaByTick.length; tick += 1) {
    cumulativeActivityByTick[tick] = cumulativeActivityByTick[tick - 1] + activeTaxaByTick[tick];
  }
  return cumulativeActivityByTick;
}

function observedLifetime(taxon: TaxonHistory, maxTick: number): number {
  const lastObservedTick = taxon.extinctTick ?? maxTick;
  return Math.max(0, lastObservedTick - taxon.firstSeenTick);
}

function divideOrZero(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

function toPositiveInt(name: string, value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function toPositiveIntList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must contain at least one value`);
  }

  return values.map((value) => {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${name} must contain only positive integers`);
    }
    return value;
  });
}

function toNonNegativeIntList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must contain at least one value`);
  }

  return values.map((value) => {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${name} must contain only non-negative integers`);
    }
    return value;
  });
}

function toUniqueIntegerList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must contain at least one value`);
  }

  const normalized = values.map((value) => {
    if (!Number.isInteger(value)) {
      throw new Error(`${name} must contain only integers`);
    }
    return value;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${name} must not contain duplicates`);
  }

  return normalized;
}

function toUniqueFiniteNumberList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must contain at least one value`);
  }

  const normalized = values.map((value) => {
    if (!Number.isFinite(value)) {
      throw new Error(`${name} must contain only finite numbers`);
    }
    return value;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`${name} must not contain duplicates`);
  }

  return normalized;
}

function toFiniteNumber(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
  return value;
}

function toNonNegativeInt(name: string, value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function toInteger(name: string, value: number): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}
