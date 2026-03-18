import { Genome, GenomeV2 } from './types';

export const DEFAULT_TRAIT_VALUES: Record<string, number> = {
  metabolism: 0.6,
  harvest: 0.6,
  aggression: 0.4,
  harvestEfficiency2: 0.5,
  habitat_preference: 1,
  trophic_level: 0.5,
  defense_level: 0.5,
  metabolic_efficiency_primary: 0.5,
  metabolic_efficiency_secondary: 0.5
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
}

const CORE_TRAITS = ['metabolism', 'harvest', 'aggression'];
const OPTIONAL_TRAITS = ['harvestEfficiency2'];
const EXTENDED_TRAITS: string[] = [
  'trophic_level',
  'defense_level',
  'metabolic_efficiency_primary',
  'metabolic_efficiency_secondary'
];

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
    candidateNewLoci = [...OPTIONAL_TRAITS, ...EXTENDED_TRAITS]
  } = options;

  const mutated = cloneGenomeV2(genome);
  const currentTraitCount = traitCount(mutated);

  for (const key of listTraits(mutated)) {
    if (CORE_TRAITS.includes(key)) {
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      setTrait(mutated, key, Math.max(0, Math.min(1, value + delta)));
    } else {
      if (currentTraitCount > minTraits && randomFloat() < removeLociProbability) {
        mutated.traits.delete(key);
        continue;
      }
      const value = getTrait(mutated, key);
      const delta = (randomFloat() - 0.5) * 2 * mutationAmount;
      setTrait(mutated, key, Math.max(0, Math.min(1, value + delta)));
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

export function genomeV2Distance(a: GenomeV2, b: GenomeV2): number {
  const allKeys = new Set([...listTraits(a), ...listTraits(b)]);
  let sum = 0;
  for (const key of allKeys) {
    sum += Math.abs(getTrait(a, key) - getTrait(b, key));
  }
  return sum;
}
