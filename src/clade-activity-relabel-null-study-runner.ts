import { buildActivitySeedPanelThresholdSeedResult } from './activity-thresholds';
import { buildMatchedSchedulePseudoClades } from './clade-activity-relabel-null-matched-schedule';
import {
  buildCladeActivityRelabelNullSeedResult,
  deriveRelabelSeed
} from './clade-activity-relabel-null-study-helpers';
import { buildCladeActivityRelabelNullThresholdAggregate } from './clade-activity-relabel-null-thresholds';
import { LifeSimulationOptions } from './simulation';
import {
  CladeActivityPersistenceSummary,
  CladeActivityProbeSummary,
  CladeActivityRelabelNullThresholdResult,
  EvolutionHistorySnapshot,
  MatchedNullFounderContext,
  StepSummary,
  TaxonHistory
} from './types';

export interface RunCladeActivityRelabelNullSeedSimulationInput {
  steps: number;
  seed: number;
  stopWhenExtinct: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  emptyRunError: string;
}

export interface RunCladeActivityRelabelNullSeedSimulationResult {
  history: EvolutionHistorySnapshot;
  finalSummary: StepSummary;
}

export interface BuildCladeActivityRelabelNullThresholdResultsInput {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
  stopWhenExtinct: boolean;
  simulation?: Omit<LifeSimulationOptions, 'seed'>;
  matchedNullFounderContext: MatchedNullFounderContext;
}

export interface CladeActivityRelabelNullStudyRunnerDependencies {
  runSimulation: (
    input: RunCladeActivityRelabelNullSeedSimulationInput
  ) => RunCladeActivityRelabelNullSeedSimulationResult;
  analyzeCladeActivitySummary: (input: {
    clades: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
  }) => CladeActivityProbeSummary;
  analyzePersistentCladeActivitySummary: (input: {
    clades: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
    minSurvivalTicks: number;
  }) => CladeActivityPersistenceSummary;
  withCladogenesisThreshold: (
    simulation: Omit<LifeSimulationOptions, 'seed'> | undefined,
    cladogenesisThreshold: number
  ) => Omit<LifeSimulationOptions, 'seed'>;
}

export function buildCladeActivityRelabelNullThresholdResults(
  input: BuildCladeActivityRelabelNullThresholdResultsInput,
  dependencies: CladeActivityRelabelNullStudyRunnerDependencies
): CladeActivityRelabelNullThresholdResult[] {
  return input.cladogenesisThresholds.map((cladogenesisThreshold) => {
    const seedResults = input.seeds.map((seed) => {
      const { history, finalSummary } = dependencies.runSimulation({
        steps: input.steps,
        seed,
        stopWhenExtinct: input.stopWhenExtinct,
        simulation: dependencies.withCladogenesisThreshold(input.simulation, cladogenesisThreshold),
        emptyRunError: 'Clade activity relabel null study produced no step data'
      });
      const relabelSeed = deriveRelabelSeed(seed, cladogenesisThreshold);
      const matchedNullClades = buildMatchedSchedulePseudoClades({
        species: history.species,
        clades: history.clades,
        maxTick: finalSummary.tick,
        relabelSeed,
        matchedNullFounderContext: input.matchedNullFounderContext
      });
      const actualRawSummary = dependencies.analyzeCladeActivitySummary({
        clades: history.clades,
        windowSize: input.windowSize,
        burnIn: input.burnIn,
        maxTick: finalSummary.tick
      });
      const matchedNullRawSummary = dependencies.analyzeCladeActivitySummary({
        clades: matchedNullClades,
        windowSize: input.windowSize,
        burnIn: input.burnIn,
        maxTick: finalSummary.tick
      });

      return buildCladeActivityRelabelNullSeedResult({
        seed,
        relabelSeed,
        finalSummary,
        actualClades: history.clades,
        matchedNullClades,
        actualRawSummary,
        matchedNullRawSummary,
        actualThresholds: buildCladeActivityThresholdSeedResults({
          clades: history.clades,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          maxTick: finalSummary.tick,
          minSurvivalTicks: input.minSurvivalTicks
        }, dependencies),
        matchedNullThresholds: buildCladeActivityThresholdSeedResults({
          clades: matchedNullClades,
          windowSize: input.windowSize,
          burnIn: input.burnIn,
          maxTick: finalSummary.tick,
          minSurvivalTicks: input.minSurvivalTicks
        }, dependencies),
        minSurvivalTicks: input.minSurvivalTicks,
        matchedNullFounderContext: input.matchedNullFounderContext
      });
    });

    return {
      cladogenesisThreshold,
      seedResults,
      aggregates: input.minSurvivalTicks.map((threshold) =>
        buildCladeActivityRelabelNullThresholdAggregate(threshold, seedResults)
      )
    };
  });
}

function buildCladeActivityThresholdSeedResults(
  input: {
    clades: TaxonHistory[];
    windowSize: number;
    burnIn: number;
    maxTick: number;
    minSurvivalTicks: number[];
  },
  dependencies: Pick<CladeActivityRelabelNullStudyRunnerDependencies, 'analyzePersistentCladeActivitySummary'>
) {
  return input.minSurvivalTicks.map((minSurvivalTicks) =>
    buildActivitySeedPanelThresholdSeedResult({
      minSurvivalTicks,
      summary: dependencies.analyzePersistentCladeActivitySummary({
        clades: input.clades,
        windowSize: input.windowSize,
        burnIn: input.burnIn,
        maxTick: input.maxTick,
        minSurvivalTicks
      })
    })
  );
}
