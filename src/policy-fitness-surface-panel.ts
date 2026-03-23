import {
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_RUNS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STEPS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT,
  BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
  BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS,
  BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG
} from './behavioral-policy-fitness-pilot';
import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import {
  analyzePolicyFitnessComparison,
  PolicyFitnessAnalysis,
  PolicyFitnessAggregateComparison,
  PolicyFitnessCohortMetrics,
  PolicyFitnessGroupMetrics,
  PolicyFitnessRecord,
  summarizePolicyFitnessCohort
} from './policy-fitness';
import { Rng } from './rng';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig, StepSummary } from './types';

export const POLICY_FITNESS_SURFACE_PANEL_ARTIFACT = 'docs/policy_fitness_surface_panel_2026-03-23.json';

type PolicySurfaceArm = 'movement_only' | 'reproduction_only' | 'harvest_only' | 'combined' | 'no_policy';
type PolicyArmOutcome = 'advantage' | 'mixed' | 'detrimental' | 'baseline';
type DominantHarmConclusion = PolicySurfaceArm | 'combination' | 'none' | 'mixed';

export interface PolicyFitnessSurfacePanelInput {
  generatedAt?: string;
  runs?: number;
  steps?: number;
  seed?: number;
  seedStep?: number;
  stopWhenExtinct?: boolean;
}

interface PolicyFitnessSurfaceRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  finalSummary: StepSummary;
  armMetrics: PolicyFitnessCohortMetrics;
  controlMetrics: PolicyFitnessCohortMetrics;
  matchedBins: number;
  weightedHarvestAdvantage: number;
  weightedSurvivalAdvantage: number;
  weightedReproductionAdvantage: number;
}

interface PolicyFitnessSurfaceArmSummary {
  arm: Exclude<PolicySurfaceArm, 'no_policy'>;
  label: string;
  activePolicyKeys: string[];
  policyValues: Record<string, number>;
  runs: PolicyFitnessSurfaceRunSummary[];
  overall: {
    armMetrics: PolicyFitnessCohortMetrics;
    controlMetrics: PolicyFitnessCohortMetrics;
    matchedComparison: PolicyFitnessAnalysis['aggregate'];
  };
  support: {
    harvestAdvantagePositiveRunFraction: number;
    survivalAdvantagePositiveRunFraction: number;
    reproductionAdvantagePositiveRunFraction: number;
  };
  interpretation: {
    outcome: PolicyArmOutcome;
    summary: string;
  };
}

interface PolicyFitnessNoPolicyRunSummary {
  run: number;
  seed: number;
  stepsExecuted: number;
  extinct: boolean;
  finalSummary: StepSummary;
  metrics: PolicyFitnessCohortMetrics;
}

interface PolicyFitnessNoPolicySummary {
  arm: 'no_policy';
  label: string;
  runs: PolicyFitnessNoPolicyRunSummary[];
  overall: {
    metrics: PolicyFitnessCohortMetrics;
  };
  interpretation: {
    outcome: 'baseline';
    summary: string;
  };
}

interface MutableCohortAccumulator {
  exposures: number;
  harvestTotal: number;
  survivedTotal: number;
  offspringTotal: number;
  movementPolicyGatedTotal: number;
  reproductionPolicyGatedTotal: number;
  harvestPolicyGuidedTotal: number;
}

interface MutableComparisonAccumulator {
  positive: MutableCohortAccumulator;
  negative: MutableCohortAccumulator;
  bins: Map<
    string,
    {
      fertilityBin: number;
      crowdingBin: number;
      ageBin: number;
      disturbancePhase: number;
      positive: MutableCohortAccumulator;
      negative: MutableCohortAccumulator;
    }
  >;
}

export interface PolicyFitnessSurfacePanelArtifact {
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
    harvestSecondaryPreference: number;
    simulation: Partial<SimulationConfig>;
  };
  arms: PolicyFitnessSurfaceArmSummary[];
  noPolicy: PolicyFitnessNoPolicySummary;
  interpretation: {
    dominantHarm: DominantHarmConclusion;
    summary: string;
  };
}

const HARVEST_POLICY_SECONDARY_PREFERENCE = 0.85;
const PANEL_SIMULATION_CONFIG: Partial<SimulationConfig> = {
  ...BEHAVIORAL_POLICY_FITNESS_PILOT_SIMULATION_CONFIG,
  maxResource2: 8,
  resource2Regen: 0.7
};

const ARM_ORDER: ReadonlyArray<Exclude<PolicySurfaceArm, 'no_policy'>> = [
  'movement_only',
  'reproduction_only',
  'harvest_only',
  'combined'
];

export function runPolicyFitnessSurfacePanel(
  input: PolicyFitnessSurfacePanelInput = {}
): PolicyFitnessSurfacePanelArtifact {
  const runs = input.runs ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_RUNS;
  const steps = input.steps ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STEPS;
  const seed = input.seed ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED;
  const seedStep = input.seedStep ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_SEED_STEP;
  const stopWhenExtinct = input.stopWhenExtinct ?? BEHAVIORAL_POLICY_FITNESS_PILOT_DEFAULT_STOP_WHEN_EXTINCT;

  const arms = ARM_ORDER.map((arm) =>
    runPolicySurfaceArm({
      arm,
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct
    })
  );
  const noPolicy = runNoPolicyBaseline({
    runs,
    steps,
    seed,
    seedStep,
    stopWhenExtinct
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Which isolated behavioral policy surface is actually harmful or helpful under the refined March 22 policy-fitness attribution surface once movement, reproduction, and harvest policies are separated?',
    prediction:
      'If one surface dominates the current detriment, its matched-bin harvest and/or survival deltas should stay negative in isolation; if the harm is combinatorial, the combined arm should underperform more than any single-policy arm.',
    config: {
      runs,
      steps,
      seed,
      seedStep,
      stopWhenExtinct,
      initialAgents: BEHAVIORAL_POLICY_FITNESS_PILOT_INITIAL_AGENTS,
      policyShare: BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE,
      harvestSecondaryPreference: HARVEST_POLICY_SECONDARY_PREFERENCE,
      simulation: { ...PANEL_SIMULATION_CONFIG }
    },
    arms,
    noPolicy,
    interpretation: interpretSurfacePanel(arms)
  };
}

export function runPolicyFitnessSurfacePanelCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runPolicyFitnessSurfacePanel({ generatedAt }));
}

function runPolicySurfaceArm(input: {
  arm: Exclude<PolicySurfaceArm, 'no_policy'>;
  runs: number;
  steps: number;
  seed: number;
  seedStep: number;
  stopWhenExtinct: boolean;
}): PolicyFitnessSurfaceArmSummary {
  const runSummaries: PolicyFitnessSurfaceRunSummary[] = [];
  const overallAccumulator = createComparisonAccumulator();
  const armPredicate = buildArmPredicate(input.arm);

  for (let run = 0; run < input.runs; run += 1) {
    const runSeed = input.seed + run * input.seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: PANEL_SIMULATION_CONFIG,
      initialAgents: buildPanelInitialAgents(runSeed, input.arm)
    });
    const series = simulation.runWithPolicyFitness(input.steps, input.stopWhenExtinct);
    const finalSummary = series.summaries[series.summaries.length - 1];
    if (!finalSummary) {
      throw new Error(`Policy fitness surface panel arm ${input.arm} run ${run + 1} produced no summaries`);
    }

    const runArmRecords: PolicyFitnessRecord[] = [];
    const runControlRecords: PolicyFitnessRecord[] = [];
    for (const record of series.records) {
      if (armPredicate(record)) {
        runArmRecords.push(record);
        addComparisonRecord(overallAccumulator, record, 'positive');
        continue;
      }
      if (!record.hasAnyPolicy) {
        runControlRecords.push(record);
        addComparisonRecord(overallAccumulator, record, 'negative');
      }
    }
    const analysis = analyzePolicyFitnessComparison(
      series.records,
      armPredicate,
      (record) => !record.hasAnyPolicy
    );

    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      finalSummary,
      armMetrics: summarizePolicyFitnessCohort(runArmRecords),
      controlMetrics: summarizePolicyFitnessCohort(runControlRecords),
      matchedBins: analysis.aggregate.matchedBins,
      weightedHarvestAdvantage: analysis.aggregate.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: analysis.aggregate.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: analysis.aggregate.weightedReproductionAdvantage
    });
  }

  const overallAnalysis = summarizeComparisonAccumulator(overallAccumulator);

  return {
    arm: input.arm,
    label: armLabel(input.arm),
    activePolicyKeys: [...armPolicyState(input.arm).keys()],
    policyValues: Object.fromEntries(armPolicyState(input.arm)),
    runs: runSummaries,
    overall: {
      armMetrics: overallAnalysis.armMetrics,
      controlMetrics: overallAnalysis.controlMetrics,
      matchedComparison: overallAnalysis.aggregate
    },
    support: {
      harvestAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedHarvestAdvantage'),
      survivalAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedSurvivalAdvantage'),
      reproductionAdvantagePositiveRunFraction: positiveRunFraction(runSummaries, 'weightedReproductionAdvantage')
    },
    interpretation: interpretArm(input.arm, overallAnalysis.aggregate)
  };
}

function runNoPolicyBaseline(input: {
  runs: number;
  steps: number;
  seed: number;
  seedStep: number;
  stopWhenExtinct: boolean;
}): PolicyFitnessNoPolicySummary {
  const runSummaries: PolicyFitnessNoPolicyRunSummary[] = [];
  const overallAccumulator = createCohortAccumulator();

  for (let run = 0; run < input.runs; run += 1) {
    const runSeed = input.seed + run * input.seedStep;
    const simulation = new LifeSimulation({
      seed: runSeed,
      config: PANEL_SIMULATION_CONFIG,
      initialAgents: buildPanelInitialAgents(runSeed, 'no_policy')
    });
    const series = simulation.runWithPolicyFitness(input.steps, input.stopWhenExtinct);
    const finalSummary = series.summaries[series.summaries.length - 1];
    if (!finalSummary) {
      throw new Error(`Policy fitness surface panel no-policy run ${run + 1} produced no summaries`);
    }

    accumulateCohortRecords(overallAccumulator, series.records);
    runSummaries.push({
      run: run + 1,
      seed: runSeed,
      stepsExecuted: series.summaries.length,
      extinct: finalSummary.population === 0,
      finalSummary,
      metrics: summarizePolicyFitnessCohort(series.records)
    });
  }

  const metrics = summarizeCohortAccumulator(overallAccumulator);
  return {
    arm: 'no_policy',
    label: 'No Policy',
    runs: runSummaries,
    overall: { metrics },
    interpretation: {
      outcome: 'baseline',
      summary: `Baseline controls recorded harvest ${formatSigned(metrics.meanHarvestIntake)}, survival ${formatSigned(metrics.survivalRate)}, reproduction ${formatSigned(metrics.reproductionRate)}, with zero policy gating as expected.`
    }
  };
}

function buildPanelInitialAgents(seed: number, arm: PolicySurfaceArm): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: PANEL_SIMULATION_CONFIG
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

  if (arm === 'no_policy') {
    return agents;
  }

  const policyCount = Math.round(agents.length * BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_SHARE);
  const rng = new Rng(seed + 20_023);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));
  const policyState = armPolicyState(arm);

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map(policyState);
  }

  return agents;
}

function armPolicyState(arm: Exclude<PolicySurfaceArm, 'no_policy'>): ReadonlyMap<string, number> {
  if (arm === 'movement_only') {
    return new Map([
      [
        INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
        BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.movementEnergyReserveThreshold
      ],
      [
        INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
        BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.movementMinRecentHarvest
      ]
    ]);
  }

  if (arm === 'reproduction_only') {
    return new Map([
      [
        INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
        BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.reproductionHarvestThreshold
      ]
    ]);
  }

  if (arm === 'harvest_only') {
    return new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, HARVEST_POLICY_SECONDARY_PREFERENCE]]);
  }

  return new Map([
    [
      INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
      BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.reproductionHarvestThreshold
    ],
    [
      INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
      BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.movementEnergyReserveThreshold
    ],
    [
      INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
      BEHAVIORAL_POLICY_FITNESS_PILOT_POLICY_THRESHOLDS.movementMinRecentHarvest
    ],
    [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, HARVEST_POLICY_SECONDARY_PREFERENCE]
  ]);
}

function buildArmPredicate(
  arm: Exclude<PolicySurfaceArm, 'no_policy'>
): (record: PolicyFitnessRecord) => boolean {
  return (record) => {
    if (arm === 'movement_only') {
      return record.hasMovementPolicy && !record.hasReproductionPolicy && !record.hasHarvestPolicy;
    }
    if (arm === 'reproduction_only') {
      return !record.hasMovementPolicy && record.hasReproductionPolicy && !record.hasHarvestPolicy;
    }
    if (arm === 'harvest_only') {
      return !record.hasMovementPolicy && !record.hasReproductionPolicy && record.hasHarvestPolicy;
    }

    return record.hasMovementPolicy && record.hasReproductionPolicy && record.hasHarvestPolicy;
  };
}

function interpretArm(
  arm: Exclude<PolicySurfaceArm, 'no_policy'>,
  aggregate: PolicyFitnessAnalysis['aggregate']
): { outcome: PolicyArmOutcome; summary: string } {
  const outcome = classifyOutcome(aggregate);
  return {
    outcome,
    summary: `${armLabel(arm)} vs control: matched bins ${aggregate.matchedBins}, harvest ${formatSigned(aggregate.weightedHarvestAdvantage)}, survival ${formatSigned(aggregate.weightedSurvivalAdvantage)}, reproduction ${formatSigned(aggregate.weightedReproductionAdvantage)}.`
  };
}

function interpretSurfacePanel(
  arms: ReadonlyArray<PolicyFitnessSurfaceArmSummary>
): PolicyFitnessSurfacePanelArtifact['interpretation'] {
  const byArm = new Map(arms.map((arm) => [arm.arm, arm]));
  const singleArms = arms.filter((arm) => arm.arm !== 'combined');
  const worstSingle = [...singleArms].sort(
    (left, right) =>
      left.overall.matchedComparison.weightedHarvestAdvantage -
      right.overall.matchedComparison.weightedHarvestAdvantage
  )[0];
  const combined = byArm.get('combined');

  if (!worstSingle || !combined) {
    return {
      dominantHarm: 'mixed',
      summary: 'Surface panel did not produce enough arm summaries to resolve a dominant harm surface.'
    };
  }

  const combinedHarvest = combined.overall.matchedComparison.weightedHarvestAdvantage;
  const worstSingleHarvest = worstSingle.overall.matchedComparison.weightedHarvestAdvantage;
  const allSinglesNearNeutral = singleArms.every(
    (arm) => arm.overall.matchedComparison.weightedHarvestAdvantage > -0.01
  );

  if (combinedHarvest < -0.02 && (allSinglesNearNeutral || combinedHarvest < worstSingleHarvest - 0.01)) {
    return {
      dominantHarm: 'combination',
      summary: `The main penalty appears in combination: combined harvest delta ${formatSigned(combinedHarvest)} is more negative than any isolated surface, while the worst single arm is ${worstSingle.label.toLowerCase()} at ${formatSigned(worstSingleHarvest)}.`
    };
  }

  if (worstSingleHarvest < -0.02) {
    return {
      dominantHarm: worstSingle.arm,
      summary: `${worstSingle.label} is the clearest isolated detriment: harvest delta ${formatSigned(worstSingleHarvest)}, survival ${formatSigned(worstSingle.overall.matchedComparison.weightedSurvivalAdvantage)}, reproduction ${formatSigned(worstSingle.overall.matchedComparison.weightedReproductionAdvantage)}. Combined lands at harvest ${formatSigned(combinedHarvest)}.`
    };
  }

  if (arms.every((arm) => arm.overall.matchedComparison.weightedHarvestAdvantage > -0.01)) {
    return {
      dominantHarm: 'none',
      summary: 'No isolated surface produced a materially negative matched-bin harvest signal in this bounded panel; the earlier detriment does not replicate cleanly under these separated arms.'
    };
  }

  return {
    dominantHarm: 'mixed',
    summary: `No single story dominates cleanly. Worst isolated harvest delta is ${worstSingle.label.toLowerCase()} at ${formatSigned(worstSingleHarvest)}, while combined lands at ${formatSigned(combinedHarvest)}.`
  };
}

function classifyOutcome(aggregate: PolicyFitnessAnalysis['aggregate']): PolicyArmOutcome {
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
  if (negativeSignals >= 2 && positiveSignals === 0) {
    return 'detrimental';
  }
  return 'mixed';
}

function armLabel(arm: Exclude<PolicySurfaceArm, 'no_policy'>): string {
  if (arm === 'movement_only') {
    return 'Movement Only';
  }
  if (arm === 'reproduction_only') {
    return 'Reproduction Only';
  }
  if (arm === 'harvest_only') {
    return 'Harvest Only';
  }
  return 'Combined';
}

function positiveRunFraction(
  runs: ReadonlyArray<PolicyFitnessSurfaceRunSummary>,
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

function createCohortAccumulator(): MutableCohortAccumulator {
  return {
    exposures: 0,
    harvestTotal: 0,
    survivedTotal: 0,
    offspringTotal: 0,
    movementPolicyGatedTotal: 0,
    reproductionPolicyGatedTotal: 0,
    harvestPolicyGuidedTotal: 0
  };
}

function createComparisonAccumulator(): MutableComparisonAccumulator {
  return {
    positive: createCohortAccumulator(),
    negative: createCohortAccumulator(),
    bins: new Map()
  };
}

function addComparisonRecord(
  accumulator: MutableComparisonAccumulator,
  record: PolicyFitnessRecord,
  cohort: 'positive' | 'negative'
): void {
  const overallTarget = cohort === 'positive' ? accumulator.positive : accumulator.negative;
  addCohortRecord(overallTarget, record);

  const key = `${record.fertilityBin}:${record.crowdingBin}:${record.ageBin}:${record.disturbancePhase}`;
  let bin = accumulator.bins.get(key);
  if (!bin) {
    bin = {
      fertilityBin: record.fertilityBin,
      crowdingBin: record.crowdingBin,
      ageBin: record.ageBin,
      disturbancePhase: record.disturbancePhase,
      positive: createCohortAccumulator(),
      negative: createCohortAccumulator()
    };
    accumulator.bins.set(key, bin);
  }

  addCohortRecord(cohort === 'positive' ? bin.positive : bin.negative, record);
}

function accumulateCohortRecords(
  accumulator: MutableCohortAccumulator,
  records: ReadonlyArray<PolicyFitnessRecord>
): void {
  for (const record of records) {
    addCohortRecord(accumulator, record);
  }
}

function addCohortRecord(accumulator: MutableCohortAccumulator, record: PolicyFitnessRecord): void {
  accumulator.exposures += 1;
  accumulator.harvestTotal += record.harvestIntake;
  accumulator.survivedTotal += Number(record.survived);
  accumulator.offspringTotal += record.offspringProduced;
  accumulator.movementPolicyGatedTotal += Number(record.movementPolicyGated);
  accumulator.reproductionPolicyGatedTotal += Number(record.reproductionPolicyGated);
  accumulator.harvestPolicyGuidedTotal += Number(record.harvestPolicyGuided);
}

function summarizeCohortAccumulator(accumulator: MutableCohortAccumulator): PolicyFitnessCohortMetrics {
  if (accumulator.exposures === 0) {
    return {
      exposures: 0,
      meanHarvestIntake: 0,
      survivalRate: 0,
      reproductionRate: 0,
      movementPolicyGatedRate: 0,
      reproductionPolicyGatedRate: 0,
      harvestPolicyGuidedRate: 0
    };
  }

  return {
    exposures: accumulator.exposures,
    meanHarvestIntake: accumulator.harvestTotal / accumulator.exposures,
    survivalRate: accumulator.survivedTotal / accumulator.exposures,
    reproductionRate: accumulator.offspringTotal / accumulator.exposures,
    movementPolicyGatedRate: accumulator.movementPolicyGatedTotal / accumulator.exposures,
    reproductionPolicyGatedRate: accumulator.reproductionPolicyGatedTotal / accumulator.exposures,
    harvestPolicyGuidedRate: accumulator.harvestPolicyGuidedTotal / accumulator.exposures
  };
}

function summarizeGroupAccumulator(accumulator: MutableCohortAccumulator): PolicyFitnessGroupMetrics {
  const cohort = summarizeCohortAccumulator(accumulator);
  return {
    exposures: cohort.exposures,
    meanHarvestIntake: cohort.meanHarvestIntake,
    survivalRate: cohort.survivalRate,
    reproductionRate: cohort.reproductionRate
  };
}

function summarizeComparisonAccumulator(accumulator: MutableComparisonAccumulator): {
  armMetrics: PolicyFitnessCohortMetrics;
  controlMetrics: PolicyFitnessCohortMetrics;
  aggregate: PolicyFitnessAggregateComparison;
} {
  const matchedBins = [...accumulator.bins.values()]
    .map((bin) => {
      const positive = summarizeGroupAccumulator(bin.positive);
      const negative = summarizeGroupAccumulator(bin.negative);
      if (positive.exposures === 0 || negative.exposures === 0) {
        return undefined;
      }

      const weight = Math.min(positive.exposures, negative.exposures);
      return {
        weight,
        harvestDelta: positive.meanHarvestIntake - negative.meanHarvestIntake,
        survivalDelta: positive.survivalRate - negative.survivalRate,
        reproductionDelta: positive.reproductionRate - negative.reproductionRate
      };
    })
    .filter((bin): bin is NonNullable<typeof bin> => bin !== undefined);

  const totalWeight = matchedBins.reduce((sum, bin) => sum + bin.weight, 0);

  return {
    armMetrics: summarizeCohortAccumulator(accumulator.positive),
    controlMetrics: summarizeCohortAccumulator(accumulator.negative),
    aggregate: {
      matchedBins: matchedBins.length,
      policyPositiveExposures: accumulator.positive.exposures,
      policyNegativeExposures: accumulator.negative.exposures,
      weightedHarvestAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.harvestDelta, bin.weight])),
      weightedSurvivalAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.survivalDelta, bin.weight])),
      weightedReproductionAdvantage:
        totalWeight === 0 ? 0 : weightedMean(matchedBins.map((bin) => [bin.reproductionDelta, bin.weight]))
    }
  };
}

function weightedMean(values: ReadonlyArray<readonly [number, number]>): number {
  let totalWeight = 0;
  let total = 0;
  for (const [value, weight] of values) {
    if (weight <= 0) {
      continue;
    }
    totalWeight += weight;
    total += value * weight;
  }
  return totalWeight === 0 ? 0 : total / totalWeight;
}

if (process.argv[1]?.endsWith('policy-fitness-surface-panel.ts')) {
  runPolicyFitnessSurfacePanelCli(process.argv.slice(2));
}
