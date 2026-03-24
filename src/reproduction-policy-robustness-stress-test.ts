import {
  BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS
} from './behavioral-policy-fitness-pilot';
import { INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD } from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import {
  analyzePolicyFitnessComparison,
  PolicyFitnessAnalysis,
  PolicyFitnessCohortMetrics,
  PolicyFitnessRecord,
  summarizePolicyFitnessCohort
} from './policy-fitness';
import { Rng } from './rng';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig, StepSummary } from './types';

export const REPRODUCTION_POLICY_ROBUSTNESS_STRESS_TEST_ARTIFACT =
  'docs/reproduction_policy_robustness_stress_test_2026-03-24.json';

const STRESS_TEST_RUNS = 6;
const STRESS_TEST_STEPS = 200;
const STRESS_TEST_SEED = 90210;
const STRESS_TEST_SEED_STEP = 37;
const STOP_WHEN_EXTINCT = true;

const SIMULATION_CONFIG: Partial<SimulationConfig> = {
  width: 20,
  height: 20,
  initialAgents: 48,
  initialEnergy: 12,
  resourceRegen: 0.7,
  maxResource: 8,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  harvestCap: 2.5,
  reproduceThreshold: 20,
  reproduceProbability: 0.35,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  policyMutationProbability: 0.12,
  policyMutationMagnitude: 0.15,
  biomeBands: 4,
  biomeContrast: 0.45,
  maxAge: 120,
  maxResource2: 8,
  resource2Regen: 0.7
};

interface RunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  finalSummary: StepSummary;
  policyMetrics: PolicyFitnessCohortMetrics;
  controlMetrics: PolicyFitnessCohortMetrics;
  matchedBins: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
}

export interface ReproductionPolicyRobustnessStressTestInput {
  generatedAt?: string;
  runs?: number;
  steps?: number;
  seed?: number;
  seedStep?: number;
}

export interface ReproductionPolicyRobustnessStressTestArtifact {
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
    reproductionHarvestThreshold: number;
    simulation: Partial<SimulationConfig>;
  };
  runs: RunSummary[];
  overall: {
    policyMetrics: PolicyFitnessCohortMetrics;
    controlMetrics: PolicyFitnessCohortMetrics;
    matchedComparison: PolicyFitnessAnalysis['aggregate'];
  };
  support: {
    harvestAdvantagePositiveRunFraction: number;
    survivalAdvantagePositiveRunFraction: number;
    reproductionAdvantagePositiveRunFraction: number;
  };
  conclusion: {
    signal: 'robust' | 'vanished' | 'reversed' | 'mixed';
    summary: string;
  };
}

export function runReproductionPolicyRobustnessStressTest(
  input: ReproductionPolicyRobustnessStressTestInput = {}
): ReproductionPolicyRobustnessStressTestArtifact {
  const runs = input.runs ?? STRESS_TEST_RUNS;
  const steps = input.steps ?? STRESS_TEST_STEPS;
  const seed = input.seed ?? STRESS_TEST_SEED;
  const seedStep = input.seedStep ?? STRESS_TEST_SEED_STEP;

  const runSummaries: RunSummary[] = [];
  const overallPolicyRecords: PolicyFitnessRecord[] = [];
  const overallControlRecords: PolicyFitnessRecord[] = [];

  for (let run = 0; run < runs; run += 1) {
    const runSeed = seed + run * seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: SIMULATION_CONFIG,
      initialAgents: buildInitialAgents(runSeed)
    });

    const series = simulation.runWithPolicyFitness(steps, STOP_WHEN_EXTINCT);
    const finalSummary = series.summaries[series.summaries.length - 1];
    if (!finalSummary) {
      throw new Error(`Reproduction policy robustness stress test run ${run + 1} produced no summaries`);
    }

    const runPolicyRecords: PolicyFitnessRecord[] = [];
    const runControlRecords: PolicyFitnessRecord[] = [];

    for (const record of series.records) {
      if (record.hasReproductionPolicy && !record.hasMovementPolicy && !record.hasHarvestPolicy) {
        runPolicyRecords.push(record);
        overallPolicyRecords.push(record);
        continue;
      }
      if (!record.hasAnyPolicy) {
        runControlRecords.push(record);
        overallControlRecords.push(record);
      }
    }

    const analysis = analyzePolicyFitnessComparison(
      series.records,
      (record) => record.hasReproductionPolicy && !record.hasMovementPolicy && !record.hasHarvestPolicy,
      (record) => !record.hasAnyPolicy
    );

    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      finalSummary,
      policyMetrics: summarizePolicyFitnessCohort(runPolicyRecords),
      controlMetrics: summarizePolicyFitnessCohort(runControlRecords),
      matchedBins: analysis.aggregate.matchedBins,
      weightedHarvestAdvantage: analysis.aggregate.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: analysis.aggregate.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: analysis.aggregate.weightedReproductionAdvantage
    });
  }

  const overallAnalysis = analyzePolicyFitnessComparison(
    [...overallPolicyRecords, ...overallControlRecords],
    (record) => record.hasReproductionPolicy && !record.hasMovementPolicy && !record.hasHarvestPolicy,
    (record) => !record.hasAnyPolicy
  );

  const support = {
    harvestAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedHarvestAdvantage'),
    survivalAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedSurvivalAdvantage'),
    reproductionAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedReproductionAdvantage')
  };

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does the March 23 reproduction-only advantage persist over a longer horizon and broader seed panel, or was it a short-panel artifact?',
    prediction:
      'If the signal is real, the weighted harvest and reproduction advantages should remain positive across most runs; if it was an artifact, the deltas should vanish or reverse.',
    config: {
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct: STOP_WHEN_EXTINCT,
      initialAgents: BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
      policyShare: BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
      reproductionHarvestThreshold: BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.reproductionHarvestThreshold,
      simulation: { ...SIMULATION_CONFIG }
    },
    runs: runSummaries,
    overall: {
      policyMetrics: summarizePolicyFitnessCohort(overallPolicyRecords),
      controlMetrics: summarizePolicyFitnessCohort(overallControlRecords),
      matchedComparison: overallAnalysis.aggregate
    },
    support,
    conclusion: interpretResults(overallAnalysis.aggregate, support)
  };
}

export function runReproductionPolicyRobustnessStressTestCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runReproductionPolicyRobustnessStressTest({ generatedAt }));
}

function buildInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: SIMULATION_CONFIG
  });
  const snapshot = seeder.snapshot();
  const agents: AgentSeed[] = snapshot.agents.map((agent) => ({
    x: agent.x,
    y: agent.y,
    energy: agent.energy,
    energyPrimary: agent.energyPrimary,
    energySecondary: agent.energySecondary,
    age: agent.age,
    lineage: agent.lineage,
    species: agent.species,
    genome: { ...agent.genome },
    genomeV2: agent.genomeV2,
    policyState: undefined,
    transientState: undefined
  }));

  const policyCount = Math.round(agents.length * BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE);
  const rng = new Rng(seed + 20_023);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map([
      [
        INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
        BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.reproductionHarvestThreshold
      ]
    ]);
  }

  return agents;
}

function interpretResults(
  aggregate: PolicyFitnessAnalysis['aggregate'],
  support: {
    harvestAdvantagePositiveRunFraction: number;
    survivalAdvantagePositiveRunFraction: number;
    reproductionAdvantagePositiveRunFraction: number;
  }
): { signal: 'robust' | 'vanished' | 'reversed' | 'mixed'; summary: string } {
  const harvestAdvantage = aggregate.weightedHarvestAdvantage;
  const survivalAdvantage = aggregate.weightedSurvivalAdvantage;
  const reproductionAdvantage = aggregate.weightedReproductionAdvantage;

  if (harvestAdvantage > 0.02 && reproductionAdvantage > 0.001 && support.harvestAdvantagePositiveRunFraction >= 0.66) {
    return {
      signal: 'robust',
      summary: `The reproduction-only advantage survives stress testing: harvest ${formatSigned(harvestAdvantage)}, survival ${formatSigned(survivalAdvantage)}, reproduction ${formatSigned(reproductionAdvantage)}, with harvest positive in ${formatPercent(support.harvestAdvantagePositiveRunFraction)} of runs and reproduction positive in ${formatPercent(support.reproductionAdvantagePositiveRunFraction)} of runs. The signal is real enough to build on.`
    };
  }

  if (harvestAdvantage < -0.02 || reproductionAdvantage < -0.001) {
    return {
      signal: 'reversed',
      summary: `The reproduction-only signal reverses under stress testing: harvest ${formatSigned(harvestAdvantage)}, survival ${formatSigned(survivalAdvantage)}, reproduction ${formatSigned(reproductionAdvantage)}. The March 23 advantage was a short-panel artifact. This is not a viable foothold.`
    };
  }

  if (Math.abs(harvestAdvantage) <= 0.01 && Math.abs(reproductionAdvantage) <= 0.0005) {
    return {
      signal: 'vanished',
      summary: `The reproduction-only signal vanishes under stress testing: harvest ${formatSigned(harvestAdvantage)}, survival ${formatSigned(survivalAdvantage)}, reproduction ${formatSigned(reproductionAdvantage)}, all near zero. The March 23 advantage does not replicate cleanly over a longer horizon and broader seed panel.`
    };
  }

  return {
    signal: 'mixed',
    summary: `The reproduction-only signal is inconsistent under stress testing: harvest ${formatSigned(harvestAdvantage)}, survival ${formatSigned(survivalAdvantage)}, reproduction ${formatSigned(reproductionAdvantage)}, with harvest positive in ${formatPercent(support.harvestAdvantagePositiveRunFraction)} of runs. The evidence is too ambiguous to recommend building on this surface without further validation.`
  };
}

function positiveRunFraction(
  runs: ReadonlyArray<RunSummary>,
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

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(4)}`;
}

function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(0)}%`;
}

if (process.argv[1]?.endsWith('reproduction-policy-robustness-stress-test.ts')) {
  runReproductionPolicyRobustnessStressTestCli(process.argv.slice(2));
}
