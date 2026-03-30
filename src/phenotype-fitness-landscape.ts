import { realizePhenotype, RealizedPhenotype } from './phenotype';
import { PolicyFitnessRecord } from './policy-fitness';
import { Agent } from './types';

export interface PhenotypeFitnessRecord extends PolicyFitnessRecord {
  trophicLevel: number;
  defenseLevel: number;
  metabolicEfficiencyPrimary: number;
  metabolicEfficiencySecondary: number;
  harvestSecondaryPreference: number;
  spendingSecondaryPreference: number;
}

export interface PhenotypeBin {
  trophicLevelBin: number;
  defenseLevelBin: number;
  metabolicEfficiencyPrimaryBin: number;
  resourcePreferenceBin: number;
}

export interface EnvironmentBin {
  fertilityBin: number;
  crowdingBin: number;
  ageBin: number;
  disturbancePhase: number;
}

export interface PhenotypeEnvironmentBin extends PhenotypeBin, EnvironmentBin {}

export interface PhenotypeEnvironmentOutcome {
  bin: PhenotypeEnvironmentBin;
  exposures: number;
  meanHarvestIntake: number;
  survivalRate: number;
  reproductionRate: number;
  policyPositiveShare: number;
}

export interface PhenotypeFitnessLandscape {
  records: number;
  outcomes: PhenotypeEnvironmentOutcome[];
}

export const DEFAULT_TROPHIC_LEVEL_BINS = 3;
export const DEFAULT_DEFENSE_LEVEL_BINS = 3;
export const DEFAULT_METABOLIC_EFFICIENCY_BINS = 3;
export const DEFAULT_RESOURCE_PREFERENCE_BINS = 3;

export function enrichPolicyFitnessWithPhenotype(
  record: PolicyFitnessRecord,
  agent: Pick<Agent, 'genomeV2' | 'policyState'>
): PhenotypeFitnessRecord {
  const phenotype = realizePhenotype(agent);

  return {
    ...record,
    trophicLevel: phenotype.trophicLevel ?? 0.5,
    defenseLevel: phenotype.defenseLevel ?? 0.5,
    metabolicEfficiencyPrimary: phenotype.metabolicEfficiencyPrimary ?? 0.5,
    metabolicEfficiencySecondary: phenotype.metabolicEfficiencySecondary ?? 0.5,
    harvestSecondaryPreference: phenotype.harvestSecondaryPreference ?? 0.5,
    spendingSecondaryPreference: phenotype.spendingSecondaryPreference ?? 0.5
  };
}

export function binPhenotypeValue(value: number, bins: number): number {
  const normalized = Math.max(0, Math.min(1, value));
  const scaled = Math.floor(normalized * bins);
  return Math.min(bins - 1, scaled);
}

export function binPhenotype(record: PhenotypeFitnessRecord): PhenotypeBin {
  const resourcePreference = (record.harvestSecondaryPreference + record.spendingSecondaryPreference) / 2;

  return {
    trophicLevelBin: binPhenotypeValue(record.trophicLevel, DEFAULT_TROPHIC_LEVEL_BINS),
    defenseLevelBin: binPhenotypeValue(record.defenseLevel, DEFAULT_DEFENSE_LEVEL_BINS),
    metabolicEfficiencyPrimaryBin: binPhenotypeValue(
      record.metabolicEfficiencyPrimary,
      DEFAULT_METABOLIC_EFFICIENCY_BINS
    ),
    resourcePreferenceBin: binPhenotypeValue(resourcePreference, DEFAULT_RESOURCE_PREFERENCE_BINS)
  };
}

export function binEnvironment(record: PolicyFitnessRecord): EnvironmentBin {
  return {
    fertilityBin: record.fertilityBin,
    crowdingBin: record.crowdingBin,
    ageBin: record.ageBin,
    disturbancePhase: record.disturbancePhase
  };
}

export function binPhenotypeEnvironment(record: PhenotypeFitnessRecord): PhenotypeEnvironmentBin {
  return {
    ...binPhenotype(record),
    ...binEnvironment(record)
  };
}

export function createBinKey(bin: PhenotypeEnvironmentBin): string {
  return `${bin.trophicLevelBin}:${bin.defenseLevelBin}:${bin.metabolicEfficiencyPrimaryBin}:${bin.resourcePreferenceBin}:${bin.fertilityBin}:${bin.crowdingBin}:${bin.ageBin}:${bin.disturbancePhase}`;
}

export function parseBinKey(key: string): PhenotypeEnvironmentBin {
  const [
    trophicLevelBin,
    defenseLevelBin,
    metabolicEfficiencyPrimaryBin,
    resourcePreferenceBin,
    fertilityBin,
    crowdingBin,
    ageBin,
    disturbancePhase
  ] = key.split(':').map(Number);

  return {
    trophicLevelBin,
    defenseLevelBin,
    metabolicEfficiencyPrimaryBin,
    resourcePreferenceBin,
    fertilityBin,
    crowdingBin,
    ageBin,
    disturbancePhase
  };
}

export function aggregatePhenotypeFitnessLandscape(
  records: ReadonlyArray<PhenotypeFitnessRecord>
): PhenotypeFitnessLandscape {
  const bins = new Map<string, PhenotypeFitnessRecord[]>();

  for (const record of records) {
    const bin = binPhenotypeEnvironment(record);
    const key = createBinKey(bin);
    const binRecords = bins.get(key);
    if (binRecords) {
      binRecords.push(record);
    } else {
      bins.set(key, [record]);
    }
  }

  const outcomes: PhenotypeEnvironmentOutcome[] = [];
  for (const [key, binRecords] of bins) {
    if (binRecords.length === 0) {
      continue;
    }

    const bin = parseBinKey(key);
    let harvestTotal = 0;
    let survivedTotal = 0;
    let offspringTotal = 0;
    let policyPositiveCount = 0;

    for (const record of binRecords) {
      harvestTotal += record.harvestIntake;
      survivedTotal += Number(record.survived);
      offspringTotal += record.offspringProduced;
      policyPositiveCount += Number(record.hasAnyPolicy);
    }

    outcomes.push({
      bin,
      exposures: binRecords.length,
      meanHarvestIntake: harvestTotal / binRecords.length,
      survivalRate: survivedTotal / binRecords.length,
      reproductionRate: offspringTotal / binRecords.length,
      policyPositiveShare: policyPositiveCount / binRecords.length
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

  return {
    records: records.length,
    outcomes
  };
}

export function findStableFitnessRegions(
  landscape: PhenotypeFitnessLandscape,
  minExposures: number,
  minFitnessThreshold: { harvestIntake?: number; survivalRate?: number; reproductionRate?: number }
): PhenotypeEnvironmentOutcome[] {
  return landscape.outcomes.filter((outcome) => {
    if (outcome.exposures < minExposures) {
      return false;
    }

    if (minFitnessThreshold.harvestIntake !== undefined &&
        outcome.meanHarvestIntake < minFitnessThreshold.harvestIntake) {
      return false;
    }

    if (minFitnessThreshold.survivalRate !== undefined &&
        outcome.survivalRate < minFitnessThreshold.survivalRate) {
      return false;
    }

    if (minFitnessThreshold.reproductionRate !== undefined &&
        outcome.reproductionRate < minFitnessThreshold.reproductionRate) {
      return false;
    }

    return true;
  });
}
