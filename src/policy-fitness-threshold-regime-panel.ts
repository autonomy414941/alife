import {
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT,
  BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
  BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG,
  BehavioralPolicyThresholds,
  buildBehavioralPolicyFitnessPilotInitialAgents
} from './behavioral-policy-fitness-pilot';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import {
  analyzePolicyFitnessRecords,
  PolicyFitnessAggregateComparison,
  PolicyFitnessAnalysis,
  PolicyFitnessCohortMetrics,
  PolicyFitnessRecord,
  summarizePolicyFitnessCohort
} from './policy-fitness';
import { LifeSimulation } from './simulation';
import { SimulationConfig, StepSummary } from './types';

export const POLICY_FITNESS_THRESHOLD_REGIME_PANEL_ARTIFACT =
  'docs/policy_fitness_threshold_regime_panel_2026-03-23.json';

const DEFAULT_REPRODUCTION_THRESHOLDS = [0.3, 0.6, 0.9] as const;
const DEFAULT_MOVEMENT_ENERGY_THRESHOLDS = [4, 8] as const;
const DEFAULT_MOVEMENT_RECENT_HARVEST_THRESHOLDS = [0.25, 0.5] as const;
const DEFAULT_THRESHOLD_PANEL_RUNS = 2;
const DEFAULT_THRESHOLD_PANEL_STEPS = 120;

export interface PolicyFitnessThresholdRegimePanelInput {
  generatedAt?: string;
  runs?: number;
  steps?: number;
  seed?: number;
  seedStep?: number;
  stopWhenExtinct?: boolean;
  reproductionHarvestThresholds?: ReadonlyArray<number>;
  movementEnergyReserveThresholds?: ReadonlyArray<number>;
  movementMinRecentHarvestThresholds?: ReadonlyArray<number>;
}

export interface PolicyDecisionObservabilityRollup {
  policyAgentMeanFraction: number;
  decisionGatedFraction: number;
  movementDecisionGatedFraction: number;
  blockedByEnergyReserveFraction: number;
  blockedByRecentHarvestFraction: number;
  energyReserveNearThresholdFraction: number;
  recentHarvestNearThresholdFraction: number;
  reproductionDecisionGatedFraction: number;
  suppressedByHarvestThresholdFraction: number;
  harvestThresholdNearThresholdFraction: number;
}

export interface PolicyFitnessThresholdRegimeRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  thresholds: BehavioralPolicyThresholds;
  finalSummary: StepSummary;
  policyMetrics: PolicyFitnessCohortMetrics;
  controlMetrics: PolicyFitnessCohortMetrics;
  matchedBins: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
  decisionObservability: PolicyDecisionObservabilityRollup;
}

type ThresholdRegimeOutcome = 'advantage' | 'non_detrimental' | 'mixed' | 'detrimental';

export interface PolicyFitnessThresholdRegimeSummary {
  regimeId: string;
  thresholds: BehavioralPolicyThresholds;
  runs: PolicyFitnessThresholdRegimeRunSummary[];
  overall: {
    policyMetrics: PolicyFitnessCohortMetrics;
    controlMetrics: PolicyFitnessCohortMetrics;
    matchedComparison: PolicyFitnessAggregateComparison;
    decisionObservability: PolicyDecisionObservabilityRollup;
  };
  support: {
    harvestAdvantagePositiveRunFraction: number;
    survivalAdvantagePositiveRunFraction: number;
    reproductionAdvantagePositiveRunFraction: number;
  };
  interpretation: {
    outcome: ThresholdRegimeOutcome;
    score: number;
    summary: string;
  };
}

export interface PolicyFitnessThresholdRegimePanelArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    runs: number;
    steps: number;
    seed: number;
    seedStep: number;
    stopWhenExtinct: boolean;
    initialAgents: number;
    policyShare: number;
    reproductionHarvestThresholds: number[];
    movementEnergyReserveThresholds: number[];
    movementMinRecentHarvestThresholds: number[];
    simulation: Partial<SimulationConfig>;
  };
  regimes: PolicyFitnessThresholdRegimeSummary[];
  interpretation: {
    nonDetrimentalRegimeIds: string[];
    bestRegimeId: string | null;
    worstRegimeId: string | null;
    ruledOutAcrossTestedRange: boolean;
    summary: string;
  };
}

interface MutableDecisionObservabilityAccumulator {
  weightedPolicyAgentFraction: number;
  populationWeight: number;
  movementDecisions: number;
  movementGated: number;
  blockedByEnergyReserve: number;
  blockedByRecentHarvest: number;
  energyReserveNearThreshold: number;
  recentHarvestNearThreshold: number;
  reproductionDecisions: number;
  reproductionGated: number;
  suppressedByHarvestThreshold: number;
  harvestThresholdNearThreshold: number;
}

export function runPolicyFitnessThresholdRegimePanel(
  input: PolicyFitnessThresholdRegimePanelInput = {}
): PolicyFitnessThresholdRegimePanelArtifact {
  const runs = input.runs ?? DEFAULT_THRESHOLD_PANEL_RUNS;
  const steps = input.steps ?? DEFAULT_THRESHOLD_PANEL_STEPS;
  const seed = input.seed ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED;
  const seedStep = input.seedStep ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP;
  const stopWhenExtinct = input.stopWhenExtinct ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT;
  const reproductionHarvestThresholds = sanitizeThresholds(
    input.reproductionHarvestThresholds,
    DEFAULT_REPRODUCTION_THRESHOLDS
  );
  const movementEnergyReserveThresholds = sanitizeThresholds(
    input.movementEnergyReserveThresholds,
    DEFAULT_MOVEMENT_ENERGY_THRESHOLDS
  );
  const movementMinRecentHarvestThresholds = sanitizeThresholds(
    input.movementMinRecentHarvestThresholds,
    DEFAULT_MOVEMENT_RECENT_HARVEST_THRESHOLDS
  );

  const regimes = buildThresholdRegimeGrid(
    reproductionHarvestThresholds,
    movementEnergyReserveThresholds,
    movementMinRecentHarvestThresholds
  ).map((thresholds) =>
    runThresholdRegime({
      thresholds,
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct
    })
  );

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does a bounded sweep of movement and reproduction threshold regimes uncover any non-detrimental binary gate settings under the refined March 22 policy-fitness attribution surface?',
    prediction:
      'If the March 21 detriment was mostly threshold miscalibration, at least one more permissive regime should reduce movement and reproduction gate firing enough to reach near-neutral or positive matched-bin fitness.',
    config: {
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct,
      initialAgents: BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
      policyShare: BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
      reproductionHarvestThresholds,
      movementEnergyReserveThresholds,
      movementMinRecentHarvestThresholds,
      simulation: { ...BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG }
    },
    regimes,
    interpretation: interpretThresholdPanel(regimes)
  };
}

export function runPolicyFitnessThresholdRegimePanelCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) =>
    runPolicyFitnessThresholdRegimePanel({ generatedAt })
  );
}

function runThresholdRegime(input: {
  thresholds: BehavioralPolicyThresholds;
  runs: number;
  steps: number;
  seed: number;
  seedStep: number;
  stopWhenExtinct: boolean;
}): PolicyFitnessThresholdRegimeSummary {
  const runSummaries: PolicyFitnessThresholdRegimeRunSummary[] = [];
  const allRecords: PolicyFitnessRecord[] = [];
  const overallDecisionObservability = createDecisionObservabilityAccumulator();

  for (let run = 0; run < input.runs; run += 1) {
    const runSeed = input.seed + run * input.seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG,
      initialAgents: buildBehavioralPolicyFitnessPilotInitialAgents(runSeed, input.thresholds)
    });
    const series = simulation.runWithPolicyFitness(input.steps, input.stopWhenExtinct);
    const finalSummary = series.summaries[series.summaries.length - 1];
    if (!finalSummary) {
      throw new Error(`Policy fitness threshold regime ${regimeId(input.thresholds)} produced no summaries`);
    }

    const analysis = analyzePolicyFitnessRecords(series.records);
    const policyRecords = series.records.filter((record) => record.hasAnyPolicy);
    const controlRecords = series.records.filter((record) => !record.hasAnyPolicy);
    const decisionObservability = summarizeDecisionObservability(series.summaries);

    allRecords.push(...series.records);
    accumulateDecisionObservability(overallDecisionObservability, series.summaries);

    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      thresholds: { ...input.thresholds },
      finalSummary,
      policyMetrics: summarizePolicyFitnessCohort(policyRecords),
      controlMetrics: summarizePolicyFitnessCohort(controlRecords),
      matchedBins: analysis.aggregate.matchedBins,
      weightedHarvestAdvantage: analysis.aggregate.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: analysis.aggregate.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: analysis.aggregate.weightedReproductionAdvantage,
      decisionObservability
    });
  }

  const overallAnalysis = analyzePolicyFitnessRecords(allRecords);
  const interpretation = interpretThresholdRegime(
    input.thresholds,
    overallAnalysis.aggregate,
    summarizeDecisionObservabilityAccumulator(overallDecisionObservability)
  );

  return {
    regimeId: regimeId(input.thresholds),
    thresholds: { ...input.thresholds },
    runs: runSummaries,
    overall: {
      policyMetrics: summarizePolicyFitnessCohort(allRecords.filter((record) => record.hasAnyPolicy)),
      controlMetrics: summarizePolicyFitnessCohort(allRecords.filter((record) => !record.hasAnyPolicy)),
      matchedComparison: overallAnalysis.aggregate,
      decisionObservability: summarizeDecisionObservabilityAccumulator(overallDecisionObservability)
    },
    support: {
      harvestAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedHarvestAdvantage'),
      survivalAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedSurvivalAdvantage'),
      reproductionAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedReproductionAdvantage')
    },
    interpretation
  };
}

function sanitizeThresholds(
  values: ReadonlyArray<number> | undefined,
  defaults: ReadonlyArray<number>
): number[] {
  const selected = values && values.length > 0 ? values : defaults;
  return [...new Set(selected.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value >= 0))]
    .sort((left, right) => left - right);
}

function buildThresholdRegimeGrid(
  reproductionHarvestThresholds: ReadonlyArray<number>,
  movementEnergyReserveThresholds: ReadonlyArray<number>,
  movementMinRecentHarvestThresholds: ReadonlyArray<number>
): BehavioralPolicyThresholds[] {
  const regimes: BehavioralPolicyThresholds[] = [];

  for (const reproductionHarvestThreshold of reproductionHarvestThresholds) {
    for (const movementEnergyReserveThreshold of movementEnergyReserveThresholds) {
      for (const movementMinRecentHarvest of movementMinRecentHarvestThresholds) {
        regimes.push({
          reproductionHarvestThreshold,
          movementEnergyReserveThreshold,
          movementMinRecentHarvest
        });
      }
    }
  }

  return regimes;
}

function createDecisionObservabilityAccumulator(): MutableDecisionObservabilityAccumulator {
  return {
    weightedPolicyAgentFraction: 0,
    populationWeight: 0,
    movementDecisions: 0,
    movementGated: 0,
    blockedByEnergyReserve: 0,
    blockedByRecentHarvest: 0,
    energyReserveNearThreshold: 0,
    recentHarvestNearThreshold: 0,
    reproductionDecisions: 0,
    reproductionGated: 0,
    suppressedByHarvestThreshold: 0,
    harvestThresholdNearThreshold: 0
  };
}

function summarizeDecisionObservability(
  summaries: ReadonlyArray<StepSummary>
): PolicyDecisionObservabilityRollup {
  const accumulator = createDecisionObservabilityAccumulator();
  accumulateDecisionObservability(accumulator, summaries);
  return summarizeDecisionObservabilityAccumulator(accumulator);
}

function accumulateDecisionObservability(
  accumulator: MutableDecisionObservabilityAccumulator,
  summaries: ReadonlyArray<StepSummary>
): void {
  for (const summary of summaries) {
    const observability = summary.policyObservability;
    if (!observability) {
      continue;
    }

    accumulator.weightedPolicyAgentFraction +=
      observability.activation.anyPolicyAgentFraction * summary.population;
    accumulator.populationWeight += summary.population;
    accumulator.movementDecisions += observability.movement.decisions;
    accumulator.movementGated += observability.movement.gatedDecisions;
    accumulator.blockedByEnergyReserve += observability.movement.blockedByEnergyReserve;
    accumulator.blockedByRecentHarvest += observability.movement.blockedByRecentHarvest;
    accumulator.energyReserveNearThreshold += observability.movement.energyReserveNearThreshold;
    accumulator.recentHarvestNearThreshold += observability.movement.recentHarvestNearThreshold;
    accumulator.reproductionDecisions += observability.reproduction.decisions;
    accumulator.reproductionGated += observability.reproduction.gatedDecisions;
    accumulator.suppressedByHarvestThreshold += observability.reproduction.suppressedByHarvestThreshold;
    accumulator.harvestThresholdNearThreshold += observability.reproduction.harvestThresholdNearThreshold;
  }
}

function summarizeDecisionObservabilityAccumulator(
  accumulator: MutableDecisionObservabilityAccumulator
): PolicyDecisionObservabilityRollup {
  const movementDecisions = accumulator.movementDecisions;
  const reproductionDecisions = accumulator.reproductionDecisions;
  const totalDecisions = movementDecisions + reproductionDecisions;

  return {
    policyAgentMeanFraction:
      accumulator.populationWeight === 0 ? 0 : accumulator.weightedPolicyAgentFraction / accumulator.populationWeight,
    decisionGatedFraction:
      totalDecisions === 0 ? 0 : (accumulator.movementGated + accumulator.reproductionGated) / totalDecisions,
    movementDecisionGatedFraction: ratio(accumulator.movementGated, movementDecisions),
    blockedByEnergyReserveFraction: ratio(accumulator.blockedByEnergyReserve, movementDecisions),
    blockedByRecentHarvestFraction: ratio(accumulator.blockedByRecentHarvest, movementDecisions),
    energyReserveNearThresholdFraction: ratio(accumulator.energyReserveNearThreshold, movementDecisions),
    recentHarvestNearThresholdFraction: ratio(accumulator.recentHarvestNearThreshold, movementDecisions),
    reproductionDecisionGatedFraction: ratio(accumulator.reproductionGated, reproductionDecisions),
    suppressedByHarvestThresholdFraction: ratio(accumulator.suppressedByHarvestThreshold, reproductionDecisions),
    harvestThresholdNearThresholdFraction: ratio(accumulator.harvestThresholdNearThreshold, reproductionDecisions)
  };
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function positiveRunFraction(
  runs: ReadonlyArray<PolicyFitnessThresholdRegimeRunSummary>,
  key: 'weightedHarvestAdvantage' | 'weightedSurvivalAdvantage' | 'weightedReproductionAdvantage'
): number {
  if (runs.length === 0) {
    return 0;
  }

  let positive = 0;
  for (const run of runs) {
    if (run[key] > 0) {
      positive += 1;
    }
  }

  return positive / runs.length;
}

function interpretThresholdRegime(
  thresholds: BehavioralPolicyThresholds,
  aggregate: PolicyFitnessAnalysis['aggregate'],
  observability: PolicyDecisionObservabilityRollup
): PolicyFitnessThresholdRegimeSummary['interpretation'] {
  const outcome = classifyThresholdOutcome(aggregate);
  const score = regimeScore(aggregate);

  return {
    outcome,
    score,
    summary:
      `${regimeId(thresholds)}: matched bins ${aggregate.matchedBins}, harvest ${formatSigned(aggregate.weightedHarvestAdvantage)}, ` +
      `survival ${formatSigned(aggregate.weightedSurvivalAdvantage)}, reproduction ${formatSigned(aggregate.weightedReproductionAdvantage)}, ` +
      `movement gate ${formatPercent(observability.movementDecisionGatedFraction)}, reproduction gate ${formatPercent(observability.reproductionDecisionGatedFraction)}.`
  };
}

function classifyThresholdOutcome(
  aggregate: PolicyFitnessAnalysis['aggregate']
): ThresholdRegimeOutcome {
  const positiveSignals = [
    aggregate.weightedHarvestAdvantage > 0.02,
    aggregate.weightedSurvivalAdvantage > 0.001,
    aggregate.weightedReproductionAdvantage > 0.002
  ].filter(Boolean).length;
  const negativeSignals = [
    aggregate.weightedHarvestAdvantage < -0.02,
    aggregate.weightedSurvivalAdvantage < -0.001,
    aggregate.weightedReproductionAdvantage < -0.002
  ].filter(Boolean).length;

  if (positiveSignals >= 2 && negativeSignals === 0) {
    return 'advantage';
  }
  if (
    aggregate.weightedHarvestAdvantage >= -0.02 &&
    aggregate.weightedSurvivalAdvantage >= -0.001 &&
    aggregate.weightedReproductionAdvantage >= -0.002
  ) {
    return 'non_detrimental';
  }
  if (negativeSignals >= 2 && positiveSignals === 0) {
    return 'detrimental';
  }
  return 'mixed';
}

function interpretThresholdPanel(
  regimes: ReadonlyArray<PolicyFitnessThresholdRegimeSummary>
): PolicyFitnessThresholdRegimePanelArtifact['interpretation'] {
  const sorted = [...regimes].sort((left, right) => right.interpretation.score - left.interpretation.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const nonDetrimental = regimes.filter(
    (regime) => regime.interpretation.outcome === 'advantage' || regime.interpretation.outcome === 'non_detrimental'
  );
  const ruledOutAcrossTestedRange = nonDetrimental.length === 0;

  if (!best || !worst) {
    return {
      nonDetrimentalRegimeIds: [],
      bestRegimeId: null,
      worstRegimeId: null,
      ruledOutAcrossTestedRange: false,
      summary: 'The threshold panel did not produce any regime summaries.'
    };
  }

  if (ruledOutAcrossTestedRange) {
    return {
      nonDetrimentalRegimeIds: [],
      bestRegimeId: best.regimeId,
      worstRegimeId: worst.regimeId,
      ruledOutAcrossTestedRange: true,
      summary:
        `No tested regime cleared the non-detrimental bar. Best remaining candidate ${best.regimeId} still landed at ` +
        `harvest ${formatSigned(best.overall.matchedComparison.weightedHarvestAdvantage)}, survival ${formatSigned(best.overall.matchedComparison.weightedSurvivalAdvantage)}, ` +
        `reproduction ${formatSigned(best.overall.matchedComparison.weightedReproductionAdvantage)}; this bounded sweep does not support the current binary gate design across the tested range.`
    };
  }

  return {
    nonDetrimentalRegimeIds: nonDetrimental.map((regime) => regime.regimeId),
    bestRegimeId: best.regimeId,
    worstRegimeId: worst.regimeId,
    ruledOutAcrossTestedRange: false,
    summary:
      `The bounded sweep found ${nonDetrimental.length} non-detrimental regime(s). Best regime ${best.regimeId} recorded ` +
      `harvest ${formatSigned(best.overall.matchedComparison.weightedHarvestAdvantage)}, survival ${formatSigned(best.overall.matchedComparison.weightedSurvivalAdvantage)}, ` +
      `reproduction ${formatSigned(best.overall.matchedComparison.weightedReproductionAdvantage)}, while worst regime ${worst.regimeId} landed at harvest ${formatSigned(worst.overall.matchedComparison.weightedHarvestAdvantage)}.`
  };
}

function regimeScore(aggregate: PolicyFitnessAnalysis['aggregate']): number {
  return (
    aggregate.weightedHarvestAdvantage / 0.02 +
    aggregate.weightedSurvivalAdvantage / 0.001 +
    aggregate.weightedReproductionAdvantage / 0.002
  );
}

function regimeId(thresholds: BehavioralPolicyThresholds): string {
  return `rh${formatThreshold(thresholds.reproductionHarvestThreshold)}_me${formatThreshold(thresholds.movementEnergyReserveThreshold)}_mh${formatThreshold(thresholds.movementMinRecentHarvest)}`;
}

function formatThreshold(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

if (process.argv[1]?.endsWith('policy-fitness-threshold-regime-panel.ts')) {
  runPolicyFitnessThresholdRegimePanelCli(process.argv.slice(2));
}
