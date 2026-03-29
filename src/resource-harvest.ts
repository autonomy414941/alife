import { Genome } from './types';

export interface DualResourceHarvestResult {
  primaryHarvest: number;
  secondaryHarvest: number;
  totalHarvest: number;
  primaryShare: number;
  secondaryShare: number;
}

const HARVEST_POLICY_PAYOFF_BONUS = 0.25;

export function secondaryHarvestEfficiency(genome: Genome): number {
  return Math.max(0, genome.harvestEfficiency2 ?? 0);
}

export function resolveResourceHarvestShares(
  genome: Genome,
  secondaryPreferenceShare?: number
): {
  primaryShare: number;
  secondaryShare: number;
} {
  if (secondaryPreferenceShare !== undefined) {
    const secondaryShare = clamp(secondaryPreferenceShare, 0, 1);
    return {
      primaryShare: 1 - secondaryShare,
      secondaryShare
    };
  }

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
  genome: Genome,
  secondaryPreferenceShare?: number
): number {
  const { primaryShare, secondaryShare } = resolveResourceHarvestShares(genome, secondaryPreferenceShare);
  return Math.max(0, primaryAvailable) * primaryShare + Math.max(0, secondaryAvailable) * secondaryShare;
}

export function resolveHarvestPolicyPayoffMultiplier(
  primaryAvailable: number,
  secondaryAvailable: number,
  secondaryPreferenceShare?: number
): number {
  if (secondaryPreferenceShare === undefined) {
    return 1;
  }

  const totalAvailable = Math.max(0, primaryAvailable) + Math.max(0, secondaryAvailable);
  if (totalAvailable <= 0) {
    return 1;
  }

  const secondaryAvailabilityShare = clamp(Math.max(0, secondaryAvailable) / totalAvailable, 0, 1);
  const secondaryPreferenceOffset = clamp(secondaryPreferenceShare, 0, 1) - 0.5;
  const availabilityOffset = secondaryAvailabilityShare - 0.5;
  return 1 + HARVEST_POLICY_PAYOFF_BONUS * 4 * secondaryPreferenceOffset * availabilityOffset;
}

export function resolveDualResourceHarvest({
  primaryAvailable,
  secondaryAvailable,
  genome,
  baseCapacity,
  secondaryPreferenceShare
}: {
  primaryAvailable: number;
  secondaryAvailable: number;
  genome: Genome;
  baseCapacity: number;
  secondaryPreferenceShare?: number;
}): DualResourceHarvestResult {
  const capacity = Math.max(0, baseCapacity);
  if (capacity <= 0) {
    const shares = resolveResourceHarvestShares(genome, secondaryPreferenceShare);
    return { primaryHarvest: 0, secondaryHarvest: 0, totalHarvest: 0, ...shares };
  }

  const { primaryShare, secondaryShare } = resolveResourceHarvestShares(genome, secondaryPreferenceShare);
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
    totalHarvest: primaryHarvest + secondaryHarvest,
    primaryShare,
    secondaryShare
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
