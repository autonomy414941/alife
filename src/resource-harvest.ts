import { Genome } from './types';

export interface DualResourceHarvestResult {
  primaryHarvest: number;
  secondaryHarvest: number;
  totalHarvest: number;
}

export function secondaryHarvestEfficiency(genome: Genome): number {
  return Math.max(0, genome.harvestEfficiency2 ?? 0);
}

export function resolveResourceHarvestShares(genome: Genome): {
  primaryShare: number;
  secondaryShare: number;
} {
  const primaryEfficiency = Math.max(0, genome.harvest);
  const secondaryEfficiency = secondaryHarvestEfficiency(genome);
  const totalEfficiency = primaryEfficiency + secondaryEfficiency;
  if (totalEfficiency <= 0) {
    return { primaryShare: 1, secondaryShare: 0 };
  }
  return {
    primaryShare: primaryEfficiency / totalEfficiency,
    secondaryShare: secondaryEfficiency / totalEfficiency
  };
}

export function combinedResourceAvailability(
  primaryAvailable: number,
  secondaryAvailable: number,
  genome: Genome
): number {
  const { primaryShare, secondaryShare } = resolveResourceHarvestShares(genome);
  return Math.max(0, primaryAvailable) * primaryShare + Math.max(0, secondaryAvailable) * secondaryShare;
}

export function resolveDualResourceHarvest({
  primaryAvailable,
  secondaryAvailable,
  genome,
  baseCapacity
}: {
  primaryAvailable: number;
  secondaryAvailable: number;
  genome: Genome;
  baseCapacity: number;
}): DualResourceHarvestResult {
  const capacity = Math.max(0, baseCapacity);
  if (capacity <= 0) {
    return { primaryHarvest: 0, secondaryHarvest: 0, totalHarvest: 0 };
  }

  const { primaryShare, secondaryShare } = resolveResourceHarvestShares(genome);
  const primaryHarvest = Math.min(
    Math.max(0, primaryAvailable),
    capacity * primaryShare * Math.max(0, genome.harvest)
  );
  const secondaryHarvest = Math.min(
    Math.max(0, secondaryAvailable),
    capacity * secondaryShare * secondaryHarvestEfficiency(genome)
  );

  return {
    primaryHarvest,
    secondaryHarvest,
    totalHarvest: primaryHarvest + secondaryHarvest
  };
}
