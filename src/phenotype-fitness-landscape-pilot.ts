import { LifeSimulation } from './simulation';
import {
  enrichPolicyFitnessWithPhenotype,
  aggregatePhenotypeFitnessLandscape,
  findStableFitnessRegions,
  PhenotypeFitnessRecord,
  PhenotypeFitnessLandscape
} from './phenotype-fitness-landscape';
import { PolicyFitnessRecord } from './policy-fitness';
import { Agent } from './types';

export interface PhenotypeLandscapePilotConfig {
  seed: number;
  steps: number;
  minExposuresForStability: number;
  minFitnessThreshold: {
    harvestIntake?: number;
    survivalRate?: number;
    reproductionRate?: number;
  };
}

export interface PhenotypeLandscapePilotResult {
  config: PhenotypeLandscapePilotConfig;
  landscape: PhenotypeFitnessLandscape;
  stableRegions: ReturnType<typeof findStableFitnessRegions>;
  topRegionsByHarvest: ReturnType<typeof findStableFitnessRegions>;
  topRegionsBySurvival: ReturnType<typeof findStableFitnessRegions>;
  topRegionsByReproduction: ReturnType<typeof findStableFitnessRegions>;
}

export function runPhenotypeLandscapePilot(
  config: PhenotypeLandscapePilotConfig
): PhenotypeLandscapePilotResult {
  const sim = new LifeSimulation({ seed: config.seed });
  const agentSnapshots = new Map<number, Pick<Agent, 'genomeV2' | 'policyState'>>();

  const enrichedRecords: PhenotypeFitnessRecord[] = [];

  for (let i = 0; i < config.steps; i += 1) {
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
      if (agentSnapshot) {
        enrichedRecords.push(enrichPolicyFitnessWithPhenotype(record, agentSnapshot));
      }
    }
  }

  const landscape = aggregatePhenotypeFitnessLandscape(enrichedRecords);

  const stableRegions = findStableFitnessRegions(landscape, config.minExposuresForStability, config.minFitnessThreshold);

  const topRegionsByHarvest = [...landscape.outcomes]
    .filter((o) => o.exposures >= config.minExposuresForStability)
    .sort((a, b) => b.meanHarvestIntake - a.meanHarvestIntake)
    .slice(0, 10);

  const topRegionsBySurvival = [...landscape.outcomes]
    .filter((o) => o.exposures >= config.minExposuresForStability)
    .sort((a, b) => b.survivalRate - a.survivalRate)
    .slice(0, 10);

  const topRegionsByReproduction = [...landscape.outcomes]
    .filter((o) => o.exposures >= config.minExposuresForStability)
    .sort((a, b) => b.reproductionRate - a.reproductionRate)
    .slice(0, 10);

  return {
    config,
    landscape,
    stableRegions,
    topRegionsByHarvest,
    topRegionsBySurvival,
    topRegionsByReproduction
  };
}

export function formatPhenotypeLandscapeResult(result: PhenotypeLandscapePilotResult): string {
  const lines: string[] = [];

  lines.push('# Phenotype-Fitness Landscape Analysis');
  lines.push('');
  lines.push(`## Configuration`);
  lines.push(`- Seed: ${result.config.seed}`);
  lines.push(`- Steps: ${result.config.steps}`);
  lines.push(`- Min exposures for stability: ${result.config.minExposuresForStability}`);
  lines.push(`- Min fitness threshold:`);
  if (result.config.minFitnessThreshold.harvestIntake !== undefined) {
    lines.push(`  - Harvest intake: ${result.config.minFitnessThreshold.harvestIntake}`);
  }
  if (result.config.minFitnessThreshold.survivalRate !== undefined) {
    lines.push(`  - Survival rate: ${result.config.minFitnessThreshold.survivalRate}`);
  }
  if (result.config.minFitnessThreshold.reproductionRate !== undefined) {
    lines.push(`  - Reproduction rate: ${result.config.minFitnessThreshold.reproductionRate}`);
  }
  lines.push('');

  lines.push(`## Summary`);
  lines.push(`- Total records: ${result.landscape.records}`);
  lines.push(`- Unique phenotype-environment bins: ${result.landscape.outcomes.length}`);
  lines.push(`- Stable regions: ${result.stableRegions.length}`);
  lines.push('');

  lines.push(`## Top 10 Regions by Harvest Intake`);
  lines.push('| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |');
  lines.push('|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|');
  for (const region of result.topRegionsByHarvest) {
    lines.push(
      `| ${region.bin.trophicLevelBin} | ${region.bin.defenseLevelBin} | ${region.bin.metabolicEfficiencyPrimaryBin} | ${region.bin.resourcePreferenceBin} | ${region.bin.fertilityBin} | ${region.bin.crowdingBin} | ${region.bin.ageBin} | ${region.bin.disturbancePhase} | ${region.exposures} | ${region.meanHarvestIntake.toFixed(2)} | ${region.survivalRate.toFixed(3)} | ${region.reproductionRate.toFixed(3)} | ${(region.policyPositiveShare * 100).toFixed(1)}% |`
    );
  }
  lines.push('');

  lines.push(`## Top 10 Regions by Survival Rate`);
  lines.push('| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |');
  lines.push('|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|');
  for (const region of result.topRegionsBySurvival) {
    lines.push(
      `| ${region.bin.trophicLevelBin} | ${region.bin.defenseLevelBin} | ${region.bin.metabolicEfficiencyPrimaryBin} | ${region.bin.resourcePreferenceBin} | ${region.bin.fertilityBin} | ${region.bin.crowdingBin} | ${region.bin.ageBin} | ${region.bin.disturbancePhase} | ${region.exposures} | ${region.meanHarvestIntake.toFixed(2)} | ${region.survivalRate.toFixed(3)} | ${region.reproductionRate.toFixed(3)} | ${(region.policyPositiveShare * 100).toFixed(1)}% |`
    );
  }
  lines.push('');

  lines.push(`## Top 10 Regions by Reproduction Rate`);
  lines.push('| Trophic | Defense | MetabEff | ResPref | Fert | Crowd | Age | Dist | Exposures | Harvest | Survival | Repro | Policy% |');
  lines.push('|---------|---------|----------|---------|------|-------|-----|------|-----------|---------|----------|-------|---------|');
  for (const region of result.topRegionsByReproduction) {
    lines.push(
      `| ${region.bin.trophicLevelBin} | ${region.bin.defenseLevelBin} | ${region.bin.metabolicEfficiencyPrimaryBin} | ${region.bin.resourcePreferenceBin} | ${region.bin.fertilityBin} | ${region.bin.crowdingBin} | ${region.bin.ageBin} | ${region.bin.disturbancePhase} | ${region.exposures} | ${region.meanHarvestIntake.toFixed(2)} | ${region.survivalRate.toFixed(3)} | ${region.reproductionRate.toFixed(3)} | ${(region.policyPositiveShare * 100).toFixed(1)}% |`
    );
  }
  lines.push('');

  return lines.join('\n');
}
