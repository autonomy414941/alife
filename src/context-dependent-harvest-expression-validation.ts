import { writeFileSync } from 'node:fs';
import {
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { fromGenome, setTrait } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export const CONTEXT_DEPENDENT_HARVEST_EXPRESSION_VALIDATION_ARTIFACT =
  'docs/context_dependent_harvest_expression_validation_2026-04-03.json';

const DEFAULT_SEEDS = [4101, 4102, 4103, 4104, 4105, 4106];
const DEFAULT_STEPS = 80;

const VALIDATION_CONFIG: Partial<SimulationConfig> = {
  width: 6,
  height: 6,
  initialAgents: 18,
  initialEnergy: 14,
  maxResource: 8,
  maxResource2: 8,
  resourceRegen: 0.75,
  resource2Regen: 0.75,
  seasonalFertilityContrastAmplitude: 0.45,
  metabolismCostBase: 0.2,
  moveCost: 0.12,
  harvestCap: 2,
  contextualHarvestExpression: true,
  reproduceThreshold: 12,
  reproduceProbability: 0.55,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.08,
  policyMutationProbability: 0,
  policyMutationMagnitude: 0,
  disturbanceInterval: 12,
  disturbanceResourceLoss: 1.25,
  disturbanceRadius: 1,
  disturbanceRefugiaFraction: 0.15,
  maxAge: 100
};

export interface ContextDependentHarvestExpressionValidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
}

export interface ContextDependentHarvestExpressionMetrics {
  finalPopulation: number;
  totalBirths: number;
  meanPolicyHarvestIntake: number;
  meanFinalEnergy: number;
  meanFinalSecondaryEnergyShare: number;
  meanHarvestDecisionGuidedFraction: number;
}

export interface ContextDependentHarvestExpressionCheck {
  seed: number;
  contextual: ContextDependentHarvestExpressionMetrics;
  directEncoding: ContextDependentHarvestExpressionMetrics;
  delta: {
    finalPopulation: number;
    totalBirths: number;
    meanPolicyHarvestIntake: number;
    meanFinalEnergy: number;
    meanFinalSecondaryEnergyShare: number;
    meanHarvestDecisionGuidedFraction: number;
  };
}

export interface ContextDependentHarvestExpressionValidationOutput {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    seeds: number[];
    steps: number;
    simulation: Partial<SimulationConfig>;
  };
  summary: {
    seeds: number;
    seedsWithPopulationChange: number;
    seedsWithHarvestIntakeChange: number;
    meanFinalPopulationDelta: number;
    meanTotalBirthsDelta: number;
    meanPolicyHarvestIntakeDelta: number;
    meanFinalEnergyDelta: number;
    meanFinalSecondaryEnergyShareDelta: number;
    meanHarvestDecisionGuidedFractionDelta: number;
  };
  checks: ContextDependentHarvestExpressionCheck[];
}

export function runContextDependentHarvestExpressionValidation(
  input: ContextDependentHarvestExpressionValidationInput = {}
): ContextDependentHarvestExpressionValidationOutput {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;

  const checks = seeds.map((seed) => {
    const contextual = runArm(seed, steps, true);
    const directEncoding = runArm(seed, steps, false);

    return {
      seed,
      contextual,
      directEncoding,
      delta: {
        finalPopulation: contextual.finalPopulation - directEncoding.finalPopulation,
        totalBirths: contextual.totalBirths - directEncoding.totalBirths,
        meanPolicyHarvestIntake:
          contextual.meanPolicyHarvestIntake - directEncoding.meanPolicyHarvestIntake,
        meanFinalEnergy: contextual.meanFinalEnergy - directEncoding.meanFinalEnergy,
        meanFinalSecondaryEnergyShare:
          contextual.meanFinalSecondaryEnergyShare - directEncoding.meanFinalSecondaryEnergyShare,
        meanHarvestDecisionGuidedFraction:
          contextual.meanHarvestDecisionGuidedFraction - directEncoding.meanHarvestDecisionGuidedFraction
      }
    };
  });

  return {
    generatedAt,
    question:
      'Does live context-conditioned harvest expression change policy-bearing cohort outcomes relative to the direct-encoding harvest policy path?',
    prediction:
      'Context-conditioned harvest expression should change harvest intake and downstream cohort outcomes once local fertility, crowding, and recent disturbance shape expressed resource preference.',
    config: {
      seeds,
      steps,
      simulation: VALIDATION_CONFIG
    },
    summary: {
      seeds: checks.length,
      seedsWithPopulationChange: checks.filter((check) => check.delta.finalPopulation !== 0).length,
      seedsWithHarvestIntakeChange: checks.filter(
        (check) => Math.abs(check.delta.meanPolicyHarvestIntake) > 1e-9
      ).length,
      meanFinalPopulationDelta: mean(checks.map((check) => check.delta.finalPopulation)),
      meanTotalBirthsDelta: mean(checks.map((check) => check.delta.totalBirths)),
      meanPolicyHarvestIntakeDelta: mean(checks.map((check) => check.delta.meanPolicyHarvestIntake)),
      meanFinalEnergyDelta: mean(checks.map((check) => check.delta.meanFinalEnergy)),
      meanFinalSecondaryEnergyShareDelta: mean(
        checks.map((check) => check.delta.meanFinalSecondaryEnergyShare)
      ),
      meanHarvestDecisionGuidedFractionDelta: mean(
        checks.map((check) => check.delta.meanHarvestDecisionGuidedFraction)
      )
    },
    checks
  };
}

function runArm(
  seed: number,
  steps: number,
  contextualHarvestExpression: boolean
): ContextDependentHarvestExpressionMetrics {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...VALIDATION_CONFIG,
      contextualHarvestExpression
    },
    initialAgents: buildInitialAgents()
  });

  const series = simulation.runWithPolicyFitness(steps);
  const finalSnapshot = simulation.snapshot();
  const finalSummary = series.summaries[series.summaries.length - 1];
  const policyRecords = series.records.filter((record) => record.hasHarvestPolicy);
  const meanPolicyHarvestIntake = mean(policyRecords.map((record) => record.harvestIntake));
  const meanFinalEnergy = mean(finalSnapshot.agents.map((agent) => agent.energy));
  const meanFinalSecondaryEnergyShare = mean(
    finalSnapshot.agents.map((agent) => {
      if (agent.energy <= 0) {
        return 0;
      }
      return (agent.energySecondary ?? 0) / agent.energy;
    })
  );

  return {
    finalPopulation: finalSnapshot.population,
    totalBirths: series.summaries.reduce((sum, summary) => sum + summary.births, 0),
    meanPolicyHarvestIntake,
    meanFinalEnergy,
    meanFinalSecondaryEnergyShare,
    meanHarvestDecisionGuidedFraction:
      finalSummary?.policyObservability?.activation.harvestDecisionGuidedFraction ?? 0
  };
}

function buildInitialAgents(): AgentSeed[] {
  return Array.from({ length: 18 }, (_, index) => {
    const genome = {
      metabolism: 0.55,
      harvest: 1,
      aggression: 0.2,
      harvestEfficiency2: 0.25
    };
    const genomeV2 = fromGenome(genome);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.25);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD, 3.5);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 2.5);

    return {
      x: index % 3,
      y: Math.floor(index / 3),
      energy: 14,
      genome,
      genomeV2
    };
  });
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), (input: { generatedAt?: string }) => {
    const output = runContextDependentHarvestExpressionValidation(input);
    writeFileSync(
      CONTEXT_DEPENDENT_HARVEST_EXPRESSION_VALIDATION_ARTIFACT,
      JSON.stringify(output, null, 2) + '\n',
      'utf-8'
    );
    console.log(`Wrote ${CONTEXT_DEPENDENT_HARVEST_EXPRESSION_VALIDATION_ARTIFACT}`);
    return output;
  });
}
