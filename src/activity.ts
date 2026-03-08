import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
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
  CladeActivityWindow,
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

interface ActivityThresholdSummaryLike {
  evaluablePostBurnInWindows: number;
  postBurnInWindowsWithPersistentNewActivity: number;
  postBurnInPersistentNewActivityMean: number;
}

interface ActivityThresholdLike<TSummary extends ActivityThresholdSummaryLike> {
  minSurvivalTicks: number;
  summary: TSummary;
}

interface ActivitySeedThresholdLike<TSummary extends ActivityThresholdSummaryLike>
  extends ActivityThresholdLike<TSummary> {
  persistentWindowFraction: number;
  allEvaluableWindowsPositive: boolean;
}

interface ActivitySeedResultLike<
  TSummary extends ActivityThresholdSummaryLike,
  TThreshold extends ActivitySeedThresholdLike<TSummary>
> {
  seed: number;
  thresholds: TThreshold[];
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
    const sweep = runSpeciesActivityPersistenceSweep({
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct,
      simulation: input.simulation,
      minSurvivalTicks
    });

    return {
      seed,
      finalSummary: sweep.finalSummary,
      rawSummary: sweep.rawSummary,
      thresholds: sweep.thresholds.map((threshold) => buildActivitySeedPanelThresholdSeedResult(threshold))
    };
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
    const sweep = runCladeActivityPersistenceSweep({
      steps,
      windowSize,
      burnIn,
      seed,
      stopWhenExtinct,
      simulation: input.simulation,
      minSurvivalTicks
    });

    return {
      seed,
      finalSummary: sweep.finalSummary,
      rawSummary: sweep.rawSummary,
      thresholds: sweep.thresholds.map((threshold) => buildActivitySeedPanelThresholdSeedResult(threshold))
    };
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

function buildActivitySeedPanelThresholdSeedResult<TSummary extends ActivityThresholdSummaryLike>(
  threshold: ActivityThresholdLike<TSummary>
): ActivitySeedThresholdLike<TSummary> {
  const evaluableWindows = threshold.summary.evaluablePostBurnInWindows;

  return {
    minSurvivalTicks: threshold.minSurvivalTicks,
    summary: threshold.summary,
    persistentWindowFraction:
      evaluableWindows === 0 ? 0 : threshold.summary.postBurnInWindowsWithPersistentNewActivity / evaluableWindows,
    allEvaluableWindowsPositive:
      evaluableWindows > 0 &&
      threshold.summary.postBurnInWindowsWithPersistentNewActivity === threshold.summary.evaluablePostBurnInWindows
  };
}

function buildActivitySeedPanelThresholdAggregate<
  TSummary extends ActivityThresholdSummaryLike,
  TThreshold extends ActivitySeedThresholdLike<TSummary>,
  TSeedResult extends ActivitySeedResultLike<TSummary, TThreshold>
>(minSurvivalTicks: number, seedResults: TSeedResult[]): {
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
} {
  const thresholdResults = seedResults.map((seedResult) => {
    const threshold = seedResult.thresholds.find((result) => result.minSurvivalTicks === minSurvivalTicks);
    if (!threshold) {
      throw new Error(`Missing threshold ${minSurvivalTicks} for seed ${seedResult.seed}`);
    }
    return threshold;
  });
  const persistentWindowFractions = thresholdResults.map((threshold) => threshold.persistentWindowFraction);
  const persistentActivityMeans = thresholdResults.map(
    (threshold) => threshold.summary.postBurnInPersistentNewActivityMean
  );

  return {
    minSurvivalTicks,
    seeds: thresholdResults.length,
    seedsWithEvaluableWindows: thresholdResults.filter((threshold) => threshold.summary.evaluablePostBurnInWindows > 0)
      .length,
    seedsWithAllEvaluableWindowsPositive: thresholdResults.filter((threshold) => threshold.allEvaluableWindowsPositive)
      .length,
    minPersistentWindowFraction: min(persistentWindowFractions),
    meanPersistentWindowFraction: mean(persistentWindowFractions),
    maxPersistentWindowFraction: max(persistentWindowFractions),
    minPersistentActivityMean: min(persistentActivityMeans),
    meanPersistentActivityMean: mean(persistentActivityMeans),
    maxPersistentActivityMean: max(persistentActivityMeans)
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

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function min(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((lowest, value) => Math.min(lowest, value), values[0]);
}

function max(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((highest, value) => Math.max(highest, value), values[0]);
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
