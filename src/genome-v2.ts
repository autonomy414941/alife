import { Genome, GenomeV2, GenomeV2DistanceTraitCategory, GenomeV2DistanceWeights } from './types';

export const DEFAULT_TRAIT_VALUES: Record<string, number> = {
  metabolism: 0.6,
  harvest: 0.6,
  aggression: 0.4,
  harvestEfficiency2: 0.5,
  habitat_preference: 1,
  trophic_level: 0.5,
  defense_level: 0.5,
  metabolic_efficiency_primary: 0.5,
  metabolic_efficiency_secondary: 0.5,
  reproduction_harvest_threshold: 0,
  reproduction_harvest_threshold_steepness: 1.0,
  movement_energy_reserve_threshold: 0,
  movement_min_recent_harvest: 0,
  harvest_secondary_preference: 0.5,
  spending_secondary_preference: 0.5
};

export function createGenomeV2(traits: Map<string, number> = new Map()): GenomeV2 {
  return { traits: new Map(traits) };
}

export function fromGenome(genome: Genome): GenomeV2 {
  const traits = new Map<string, number>();
  traits.set('metabolism', genome.metabolism);
  traits.set('harvest', genome.harvest);
  traits.set('aggression', genome.aggression);
  if (genome.harvestEfficiency2 !== undefined) {
    traits.set('harvestEfficiency2', genome.harvestEfficiency2);
  }
  return createGenomeV2(traits);
}

export function toGenome(genomeV2: GenomeV2): Genome {
  const genome: Genome = {
    metabolism: getTrait(genomeV2, 'metabolism'),
    harvest: getTrait(genomeV2, 'harvest'),
    aggression: getTrait(genomeV2, 'aggression')
  };
  if (genomeV2.traits.has('harvestEfficiency2')) {
    genome.harvestEfficiency2 = getTrait(genomeV2, 'harvestEfficiency2');
  }
  return genome;
}

export function getTrait(genome: GenomeV2, key: string): number {
  const value = genome.traits.get(key);
  if (value !== undefined) {
    return value;
  }
  return DEFAULT_TRAIT_VALUES[key] ?? 0.5;
}

export function setTrait(genome: GenomeV2, key: string, value: number): void {
  genome.traits.set(key, value);
}

export function hasTrait(genome: GenomeV2, key: string): boolean {
  return genome.traits.has(key);
}

export function listTraits(genome: GenomeV2): string[] {
  return Array.from(genome.traits.keys());
}

export function traitCount(genome: GenomeV2): number {
  return genome.traits.size;
}

export function cloneGenomeV2(genome: GenomeV2): GenomeV2 {
  return createGenomeV2(genome.traits);
}

export interface MutateGenomeV2Options {
  mutationAmount: number;
  randomFloat: () => number;
  addLociProbability?: number;
  removeLociProbability?: number;
  minTraits?: number;
  maxTraits?: number;
  candidateNewLoci?: string[];
  policyMutationProbability?: number;
  policyMutationMagnitude?: number;
}

const CORE_TRAITS = ['metabolism', 'harvest', 'aggression'];
const OPTIONAL_TRAITS = ['harvestEfficiency2'];
export const EXTENDED_TRAITS: string[] = [
  'habitat_preference',
  'trophic_level',
  'defense_level',
  'metabolic_efficiency_primary',
  'metabolic_efficiency_secondary'
];
export const POLICY_TRAITS: string[] = [
  'reproduction_harvest_threshold',
  'reproduction_harvest_threshold_steepness',
  'movement_energy_reserve_threshold',
  'movement_min_recent_harvest',
  'harvest_secondary_preference',
  'spending_secondary_preference'
];
export const POLICY_THRESHOLD_TRAITS: string[] = [
  'reproduction_harvest_threshold',
  'movement_energy_reserve_threshold',
  'movement_min_recent_harvest'
];
export const POLICY_BOUNDED_TRAITS: string[] = [
  'reproduction_harvest_threshold_steepness',
  'harvest_secondary_preference',
  'spending_secondary_preference'
];
export const DEFAULT_MUTATION_CANDIDATE_NEW_LOCI = [...OPTIONAL_TRAITS, ...EXTENDED_TRAITS, ...POLICY_TRAITS];

export function mutateGenomeV2(
  genome: GenomeV2,
  options: MutateGenomeV2Options
): GenomeV2 {
  const {
    mutationAmount,
    randomFloat,
    addLociProbability = 0.02,
    removeLociProbability = 0.01,
    minTraits = 3,
    maxTraits = 20,
    candidateNewLoci = DEFAULT_MUTATION_CANDIDATE_NEW_LOCI,
    policyMutationProbability = 0,
    policyMutationMagnitude = 0
  } = options;

  const mutated = cloneGenomeV2(genome);
  const currentTraitCount = traitCount(mutated);

  for (const key of listTraits(mutated)) {
    if (CORE_TRAITS.includes(key)) {
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      setTrait(mutated, key, Math.max(0, Math.min(1, value + delta)));
    } else if (POLICY_TRAITS.includes(key)) {
      if (randomFloat() >= policyMutationProbability) {
        continue;
      }
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * policyMutationMagnitude;
      const mutatedValue = value + delta;
      setTrait(mutated, key, clampTraitValue(key, mutatedValue));
    } else {
      if (currentTraitCount > minTraits && randomFloat() < removeLociProbability) {
        mutated.traits.delete(key);
        continue;
      }
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      const mutatedValue = value + delta;
      setTrait(mutated, key, clampTraitValue(key, mutatedValue));
    }
  }

  if (currentTraitCount < maxTraits && randomFloat() < addLociProbability) {
    const absent = candidateNewLoci.filter((locus) => !hasTrait(mutated, locus));
    if (absent.length > 0) {
      const newLocus = absent[Math.floor(randomFloat() * absent.length)];
      setTrait(mutated, newLocus, DEFAULT_TRAIT_VALUES[newLocus] ?? 0.5);
    }
  }

  return mutated;
}

function clampTraitValue(key: string, value: number): number {
  if (key === 'harvest_secondary_preference' || key === 'spending_secondary_preference') {
    return Math.max(0, Math.min(1, value));
  }

  if (key === 'reproduction_harvest_threshold_steepness') {
    return Math.max(0.01, Math.min(10, value));
  }

  if (POLICY_TRAITS.includes(key)) {
    return Math.max(0, value);
  }

  return Math.max(0, Math.min(1, value));
}

export function genomeV2Distance(a: GenomeV2, b: GenomeV2, weights?: GenomeV2DistanceWeights): number {
  const allKeys = new Set([...listTraits(a), ...listTraits(b)]);
  if (allKeys.size === 0) {
    return 0;
  }

  let sum = 0;
  let totalExpressedWeight = 0;
  for (const key of allKeys) {
    const weight = distanceWeightForTrait(key, weights);
    totalExpressedWeight += weight;
    sum += Math.abs(getTrait(a, key) - getTrait(b, key)) * weight;
  }

  if (sum === 0 || totalExpressedWeight === 0) {
    return 0;
  }

  const baselineWeight = CORE_TRAITS.reduce((total, key) => total + distanceWeightForTrait(key, weights), 0);
  if (baselineWeight === 0) {
    return 0;
  }

  const normalizationCount = Math.max(totalExpressedWeight, baselineWeight);
  return (sum * baselineWeight) / normalizationCount;
}

export function classifyGenomeV2DistanceTraitCategory(key: string): GenomeV2DistanceTraitCategory {
  if (POLICY_THRESHOLD_TRAITS.includes(key)) {
    return 'policyThreshold';
  }
  if (POLICY_BOUNDED_TRAITS.includes(key)) {
    return 'policyBounded';
  }
  return 'morphology';
}

function distanceWeightForTrait(key: string, weights?: GenomeV2DistanceWeights): number {
  const traitWeight = weights?.traits?.[key];
  if (traitWeight !== undefined) {
    return validateDistanceWeight(`trait ${key}`, traitWeight);
  }

  const category = classifyGenomeV2DistanceTraitCategory(key);
  const categoryWeight = weights?.categories?.[category];
  if (categoryWeight !== undefined) {
    return validateDistanceWeight(`category ${category}`, categoryWeight);
  }

  return 1;
}

function validateDistanceWeight(label: string, weight: number): number {
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error(`GenomeV2 distance weight for ${label} must be a finite non-negative number`);
  }
  return weight;
}
