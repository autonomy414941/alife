import { Genome, GenomeV2, GenomeV2DistanceTraitCategory, GenomeV2DistanceWeights } from './types';

export type GenomeV2TraitRole = 'core' | 'ecological' | 'policy';
export type GenomeV2TraitMutationMode = 'core' | 'optional' | 'policy';
export type GenomeV2TraitActivationMode = 'positive' | 'presence';

export interface GenomeV2TraitDefinition {
  key: string;
  meaning: string;
  role: GenomeV2TraitRole;
  mutationMode: GenomeV2TraitMutationMode;
  defaultValue: number;
  clamp: {
    min: number;
    max?: number;
  };
  distanceCategory: GenomeV2DistanceTraitCategory;
  includeInDefaultMutationLoci?: boolean;
  legacyGenomeField?: keyof Genome;
  activationMode?: GenomeV2TraitActivationMode;
}

const UNIT_INTERVAL_CLAMP = { min: 0, max: 1 } as const;
const NON_NEGATIVE_CLAMP = { min: 0 } as const;
const POLICY_STEEPNESS_CLAMP = { min: 0.01, max: 10 } as const;
const HABITAT_PREFERENCE_CLAMP = { min: 0.1, max: 2 } as const;

const GENOME_V2_TRAIT_DEFINITIONS: GenomeV2TraitDefinition[] = [
  {
    key: 'metabolism',
    meaning: 'Primary metabolic expenditure baseline',
    role: 'core',
    mutationMode: 'core',
    defaultValue: 0.6,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    legacyGenomeField: 'metabolism'
  },
  {
    key: 'harvest',
    meaning: 'Primary resource acquisition bias',
    role: 'core',
    mutationMode: 'core',
    defaultValue: 0.6,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    legacyGenomeField: 'harvest'
  },
  {
    key: 'aggression',
    meaning: 'Encounter aggression bias',
    role: 'core',
    mutationMode: 'core',
    defaultValue: 0.4,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    legacyGenomeField: 'aggression'
  },
  {
    key: 'harvestEfficiency2',
    meaning: 'Secondary resource harvest efficiency',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true,
    legacyGenomeField: 'harvestEfficiency2'
  },
  {
    key: 'habitat_preference',
    meaning: 'Preferred fertility regime',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 1,
    clamp: HABITAT_PREFERENCE_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'trophic_level',
    meaning: 'Trophic interaction level',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'defense_level',
    meaning: 'Defense against encounters',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'metabolic_efficiency_primary',
    meaning: 'Primary resource metabolic efficiency',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'metabolic_efficiency_secondary',
    meaning: 'Secondary resource metabolic efficiency',
    role: 'ecological',
    mutationMode: 'optional',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'morphology',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'reproduction_harvest_threshold',
    meaning: 'Harvest threshold for reproduction gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'reproduction_harvest_threshold_steepness',
    meaning: 'Steepness of reproduction harvest gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 1,
    clamp: POLICY_STEEPNESS_CLAMP,
    distanceCategory: 'policyBounded',
    includeInDefaultMutationLoci: true,
    activationMode: 'presence'
  },
  {
    key: 'movement_energy_reserve_threshold',
    meaning: 'Energy reserve threshold for movement gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'movement_energy_reserve_threshold_steepness',
    meaning: 'Steepness of energy reserve movement gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 1,
    clamp: POLICY_STEEPNESS_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'movement_min_recent_harvest',
    meaning: 'Recent harvest threshold for movement gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold',
    includeInDefaultMutationLoci: true
  },
  {
    key: 'movement_min_recent_harvest_steepness',
    meaning: 'Steepness of recent harvest movement gating',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 1,
    clamp: POLICY_STEEPNESS_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'harvest_secondary_preference',
    meaning: 'Preference for secondary resource harvesting',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    includeInDefaultMutationLoci: true,
    activationMode: 'presence'
  },
  {
    key: 'harvest_primary_threshold',
    meaning: 'Primary resource threshold for graded harvest switching',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  },
  {
    key: 'harvest_primary_threshold_steepness',
    meaning: 'Steepness of graded harvest switching',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 1,
    clamp: POLICY_STEEPNESS_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'spending_secondary_preference',
    meaning: 'Preference for spending on secondary resource use',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    includeInDefaultMutationLoci: true,
    activationMode: 'presence'
  },
  {
    key: 'action_priority_harvest_primary',
    meaning: 'Priority for primary harvest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'action_priority_harvest_secondary',
    meaning: 'Priority for secondary harvest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'action_priority_move_toward_fertility',
    meaning: 'Priority for movement toward fertility action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'action_priority_reproduce_cautiously',
    meaning: 'Priority for cautious reproduction action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'action_priority_rest',
    meaning: 'Priority for rest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0.5,
    clamp: UNIT_INTERVAL_CLAMP,
    distanceCategory: 'policyBounded',
    activationMode: 'presence'
  },
  {
    key: 'action_threshold_harvest_primary',
    meaning: 'Threshold for primary harvest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  },
  {
    key: 'action_threshold_harvest_secondary',
    meaning: 'Threshold for secondary harvest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  },
  {
    key: 'action_threshold_move_toward_fertility',
    meaning: 'Threshold for movement toward fertility action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  },
  {
    key: 'action_threshold_reproduce_cautiously',
    meaning: 'Threshold for cautious reproduction action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  },
  {
    key: 'action_threshold_rest',
    meaning: 'Threshold for rest action',
    role: 'policy',
    mutationMode: 'policy',
    defaultValue: 0,
    clamp: NON_NEGATIVE_CLAMP,
    distanceCategory: 'policyThreshold'
  }
];

const GENOME_V2_TRAIT_DEFINITION_MAP = new Map(
  GENOME_V2_TRAIT_DEFINITIONS.map((definition) => [definition.key, definition] as const)
);

function listGenomeV2TraitKeys(
  predicate: (definition: GenomeV2TraitDefinition) => boolean
): string[] {
  return GENOME_V2_TRAIT_DEFINITIONS
    .filter(predicate)
    .map((definition) => definition.key);
}

export const CORE_TRAITS: string[] = listGenomeV2TraitKeys((definition) => definition.mutationMode === 'core');

export const EXTENDED_TRAITS: string[] = listGenomeV2TraitKeys((definition) => definition.role === 'ecological');
export const NON_POLICY_TRAITS: string[] = listGenomeV2TraitKeys((definition) => definition.role !== 'policy');
export const POLICY_TRAITS: string[] = listGenomeV2TraitKeys((definition) => definition.role === 'policy');
export const POLICY_THRESHOLD_TRAITS: string[] = listGenomeV2TraitKeys(
  (definition) => definition.distanceCategory === 'policyThreshold'
);
export const POLICY_BOUNDED_TRAITS: string[] = listGenomeV2TraitKeys(
  (definition) => definition.distanceCategory === 'policyBounded'
);
export const DEFAULT_MUTATION_CANDIDATE_NEW_LOCI = listGenomeV2TraitKeys(
  (definition) => definition.includeInDefaultMutationLoci === true
);

export const DEFAULT_TRAIT_VALUES: Record<string, number> = Object.fromEntries(
  GENOME_V2_TRAIT_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue] as const)
);

export function getGenomeV2TraitDefinition(key: string): GenomeV2TraitDefinition | undefined {
  return GENOME_V2_TRAIT_DEFINITION_MAP.get(key);
}

export function getDefaultGenomeV2TraitValue(key: string): number {
  return getGenomeV2TraitDefinition(key)?.defaultValue ?? 0.5;
}

export function clampGenomeV2TraitValue(key: string, value: number): number {
  const definition = getGenomeV2TraitDefinition(key);
  if (!definition) {
    return Math.max(0, Math.min(1, value));
  }

  const lowerBounded = Math.max(definition.clamp.min, value);
  if (definition.clamp.max === undefined) {
    return lowerBounded;
  }

  return Math.min(definition.clamp.max, lowerBounded);
}

export function classifyGenomeV2DistanceTraitCategory(key: string): GenomeV2DistanceTraitCategory {
  return getGenomeV2TraitDefinition(key)?.distanceCategory ?? 'morphology';
}

export function isActiveGenomeV2Trait(key: string, value: number, isPresent: boolean): boolean {
  const activationMode = getGenomeV2TraitDefinition(key)?.activationMode ?? 'positive';
  return activationMode === 'presence' ? isPresent : value > 0;
}

export function genomeV2HasTraitRole(genome: GenomeV2, role: GenomeV2TraitRole): boolean {
  return listTraits(genome).some((key) => getGenomeV2TraitDefinition(key)?.role === role);
}

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
  return getDefaultGenomeV2TraitValue(key);
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
    const traitDefinition = getGenomeV2TraitDefinition(key);
    const mutationMode = traitDefinition?.mutationMode ?? 'optional';

    if (mutationMode === 'core') {
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      setTrait(mutated, key, clampGenomeV2TraitValue(key, value + delta));
    } else if (mutationMode === 'policy') {
      if (randomFloat() >= policyMutationProbability) {
        continue;
      }
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * policyMutationMagnitude;
      const mutatedValue = value + delta;
      setTrait(mutated, key, clampGenomeV2TraitValue(key, mutatedValue));
    } else {
      if (currentTraitCount > minTraits && randomFloat() < removeLociProbability) {
        mutated.traits.delete(key);
        continue;
      }
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      const mutatedValue = value + delta;
      setTrait(mutated, key, clampGenomeV2TraitValue(key, mutatedValue));
    }
  }

  if (currentTraitCount < maxTraits && randomFloat() < addLociProbability) {
    const absent = candidateNewLoci.filter((locus) => !hasTrait(mutated, locus));
    if (absent.length > 0) {
      const newLocus = absent[Math.floor(randomFloat() * absent.length)];
      setTrait(mutated, newLocus, getDefaultGenomeV2TraitValue(newLocus));
    }
  }

  return mutated;
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
