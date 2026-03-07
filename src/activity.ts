import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
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

export interface AnalyzePersistentSpeciesActivityInput extends AnalyzeSpeciesActivityInput {
  minSurvivalTicks: number;
}

export interface AnalyzePersistentSpeciesActivityResult {
  windows: SpeciesActivityPersistenceWindow[];
  summary: SpeciesActivityPersistenceSummary;
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

interface SpeciesWindowContribution {
  windowIndex: number;
  activityInOriginWindow: number;
  observedLifetime: number;
}

interface SpeciesActivityContext {
  activeSpeciesByTick: number[];
  contributions: SpeciesWindowContribution[];
}

export function analyzeSpeciesActivity(input: AnalyzeSpeciesActivityInput): AnalyzeSpeciesActivityResult {
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? 0);
  const maxTick = toNonNegativeInt('maxTick', input.maxTick);
  const context = collectSpeciesActivityContext(input.species, windowSize, maxTick);
  const newActivityByWindow = new Map<number, number>();
  const newSpeciesByWindow = new Map<number, number>();

  for (const contribution of context.contributions) {
    newActivityByWindow.set(
      contribution.windowIndex,
      (newActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
    );
    newSpeciesByWindow.set(contribution.windowIndex, (newSpeciesByWindow.get(contribution.windowIndex) ?? 0) + 1);
  }

  const cumulativeActivityByTick = buildCumulativeActivityByTick(context.activeSpeciesByTick);

  const windows: SpeciesActivityWindow[] = [];
  for (let startTick = 1, windowIndex = 0; startTick <= maxTick; startTick += windowSize, windowIndex += 1) {
    const endTick = Math.min(maxTick, startTick + windowSize - 1);
    const cumulativeActivity = cumulativeActivityByTick[endTick];
    windows.push({
      windowIndex,
      startTick,
      endTick,
      size: endTick - startTick + 1,
      postBurnIn: startTick > burnIn,
      newSpecies: newSpeciesByWindow.get(windowIndex) ?? 0,
      cumulativeActivity,
      normalizedCumulativeActivity: cumulativeActivity / endTick,
      newActivity: newActivityByWindow.get(windowIndex) ?? 0
    });
  }

  return {
    windows,
    summary: buildSpeciesActivitySummary(input.species.length, maxTick, windows)
  };
}

export function analyzePersistentSpeciesActivity(
  input: AnalyzePersistentSpeciesActivityInput
): AnalyzePersistentSpeciesActivityResult {
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? 0);
  const maxTick = toNonNegativeInt('maxTick', input.maxTick);
  const minSurvivalTicks = toNonNegativeInt('minSurvivalTicks', input.minSurvivalTicks);
  const context = collectSpeciesActivityContext(input.species, windowSize, maxTick);
  const rawNewActivityByWindow = new Map<number, number>();
  const newSpeciesByWindow = new Map<number, number>();
  const persistentNewActivityByWindow = new Map<number, number>();
  const persistentNewSpeciesByWindow = new Map<number, number>();

  for (const contribution of context.contributions) {
    rawNewActivityByWindow.set(
      contribution.windowIndex,
      (rawNewActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
    );
    newSpeciesByWindow.set(contribution.windowIndex, (newSpeciesByWindow.get(contribution.windowIndex) ?? 0) + 1);

    if (contribution.observedLifetime >= minSurvivalTicks) {
      persistentNewActivityByWindow.set(
        contribution.windowIndex,
        (persistentNewActivityByWindow.get(contribution.windowIndex) ?? 0) + contribution.activityInOriginWindow
      );
      persistentNewSpeciesByWindow.set(
        contribution.windowIndex,
        (persistentNewSpeciesByWindow.get(contribution.windowIndex) ?? 0) + 1
      );
    }
  }

  const windows: SpeciesActivityPersistenceWindow[] = [];
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
      newSpecies: newSpeciesByWindow.get(windowIndex) ?? 0,
      rawNewActivity: rawNewActivityByWindow.get(windowIndex) ?? 0,
      persistentNewSpecies: censored ? null : persistentNewSpeciesByWindow.get(windowIndex) ?? 0,
      persistentNewActivity: censored ? null : persistentNewActivityByWindow.get(windowIndex) ?? 0
    });
  }

  return {
    windows,
    summary: buildSpeciesActivityPersistenceSummary(minSurvivalTicks, windows)
  };
}

export function runSpeciesActivityProbe(input: RunSpeciesActivityProbeInput): SpeciesActivityProbeExport {
  const steps = toPositiveInt('steps', input.steps);
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn);
  const seed = toInteger('seed', input.seed);
  const stopWhenExtinct = input.stopWhenExtinct ?? true;
  const simulation = new LifeSimulation({
    ...input.simulation,
    seed
  });
  const summaries: StepSummary[] = [];

  for (let step = 0; step < steps; step += 1) {
    const summary = simulation.step();
    summaries.push(summary);
    if (stopWhenExtinct && summary.population === 0) {
      break;
    }
  }

  const finalSummary = summaries[summaries.length - 1];
  if (!finalSummary) {
    throw new Error('Species activity probe produced no step data');
  }

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
  const simulation = new LifeSimulation({
    ...input.simulation,
    seed
  });
  const summaries: StepSummary[] = [];

  for (let step = 0; step < steps; step += 1) {
    const summary = simulation.step();
    summaries.push(summary);
    if (stopWhenExtinct && summary.population === 0) {
      break;
    }
  }

  const finalSummary = summaries[summaries.length - 1];
  if (!finalSummary) {
    throw new Error('Species activity persistence sweep produced no step data');
  }

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

function buildSpeciesActivitySummary(
  totalSpecies: number,
  stepsExecuted: number,
  windows: SpeciesActivityWindow[]
): SpeciesActivityProbeSummary {
  const postBurnInWindows = windows.filter((window) => window.postBurnIn);
  const postBurnInNewActivity = postBurnInWindows.map((window) => window.newActivity);
  const finalWindow = windows[windows.length - 1];

  return {
    stepsExecuted,
    totalSpecies,
    postBurnInWindows: postBurnInWindows.length,
    postBurnInWindowsWithNewActivity: postBurnInWindows.filter((window) => window.newActivity > 0).length,
    postBurnInNewSpecies: postBurnInWindows.reduce((total, window) => total + window.newSpecies, 0),
    postBurnInNewActivityMean: mean(postBurnInNewActivity),
    postBurnInNewActivityMin: min(postBurnInNewActivity),
    postBurnInNewActivityMax: max(postBurnInNewActivity),
    finalCumulativeActivity: finalWindow?.cumulativeActivity ?? 0,
    finalNormalizedCumulativeActivity: finalWindow?.normalizedCumulativeActivity ?? 0,
    finalNewActivity: finalWindow?.newActivity ?? 0
  };
}

function buildSpeciesActivityPersistenceSummary(
  minSurvivalTicks: number,
  windows: SpeciesActivityPersistenceWindow[]
): SpeciesActivityPersistenceSummary {
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
    postBurnInPersistentNewSpecies: evaluablePostBurnInWindows.reduce(
      (total, window) => total + (window.persistentNewSpecies ?? 0),
      0
    ),
    postBurnInPersistentNewActivityMean: mean(postBurnInPersistentNewActivity),
    postBurnInPersistentNewActivityMin: min(postBurnInPersistentNewActivity),
    postBurnInPersistentNewActivityMax: max(postBurnInPersistentNewActivity),
    finalPersistentNewActivity: finalWindow?.censored ? null : finalWindow?.persistentNewActivity ?? 0,
    finalWindowCensored: finalWindow?.censored ?? false
  };
}

function collectSpeciesActivityContext(
  species: TaxonHistory[],
  windowSize: number,
  maxTick: number
): SpeciesActivityContext {
  const activeSpeciesByTick = Array.from({ length: maxTick + 1 }, () => 0);
  const contributions: SpeciesWindowContribution[] = [];

  for (const speciesHistory of species) {
    for (const point of speciesHistory.timeline) {
      if (point.tick < 1 || point.tick > maxTick || point.population <= 0) {
        continue;
      }
      activeSpeciesByTick[point.tick] += 1;
    }

    if (speciesHistory.firstSeenTick < 1 || speciesHistory.firstSeenTick > maxTick) {
      continue;
    }

    const windowIndex = Math.floor((speciesHistory.firstSeenTick - 1) / windowSize);
    const windowStart = windowIndex * windowSize + 1;
    const windowEnd = Math.min(maxTick, windowStart + windowSize - 1);
    let activityInOriginWindow = 0;

    for (const point of speciesHistory.timeline) {
      if (point.tick < windowStart || point.tick > windowEnd || point.population <= 0) {
        continue;
      }
      activityInOriginWindow += 1;
    }

    contributions.push({
      windowIndex,
      activityInOriginWindow,
      observedLifetime: observedLifetime(speciesHistory, maxTick)
    });
  }

  return {
    activeSpeciesByTick,
    contributions
  };
}

function buildCumulativeActivityByTick(activeSpeciesByTick: number[]): number[] {
  const cumulativeActivityByTick = Array.from({ length: activeSpeciesByTick.length }, () => 0);
  for (let tick = 1; tick < activeSpeciesByTick.length; tick += 1) {
    cumulativeActivityByTick[tick] = cumulativeActivityByTick[tick - 1] + activeSpeciesByTick[tick];
  }
  return cumulativeActivityByTick;
}

function observedLifetime(species: TaxonHistory, maxTick: number): number {
  const lastObservedTick = species.extinctTick ?? maxTick;
  return Math.max(0, lastObservedTick - species.firstSeenTick);
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
