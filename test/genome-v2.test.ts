import { describe, it, expect } from 'vitest';
import {
  createGenomeV2,
  fromGenome,
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
      expect(getTrait(genome, 'unknown')).toBe(0.5);
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

    it('includes trophic and defense in the default extended loci list', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      let addedExtendedLocus = false;
      for (let i = 0; i < 250; i++) {
        const mutated = mutateGenomeV2(genome, {
          mutationAmount: 0.2,
          randomFloat: Math.random,
          addLociProbability: 1,
          removeLociProbability: 0
        });
        if (hasTrait(mutated, 'trophic_level') || hasTrait(mutated, 'defense_level')) {
          addedExtendedLocus = true;
          break;
        }
      }

      expect(addedExtendedLocus).toBe(true);
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
    it('calculates distance between genomes', () => {
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

    it('considers traits in one but not the other', () => {
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
      expect(distance).toBeGreaterThan(0);
    });

    it('returns zero for identical genomes', () => {
      const a = createGenomeV2();
      setTrait(a, 'metabolism', 0.5);
      setTrait(a, 'harvest', 0.6);

      const b = cloneGenomeV2(a);

      expect(genomeV2Distance(a, b)).toBe(0);
    });
  });
});
