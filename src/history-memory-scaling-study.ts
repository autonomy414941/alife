import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation, resolveSimulationConfig, SimulationStorageDiagnostics } from './simulation';
import { SimulationConfig, StepSummary } from './types';

export const HISTORY_MEMORY_SCALING_ARTIFACT = 'docs/history_memory_scaling_2026-03-16.json';

const DEFAULT_HORIZONS = [500, 1000, 2000, 5000] as const;

const DEFAULT_BENCHMARK_CONFIG: Partial<SimulationConfig> = {
  width: 10,
  height: 10,
  initialAgents: 8,
  maxAge: 180
};

type ScalingClassification = 'bounded' | 'linear' | 'superlinear' | 'quadratic' | 'noisy';

export interface HistoryMemoryScalingMeasurement {
  horizon: number;
  stepsExecuted: number;
  runWallTimeMs: number;
  historyExportWallTimeMs: number;
  heapUsedBeforeRunBytes: number;
  heapUsedAfterRunBytes: number;
  heapUsedAfterHistoryExportBytes: number;
  heapDeltaAfterRunBytes: number;
  heapDeltaAfterHistoryExportBytes: number;
  finalPopulation: number;
  finalActiveClades: number;
  finalActiveSpecies: number;
  maxActiveCladesObserved: number;
  maxActiveSpeciesObserved: number;
  cumulativeActiveCladesObserved: number;
  cumulativeActiveSpeciesObserved: number;
  cladeExtinctionEventsObserved: number;
  speciesExtinctionEventsObserved: number;
  storage: SimulationStorageDiagnostics;
  cladeTimelinePointBound: number;
  speciesTimelinePointBound: number;
  cladeTimelinePointBoundRatio: number;
  speciesTimelinePointBoundRatio: number;
}

export interface HistoryMemoryScalingSummary {
  runtimeScaling: {
    classification: ScalingClassification;
    exponent: number;
  };
  retainedHeapScaling: {
    classification: ScalingClassification;
    exponent: number;
  };
  exportedHeapScaling: {
    classification: ScalingClassification;
    exponent: number;
  };
  localityFrameRetention: {
    classification: ScalingClassification;
    exponent: number;
    numericSlotsPerFrame: number[];
  };
  cladeTimelineRetention: {
    classification: 'bounded_by_cumulative_active_taxa';
    maxObservedRatio: number;
  };
  speciesTimelineRetention: {
    classification: 'bounded_by_cumulative_active_taxa';
    maxObservedRatio: number;
  };
  memoryNegligibleAtMaxHorizon: boolean;
}

export interface HistoryMemoryScalingStudy {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    seed: number;
    horizons: number[];
    simulationConfig: SimulationConfig;
    gcExposed: boolean;
    heapMetric: 'heapUsed';
  };
  measurements: HistoryMemoryScalingMeasurement[];
  summary: HistoryMemoryScalingSummary;
}

export interface RunHistoryMemoryScalingStudyInput {
  generatedAt?: string;
  seed?: number;
  horizons?: number[];
  simulationConfig?: Partial<SimulationConfig>;
}

export function runHistoryMemoryScalingStudy(
  input: RunHistoryMemoryScalingStudyInput = {}
): HistoryMemoryScalingStudy {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seed = input.seed ?? 77;
  const horizons = [...(input.horizons ?? DEFAULT_HORIZONS)].sort((left, right) => left - right);
  const simulationConfig = resolveSimulationConfig({
    ...DEFAULT_BENCHMARK_CONFIG,
    ...(input.simulationConfig ?? {})
  });
  const measurements = horizons.map((horizon) =>
    measureHistoryMemoryScaling({
      horizon,
      seed,
      simulationConfig
    })
  );

  return {
    generatedAt,
    question:
      'How do TaxonHistory.timeline and retained localityFrames scale in wall time and memory as the horizon extends to 5000 ticks?',
    prediction:
      'Retained locality frame storage will scale linearly with horizon, while taxon timelines will stay bounded by cumulative active taxa rather than showing quadratic blow-up.',
    config: {
      seed,
      horizons,
      simulationConfig,
      gcExposed: typeof runtimeGc() === 'function',
      heapMetric: 'heapUsed'
    },
    measurements,
    summary: summarizeHistoryMemoryScaling(measurements)
  };
}

export function summarizeHistoryMemoryScaling(
  measurements: ReadonlyArray<HistoryMemoryScalingMeasurement>
): HistoryMemoryScalingSummary {
  return {
    runtimeScaling: summarizePowerLawTrend(
      measurements.map((measurement) => measurement.horizon),
      measurements.map((measurement) => measurement.runWallTimeMs)
    ),
    retainedHeapScaling: summarizePowerLawTrend(
      measurements.map((measurement) => measurement.horizon),
      measurements.map((measurement) => Math.max(1, measurement.heapDeltaAfterRunBytes))
    ),
    exportedHeapScaling: summarizePowerLawTrend(
      measurements.map((measurement) => measurement.horizon),
      measurements.map((measurement) => Math.max(1, measurement.heapDeltaAfterHistoryExportBytes))
    ),
    localityFrameRetention: {
      ...summarizePowerLawTrend(
        measurements.map((measurement) => measurement.horizon),
        measurements.map((measurement) => measurement.storage.localityNumericSlotsRetained)
      ),
      numericSlotsPerFrame: measurements.map((measurement) =>
        measurement.storage.localityFramesRetained === 0
          ? 0
          : measurement.storage.localityNumericSlotsRetained / measurement.storage.localityFramesRetained
      )
    },
    cladeTimelineRetention: {
      classification: 'bounded_by_cumulative_active_taxa',
      maxObservedRatio: max(measurements.map((measurement) => measurement.cladeTimelinePointBoundRatio))
    },
    speciesTimelineRetention: {
      classification: 'bounded_by_cumulative_active_taxa',
      maxObservedRatio: max(measurements.map((measurement) => measurement.speciesTimelinePointBoundRatio))
    },
    memoryNegligibleAtMaxHorizon: isMemoryNegligibleAtMaxHorizon(measurements)
  };
}

export function summarizePowerLawTrend(
  horizons: ReadonlyArray<number>,
  values: ReadonlyArray<number>
): { classification: ScalingClassification; exponent: number } {
  const exponent = estimatePowerLawExponent(horizons, values);
  return {
    classification: classifyPowerLawExponent(horizons, values, exponent),
    exponent
  };
}

export function estimatePowerLawExponent(
  horizons: ReadonlyArray<number>,
  values: ReadonlyArray<number>
): number {
  const points = horizons
    .map((horizon, index) => ({ horizon, value: values[index] ?? 0 }))
    .filter((point) => point.horizon > 0 && point.value > 0);
  if (points.length < 2) {
    return 0;
  }

  const xs = points.map((point) => Math.log(point.horizon));
  const ys = points.map((point) => Math.log(point.value));
  const xMean = mean(xs);
  const yMean = mean(ys);

  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < points.length; index += 1) {
    const xDelta = xs[index] - xMean;
    numerator += xDelta * (ys[index] - yMean);
    denominator += xDelta * xDelta;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

export function classifyPowerLawExponent(
  horizons: ReadonlyArray<number>,
  values: ReadonlyArray<number>,
  exponent = estimatePowerLawExponent(horizons, values)
): ScalingClassification {
  if (!isNonDecreasing(values)) {
    return 'noisy';
  }
  if (exponent <= 0.35) {
    return 'bounded';
  }
  if (exponent <= 1.35) {
    return 'linear';
  }
  if (exponent < 1.75) {
    return 'superlinear';
  }
  return 'quadratic';
}

function measureHistoryMemoryScaling(input: {
  horizon: number;
  seed: number;
  simulationConfig: SimulationConfig;
}): HistoryMemoryScalingMeasurement {
  const simulation = new LifeSimulation({
    seed: input.seed,
    config: input.simulationConfig
  });
  const initial = simulation.snapshot();

  forceGc();
  const heapUsedBeforeRunBytes = sampleHeapUsedBytes();
  const runStart = process.hrtime.bigint();
  const summaries = simulation.run(input.horizon);
  const runWallTimeMs = elapsedMilliseconds(runStart);
  forceGc();
  const heapUsedAfterRunBytes = sampleHeapUsedBytes();

  const historyExportStart = process.hrtime.bigint();
  const exportedHistory = simulation.history();
  const historyExportWallTimeMs = elapsedMilliseconds(historyExportStart);
  forceGc();
  const heapUsedAfterHistoryExportBytes = sampleHeapUsedBytes();

  const storage = simulation.storageDiagnostics();
  const final = simulation.snapshot();
  const exportedCladeTimelinePoints = countExportedTimelinePoints(exportedHistory.clades);
  const exportedSpeciesTimelinePoints = countExportedTimelinePoints(exportedHistory.species);
  if (exportedCladeTimelinePoints !== storage.cladeTimelinePoints) {
    throw new Error(
      `Exported clade timeline points ${exportedCladeTimelinePoints} did not match retained count ${storage.cladeTimelinePoints}`
    );
  }
  if (exportedSpeciesTimelinePoints !== storage.speciesTimelinePoints) {
    throw new Error(
      `Exported species timeline points ${exportedSpeciesTimelinePoints} did not match retained count ${storage.speciesTimelinePoints}`
    );
  }

  const cumulativeActiveCladesObserved = initial.activeClades + sumSummaries(summaries, (summary) => summary.activeClades);
  const cumulativeActiveSpeciesObserved =
    initial.activeSpecies + sumSummaries(summaries, (summary) => summary.activeSpecies);
  const cladeExtinctionEventsObserved = sumSummaries(summaries, (summary) => summary.cladeExtinctions);
  const speciesExtinctionEventsObserved = sumSummaries(summaries, (summary) => summary.speciesExtinctions);
  const cladeTimelinePointBound = cumulativeActiveCladesObserved + cladeExtinctionEventsObserved;
  const speciesTimelinePointBound = cumulativeActiveSpeciesObserved + speciesExtinctionEventsObserved;

  return {
    horizon: input.horizon,
    stepsExecuted: summaries.length,
    runWallTimeMs,
    historyExportWallTimeMs,
    heapUsedBeforeRunBytes,
    heapUsedAfterRunBytes,
    heapUsedAfterHistoryExportBytes,
    heapDeltaAfterRunBytes: heapUsedAfterRunBytes - heapUsedBeforeRunBytes,
    heapDeltaAfterHistoryExportBytes: heapUsedAfterHistoryExportBytes - heapUsedBeforeRunBytes,
    finalPopulation: final.population,
    finalActiveClades: final.activeClades,
    finalActiveSpecies: final.activeSpecies,
    maxActiveCladesObserved: max([initial.activeClades, ...summaries.map((summary) => summary.activeClades)]),
    maxActiveSpeciesObserved: max([initial.activeSpecies, ...summaries.map((summary) => summary.activeSpecies)]),
    cumulativeActiveCladesObserved,
    cumulativeActiveSpeciesObserved,
    cladeExtinctionEventsObserved,
    speciesExtinctionEventsObserved,
    storage,
    cladeTimelinePointBound,
    speciesTimelinePointBound,
    cladeTimelinePointBoundRatio:
      cladeTimelinePointBound === 0 ? 0 : storage.cladeTimelinePoints / cladeTimelinePointBound,
    speciesTimelinePointBoundRatio:
      speciesTimelinePointBound === 0 ? 0 : storage.speciesTimelinePoints / speciesTimelinePointBound
  };
}

function countExportedTimelinePoints(
  histories: ReadonlyArray<{
    timeline: ReadonlyArray<unknown>;
  }>
): number {
  let total = 0;
  for (const history of histories) {
    total += history.timeline.length;
  }
  return total;
}

function sumSummaries(summaries: ReadonlyArray<StepSummary>, pick: (summary: StepSummary) => number): number {
  let total = 0;
  for (const summary of summaries) {
    total += pick(summary);
  }
  return total;
}

function isMemoryNegligibleAtMaxHorizon(measurements: ReadonlyArray<HistoryMemoryScalingMeasurement>): boolean {
  const maxHorizonMeasurement = [...measurements].sort((left, right) => right.horizon - left.horizon)[0];
  if (!maxHorizonMeasurement) {
    return true;
  }

  return (
    maxHorizonMeasurement.heapDeltaAfterRunBytes <= 5_000_000 &&
    maxHorizonMeasurement.storage.estimatedRetainedBytesLowerBound <= 5_000_000
  );
}

function sampleHeapUsedBytes(): number {
  return process.memoryUsage().heapUsed;
}

function forceGc(): void {
  const gc = runtimeGc();
  if (typeof gc === 'function') {
    gc();
  }
}

function runtimeGc(): (() => void) | undefined {
  return (globalThis as typeof globalThis & { gc?: () => void }).gc;
}

function elapsedMilliseconds(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

function isNonDecreasing(values: ReadonlyArray<number>): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] < values[index - 1]) {
      return false;
    }
  }
  return true;
}

function mean(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function max(values: ReadonlyArray<number>): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  console.log('Running history memory scaling study...');
  console.log(`  Generated at: ${generatedAt}`);
  console.log(`  Horizons: ${DEFAULT_HORIZONS.join(', ')}`);

  const study = runHistoryMemoryScalingStudy({ generatedAt });
  const outputPath = options.output ?? HISTORY_MEMORY_SCALING_ARTIFACT;
  emitStudyJsonOutput(study, { output: outputPath });

  console.log(`\nStudy complete. Artifact written to ${outputPath}`);
  console.log('\nSummary:');
  console.log(
    `  Runtime scaling: ${study.summary.runtimeScaling.classification} (exponent ${study.summary.runtimeScaling.exponent.toFixed(2)})`
  );
  console.log(
    `  Retained heap scaling: ${study.summary.retainedHeapScaling.classification} (exponent ${study.summary.retainedHeapScaling.exponent.toFixed(2)})`
  );
  console.log(
    `  Locality frame retention: ${study.summary.localityFrameRetention.classification} (exponent ${study.summary.localityFrameRetention.exponent.toFixed(2)})`
  );
  console.log(
    `  Clade timeline max bound ratio: ${study.summary.cladeTimelineRetention.maxObservedRatio.toFixed(3)}`
  );
  console.log(
    `  Species timeline max bound ratio: ${study.summary.speciesTimelineRetention.maxObservedRatio.toFixed(3)}`
  );
}
