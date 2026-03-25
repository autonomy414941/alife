import { LifeSimulation } from './simulation';
import {
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS
} from './behavioral-control';
import { fromGenome, setTrait } from './genome-v2';
import { AgentSeed, SimulationConfig } from './types';

export interface GradedReproductionSmokeResult {
  steepness: number;
  threshold: number;
  finalPopulation: number;
  totalBirths: number;
  reproductionPolicyAgentFraction: number;
  reproductionDecisionGatedFraction: number;
}

const SMOKE_CONFIG: Partial<SimulationConfig> = {
  width: 20,
  height: 20,
  initialAgents: 30,
  initialEnergy: 15,
  maxResource: 8,
  maxResource2: 8,
  resourceRegen: 0.7,
  resource2Regen: 0.7,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  harvestCap: 2.5,
  reproduceThreshold: 12,
  reproduceProbability: 0.6,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  policyMutationProbability: 0,
  policyMutationMagnitude: 0,
  maxAge: 120
};

function buildInitialAgents(steepness: number, threshold: number, count: number): AgentSeed[] {
  return Array.from({ length: count }, (_, i) => {
    const genome = { metabolism: 0.5, harvest: 0.5, aggression: 0.5 };
    const genomeV2 = fromGenome(genome);
    setTrait(genomeV2, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, threshold);
    setTrait(genomeV2, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS, steepness);

    return {
      x: i % 20,
      y: Math.floor(i / 20),
      energy: 15,
      genome,
      genomeV2
    };
  });
}

export function runGradedReproductionPolicySmoke(seed = 12000): GradedReproductionSmokeResult[] {
  const steps = 60;
  const baseThreshold = 2.0;
  const steepnessValues = [0, 0.5, 1.0, 2.0, 5.0];

  const results: GradedReproductionSmokeResult[] = [];

  for (const steepness of steepnessValues) {
    const simulation = new LifeSimulation({
      seed,
      config: SMOKE_CONFIG,
      initialAgents: buildInitialAgents(steepness, baseThreshold, 30)
    });

    const summaries = simulation.run(steps);
    const finalSnapshot = simulation.snapshot();
    const finalSummary = summaries[summaries.length - 1];

    if (!finalSummary) {
      throw new Error('Graded reproduction smoke produced no step summaries');
    }

    const totalBirths = summaries.reduce((sum, s) => sum + s.births, 0);

    results.push({
      steepness,
      threshold: baseThreshold,
      finalPopulation: finalSnapshot.population,
      totalBirths,
      reproductionPolicyAgentFraction:
        finalSummary.policyObservability?.activation.reproductionPolicyAgentFraction ?? 0,
      reproductionDecisionGatedFraction:
        finalSummary.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0
    });
  }

  return results;
}

if (require.main === module) {
  console.log('Running graded reproduction policy smoke test...\n');
  const results = runGradedReproductionPolicySmoke();

  console.log('Steepness | Threshold | Final Pop | Total Births | Policy Fraction | Gated Fraction');
  console.log('----------|-----------|-----------|--------------|-----------------|---------------');
  for (const result of results) {
    console.log(
      `${result.steepness.toFixed(1).padStart(9)} | ` +
        `${result.threshold.toFixed(1).padStart(9)} | ` +
        `${result.finalPopulation.toString().padStart(9)} | ` +
        `${result.totalBirths.toString().padStart(12)} | ` +
        `${result.reproductionPolicyAgentFraction.toFixed(4).padStart(15)} | ` +
        `${result.reproductionDecisionGatedFraction.toFixed(4).padStart(14)}`
    );
  }

  console.log(
    '\nInterpretation: Steepness=0 is binary (hard threshold), higher steepness creates smoother gradients.'
  );
  console.log('Different steepness values should show different birth rates and gating fractions.');
}
