import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  runPhenotypeLandscapePilot,
  formatPhenotypeLandscapeResult
} from './phenotype-fitness-landscape-pilot';

const seeds = [42, 123, 456];
const steps = 500;
const minExposuresForStability = 10;

const results = seeds.map((seed) => {
  console.log(`Running phenotype landscape analysis for seed ${seed}...`);
  return runPhenotypeLandscapePilot({
    seed,
    steps,
    minExposuresForStability,
    minFitnessThreshold: {
      harvestIntake: 5,
      survivalRate: 0.5
    }
  });
});

const timestamp = new Date().toISOString().split('T')[0];
const outputPath = join(process.cwd(), 'docs', `phenotype_fitness_landscape_${timestamp}.md`);

const output: string[] = [];
output.push(`# Phenotype-Fitness Landscape Analysis`);
output.push(``);
output.push(`Date: ${timestamp}`);
output.push(`Steps per run: ${steps}`);
output.push(`Seeds: ${seeds.join(', ')}`);
output.push(`Min exposures for stability: ${minExposuresForStability}`);
output.push(``);
output.push(`## Purpose`);
output.push(``);
output.push(`This analysis aggregates policy-fitness records into phenotype-by-environment outcome maps. The goal is to identify which expressed trait configurations (trophic level, defense, metabolic efficiency, resource preference) gain harvest, survival, or reproduction advantages in specific environmental contexts (fertility, crowding, age, disturbance phase).`);
output.push(``);
output.push(`## Interpretation`);
output.push(``);
output.push(`- **Trophic**: 0=herbivore, 1=mid, 2=carnivore`);
output.push(`- **Defense**: 0=low, 1=mid, 2=high`);
output.push(`- **MetabEff**: 0=low metabolic efficiency (primary resource), 1=mid, 2=high`);
output.push(`- **ResPref**: 0=primary-preferring, 1=mixed, 2=secondary-preferring`);
output.push(`- **Fert**: Fertility bin (higher = more fertile environment)`);
output.push(`- **Crowd**: Crowding bin (higher = more crowded)`);
output.push(`- **Age**: Age bin (0=young, 1=mid, 2=old)`);
output.push(`- **Dist**: Disturbance phase (0=recent disturbance, 1=stable)`);
output.push(`- **Policy%**: Percentage of exposures with any active policy`);
output.push(``);

for (let i = 0; i < results.length; i++) {
  output.push(`## Run ${i + 1} (Seed ${seeds[i]})`);
  output.push(``);
  output.push(formatPhenotypeLandscapeResult(results[i]));
}

output.push(`## Cross-Run Stability Analysis`);
output.push(``);
output.push(`Regions that appear in top 10 by harvest across multiple seeds:`);
output.push(``);

const harvestRegionKeys = results.map((result) =>
  result.topRegionsByHarvest.map((r) =>
    `${r.bin.trophicLevelBin}-${r.bin.defenseLevelBin}-${r.bin.metabolicEfficiencyPrimaryBin}-${r.bin.resourcePreferenceBin}`
  )
);

const regionCounts = new Map<string, number>();
for (const keys of harvestRegionKeys) {
  for (const key of keys) {
    regionCounts.set(key, (regionCounts.get(key) || 0) + 1);
  }
}

const stableRegions = Array.from(regionCounts.entries())
  .filter(([_, count]) => count >= 2)
  .sort((a, b) => b[1] - a[1]);

if (stableRegions.length > 0) {
  output.push(`| Phenotype (T-D-M-R) | Appearances |`);
  output.push(`|---------------------|-------------|`);
  for (const [key, count] of stableRegions) {
    output.push(`| ${key} | ${count}/${results.length} |`);
  }
} else {
  output.push(`No regions appeared in top 10 by harvest across multiple seeds.`);
}
output.push(``);

const finalOutput = output.join('\n');
writeFileSync(outputPath, finalOutput, 'utf-8');
console.log(`Results written to ${outputPath}`);
