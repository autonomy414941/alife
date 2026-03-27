import { describe, it, expect } from 'vitest';
import {
  clampGenomeV2TraitValue,
  classifyGenomeV2DistanceTraitCategory,
  DEFAULT_MUTATION_CANDIDATE_NEW_LOCI,
  createGenomeV2,
  fromGenome,
  getGenomeV2TraitDefinition,
  toGenome,
  getTrait,
  setTrait,
  hasTrait,
  listTraits,
  traitCount,
  cloneGenomeV2,
  mutateGenomeV2,
  genomeV2Distance
} from '../src/genome-v2';
import { Genome } from '../src/types';

function createCoreGenomeV2() {
  const genome = createGenomeV2();
  setTrait(genome, 'metabolism', 0.5);
  setTrait(genome, 'harvest', 0.5);
  setTrait(genome, 'aggression', 0.5);
  return genome;
}

function scriptedRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? 0.5;
}

describe('GenomeV2', () => {
  describe('creation and conversion', () => {
    it('creates empty genome with defaults', () => {
      const genome = createGenomeV2();
      expect(traitCount(genome)).toBe(0);
      expect(getTrait(genome, 'metabolism')).toBe(0.6);
      expect(getTrait(genome, 'harvest')).toBe(0.6);
      expect(getTrait(genome, 'aggression')).toBe(0.4);
    });

    it('converts from Genome to GenomeV2', () => {
      const oldGenome: Genome = {
        metabolism: 0.7,
        harvest: 0.5,
        aggression: 0.3,
        harvestEfficiency2: 0.8
      };
      const newGenome = fromGenome(oldGenome);
      expect(getTrait(newGenome, 'metabolism')).toBe(0.7);
      expect(getTrait(newGenome, 'harvest')).toBe(0.5);
      expect(getTrait(newGenome, 'aggression')).toBe(0.3);
      expect(getTrait(newGenome, 'harvestEfficiency2')).toBe(0.8);
      expect(traitCount(newGenome)).toBe(4);
    });

    it('converts from Genome without optional harvestEfficiency2', () => {
      const oldGenome: Genome = {
        metabolism: 0.7,
        harvest: 0.5,
        aggression: 0.3
      };
      const newGenome = fromGenome(oldGenome);
      expect(getTrait(newGenome, 'metabolism')).toBe(0.7);
      expect(getTrait(newGenome, 'harvest')).toBe(0.5);
      expect(getTrait(newGenome, 'aggression')).toBe(0.3);
      expect(hasTrait(newGenome, 'harvestEfficiency2')).toBe(false);
      expect(traitCount(newGenome)).toBe(3);
    });

    it('converts from GenomeV2 to Genome', () => {
      const newGenome = createGenomeV2();
      setTrait(newGenome, 'metabolism', 0.7);
      setTrait(newGenome, 'harvest', 0.5);
      setTrait(newGenome, 'aggression', 0.3);
      setTrait(newGenome, 'harvestEfficiency2', 0.8);

      const oldGenome = toGenome(newGenome);
      expect(oldGenome.metabolism).toBe(0.7);
      expect(oldGenome.harvest).toBe(0.5);
      expect(oldGenome.aggression).toBe(0.3);
      expect(oldGenome.harvestEfficiency2).toBe(0.8);
    });

    it('round-trips between formats', () => {
      const original: Genome = {
        metabolism: 0.65,
        harvest: 0.45,
        aggression: 0.55,
        harvestEfficiency2: 0.72
      };
      const converted = toGenome(fromGenome(original));
      expect(converted).toEqual(original);
    });
  });

  describe('trait access', () => {
    it('gets and sets traits', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.75);
      expect(getTrait(genome, 'metabolism')).toBe(0.75);
    });

    it('returns default for missing traits', () => {
      const genome = createGenomeV2();
      expect(getTrait(genome, 'metabolism')).toBe(0.6);
      expect(getTrait(genome, 'trophic_level')).toBe(0.5);
      expect(getTrait(genome, 'defense_level')).toBe(0.5);
      expect(getTrait(genome, 'movement_energy_reserve_threshold_steepness')).toBe(1);
      expect(getTrait(genome, 'harvest_primary_threshold')).toBe(0);
      expect(getTrait(genome, 'unknown')).toBe(0.5);
    });

    it('describes known loci through the shared trait registry', () => {
      expect(getGenomeV2TraitDefinition('habitat_preference')).toMatchObject({
        role: 'ecological',
        mutationMode: 'optional',
        defaultValue: 1
      });
      expect(getGenomeV2TraitDefinition('harvest_primary_threshold')).toMatchObject({
        role: 'policy',
        mutationMode: 'policy',
        distanceCategory: 'policyThreshold'
      });
    });

    it('checks trait existence', () => {
      const genome = createGenomeV2();
      expect(hasTrait(genome, 'metabolism')).toBe(false);
      setTrait(genome, 'metabolism', 0.5);
      expect(hasTrait(genome, 'metabolism')).toBe(true);
    });

    it('lists all traits', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.6);
      const traits = listTraits(genome);
      expect(traits).toContain('metabolism');
      expect(traits).toContain('harvest');
      expect(traits.length).toBe(2);
    });

    it('counts traits', () => {
      const genome = createGenomeV2();
      expect(traitCount(genome)).toBe(0);
      setTrait(genome, 'metabolism', 0.5);
      expect(traitCount(genome)).toBe(1);
      setTrait(genome, 'harvest', 0.6);
      expect(traitCount(genome)).toBe(2);
    });
  });

  describe('cloning', () => {
    it('clones genome independently', () => {
      const original = createGenomeV2();
      setTrait(original, 'metabolism', 0.7);
      const clone = cloneGenomeV2(original);
      setTrait(clone, 'metabolism', 0.5);
      expect(getTrait(original, 'metabolism')).toBe(0.7);
      expect(getTrait(clone, 'metabolism')).toBe(0.5);
    });
  });

  describe('mutation', () => {
    it('mutates existing traits', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      let anyMutated = false;
      for (let i = 0; i < 20; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0
        });
        if (
          getTrait(mutated, 'metabolism') !== 0.5 ||
          getTrait(mutated, 'harvest') !== 0.5 ||
          getTrait(mutated, 'aggression') !== 0.5
        ) {
          anyMutated = true;
          break;
        }
      }
      expect(anyMutated).toBe(true);
    });

    it('clamps mutated values to [0, 1]', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.99);
      setTrait(genome, 'harvest', 0.01);
      setTrait(genome, 'aggression', 0.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.5,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0
        });
        expect(getTrait(mutated, 'metabolism')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'metabolism')).toBeLessThanOrEqual(1);
        expect(getTrait(mutated, 'harvest')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'harvest')).toBeLessThanOrEqual(1);
        expect(getTrait(mutated, 'aggression')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'aggression')).toBeLessThanOrEqual(1);
      }
    });

    it('clamps policy trait preferences to [0, 1]', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);
      setTrait(genome, 'harvest_secondary_preference', 0.99);
      setTrait(genome, 'spending_secondary_preference', 0.01);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.5,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0
        });
        expect(getTrait(mutated, 'harvest_secondary_preference')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'harvest_secondary_preference')).toBeLessThanOrEqual(1);
        expect(getTrait(mutated, 'spending_secondary_preference')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'spending_secondary_preference')).toBeLessThanOrEqual(1);
      }
    });

    it('clamps reproduction steepness to [0.01, 10]', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);
      setTrait(genome, 'reproduction_harvest_threshold_steepness', 9.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 5.0,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0
        });
        expect(getTrait(mutated, 'reproduction_harvest_threshold_steepness')).toBeGreaterThanOrEqual(0.01);
        expect(getTrait(mutated, 'reproduction_harvest_threshold_steepness')).toBeLessThanOrEqual(10);
      }
    });

    it('clamps habitat preference to the shared ecological range', () => {
      expect(clampGenomeV2TraitValue('habitat_preference', -5)).toBe(0.1);
      expect(clampGenomeV2TraitValue('habitat_preference', 5)).toBe(2);
    });

    it('mutates centralized policy steepness loci through policy mutation metadata', () => {
      const genome = createCoreGenomeV2();
      setTrait(genome, 'movement_energy_reserve_threshold_steepness', 9.9);

      const mutated = mutateGenomeV2(genome, {
        mutationAmount: 0,
        randomFloat: scriptedRandom([0.5, 0.5, 0.5, 0.0, 1.0]),
        addLociProbability: 0,
        removeLociProbability: 0,
        policyMutationProbability: 1,
        policyMutationMagnitude: 5
      });

      expect(getTrait(mutated, 'movement_energy_reserve_threshold_steepness')).toBe(10);
    });

    it('clamps policy threshold traits to >= 0', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);
      setTrait(genome, 'reproduction_harvest_threshold', 0.5);
      setTrait(genome, 'movement_energy_reserve_threshold', 0.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 2.0,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0
        });
        expect(getTrait(mutated, 'reproduction_harvest_threshold')).toBeGreaterThanOrEqual(0);
        expect(getTrait(mutated, 'movement_energy_reserve_threshold')).toBeGreaterThanOrEqual(0);
      }
    });

    it('preserves core traits (never removes)', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          removeLociProbability: 1.0
        });
        expect(hasTrait(mutated, 'metabolism')).toBe(true);
        expect(hasTrait(mutated, 'harvest')).toBe(true);
        expect(hasTrait(mutated, 'aggression')).toBe(true);
      }
    });

    it('can add new loci', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      let addedLocus = false;
      for (let i = 0; i < 100; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          addLociProbability: 0.5,
          removeLociProbability: 0,
          candidateNewLoci: ['harvestEfficiency2']
        });
        if (hasTrait(mutated, 'harvestEfficiency2')) {
          addedLocus = true;
          break;
        }
      }
      expect(addedLocus).toBe(true);
    });

    it.each([
      'habitat_preference',
      'trophic_level',
      'defense_level',
      'metabolic_efficiency_primary',
      'metabolic_efficiency_secondary',
      'reproduction_harvest_threshold',
      'reproduction_harvest_threshold_steepness',
      'movement_energy_reserve_threshold',
      'movement_min_recent_harvest',
      'harvest_secondary_preference',
      'spending_secondary_preference'
    ])('includes %s in the default mutation loci list', (locus) => {
      const targetIndex = DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.indexOf(locus);
      expect(targetIndex).toBeGreaterThanOrEqual(0);

      const mutated = mutateGenomeV2(createCoreGenomeV2(), {
        mutationAmount: 0,
        randomFloat: scriptedRandom([
          0.5,
          0.5,
          0.5,
          0,
          (targetIndex + 0.01) / DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.length
        ]),
        addLociProbability: 1,
        removeLociProbability: 0
      });

      expect(hasTrait(mutated, locus)).toBe(true);
    });

    it.each([
      'movement_energy_reserve_threshold_steepness',
      'movement_min_recent_harvest_steepness',
      'harvest_primary_threshold',
      'harvest_primary_threshold_steepness'
    ])('keeps %s centralized without auto-adding it to the default mutation search space', (locus) => {
      expect(DEFAULT_MUTATION_CANDIDATE_NEW_LOCI).not.toContain(locus);
      expect(getGenomeV2TraitDefinition(locus)?.role).toBe('policy');
    });

    it('can remove optional loci', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);
      setTrait(genome, 'harvestEfficiency2', 0.5);

      let removedLocus = false;
      for (let i = 0; i < 100; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          addLociProbability: 0,
          removeLociProbability: 0.5,
          minTraits: 3
        });
        if (!hasTrait(mutated, 'harvestEfficiency2')) {
          removedLocus = true;
          break;
        }
      }
      expect(removedLocus).toBe(true);
    });

    it('preserves policy traits (never removes)', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);
      setTrait(genome, 'reproduction_harvest_threshold', 5.0);
      setTrait(genome, 'harvest_secondary_preference', 0.7);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          removeLociProbability: 1.0,
          minTraits: 3
        });
        expect(hasTrait(mutated, 'reproduction_harvest_threshold')).toBe(true);
        expect(hasTrait(mutated, 'harvest_secondary_preference')).toBe(true);
      }
    });

    it('respects min traits constraint', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          removeLociProbability: 1.0,
          minTraits: 3
        });
        expect(traitCount(mutated)).toBeGreaterThanOrEqual(3);
      }
    });

    it('respects max traits constraint', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      for (let i = 0; i < 50; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          addLociProbability: 1.0,
          maxTraits: 4,
          candidateNewLoci: ['harvestEfficiency2', 'sensorRange', 'metabolicEfficiency']
        });
        expect(traitCount(mutated)).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('distance', () => {
    it('preserves the legacy scale for core-trait-only genomes', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.7);
      setTrait(b, 'harvest', 0.5);
      setTrait(b, 'aggression', 0.5);

      expect(genomeV2Distance(a, b)).toBeCloseTo(0.2);
    });

    it('down-weights optional loci contributions by expressed trait count', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.5);
      setTrait(b, 'harvest', 0.5);
      setTrait(b, 'aggression', 0.5);
      setTrait(b, 'harvestEfficiency2', 0.8);

      const distance = genomeV2Distance(a, b);
      expect(distance).toBeCloseTo(0.225);
    });

    it('prevents identical extra loci from inflating core-trait divergence', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);

      const b = cloneGenomeV2(a);
      setTrait(b, 'metabolism', 0.7);

      const baseDistance = genomeV2Distance(a, b);

      setTrait(a, 'harvestEfficiency2', 0.6);
      setTrait(a, 'habitat_preference', 0.4);
      setTrait(b, 'harvestEfficiency2', 0.6);
      setTrait(b, 'habitat_preference', 0.4);

      expect(genomeV2Distance(a, b)).toBeLessThan(baseDistance);
      expect(genomeV2Distance(a, b)).toBeCloseTo(0.12);
    });

    it('returns zero for identical genomes', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.6);

      const b = cloneGenomeV2(a);

      expect(genomeV2Distance(a, b)).toBe(0);
    });

    it('includes policy trait divergence in distance calculation', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);
      setTrait(a, 'reproduction_harvest_threshold', 5.0);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.5);
      setTrait(b, 'harvest', 0.5);
      setTrait(b, 'aggression', 0.5);
      setTrait(b, 'reproduction_harvest_threshold', 10.0);

      const distance = genomeV2Distance(a, b);
      expect(distance).toBeGreaterThan(0);
    });

    it('includes multiple policy trait differences in distance', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.5);
      setTrait(a, 'aggression', 0.5);
      setTrait(a, 'harvest_secondary_preference', 0.2);
      setTrait(a, 'spending_secondary_preference', 0.3);

      const b = createGenomeV2();
      setTrait(b, 'metabolism', 0.5);
      setTrait(b, 'harvest', 0.5);
      setTrait(b, 'aggression', 0.5);
      setTrait(b, 'harvest_secondary_preference', 0.8);
      setTrait(b, 'spending_secondary_preference', 0.7);

      const distance = genomeV2Distance(a, b);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(0.6);
    });

    it('down-weights unbounded policy thresholds by category', () => {
      const morphologyA = createCoreGenomeV2();
      setTrait(morphologyA, 'reproduction_harvest_threshold', 0);

      const morphologyB = createCoreGenomeV2();
      setTrait(morphologyB, 'metabolism', 0.9);
      setTrait(morphologyB, 'harvest', 0.9);
      setTrait(morphologyB, 'aggression', 0.9);
      setTrait(morphologyB, 'reproduction_harvest_threshold', 0);

      const policyA = createCoreGenomeV2();
      setTrait(policyA, 'reproduction_harvest_threshold', 0);

      const policyB = createCoreGenomeV2();
      setTrait(policyB, 'reproduction_harvest_threshold', 10);

      const morphologyDistance = genomeV2Distance(morphologyA, morphologyB, {
        categories: { policyThreshold: 0.1 }
      });
      const policyDistance = genomeV2Distance(policyA, policyB, {
        categories: { policyThreshold: 0.1 }
      });

      expect(policyDistance).toBeCloseTo(30 / 31, 10);
      expect(morphologyDistance).toBeGreaterThan(policyDistance);
    });

    it('lets per-locus weights override category weights', () => {
      const a = createCoreGenomeV2();
      setTrait(a, 'reproduction_harvest_threshold', 0);
      setTrait(a, 'movement_energy_reserve_threshold', 0);

      const b = createCoreGenomeV2();
      setTrait(b, 'reproduction_harvest_threshold', 2);
      setTrait(b, 'movement_energy_reserve_threshold', 2);

      const categoryWeightedDistance = genomeV2Distance(a, b, {
        categories: { policyThreshold: 0.1 }
      });
      const locusOverrideDistance = genomeV2Distance(a, b, {
        categories: { policyThreshold: 0.1 },
        traits: { reproduction_harvest_threshold: 1 }
      });

      expect(locusOverrideDistance).toBeGreaterThan(categoryWeightedDistance);
      expect(locusOverrideDistance).toBeCloseTo(6.6 / 4.1, 10);
    });

    it('classifies centralized non-default policy loci by distance category metadata', () => {
      expect(classifyGenomeV2DistanceTraitCategory('movement_energy_reserve_threshold_steepness')).toBe(
        'policyBounded'
      );
      expect(classifyGenomeV2DistanceTraitCategory('harvest_primary_threshold')).toBe('policyThreshold');
    });

    it('rejects invalid distance weights', () => {
      const a = createCoreGenomeV2();
      const b = createCoreGenomeV2();
      setTrait(b, 'reproduction_harvest_threshold', 1);

      expect(() =>
        genomeV2Distance(a, b, {
          categories: { policyThreshold: -1 }
        })
      ).toThrow(/finite non-negative number/);
    });
  });
});
