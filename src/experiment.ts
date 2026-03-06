import { LifeSimulation, LifeSimulationOptions } from './simulation';
import {
  BlockMeanUncertainty,
  DisturbanceGridCellPairedDeltas,
  DisturbanceGridCellReproducibility,
  DisturbanceGridCellSummary,
  DisturbanceGridCellTimingDiagnostics,
  DisturbanceGridStudyConfig,
  DisturbanceGridStudyExport,
  DisturbanceGridStudySummary,
  ExperimentAggregateSummary,
  ExperimentRunSummary,
  NumericAggregate,
  PairedDeltaAggregate,
  PathDependenceGainCi95Classification,
  PathDependenceGainCi95ClassificationCounts,
  PathDependenceGainCi95RankedCell,
  ResilienceAnalytics,
  SimulationConfig,
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

export interface RunDisturbanceGridStudyInput {
  runs: number;
  steps: number;
  analyticsWindow: number;
  seed: number;
  seedStep?: number;
  seedBlocks?: number;
  blockSeedStride?: number;
  stopWhenExtinct?: boolean;
  intervals: number[];
  amplitudes: number[];
  phases?: number[];
  localRadius?: number;
  localRefugiaFraction?: number;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  generatedAt?: string;
}

interface NormalizedDisturbanceGridStudyConfig extends DisturbanceGridStudyConfig {
  simulation: Omit<LifeSimulationOptions, 'seed'>;
}

interface DisturbanceGridCellBlockAnalytics {
  pairedDeltas: DisturbanceGridCellPairedDeltas;
  hypothesisSupport: boolean;
}

const PATH_DEPENDENCE_GAIN_CI95_TOP_CELL_COUNT = 5;

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

export function runDisturbanceGridStudy(input: RunDisturbanceGridStudyInput): DisturbanceGridStudyExport {
  const config = normalizeDisturbanceGridStudyConfig(input);
  const cells: DisturbanceGridCellSummary[] = [];

  for (const interval of config.intervals) {
    for (const amplitude of config.amplitudes) {
      for (const phase of config.phases) {
        const globalRuns: ExperimentRunSummary[] = [];
        const localRuns: ExperimentRunSummary[] = [];
        const blockAnalytics: DisturbanceGridCellBlockAnalytics[] = [];

        for (let block = 0; block < config.seedBlocks; block += 1) {
          const blockSeed = config.seed + block * config.blockSeedStride;
          const global = runExperiment({
            runs: config.runs,
            steps: config.steps,
            analyticsWindow: config.analyticsWindow,
            seed: blockSeed,
            seedStep: config.seedStep,
            stopWhenExtinct: config.stopWhenExtinct,
            simulation: withDisturbanceConfig(config.simulation, {
              disturbanceInterval: interval,
              disturbancePhaseOffset: phase,
              disturbanceEnergyLoss: amplitude,
              disturbanceResourceLoss: amplitude,
              disturbanceRadius: -1,
              disturbanceRefugiaFraction: 0
            })
          });
          const local = runExperiment({
            runs: config.runs,
            steps: config.steps,
            analyticsWindow: config.analyticsWindow,
            seed: blockSeed,
            seedStep: config.seedStep,
            stopWhenExtinct: config.stopWhenExtinct,
            simulation: withDisturbanceConfig(config.simulation, {
              disturbanceInterval: interval,
              disturbancePhaseOffset: phase,
              disturbanceEnergyLoss: amplitude,
              disturbanceResourceLoss: amplitude,
              disturbanceRadius: config.localRadius,
              disturbanceRefugiaFraction: config.localRefugiaFraction
            })
          });

          globalRuns.push(...global.runs);
          localRuns.push(...local.runs);

          const blockPairedDeltas = summarizeDisturbancePairedDeltas(global.runs, local.runs);
          blockAnalytics.push({
            pairedDeltas: blockPairedDeltas,
            hypothesisSupport:
              blockPairedDeltas.relapseEventReduction.mean > 0 &&
              blockPairedDeltas.pathDependenceGain.mean > 0
          });
        }

        const pairedDeltas = summarizeDisturbancePairedDeltas(globalRuns, localRuns);
        const timingDiagnostics = summarizeDisturbanceTimingDiagnostics(globalRuns, localRuns);
        const reproducibility = summarizeDisturbanceReproducibility(blockAnalytics);
        cells.push({
          interval,
          amplitude,
          phase,
          global: aggregateRuns(globalRuns),
          local: aggregateRuns(localRuns),
          pairedDeltas,
          timingDiagnostics,
          reproducibility,
          hypothesisSupport:
            pairedDeltas.relapseEventReduction.mean > 0 && pairedDeltas.pathDependenceGain.mean > 0
        });
      }
    }
  }

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    config: {
      runs: config.runs,
      steps: config.steps,
      analyticsWindow: config.analyticsWindow,
      seed: config.seed,
      seedStep: config.seedStep,
      seedBlocks: config.seedBlocks,
      blockSeedStride: config.blockSeedStride,
      stopWhenExtinct: config.stopWhenExtinct,
      intervals: config.intervals,
      amplitudes: config.amplitudes,
      phases: config.phases,
      localRadius: config.localRadius,
      localRefugiaFraction: config.localRefugiaFraction
    },
    cells,
    summary: summarizeDisturbanceGridStudy(cells)
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

function normalizeDisturbanceGridStudyConfig(
  input: RunDisturbanceGridStudyInput
): NormalizedDisturbanceGridStudyConfig {
  const baseConfig = normalizeConfig(input);
  const seedBlocks = toPositiveInt('seedBlocks', input.seedBlocks ?? 1);
  return {
    runs: baseConfig.runs,
    steps: baseConfig.steps,
    analyticsWindow: baseConfig.analyticsWindow,
    seed: baseConfig.seed,
    seedStep: baseConfig.seedStep,
    seedBlocks,
    blockSeedStride: toPositiveInt(
      'blockSeedStride',
      input.blockSeedStride ?? baseConfig.runs * baseConfig.seedStep
    ),
    stopWhenExtinct: baseConfig.stopWhenExtinct,
    simulation: baseConfig.simulation,
    intervals: toPositiveIntList('intervals', input.intervals),
    amplitudes: toUnitIntervalList('amplitudes', input.amplitudes),
    phases: toPhaseOffsetList('phases', input.phases ?? [0]),
    localRadius: toNonNegativeInt('localRadius', input.localRadius ?? 2),
    localRefugiaFraction: toUnitInterval('localRefugiaFraction', input.localRefugiaFraction ?? 0.35)
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

function toNonNegativeInt(name: string, value: number): number {
  const normalized = toInteger(name, value);
  if (normalized < 0) {
    throw new Error(`${name} must be >= 0`);
  }
  return normalized;
}

function toPositiveIntList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  return values.map((value, index) => toPositiveInt(`${name}[${index}]`, value));
}

function toUnitInterval(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  if (value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1`);
  }
  return value;
}

function toUnitIntervalList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  return values.map((value, index) => toUnitInterval(`${name}[${index}]`, value));
}

function toPhaseOffset(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function toPhaseOffsetList(name: string, values: number[]): number[] {
  if (values.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  return values.map((value, index) => toPhaseOffset(`${name}[${index}]`, value));
}

function withDisturbanceConfig(
  simulation: Omit<LifeSimulationOptions, 'seed'>,
  overrides: Pick<
    SimulationConfig,
    | 'disturbanceInterval'
    | 'disturbancePhaseOffset'
    | 'disturbanceEnergyLoss'
    | 'disturbanceResourceLoss'
    | 'disturbanceRadius'
    | 'disturbanceRefugiaFraction'
  >
): Omit<LifeSimulationOptions, 'seed'> {
  return {
    ...simulation,
    config: {
      ...(simulation.config ?? {}),
      ...overrides
    }
  };
}

function summarizeDisturbancePairedDeltas(
  globalRuns: ExperimentRunSummary[],
  localRuns: ExperimentRunSummary[]
): DisturbanceGridCellPairedDeltas {
  return {
    resilienceStabilityDelta: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) => local.finalResilienceStabilityIndex - global.finalResilienceStabilityIndex
    ),
    memoryStabilityDelta: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) =>
        local.finalResilienceMemoryStabilityIndex - global.finalResilienceMemoryStabilityIndex
    ),
    relapseEventReduction: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) =>
        global.finalResilienceRelapseEventFraction - local.finalResilienceRelapseEventFraction
    ),
    turnoverSpikeReduction: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) =>
        global.finalAnalytics.resilience.turnoverSpike - local.finalAnalytics.resilience.turnoverSpike
    ),
    pathDependenceGain: summarizePairedRuns(globalRuns, localRuns, (global, local) => {
      const memoryDelta =
        local.finalResilienceMemoryStabilityIndex - global.finalResilienceMemoryStabilityIndex;
      const immediateDelta = local.finalResilienceStabilityIndex - global.finalResilienceStabilityIndex;
      return memoryDelta - immediateDelta;
    }),
    latestRecoveryLagReduction: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) => comparableLatestRecoveryLag(global) - comparableLatestRecoveryLag(local)
    ),
    memoryRecoveryLagReduction: summarizePairedRuns(
      globalRuns,
      localRuns,
      (global, local) => comparableMemoryRecoveryLag(global) - comparableMemoryRecoveryLag(local)
    )
  };
}

function summarizeDisturbanceTimingDiagnostics(
  globalRuns: ExperimentRunSummary[],
  localRuns: ExperimentRunSummary[]
): DisturbanceGridCellTimingDiagnostics {
  ensurePairedRuns(globalRuns, localRuns);
  return {
    globalLatestEventPhaseMean: summarize(
      globalRuns.map((run) => run.finalAnalytics.resilience.latestEventSeasonalPhase)
    ).mean,
    localLatestEventPhaseMean: summarize(
      localRuns.map((run) => run.finalAnalytics.resilience.latestEventSeasonalPhase)
    ).mean,
    globalMemoryEventPhaseConcentrationMean: summarize(
      globalRuns.map((run) => run.finalAnalytics.resilience.memoryEventPhaseConcentration)
    ).mean,
    localMemoryEventPhaseConcentrationMean: summarize(
      localRuns.map((run) => run.finalAnalytics.resilience.memoryEventPhaseConcentration)
    ).mean
  };
}

function summarizeDisturbanceReproducibility(
  blocks: DisturbanceGridCellBlockAnalytics[]
): DisturbanceGridCellReproducibility {
  if (blocks.length === 0) {
    return {
      blocks: 0,
      hypothesisSupportFraction: 0,
      pathDependenceGainPositiveBlockFraction: 0,
      relapseEventReductionPositiveBlockFraction: 0,
      resilienceStabilityPositiveFraction: summarize([]),
      memoryStabilityPositiveFraction: summarize([]),
      relapseEventReductionPositiveFraction: summarize([]),
      turnoverSpikeReductionPositiveFraction: summarize([]),
      pathDependenceGainPositiveFraction: summarize([]),
      latestRecoveryLagReductionPositiveFraction: summarize([]),
      memoryRecoveryLagReductionPositiveFraction: summarize([]),
      pathDependenceGainBlockMeanUncertainty: summarizeBlockMeanUncertainty([]),
      memoryStabilityDeltaBlockMeanUncertainty: summarizeBlockMeanUncertainty([]),
      relapseEventReductionBlockMeanUncertainty: summarizeBlockMeanUncertainty([])
    };
  }

  return {
    blocks: blocks.length,
    hypothesisSupportFraction: fraction(blocks.map((block) => block.hypothesisSupport)),
    pathDependenceGainPositiveBlockFraction: fraction(
      blocks.map((block) => block.pairedDeltas.pathDependenceGain.mean > 0)
    ),
    relapseEventReductionPositiveBlockFraction: fraction(
      blocks.map((block) => block.pairedDeltas.relapseEventReduction.mean > 0)
    ),
    resilienceStabilityPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.resilienceStabilityDelta.positiveFraction)
    ),
    memoryStabilityPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.memoryStabilityDelta.positiveFraction)
    ),
    relapseEventReductionPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.relapseEventReduction.positiveFraction)
    ),
    turnoverSpikeReductionPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.turnoverSpikeReduction.positiveFraction)
    ),
    pathDependenceGainPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.pathDependenceGain.positiveFraction)
    ),
    latestRecoveryLagReductionPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.latestRecoveryLagReduction.positiveFraction)
    ),
    memoryRecoveryLagReductionPositiveFraction: summarize(
      blocks.map((block) => block.pairedDeltas.memoryRecoveryLagReduction.positiveFraction)
    ),
    pathDependenceGainBlockMeanUncertainty: summarizeBlockMeanUncertainty(
      blocks.map((block) => block.pairedDeltas.pathDependenceGain.mean)
    ),
    memoryStabilityDeltaBlockMeanUncertainty: summarizeBlockMeanUncertainty(
      blocks.map((block) => block.pairedDeltas.memoryStabilityDelta.mean)
    ),
    relapseEventReductionBlockMeanUncertainty: summarizeBlockMeanUncertainty(
      blocks.map((block) => block.pairedDeltas.relapseEventReduction.mean)
    )
  };
}

function summarizeBlockMeanUncertainty(values: number[]): BlockMeanUncertainty {
  if (values.length === 0) {
    return {
      mean: 0,
      standardError: 0,
      ci95Low: 0,
      ci95High: 0
    };
  }

  const mean = summarize(values).mean;
  if (values.length === 1) {
    return {
      mean,
      standardError: 0,
      ci95Low: mean,
      ci95High: mean
    };
  }

  let squaredDeviationTotal = 0;
  for (const value of values) {
    const deviation = value - mean;
    squaredDeviationTotal += deviation * deviation;
  }

  const sampleVariance = squaredDeviationTotal / (values.length - 1);
  const standardError = Math.sqrt(sampleVariance / values.length);
  const margin = 1.96 * standardError;
  return {
    mean,
    standardError,
    ci95Low: mean - margin,
    ci95High: mean + margin
  };
}

function summarizePairedRuns(
  globalRuns: ExperimentRunSummary[],
  localRuns: ExperimentRunSummary[],
  delta: (global: ExperimentRunSummary, local: ExperimentRunSummary) => number
): PairedDeltaAggregate {
  ensurePairedRuns(globalRuns, localRuns);
  const values: number[] = [];
  let positive = 0;

  for (let i = 0; i < globalRuns.length; i += 1) {
    const globalRun = globalRuns[i];
    const localRun = localRuns[i];

    const value = delta(globalRun, localRun);
    values.push(value);
    if (value > 0) {
      positive += 1;
    }
  }

  const aggregate = summarize(values);
  return {
    ...aggregate,
    positiveFraction: values.length === 0 ? 0 : positive / values.length
  };
}

function summarizeDisturbanceGridStudy(cells: DisturbanceGridCellSummary[]): DisturbanceGridStudySummary {
  const supportedCells = cells.reduce((count, cell) => count + (cell.hypothesisSupport ? 1 : 0), 0);
  const pathDependenceGainCi95ClassificationCounts: PathDependenceGainCi95ClassificationCounts = {
    robustPositive: 0,
    ambiguous: 0,
    robustNegative: 0
  };
  const pathDependenceGainCi95LowerBoundTopCells: PathDependenceGainCi95RankedCell[] = [];

  for (const cell of cells) {
    const uncertainty = cell.reproducibility.pathDependenceGainBlockMeanUncertainty;
    const classification = classifyPathDependenceGainCi95(uncertainty);
    pathDependenceGainCi95ClassificationCounts[classification] += 1;
    pathDependenceGainCi95LowerBoundTopCells.push({
      interval: cell.interval,
      amplitude: cell.amplitude,
      phase: cell.phase,
      mean: uncertainty.mean,
      ci95Low: uncertainty.ci95Low,
      ci95High: uncertainty.ci95High,
      classification
    });
  }

  pathDependenceGainCi95LowerBoundTopCells.sort(comparePathDependenceGainCi95RankedCells);

  return {
    cells: cells.length,
    supportedCells,
    supportFraction: cells.length === 0 ? 0 : supportedCells / cells.length,
    hypothesisSupportFractionAcrossBlocks: summarize(
      cells.map((cell) => cell.reproducibility.hypothesisSupportFraction)
    ),
    pathDependenceGainPositiveBlockFraction: summarize(
      cells.map((cell) => cell.reproducibility.pathDependenceGainPositiveBlockFraction)
    ),
    relapseEventReductionPositiveBlockFraction: summarize(
      cells.map((cell) => cell.reproducibility.relapseEventReductionPositiveBlockFraction)
    ),
    pathDependenceGainCi95ClassificationCounts,
    pathDependenceGainCi95LowerBoundTopCells: pathDependenceGainCi95LowerBoundTopCells.slice(
      0,
      PATH_DEPENDENCE_GAIN_CI95_TOP_CELL_COUNT
    ),
    memoryStabilityDelta: summarize(cells.map((cell) => cell.pairedDeltas.memoryStabilityDelta.mean)),
    relapseEventReduction: summarize(cells.map((cell) => cell.pairedDeltas.relapseEventReduction.mean)),
    pathDependenceGain: summarize(cells.map((cell) => cell.pairedDeltas.pathDependenceGain.mean)),
    latestRecoveryLagReduction: summarize(
      cells.map((cell) => cell.pairedDeltas.latestRecoveryLagReduction.mean)
    ),
    memoryRecoveryLagReduction: summarize(
      cells.map((cell) => cell.pairedDeltas.memoryRecoveryLagReduction.mean)
    ),
    globalMemoryEventPhaseConcentration: summarize(
      cells.map((cell) => cell.timingDiagnostics.globalMemoryEventPhaseConcentrationMean)
    ),
    localMemoryEventPhaseConcentration: summarize(
      cells.map((cell) => cell.timingDiagnostics.localMemoryEventPhaseConcentrationMean)
    )
  };
}

function classifyPathDependenceGainCi95(
  uncertainty: BlockMeanUncertainty
): PathDependenceGainCi95Classification {
  if (uncertainty.ci95Low > 0) {
    return 'robustPositive';
  }
  if (uncertainty.ci95High < 0) {
    return 'robustNegative';
  }
  return 'ambiguous';
}

function comparePathDependenceGainCi95RankedCells(
  left: PathDependenceGainCi95RankedCell,
  right: PathDependenceGainCi95RankedCell
): number {
  if (left.ci95Low !== right.ci95Low) {
    return right.ci95Low - left.ci95Low;
  }
  if (left.ci95High !== right.ci95High) {
    return right.ci95High - left.ci95High;
  }
  if (left.mean !== right.mean) {
    return right.mean - left.mean;
  }
  if (left.interval !== right.interval) {
    return left.interval - right.interval;
  }
  if (left.amplitude !== right.amplitude) {
    return left.amplitude - right.amplitude;
  }
  return left.phase - right.phase;
}

function ensurePairedRuns(globalRuns: ExperimentRunSummary[], localRuns: ExperimentRunSummary[]): void {
  if (globalRuns.length !== localRuns.length) {
    throw new Error(
      `Mismatched paired runs: global=${globalRuns.length} local=${localRuns.length}`
    );
  }
  for (let i = 0; i < globalRuns.length; i += 1) {
    if (globalRuns[i].seed !== localRuns[i].seed) {
      throw new Error(
        `Seed mismatch for paired runs at index ${i}: globalSeed=${globalRuns[i].seed} localSeed=${localRuns[i].seed}`
      );
    }
  }
}

function comparableLatestRecoveryLag(run: ExperimentRunSummary): number {
  const lag = run.finalAnalytics.resilience.latestEventRecoveryLagTicks;
  return lag < 0 ? run.stepsExecuted + 1 : lag;
}

function comparableMemoryRecoveryLag(run: ExperimentRunSummary): number {
  const lag = Math.max(0, run.finalAnalytics.resilience.memoryRecoveryLagTicksMean);
  const recoveredFraction = clampUnitInterval(run.finalAnalytics.resilience.memoryRecoveredEventFraction);
  return lag + (1 - recoveredFraction) * (run.stepsExecuted + 1);
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

function fraction(values: boolean[]): number {
  if (values.length === 0) {
    return 0;
  }
  let positive = 0;
  for (const value of values) {
    if (value) {
      positive += 1;
    }
  }
  return positive / values.length;
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
