import { clampGenomeV2TraitValue, getTrait } from './genome-v2';
import { GenomeV2 } from './types';

export interface PhenotypeCarrier {
  genomeV2?: GenomeV2;
  policyState?: ReadonlyMap<string, number>;
}

export interface RealizedPhenotype {
  trophicLevel?: number;
  defenseLevel?: number;
  metabolicEfficiencyPrimary?: number;
  metabolicEfficiencySecondary?: number;
  reproductionHarvestThreshold?: number;
  reproductionHarvestThresholdSteepness?: number;
  movementEnergyReserveThreshold?: number;
  movementEnergyReserveThresholdSteepness?: number;
  movementMinRecentHarvest?: number;
  movementMinRecentHarvestSteepness?: number;
  harvestSecondaryPreference?: number;
  harvestPrimaryThreshold?: number;
  harvestPrimaryThresholdSteepness?: number;
  spendingSecondaryPreference?: number;
}

export function resolveExpressedTrait(carrier: PhenotypeCarrier, key: string): number | undefined {
  if (carrier.genomeV2?.traits.has(key)) {
    return clampGenomeV2TraitValue(key, getTrait(carrier.genomeV2, key));
  }

  if (carrier.policyState?.has(key)) {
    return clampLegacyPolicyValue(key, carrier.policyState.get(key) ?? 0);
  }

  return undefined;
}

export function realizePhenotype(carrier: PhenotypeCarrier): RealizedPhenotype {
  return {
    trophicLevel: resolveExpressedTrait(carrier, 'trophic_level'),
    defenseLevel: resolveExpressedTrait(carrier, 'defense_level'),
    metabolicEfficiencyPrimary: resolveExpressedTrait(carrier, 'metabolic_efficiency_primary'),
    metabolicEfficiencySecondary: resolveExpressedTrait(carrier, 'metabolic_efficiency_secondary'),
    reproductionHarvestThreshold: resolveExpressedTrait(carrier, 'reproduction_harvest_threshold'),
    reproductionHarvestThresholdSteepness: resolveExpressedTrait(
      carrier,
      'reproduction_harvest_threshold_steepness'
    ),
    movementEnergyReserveThreshold: resolveExpressedTrait(carrier, 'movement_energy_reserve_threshold'),
    movementEnergyReserveThresholdSteepness: resolveExpressedTrait(
      carrier,
      'movement_energy_reserve_threshold_steepness'
    ),
    movementMinRecentHarvest: resolveExpressedTrait(carrier, 'movement_min_recent_harvest'),
    movementMinRecentHarvestSteepness: resolveExpressedTrait(
      carrier,
      'movement_min_recent_harvest_steepness'
    ),
    harvestSecondaryPreference: resolveExpressedTrait(carrier, 'harvest_secondary_preference'),
    harvestPrimaryThreshold: resolveExpressedTrait(carrier, 'harvest_primary_threshold'),
    harvestPrimaryThresholdSteepness: resolveExpressedTrait(carrier, 'harvest_primary_threshold_steepness'),
    spendingSecondaryPreference: resolveExpressedTrait(carrier, 'spending_secondary_preference')
  };
}

function clampLegacyPolicyValue(key: string, value: number): number {
  switch (key) {
    case 'harvest_secondary_preference':
    case 'spending_secondary_preference':
      return clamp(value, 0, 1);
    case 'reproduction_harvest_threshold':
    case 'reproduction_harvest_threshold_steepness':
    case 'movement_energy_reserve_threshold':
    case 'movement_energy_reserve_threshold_steepness':
    case 'movement_min_recent_harvest':
    case 'movement_min_recent_harvest_steepness':
    case 'harvest_primary_threshold':
    case 'harvest_primary_threshold_steepness':
      return Math.max(0, value);
    default:
      return clampGenomeV2TraitValue(key, value);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
