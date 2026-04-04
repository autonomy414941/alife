import { fromGenome, setTrait } from './genome-v2';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export const PERCEPTION_QUALITY_VALIDATION_ARTIFACT = 'docs/perception_quality_validation_2026-04-04.json';

const DEFAULT_SEEDS = [4401, 4402, 4403, 4404, 4405, 4406, 4407, 4408];
const DEFAULT_STEPS = 35;
const DEFAULT_LIMITED_PERCEPTION = {
  noise: 0.18,
  fidelity: 0.82
} as const;

const VALIDATION_CONFIG: Partial<SimulationConfig> = {
  width: 6,
  height: 6,
  initialAgents: 12,
  initialEnergy: 10.5,
  maxResource: 6,
  maxResource2: 5,
  resourceRegen: 0.5,
  resource2Regen: 0.35,
  seasonalFertilityContrastAmplitude: 0.4,
  dispersalPressure: 0.75,
  habitatPreferenceStrength: 0.35,
  metabolismCostBase: 0.3,
  moveCost: 0.2,
  harvestCap: 1.2,
  contextualHarvestExpression: false,
  reproduceThreshold: 13,
  reproduceProbability: 0.32,
  offspringEnergyFraction: 0.42,
  mutationAmount: 0.03,
  policyMutationProbability: 0,
  policyMutationMagnitude: 0,
  disturbanceInterval: 12,
  disturbanceResourceLoss: 1.15,
  disturbanceRadius: 1,
  disturbanceRefugiaFraction: 0.18,
  maxAge: 70
};

export interface PerceptionQualityValidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
  limitedPerception?: Partial<PerceptionSetting>;
}

export interface PerceptionSetting {
  noise: number;
  fidelity: number;
}

export interface PerceptionMovementValidationMetrics {
  founderSurvivalRate: number;
  finalPopulation: number;
  extantDescendants: number;
  totalBirths: number;
  meanFinalEnergy: number;
  meanMovementDecisionsPerStep: number;
}

export interface PerceptionMovementValidationCheck {
  seed: number;
  perfectInformation: PerceptionMovementValidationMetrics;
  limitedPerception: PerceptionMovementValidationMetrics;
  delta: {
    founderSurvivalRate: number;
    finalPopulation: number;
    extantDescendants: number;
    totalBirths: number;
    meanFinalEnergy: number;
    meanMovementDecisionsPerStep: number;
  };
}

export type PerceptionMovementValidationVerdict = 'positive' | 'neutral' | 'negative';

export interface PerceptionQualityValidationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    simulation: Partial<SimulationConfig>;
    limitedPerception: PerceptionSetting;
  };
  summary: {
    seeds: number;
    seedsWithMovementActivity: number;
    seedsLimitedPopulationAdvantage: number;
    seedsLimitedPopulationDisadvantage: number;
    meanFounderSurvivalRateDelta: number;
    meanFinalPopulationDelta: number;
    meanExtantDescendantsDelta: number;
    meanTotalBirthsDelta: number;
    meanFinalEnergyDelta: number;
    meanMovementDecisionsPerStepDelta: number;
    verdict: PerceptionMovementValidationVerdict;
    interpretation: string;
  };
  checks: PerceptionMovementValidationCheck[];
}

export function runPerceptionQualityValidation(
  input: PerceptionQualityValidationInput = {}
): PerceptionQualityValidationArtifact {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const limitedPerception = {
    noise: input.limitedPerception?.noise ?? DEFAULT_LIMITED_PERCEPTION.noise,
    fidelity: input.limitedPerception?.fidelity ?? DEFAULT_LIMITED_PERCEPTION.fidelity
  };

  const checks = seeds.map((seed) => {
    const perfectInformation = runArm(seed, steps, {
      noise: 0,
      fidelity: 1
    });
    const limitedPerceptionMetrics = runArm(seed, steps, limitedPerception);

    return {
      seed,
      perfectInformation,
      limitedPerception: limitedPerceptionMetrics,
      delta: {
        founderSurvivalRate:
          limitedPerceptionMetrics.founderSurvivalRate - perfectInformation.founderSurvivalRate,
        finalPopulation: limitedPerceptionMetrics.finalPopulation - perfectInformation.finalPopulation,
        extantDescendants:
          limitedPerceptionMetrics.extantDescendants - perfectInformation.extantDescendants,
        totalBirths: limitedPerceptionMetrics.totalBirths - perfectInformation.totalBirths,
        meanFinalEnergy: limitedPerceptionMetrics.meanFinalEnergy - perfectInformation.meanFinalEnergy,
        meanMovementDecisionsPerStep:
          limitedPerceptionMetrics.meanMovementDecisionsPerStep -
          perfectInformation.meanMovementDecisionsPerStep
      }
    };
  });

  const summary = buildSummary(checks);

  return {
    generatedAt,
    question:
      'Under a shared-seed matched-control panel, does limited-perception movement outperform or underperform an otherwise identical perfect-information movement baseline on founder survival and descendant outcomes?',
    prediction:
      'If partial observability creates a robustness advantage, limited-perception movement should hold founder survival roughly constant while matching or improving descendant counts; otherwise it should trail the omniscient baseline on final population and births.',
    methodology:
      `Run ${steps}-step shared-seed paired simulations for ${seeds.length} seeds with contextual harvest disabled so perception differences only affect movement scoring. ` +
      'Both arms start from the same genome-backed cohort and ecology; the limited arm uses fixed perception noise and fidelity loss while the control arm reads exact local observations.',
    config: {
      seeds: [...seeds],
      steps,
      simulation: VALIDATION_CONFIG,
      limitedPerception
    },
    summary,
    checks
  };
}

function runArm(seed: number, steps: number, perception: PerceptionSetting): PerceptionMovementValidationMetrics {
  const simulation = new LifeSimulation({
    seed,
    config: VALIDATION_CONFIG,
    initialAgents: buildInitialAgents(perception)
  });
  const founderIds = new Set(simulation.snapshot().agents.map((agent) => agent.id));
  const series = simulation.runWithPolicyFitness(steps);
  const finalSnapshot = simulation.snapshot();
  const survivingFounders = finalSnapshot.agents.filter((agent) => founderIds.has(agent.id)).length;

  return {
    founderSurvivalRate: founderIds.size === 0 ? 0 : survivingFounders / founderIds.size,
    finalPopulation: finalSnapshot.population,
    extantDescendants: Math.max(0, finalSnapshot.population - survivingFounders),
    totalBirths: series.summaries.reduce((sum, summary) => sum + summary.births, 0),
    meanFinalEnergy: mean(finalSnapshot.agents.map((agent) => agent.energy)),
    meanMovementDecisionsPerStep: mean(
      series.summaries.map((summary) => summary.policyObservability?.movement.decisions ?? 0)
    )
  };
}

function buildInitialAgents(perception: PerceptionSetting): AgentSeed[] {
  return Array.from({ length: 12 }, (_, index) => {
    const genome = {
      metabolism: 0.7,
      harvest: 0.78,
      aggression: 0.12,
      harvestEfficiency2: 0.3
    };
    const genomeV2 = fromGenome(genome);
    setTrait(genomeV2, 'perception_noise', perception.noise);
    setTrait(genomeV2, 'perception_fidelity', perception.fidelity);

    return {
      x: (index % 4) + 1,
      y: Math.floor(index / 4) + 1,
      energy: 10.5,
      genome,
      genomeV2
    };
  });
}

function buildSummary(
  checks: PerceptionMovementValidationCheck[]
): PerceptionQualityValidationArtifact['summary'] {
  const meanFounderSurvivalRateDelta = mean(checks.map((check) => check.delta.founderSurvivalRate));
  const meanFinalPopulationDelta = mean(checks.map((check) => check.delta.finalPopulation));
  const meanExtantDescendantsDelta = mean(checks.map((check) => check.delta.extantDescendants));
  const meanTotalBirthsDelta = mean(checks.map((check) => check.delta.totalBirths));
  const meanFinalEnergyDelta = mean(checks.map((check) => check.delta.meanFinalEnergy));
  const meanMovementDecisionsPerStepDelta = mean(
    checks.map((check) => check.delta.meanMovementDecisionsPerStep)
  );
  const seedsLimitedPopulationAdvantage = checks.filter((check) => check.delta.finalPopulation > 0).length;
  const seedsLimitedPopulationDisadvantage = checks.filter((check) => check.delta.finalPopulation < 0).length;
  const seedsWithMovementActivity = checks.filter(
    (check) =>
      check.perfectInformation.meanMovementDecisionsPerStep > 0 &&
      check.limitedPerception.meanMovementDecisionsPerStep > 0
  ).length;
  const verdict = classifyVerdict({
    meanFounderSurvivalRateDelta,
    meanFinalPopulationDelta,
    meanExtantDescendantsDelta,
    meanTotalBirthsDelta
  });

  return {
    seeds: checks.length,
    seedsWithMovementActivity,
    seedsLimitedPopulationAdvantage,
    seedsLimitedPopulationDisadvantage,
    meanFounderSurvivalRateDelta,
    meanFinalPopulationDelta,
    meanExtantDescendantsDelta,
    meanTotalBirthsDelta,
    meanFinalEnergyDelta,
    meanMovementDecisionsPerStepDelta,
    verdict,
    interpretation: buildInterpretation({
      verdict,
      seeds: checks.length,
      seedsLimitedPopulationAdvantage,
      seedsLimitedPopulationDisadvantage,
      meanFounderSurvivalRateDelta,
      meanFinalPopulationDelta,
      meanExtantDescendantsDelta,
      meanTotalBirthsDelta,
      meanFinalEnergyDelta
    })
  };
}

function classifyVerdict(input: {
  meanFounderSurvivalRateDelta: number;
  meanFinalPopulationDelta: number;
  meanExtantDescendantsDelta: number;
  meanTotalBirthsDelta: number;
}): PerceptionMovementValidationVerdict {
  if (
    input.meanFounderSurvivalRateDelta > 0.02 &&
    input.meanFinalPopulationDelta > 0.5 &&
    input.meanExtantDescendantsDelta > 0.5
  ) {
    return 'positive';
  }

  if (input.meanFinalPopulationDelta < -0.5 && input.meanExtantDescendantsDelta < -0.5) {
    return 'negative';
  }

  if (input.meanFounderSurvivalRateDelta < -0.02 && input.meanTotalBirthsDelta < 0) {
    return 'negative';
  }

  return 'neutral';
}

function buildInterpretation(input: {
  verdict: PerceptionMovementValidationVerdict;
  seeds: number;
  seedsLimitedPopulationAdvantage: number;
  seedsLimitedPopulationDisadvantage: number;
  meanFounderSurvivalRateDelta: number;
  meanFinalPopulationDelta: number;
  meanExtantDescendantsDelta: number;
  meanTotalBirthsDelta: number;
  meanFinalEnergyDelta: number;
}): string {
  return (
    `Verdict ${input.verdict}: limited perception changed founder survival by ${input.meanFounderSurvivalRateDelta.toFixed(4)}, ` +
    `final population by ${input.meanFinalPopulationDelta.toFixed(3)}, extant descendants by ${input.meanExtantDescendantsDelta.toFixed(3)}, ` +
    `and total births by ${input.meanTotalBirthsDelta.toFixed(3)} across ${input.seeds} paired seeds. ` +
    `Limited perception finished ahead on population in ${input.seedsLimitedPopulationAdvantage}/${input.seeds} seeds, ` +
    `behind in ${input.seedsLimitedPopulationDisadvantage}/${input.seeds}, ` +
    `and shifted mean final energy by ${input.meanFinalEnergyDelta.toFixed(3)}.`
  );
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runPerceptionQualityValidation({ generatedAt })
  );
}
