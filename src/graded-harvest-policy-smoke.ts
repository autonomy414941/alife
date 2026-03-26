import { LifeSimulation } from './simulation';
import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS
} from './behavioral-control';
import { fromGenome, setTrait } from './genome-v2';
import { AgentSeed, SimulationConfig } from './types';

export interface GradedHarvestSmokeResult {
  steepness: number;
  threshold: number;
  basePreference: number;
  finalPopulation: number;
  totalBirths: number;
  harvestPolicyAgentFraction: number;
  harvestDecisionGuidedFraction: number;
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

function buildInitialAgents(
  steepness: number,
  threshold: number,
  basePreference: number,
  count: number
): AgentSeed[] {
  return Array.from({ length: count }, (_, i) => {
    const genome = { metabolism: 0.5, harvest: 0.5, aggression: 0.5, harvestEfficiency2: 0.5 };
    const genomeV2 = fromGenome(genome);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, basePreference);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD, threshold);
    setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, steepness);

    return {
      x: i % 20,
      y: Math.floor(i / 20),
      energy: 15,
      genome,
      genomeV2
    };
  });
}

export function runGradedHarvestPolicySmoke(seed = 12000): GradedHarvestSmokeResult[] {
  const steps = 100;
  const baseThreshold = 4.0;
  const basePreference = 0.5;
  const steepnessValues = [0, 0.5, 1.0, 2.0, 5.0];

  const results: GradedHarvestSmokeResult[] = [];

  for (const steepness of steepnessValues) {
    const simulation = new LifeSimulation({
      seed,
      config: SMOKE_CONFIG,
      initialAgents: buildInitialAgents(steepness, baseThreshold, basePreference, 30)
    });

    const summaries = simulation.run(steps);
    const finalSnapshot = simulation.snapshot();
    const finalSummary = summaries[summaries.length - 1];

    if (!finalSummary) {
      throw new Error('Graded harvest smoke produced no step summaries');
    }

    const totalBirths = summaries.reduce((sum, s) => sum + s.births, 0);

    results.push({
      steepness,
      threshold: baseThreshold,
      basePreference,
      finalPopulation: finalSnapshot.population,
      totalBirths,
      harvestPolicyAgentFraction:
        finalSummary.policyObservability?.activation.harvestPolicyAgentFraction ?? 0,
      harvestDecisionGuidedFraction:
        finalSummary.policyObservability?.activation.harvestDecisionGuidedFraction ?? 0
    });
  }

  return results;
}

if (require.main === module) {
  console.log('Running graded harvest policy smoke test...\n');

  const results = runGradedHarvestPolicySmoke(42);

  console.log('| Steepness | Threshold | Base Pref | Final Pop | Births | Policy Agent % | Harvest Guided % |');
  console.log('|-----------|-----------|-----------|-----------|--------|----------------|------------------|');

  for (const r of results) {
    console.log(
      `| ${r.steepness.toFixed(1).padStart(9)} | ${r.threshold.toFixed(1).padStart(9)} | ${r.basePreference.toFixed(2).padStart(9)} | ${String(r.finalPopulation).padStart(9)} | ${String(r.totalBirths).padStart(6)} | ${(r.harvestPolicyAgentFraction * 100).toFixed(1).padStart(14)}% | ${(r.harvestDecisionGuidedFraction * 100).toFixed(1).padStart(16)}% |`
    );
  }

  console.log('\nSmoke test complete.');
}
