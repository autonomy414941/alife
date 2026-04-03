import { clampGenomeV2TraitValue, getTrait } from './genome-v2';
import { GenomeV2 } from './types';

export interface PhenotypeCarrier {
  genomeV2?: GenomeV2;
  policyState?: ReadonlyMap<string, number>;
}

export interface LocalEcologicalContext {
  localFertility: number;
  localCrowding: number;
  disturbancePhase: number;
  age?: number;
  ticksSinceDisturbance?: number;
  recentDisturbanceCount?: number;
  primaryResourceLevel?: number;
  secondaryResourceLevel?: number;
  secondaryResourceFraction?: number;
  sameLineageCrowding?: number;
  sameLineageShare?: number;
}

export interface LocalObservationMap {
  age: number;
  localFertility: number;
  localCrowding: number;
  disturbancePhase: number;
  ticksSinceDisturbance: number;
  recentDisturbanceCount: number;
  primaryResourceLevel: number;
  secondaryResourceLevel: number;
  secondaryResourceFraction: number;
  sameLineageCrowding: number;
  sameLineageShare: number;
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

export function realizePhenotype(carrier: PhenotypeCarrier, context?: LocalEcologicalContext): RealizedPhenotype {
  const baseMetabolicEfficiencyPrimary = resolveExpressedTrait(carrier, 'metabolic_efficiency_primary');
  const baseMetabolicEfficiencySecondary = resolveExpressedTrait(carrier, 'metabolic_efficiency_secondary');
  const baseHarvestSecondaryPreference = resolveExpressedTrait(carrier, 'harvest_secondary_preference');

  const metabolicEfficiencyPrimary = context
    ? realizeContextDependentMetabolicEfficiency(
        baseMetabolicEfficiencyPrimary,
        context,
        'primary'
      )
    : baseMetabolicEfficiencyPrimary;

  const metabolicEfficiencySecondary = context
    ? realizeContextDependentMetabolicEfficiency(
        baseMetabolicEfficiencySecondary,
        context,
        'secondary'
      )
    : baseMetabolicEfficiencySecondary;

  const harvestSecondaryPreference = context
    ? realizeContextDependentHarvestSecondaryPreference(baseHarvestSecondaryPreference, context)
    : baseHarvestSecondaryPreference;

  return {
    trophicLevel: resolveExpressedTrait(carrier, 'trophic_level'),
    defenseLevel: resolveExpressedTrait(carrier, 'defense_level'),
    metabolicEfficiencyPrimary,
    metabolicEfficiencySecondary,
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
    harvestSecondaryPreference,
    harvestPrimaryThreshold: resolveExpressedTrait(carrier, 'harvest_primary_threshold'),
    harvestPrimaryThresholdSteepness: resolveExpressedTrait(carrier, 'harvest_primary_threshold_steepness'),
    spendingSecondaryPreference: resolveExpressedTrait(carrier, 'spending_secondary_preference')
  };
}

function realizeContextDependentMetabolicEfficiency(
  baseEfficiency: number | undefined,
  context: LocalEcologicalContext,
  resourceType: 'primary' | 'secondary'
): number | undefined {
  if (baseEfficiency === undefined) {
    return undefined;
  }

  const fertilityModulation = computeFertilityModulation(context.localFertility);
  const crowdingModulation = computeCrowdingModulation(context.localCrowding);
  const disturbanceModulation = computeDisturbanceModulation(context.disturbancePhase);

  const contextualMultiplier = fertilityModulation * crowdingModulation * disturbanceModulation;

  const modulated = baseEfficiency * contextualMultiplier;
  return Math.max(0, Math.min(1, modulated));
}

function realizeContextDependentHarvestSecondaryPreference(
  basePreference: number | undefined,
  context: LocalEcologicalContext
): number | undefined {
  if (basePreference === undefined) {
    return undefined;
  }

  const fertilityPressure = 1 - clamp(context.localFertility, 0, 2);
  const crowdingPressure = clamp(context.localCrowding / 8, 0, 1);
  const disturbancePressure = context.disturbancePhase > 0 ? 1 : 0;
  const adjustedPreference =
    basePreference + fertilityPressure * 0.18 + crowdingPressure * 0.08 + disturbancePressure * 0.12;

  return clamp(adjustedPreference, 0, 1);
}

function computeFertilityModulation(localFertility: number): number {
  const normalizedFertility = Math.max(0, Math.min(2, localFertility));
  return 0.8 + 0.2 * normalizedFertility;
}

function computeCrowdingModulation(localCrowding: number): number {
  const normalizedCrowding = Math.max(0, Math.min(1, localCrowding / 8));
  return 1 - 0.3 * normalizedCrowding;
}

function computeDisturbanceModulation(disturbancePhase: number): number {
  if (disturbancePhase > 0) {
    return 0.7;
  }
  return 1.0;
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

export function cloneLocalObservationMap(observation: LocalObservationMap): LocalObservationMap {
  return { ...observation };
}
