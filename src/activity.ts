import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
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

export interface RunSpeciesActivityProbeInput {
  steps: number;
  windowSize: number;
  burnIn: number;
  seed: number;
  stopWhenExtinct?: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

export const SPECIES_ACTIVITY_PROBE_DEFINITION: SpeciesActivityProbeDefinition = {
  component: 'species',
  activityUnit: 'activeSpeciesTick',
  cumulativeActivity: 'Sum of occupied species-ticks from simulation tick 1 through the end of each window.',
  normalizedCumulativeActivity: 'Cumulative activity divided by elapsed simulation ticks at the end of each window.',
  newActivity:
    'Occupied species-ticks within a window contributed by species whose firstSeenTick falls inside that same window.'
};

export function analyzeSpeciesActivity(input: AnalyzeSpeciesActivityInput): AnalyzeSpeciesActivityResult {
  const windowSize = toPositiveInt('windowSize', input.windowSize);
  const burnIn = toNonNegativeInt('burnIn', input.burnIn ?? 0);
  const maxTick = toNonNegativeInt('maxTick', input.maxTick);
  const activeSpeciesByTick = Array.from({ length: maxTick + 1 }, () => 0);
  const newActivityByWindow = new Map<number, number>();
  const newSpeciesByWindow = new Map<number, number>();

  for (const species of input.species) {
    for (const point of species.timeline) {
      if (point.tick < 1 || point.tick > maxTick || point.population <= 0) {
        continue;
      }
      activeSpeciesByTick[point.tick] += 1;
    }

    if (species.firstSeenTick < 1 || species.firstSeenTick > maxTick) {
      continue;
    }

    const windowIndex = Math.floor((species.firstSeenTick - 1) / windowSize);
    const windowStart = windowIndex * windowSize + 1;
    const windowEnd = Math.min(maxTick, windowStart + windowSize - 1);
    let activityInOriginWindow = 0;

    for (const point of species.timeline) {
      if (point.tick < windowStart || point.tick > windowEnd || point.population <= 0) {
        continue;
      }
      activityInOriginWindow += 1;
    }

    newActivityByWindow.set(windowIndex, (newActivityByWindow.get(windowIndex) ?? 0) + activityInOriginWindow);
    newSpeciesByWindow.set(windowIndex, (newSpeciesByWindow.get(windowIndex) ?? 0) + 1);
  }

  const cumulativeActivityByTick = Array.from({ length: maxTick + 1 }, () => 0);
  for (let tick = 1; tick <= maxTick; tick += 1) {
    cumulativeActivityByTick[tick] = cumulativeActivityByTick[tick - 1] + activeSpeciesByTick[tick];
  }

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
