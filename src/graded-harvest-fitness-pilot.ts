import { LifeSimulation } from './simulation';
import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS
} from './behavioral-control';
import { fromGenome, setTrait } from './genome-v2';
import { AgentSeed, SimulationConfig } from './types';

export interface GradedHarvestFitnessPilotResult {
  seed: number;
  steepness: number;
  threshold: number;
  basePreference: number;
  finalPopulation: number;
  totalBirths: number;
  totalDeaths: number;
  meanEnergy: number;
  activeSpecies: number;
  activeClades: number;
  reproductiveSuccess: number;
  avgPopulation: number;
}

const PILOT_CONFIG: Partial<SimulationConfig> = {
  width: 25,
  height: 25,
  initialAgents: 40,
  initialEnergy: 15,
  maxResource: 10,
  maxResource2: 10,
  resourceRegen: 0.8,
  resource2Regen: 0.8,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  harvestCap: 3.0,
  reproduceThreshold: 12,
  reproduceProbability: 0.65,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.15,
  policyMutationProbability: 0.05,
  policyMutationMagnitude: 0.3,
  maxAge: 150
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
      x: (i * 7) % 25,
      y: Math.floor((i * 7) / 25),
      energy: 15,
      genome,
      genomeV2
    };
  });
}

export function runGradedHarvestFitnessPilot(
  seeds: number[],
  steepnessValues: number[],
  basePreferences: number[] = [0.5],
  options: {
    steps?: number;
  } = {}
): GradedHarvestFitnessPilotResult[] {
  const steps = options.steps ?? 150;
  const baseThreshold = 5.0;

  const results: GradedHarvestFitnessPilotResult[] = [];

  for (const seed of seeds) {
    for (const basePreference of basePreferences) {
      for (const steepness of steepnessValues) {
        const simulation = new LifeSimulation({
          seed,
          config: PILOT_CONFIG,
          initialAgents: buildInitialAgents(steepness, baseThreshold, basePreference, 40)
        });

        const summaries = simulation.run(steps);
        const finalSnapshot = simulation.snapshot();
        const finalSummary = summaries[summaries.length - 1];

        if (!finalSummary) {
          throw new Error('Graded harvest fitness pilot produced no step summaries');
        }

        const totalBirths = summaries.reduce((sum, s) => sum + s.births, 0);
        const totalDeaths = summaries.reduce((sum, s) => sum + s.deaths, 0);

        const avgPopulation = summaries.reduce((sum, s) => sum + s.population, 0) / summaries.length;

        const reproductiveSuccess = totalBirths > 0 ? totalBirths / (totalBirths + totalDeaths) : 0;

        results.push({
          seed,
          steepness,
          threshold: baseThreshold,
          basePreference,
          finalPopulation: finalSnapshot.population,
          totalBirths,
          totalDeaths,
          meanEnergy: finalSnapshot.meanEnergy,
          activeSpecies: finalSnapshot.activeSpecies,
          activeClades: finalSnapshot.activeClades,
          reproductiveSuccess,
          avgPopulation
        });
      }
    }
  }

  return results;
}

if (require.main === module) {
  console.log('Running graded harvest fitness differentiation pilot...\n');

  const seeds = [42, 100, 200, 300];
  const steepnessValues = [0, 0.5, 1.0, 2.0];

  const results = runGradedHarvestFitnessPilot(seeds, steepnessValues);

  console.log(
    '| Seed | Steepness | Final Pop | Avg Pop | Births | Deaths | Mean Energy | Species | Clades | Repro Success |'
  );
  console.log(
    '|------|-----------|-----------|---------|--------|--------|-------------|---------|--------|---------------|'
  );

  for (const r of results) {
    console.log(
      `| ${String(r.seed).padStart(4)} | ${r.steepness.toFixed(1).padStart(9)} | ${String(r.finalPopulation).padStart(9)} | ${r.avgPopulation.toFixed(1).padStart(7)} | ${String(r.totalBirths).padStart(6)} | ${String(r.totalDeaths).padStart(6)} | ${r.meanEnergy.toFixed(2).padStart(11)} | ${String(r.activeSpecies).padStart(7)} | ${String(r.activeClades).padStart(6)} | ${r.reproductiveSuccess.toFixed(3).padStart(13)} |`
    );
  }

  console.log('\n--- Aggregate by Steepness ---\n');

  for (const steepness of steepnessValues) {
    const steepnessResults = results.filter((r) => r.steepness === steepness);
    const avgFinalPop =
      steepnessResults.reduce((sum, r) => sum + r.finalPopulation, 0) / steepnessResults.length;
    const avgPop =
      steepnessResults.reduce((sum, r) => sum + r.avgPopulation, 0) / steepnessResults.length;
    const avgBirths =
      steepnessResults.reduce((sum, r) => sum + r.totalBirths, 0) / steepnessResults.length;
    const avgDeaths =
      steepnessResults.reduce((sum, r) => sum + r.totalDeaths, 0) / steepnessResults.length;
    const avgEnergy =
      steepnessResults.reduce((sum, r) => sum + r.meanEnergy, 0) / steepnessResults.length;
    const avgSpecies =
      steepnessResults.reduce((sum, r) => sum + r.activeSpecies, 0) / steepnessResults.length;
    const avgClades =
      steepnessResults.reduce((sum, r) => sum + r.activeClades, 0) / steepnessResults.length;
    const avgReproSuccess =
      steepnessResults.reduce((sum, r) => sum + r.reproductiveSuccess, 0) / steepnessResults.length;

    console.log(`Steepness ${steepness.toFixed(1)} (n=${steepnessResults.length}):`);
    console.log(`  Avg Final Population: ${avgFinalPop.toFixed(1)}`);
    console.log(`  Avg Population (over time): ${avgPop.toFixed(1)}`);
    console.log(`  Avg Births: ${avgBirths.toFixed(1)}`);
    console.log(`  Avg Deaths: ${avgDeaths.toFixed(1)}`);
    console.log(`  Avg Mean Energy: ${avgEnergy.toFixed(2)}`);
    console.log(`  Avg Active Species: ${avgSpecies.toFixed(1)}`);
    console.log(`  Avg Active Clades: ${avgClades.toFixed(1)}`);
    console.log(`  Avg Reproductive Success: ${avgReproSuccess.toFixed(3)}`);
    console.log();
  }

  console.log('\nPilot complete.');
}
