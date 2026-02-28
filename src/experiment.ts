import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
  ExperimentAggregateSummary,
  ExperimentRunSummary,
  NumericAggregate,
  ResilienceAnalytics,
  SimulationExperimentConfig,
  SimulationExperimentExport
} from './types';

export interface RunExperimentInput {
  runs: number;
  steps: number;
  analyticsWindow: number;
  seed: number;
  seedStep?: number;
  stopWhenExtinct?: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

interface NormalizedExperimentConfig extends SimulationExperimentConfig {
  simulation: Omit<LifeSimulationOptions, 'seed'>;
}

export function runExperiment(input: RunExperimentInput): SimulationExperimentExport {
  const config = normalizeConfig(input);
  const runs: ExperimentRunSummary[] = [];

  for (let run = 0; run < config.runs; run += 1) {
    const seed = config.seed + run * config.seedStep;
    const simulation = new LifeSimulation({
      ...config.simulation,
      seed
    });
    const series = simulation.runWithAnalytics(config.steps, config.analyticsWindow, config.stopWhenExtinct);

    const finalSummary = series.summaries[series.summaries.length - 1];
    const finalAnalytics = series.analytics[series.analytics.length - 1];
    if (!finalSummary || !finalAnalytics) {
      throw new Error(`Experiment run ${run + 1} produced no step data`);
    }

    runs.push({
      run: run + 1,
      seed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      finalResilienceStabilityIndex: computeResilienceStabilityIndex(finalAnalytics.resilience),
      finalResilienceMemoryStabilityIndex: clampUnitInterval(finalAnalytics.resilience.memoryStabilityIndexMean),
      finalResilienceRelapseEventFraction: clampUnitInterval(finalAnalytics.resilience.memoryRelapseEventFraction),
      finalSummary,
      finalAnalytics
    });
  }

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    config: {
      runs: config.runs,
      steps: config.steps,
      analyticsWindow: config.analyticsWindow,
      seed: config.seed,
      seedStep: config.seedStep,
      stopWhenExtinct: config.stopWhenExtinct
    },
    runs,
    aggregate: aggregateRuns(runs)
  };
}

function normalizeConfig(input: RunExperimentInput): NormalizedExperimentConfig {
  const runs = toPositiveInt('runs', input.runs);
  const steps = toPositiveInt('steps', input.steps);
  const analyticsWindow = toPositiveInt('analyticsWindow', input.analyticsWindow);
  const seed = toInteger('seed', input.seed);
  const seedStep = toPositiveInt('seedStep', input.seedStep ?? 1);
  return {
    runs,
    steps,
    analyticsWindow,
    seed,
    seedStep,
    stopWhenExtinct: input.stopWhenExtinct ?? true,
    simulation: input.simulation ?? {}
  };
}

function toInteger(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  return Math.trunc(value);
}

function toPositiveInt(name: string, value: number): number {
  const normalized = toInteger(name, value);
  if (normalized <= 0) {
    throw new Error(`${name} must be > 0`);
  }
  return normalized;
}

function aggregateRuns(runs: ExperimentRunSummary[]): ExperimentAggregateSummary {
  const extinctRuns = runs.reduce((count, run) => count + (run.extinct ? 1 : 0), 0);
  return {
    runs: runs.length,
    extinctRuns,
    extinctionRate: runs.length === 0 ? 0 : extinctRuns / runs.length,
    stepsExecuted: summarize(runs.map((run) => run.stepsExecuted)),
    finalPopulation: summarize(runs.map((run) => run.finalSummary.population)),
    finalMeanEnergy: summarize(runs.map((run) => run.finalSummary.meanEnergy)),
    finalActiveClades: summarize(runs.map((run) => run.finalSummary.activeClades)),
    finalActiveSpecies: summarize(runs.map((run) => run.finalSummary.activeSpecies)),
    finalDominantSpeciesShare: summarize(runs.map((run) => run.finalSummary.dominantSpeciesShare)),
    finalSpeciesSpeciationRate: summarize(runs.map((run) => run.finalAnalytics.species.speciationRate)),
    finalSpeciesExtinctionRate: summarize(runs.map((run) => run.finalAnalytics.species.extinctionRate)),
    finalSpeciesNetDiversificationRate: summarize(
      runs.map((run) => run.finalAnalytics.species.netDiversificationRate)
    ),
    finalResilienceStabilityIndex: summarize(runs.map((run) => run.finalResilienceStabilityIndex)),
    finalResilienceMemoryStabilityIndex: summarize(runs.map((run) => run.finalResilienceMemoryStabilityIndex)),
    finalResilienceRelapseEventFraction: summarize(runs.map((run) => run.finalResilienceRelapseEventFraction))
  };
}

export function computeResilienceStabilityIndex(resilience: ResilienceAnalytics): number {
  const progress = clampUnitInterval(resilience.recoveryProgress);
  const sustained = Math.max(0, resilience.sustainedRecoveryTicks);
  const relapses = Math.max(0, resilience.recoveryRelapses);
  return (progress * (sustained + 1)) / (sustained + relapses + 1);
}

function clampUnitInterval(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function summarize(values: number[]): NumericAggregate {
  if (values.length === 0) {
    return { mean: 0, min: 0, max: 0 };
  }
  let min = values[0];
  let max = values[0];
  let total = 0;
  for (const value of values) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
    total += value;
  }
  return {
    mean: total / values.length,
    min,
    max
  };
}
