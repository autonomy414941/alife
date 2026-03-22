import { AgentSeed, SimulationConfig, StepSummary } from './types';
import {
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation } from './simulation';
import { Rng } from './rng';
import { analyzePolicyFitnessRecords, PolicyFitnessAnalysis, PolicyFitnessRecord } from './policy-fitness';

export const BEHAVIORAL_POLICY_FITNESS_PILOT_ARTIFACT =
  'docs/behavioral_policy_fitness_pilot_2026-03-21.json';

export interface BehavioralPolicyFitnessPilotInput {
  generatedAt?: string;
  runs?: number;
  steps?: number;
  seed?: number;
  seedStep?: number;
  stopWhenExtinct?: boolean;
}

export interface BehavioralPolicyFitnessPilotRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  finalSummary: StepSummary;
  policyPositiveExposures: number;
  policyNegativeExposures: number;
  matchedBins: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
}

export interface BehavioralPolicyFitnessPilotArtifact {
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
    policyThresholds: {
      reproductionHarvestThreshold: number;
      movementEnergyReserveThreshold: number;
      movementMinRecentHarvest: number;
    };
    simulation: Partial<SimulationConfig>;
  };
  runs: BehavioralPolicyFitnessPilotRunSummary[];
  overall: PolicyFitnessAnalysis;
  support: {
    harvestAdvantagePositiveRunFraction: number;
    survivalAdvantagePositiveRunFraction: number;
    reproductionAdvantagePositiveRunFraction: number;
  };
  interpretation: {
    outcome: 'advantage' | 'mixed' | 'detrimental';
    summary: string;
  };
}

const POLICY_SHARE = 0.5;
const INITIAL_AGENTS = 48;
const DEFAULT_RUNS = 6;
const DEFAULT_STEPS = 300;
const DEFAULT_SEED = 90210;
const DEFAULT_SEED_STEP = 37;
const DEFAULT_STOP_WHEN_EXTINCT = true;

const POLICY_THRESHOLDS = {
  reproductionHarvestThreshold: 0.6,
  movementEnergyReserveThreshold: 8,
  movementMinRecentHarvest: 0.5
} as const;

const PILOT_SIMULATION_CONFIG: Partial<SimulationConfig> = {
  width: 20,
  height: 20,
  initialAgents: INITIAL_AGENTS,
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
  maxAge: 120
};

export function runBehavioralPolicyFitnessPilot(
  input: BehavioralPolicyFitnessPilotInput = {}
): BehavioralPolicyFitnessPilotArtifact {
  const runs = input.runs ?? DEFAULT_RUNS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const seed = input.seed ?? DEFAULT_SEED;
  const seedStep = input.seedStep ?? DEFAULT_SEED_STEP;
  const stopWhenExtinct = input.stopWhenExtinct ?? DEFAULT_STOP_WHEN_EXTINCT;
  const runSummaries: BehavioralPolicyFitnessPilotRunSummary[] = [];
  const allRecords: PolicyFitnessRecord[] = [];

  for (let run = 0; run < runs; run += 1) {
    const runSeed = seed + run * seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: PILOT_SIMULATION_CONFIG,
      initialAgents: buildPilotInitialAgents(runSeed)
    });
    const series = simulation.runWithPolicyFitness(steps, stopWhenExtinct);
    const finalSummary = series.summaries[series.summaries.length - 1];
    if (!finalSummary) {
      throw new Error(`Behavioral policy fitness pilot run ${run + 1} produced no step summaries`);
    }

    for (const record of series.records) {
      allRecords.push(record);
    }
    const analysis = analyzePolicyFitnessRecords(series.records);
    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      finalSummary,
      policyPositiveExposures: analysis.aggregate.policyPositiveExposures,
      policyNegativeExposures: analysis.aggregate.policyNegativeExposures,
      matchedBins: analysis.aggregate.matchedBins,
      weightedHarvestAdvantage: analysis.aggregate.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: analysis.aggregate.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: analysis.aggregate.weightedReproductionAdvantage
    });
  }

  const overall = analyzePolicyFitnessRecords(allRecords);
  const support = {
    harvestAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedHarvestAdvantage'),
    survivalAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedSurvivalAdvantage'),
    reproductionAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedReproductionAdvantage')
  };
  const interpretation = interpretPilot(overall);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Do agents carrying movement and reproduction policy thresholds outperform default agents in matched fertility and crowding bins?',
    prediction:
      'If contingent policies convert local state into ecological advantage, policy-positive agents should improve survival and reproduction at similar local fertility and crowding, not just drift into richer cells.',
    config: {
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct,
      initialAgents: INITIAL_AGENTS,
      policyShare: POLICY_SHARE,
      policyThresholds: { ...POLICY_THRESHOLDS },
      simulation: { ...PILOT_SIMULATION_CONFIG }
    },
    runs: runSummaries,
    overall,
    support,
    interpretation
  };
}

export function runBehavioralPolicyFitnessPilotCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runBehavioralPolicyFitnessPilot({ generatedAt }));
}

function buildPilotInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: PILOT_SIMULATION_CONFIG
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
  const policyCount = Math.round(agents.length * POLICY_SHARE);
  const rng = new Rng(seed + 10_001);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map([
      [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, POLICY_THRESHOLDS.reproductionHarvestThreshold],
      [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, POLICY_THRESHOLDS.movementEnergyReserveThreshold],
      [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, POLICY_THRESHOLDS.movementMinRecentHarvest]
    ]);
  }

  return agents;
}

function positiveRunFraction(
  runs: ReadonlyArray<BehavioralPolicyFitnessPilotRunSummary>,
  key:
    | 'weightedHarvestAdvantage'
    | 'weightedSurvivalAdvantage'
    | 'weightedReproductionAdvantage'
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

function interpretPilot(overall: PolicyFitnessAnalysis): BehavioralPolicyFitnessPilotArtifact['interpretation'] {
  const harvest = overall.aggregate.weightedHarvestAdvantage;
  const survival = overall.aggregate.weightedSurvivalAdvantage;
  const reproduction = overall.aggregate.weightedReproductionAdvantage;
  const positiveSignals = [
    isMeaningfullyPositive(harvest, 0.02),
    isMeaningfullyPositive(survival, 0.001),
    isMeaningfullyPositive(reproduction, 0.002)
  ].filter(Boolean).length;
  const negativeSignals = [
    isMeaningfullyNegative(harvest, 0.02),
    isMeaningfullyNegative(survival, 0.001),
    isMeaningfullyNegative(reproduction, 0.002)
  ].filter(Boolean).length;

  if (positiveSignals >= 2 && negativeSignals === 0) {
    return {
      outcome: 'advantage',
      summary: `Policy-positive agents improved matched-bin fitness overall: harvest ${formatSigned(harvest)}, survival ${formatSigned(survival)}, reproduction ${formatSigned(reproduction)}.`
    };
  }

  if (negativeSignals >= 2 && positiveSignals === 0) {
    return {
      outcome: 'detrimental',
      summary: `Policy-positive agents underperformed in matched bins: harvest ${formatSigned(harvest)}, survival ${formatSigned(survival)}, reproduction ${formatSigned(reproduction)}.`
    };
  }

  return {
    outcome: 'mixed',
    summary: `Policy-positive agents produced mixed matched-bin effects: harvest ${formatSigned(harvest)}, survival ${formatSigned(survival)}, reproduction ${formatSigned(reproduction)}.`
  };
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

function isMeaningfullyPositive(value: number, threshold: number): boolean {
  return value > Math.abs(threshold);
}

function isMeaningfullyNegative(value: number, threshold: number): boolean {
  return value < -Math.abs(threshold);
}

if (process.argv[1]?.endsWith('behavioral-policy-fitness-pilot.ts')) {
  runBehavioralPolicyFitnessPilotCli(process.argv.slice(2));
}
