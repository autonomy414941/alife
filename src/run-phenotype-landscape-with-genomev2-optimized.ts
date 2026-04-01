import { writeFileSync } from 'fs';
import { join } from 'path';
import { LifeSimulation } from './simulation';
import { createGenomeV2InitialAgents } from './genome-v2-adapter';
import {
  enrichPolicyFitnessWithPhenotype,
  PhenotypeFitnessRecord,
  PhenotypeEnvironmentOutcome,
  binPhenotypeEnvironment,
  createBinKey,
  parseBinKey
} from './phenotype-fitness-landscape';
import { Agent, AgentSeed } from './types';

const seeds = [42, 123, 456];
const analysisSteps = 500;
const minExposuresForStability = 10;

console.log(`Running phenotype landscape analysis with genomeV2-seeded agents (memory-optimized)`);
console.log(`Analysis steps per seed: ${analysisSteps}`);

function buildInitialAgentsWithGenomeV2(seed: number): AgentSeed[] {
  return createGenomeV2InitialAgents({ seed });
}

interface BinAccumulator {
  harvestTotal: number;
  survivedTotal: number;
  offspringTotal: number;
  policyPositiveCount: number;
  exposures: number;
}

const results = seeds.map((seed) => {
  console.log(`\nSeed ${seed}:`);
  console.log(`  Creating genomeV2-seeded initial agents...`);

  const initialAgents = buildInitialAgentsWithGenomeV2(seed);

  const sim = new LifeSimulation({
    seed,
    config: {
      policyMutationProbability: 0.65,
      policyMutationMagnitude: 0.5,
      mutationAmount: 0.16,
      width: 32,
      height: 32
    },
    initialAgents
  });

  const agentSnapshots = new Map<number, Pick<Agent, 'genomeV2' | 'policyState'>>();
  const bins = new Map<string, BinAccumulator>();

  let totalRecords = 0;
  let policyPositiveRecords = 0;

  console.log(`  Running ${analysisSteps} steps...`);
  for (let i = 0; i < analysisSteps; i++) {
    sim.step();

    for (const agent of sim.snapshot().agents) {
      agentSnapshots.set(agent.id, {
        genomeV2: agent.genomeV2,
        policyState: agent.policyState
      });
    }

    const stepRecords = sim.policyFitnessRecords();
    for (const record of stepRecords) {
      const agentSnapshot = agentSnapshots.get(record.agentId);
      if (!agentSnapshot) continue;

      const enriched = enrichPolicyFitnessWithPhenotype(record, agentSnapshot);
      const bin = binPhenotypeEnvironment(enriched);
      const key = createBinKey(bin);

      let accumulator = bins.get(key);
      if (!accumulator) {
        accumulator = {
          harvestTotal: 0,
          survivedTotal: 0,
          offspringTotal: 0,
          policyPositiveCount: 0,
          exposures: 0
        };
        bins.set(key, accumulator);
      }

      accumulator.harvestTotal += enriched.harvestIntake;
      accumulator.survivedTotal += Number(enriched.survived);
      accumulator.offspringTotal += enriched.offspringProduced;
      accumulator.policyPositiveCount += Number(enriched.hasAnyPolicy);
      accumulator.exposures++;

      totalRecords++;
      if (enriched.hasAnyPolicy) policyPositiveRecords++;
    }
  }

  const outcomes: PhenotypeEnvironmentOutcome[] = [];
  for (const [key, acc] of bins) {
    outcomes.push({
      bin: parseBinKey(key),
      exposures: acc.exposures,
      meanHarvestIntake: acc.harvestTotal / acc.exposures,
      survivalRate: acc.survivedTotal / acc.exposures,
      reproductionRate: acc.offspringTotal / acc.exposures,
      policyPositiveShare: acc.policyPositiveCount / acc.exposures
    });
  }

  outcomes.sort((left, right) => {
    if (left.bin.trophicLevelBin !== right.bin.trophicLevelBin) {
      return left.bin.trophicLevelBin - right.bin.trophicLevelBin;
    }
    if (left.bin.defenseLevelBin !== right.bin.defenseLevelBin) {
      return left.bin.defenseLevelBin - right.bin.defenseLevelBin;
    }
    if (left.bin.metabolicEfficiencyPrimaryBin !== right.bin.metabolicEfficiencyPrimaryBin) {
      return left.bin.metabolicEfficiencyPrimaryBin - right.bin.metabolicEfficiencyPrimaryBin;
    }
    if (left.bin.resourcePreferenceBin !== right.bin.resourcePreferenceBin) {
      return left.bin.resourcePreferenceBin - right.bin.resourcePreferenceBin;
    }
    if (left.bin.fertilityBin !== right.bin.fertilityBin) {
      return left.bin.fertilityBin - right.bin.fertilityBin;
    }
    if (left.bin.crowdingBin !== right.bin.crowdingBin) {
      return left.bin.crowdingBin - right.bin.crowdingBin;
    }
    if (left.bin.ageBin !== right.bin.ageBin) {
      return left.bin.ageBin - right.bin.ageBin;
    }
    return left.bin.disturbancePhase - right.bin.disturbancePhase;
  });

  const binsWithPolicy = outcomes.filter((o) => o.policyPositiveShare > 0);

  console.log(`  Total records: ${totalRecords}`);
  console.log(`  Policy-positive records: ${policyPositiveRecords} (${((policyPositiveRecords / totalRecords) * 100).toFixed(1)}%)`);
  console.log(`  Unique bins: ${outcomes.length}`);
  console.log(`  Bins with policy-positive exposure: ${binsWithPolicy.length}`);

  return {
    seed,
    outcomes,
    totalRecords,
    policyPositiveRecords,
    binsWithPolicy
  };
});

const timestamp = new Date().toISOString().split('T')[0];
const outputPath = join(process.cwd(), 'docs', `phenotype_landscape_genomev2_${timestamp}.md`);

const output: string[] = [];
output.push(`# Phenotype-Fitness Landscape (genomeV2-seeded)`);
output.push(``);
output.push(`Date: ${timestamp}`);
output.push(`Analysis steps: ${analysisSteps}`);
output.push(`Seeds: ${seeds.join(', ')}`);
output.push(`Min exposures for stability: ${minExposuresForStability}`);
output.push(``);
output.push(`## Purpose`);
output.push(``);
output.push(`This analysis identifies why the March 30 phenotype-fitness landscape showed 0.0% policy-positive exposure despite large reported policy-sensitive diversity gains.`);
output.push(``);
output.push(`## Key Finding`);
output.push(``);
output.push(`**Initial agents created by the default simulation do not have \`genomeV2\`, and therefore cannot evolve policy loci** because:`);
output.push(``);
output.push(`1. Parents without \`genomeV2\` produce offspring without \`genomeV2\` (simulation-reproduction.ts:367-369)`);
output.push(`2. Policy loci only exist in \`genomeV2\`, not in the legacy \`genome\` structure`);
output.push(`3. The \`addLociProbability: 0.02\` in \`mutateGenomeV2WithConfig\` can add new loci, but only if the genome is already genomeV2`);
output.push(``);
output.push(`This run seeds initial agents with \`genomeV2 = fromGenome(genome)\`, allowing policy loci to evolve via \`policyMutationProbability\` during reproduction.`);
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
  const result = results[i];
  output.push(`## Run ${i + 1} (Seed ${seeds[i]})`);
  output.push(``);
  output.push(`- Total records: ${result.totalRecords}`);
  output.push(`- Policy-positive records: ${result.policyPositiveRecords} (${((result.policyPositiveRecords / result.totalRecords) * 100).toFixed(1)}%)`);
  output.push(`- Unique phenotype-environment bins: ${result.outcomes.length}`);
  output.push(`- Bins with policy-positive exposure: ${result.binsWithPolicy.length} (${((result.binsWithPolicy.length / result.outcomes.length) * 100).toFixed(1)}%)`);
  output.push(``);

  if (result.binsWithPolicy.length > 0) {
    output.push(`### Top 10 Bins by Policy-Positive Share`);
    output.push(`| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Policy% | Harvest | Survival | Repro |`);
    output.push(`|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|---------|----------|-------|`);

    const sorted = [...result.binsWithPolicy]
      .filter((o) => o.exposures >= minExposuresForStability)
      .sort((a, b) => b.policyPositiveShare - a.policyPositiveShare)
      .slice(0, 10);

    for (const bin of sorted) {
      output.push(
        `| ${bin.bin.trophicLevelBin} | ${bin.bin.defenseLevelBin} | ${bin.bin.metabolicEfficiencyPrimaryBin} | ${bin.bin.resourcePreferenceBin} | ${bin.bin.fertilityBin} | ${bin.bin.crowdingBin} | ${bin.bin.ageBin} | ${bin.bin.disturbancePhase} | ${bin.exposures} | ${(bin.policyPositiveShare * 100).toFixed(1)}% | ${bin.meanHarvestIntake.toFixed(2)} | ${bin.survivalRate.toFixed(3)} | ${bin.reproductionRate.toFixed(3)} |`
      );
    }
    output.push(``);
  } else {
    output.push(`**No bins with policy-positive exposure found.** Policy loci may not be evolving or activating within ${analysisSteps} steps.`);
    output.push(``);
  }

  output.push(`### Top 10 Bins by Harvest Intake`);
  output.push(`| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |`);
  output.push(`|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|`);

  const topByHarvest = [...result.outcomes]
    .filter((o) => o.exposures >= minExposuresForStability)
    .sort((a, b) => b.meanHarvestIntake - a.meanHarvestIntake)
    .slice(0, 10);

  for (const bin of topByHarvest) {
    output.push(
      `| ${bin.bin.trophicLevelBin} | ${bin.bin.defenseLevelBin} | ${bin.bin.metabolicEfficiencyPrimaryBin} | ${bin.bin.resourcePreferenceBin} | ${bin.bin.fertilityBin} | ${bin.bin.crowdingBin} | ${bin.bin.ageBin} | ${bin.bin.disturbancePhase} | ${bin.exposures} | ${bin.meanHarvestIntake.toFixed(2)} | ${bin.survivalRate.toFixed(3)} | ${bin.reproductionRate.toFixed(3)} | ${(bin.policyPositiveShare * 100).toFixed(1)}% |`
    );
  }
  output.push(``);
}

output.push(`## Conclusion`);
output.push(``);

const totalPolicyRecords = results.reduce((sum, r) => sum + r.policyPositiveRecords, 0);
const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
const totalBinsWithPolicy = results.reduce((sum, r) => sum + r.binsWithPolicy.length, 0);
const totalBins = results.reduce((sum, r) => sum + r.outcomes.length, 0);

output.push(`Across all runs:`);
output.push(`- Policy-positive records: ${totalPolicyRecords}/${totalRecords} (${((totalPolicyRecords / totalRecords) * 100).toFixed(1)}%)`);
output.push(`- Bins with policy-positive exposure: ${totalBinsWithPolicy}/${totalBins} (${((totalBinsWithPolicy / totalBins) * 100).toFixed(1)}%)`);
output.push(``);

if (totalPolicyRecords > 0) {
  output.push(`**Policy-active cohorts exist**, confirming that genomeV2-seeding enables policy evolution. The March 30 landscape analysis failed to surface these cohorts because default initial agents lack genomeV2 and cannot evolve policy loci within the analysis timeframe.`);
  output.push(``);
  output.push(`The policy-positive exposure percentage (${((totalPolicyRecords / totalRecords) * 100).toFixed(1)}%) and bin distribution (${((totalBinsWithPolicy / totalBins) * 100).toFixed(1)}% of bins) indicate that policy-active agents occupy a minority but non-trivial subset of the phenotype-fitness landscape.`);
} else {
  output.push(`**Policy loci still did not evolve or activate.** This suggests that either:`);
  output.push(`1. 500 steps is insufficient for policy loci to both emerge and activate, OR`);
  output.push(`2. Policy activation requires specific environmental or demographic conditions not present in these runs, OR`);
  output.push(`3. The \`isActivePolicyParameter\` detection is too strict for early-stage policy evolution.`);
}
output.push(``);

const finalOutput = output.join('\n');
writeFileSync(outputPath, finalOutput, 'utf-8');
console.log(`\nResults written to ${outputPath}`);
