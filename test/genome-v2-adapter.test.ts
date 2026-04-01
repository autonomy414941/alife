import { describe, it, expect } from 'vitest';
import {
  agentToV2,
  agentFromV2,
  mutateGenomeV2WithConfig,
  shouldSpeciateV2,
  shouldFoundCladeV2,
  getMetabolismV2,
  getHarvestV2,
  getAggressionV2,
  getHarvestEfficiency2V2,
  createGenomeV2InitialAgents
} from '../src/genome-v2-adapter';
import { DEFAULT_MUTATION_CANDIDATE_NEW_LOCI, createGenomeV2, setTrait, getTrait } from '../src/genome-v2';
import { Agent, SimulationConfig } from '../src/types';

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

describe('GenomeV2 Adapter', () => {
  describe('agent conversion', () => {
    it('converts agent to V2', () => {
      const agent: Agent = {
        id: 1,
        lineage: 1,
        species: 1,
        x: 5,
        y: 5,
        energy: 10,
        age: 0,
        genome: {
          metabolism: 0.7,
          harvest: 0.5,
          aggression: 0.3,
          harvestEfficiency2: 0.8
        }
      };

      const agentV2 = agentToV2(agent);
      expect(agentV2.id).toBe(1);
      expect(agentV2.lineage).toBe(1);
      expect(agentV2.species).toBe(1);
      expect(agentV2.x).toBe(5);
      expect(agentV2.y).toBe(5);
      expect(agentV2.energy).toBe(10);
      expect(agentV2.age).toBe(0);
      expect(getTrait(agentV2.genomeV2, 'metabolism')).toBe(0.7);
      expect(getTrait(agentV2.genomeV2, 'harvest')).toBe(0.5);
      expect(getTrait(agentV2.genomeV2, 'aggression')).toBe(0.3);
      expect(getTrait(agentV2.genomeV2, 'harvestEfficiency2')).toBe(0.8);
    });

    it('converts agent from V2', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, 'metabolism', 0.7);
      setTrait(genomeV2, 'harvest', 0.5);
      setTrait(genomeV2, 'aggression', 0.3);
      setTrait(genomeV2, 'harvestEfficiency2', 0.8);

      const agentV2 = {
        id: 1,
        lineage: 1,
        species: 1,
        x: 5,
        y: 5,
        energy: 10,
        age: 0,
        genomeV2
      };

      const agent = agentFromV2(agentV2);
      expect(agent.genome.metabolism).toBe(0.7);
      expect(agent.genome.harvest).toBe(0.5);
      expect(agent.genome.aggression).toBe(0.3);
      expect(agent.genome.harvestEfficiency2).toBe(0.8);
    });

    it('round-trips agent conversion', () => {
      const original: Agent = {
        id: 1,
        lineage: 1,
        species: 1,
        x: 5,
        y: 5,
        energy: 10,
        age: 0,
        genome: {
          metabolism: 0.65,
          harvest: 0.45,
          aggression: 0.55,
          harvestEfficiency2: 0.72
        }
      };

      const converted = agentFromV2(agentToV2(original));
      expect(converted).toEqual(original);
    });
  });

  describe('mutation with config', () => {
    it('mutates genome using simulation config', () => {
      const config: Partial<SimulationConfig> = {
        mutationAmount: 0.2
      };

      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.5);
      setTrait(genome, 'harvest', 0.5);
      setTrait(genome, 'aggression', 0.5);

      let anyMutated = false;
      for (let i = 0; i < 20; i++) {
        const mutated = mutateGenomeV2WithConfig(genome, config as SimulationConfig, Math.random);
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

    it.each([
      'habitat_preference',
      'trophic_level',
      'defense_level',
      'metabolic_efficiency_primary',
      'metabolic_efficiency_secondary'
    ])('can add %s through the live mutation adapter', (locus) => {
      const targetIndex = DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.indexOf(locus);
      expect(targetIndex).toBeGreaterThanOrEqual(0);

      const mutated = mutateGenomeV2WithConfig(
        createCoreGenomeV2(),
        {
          mutationAmount: 0
        } as SimulationConfig,
        scriptedRandom([
          0.5,
          0.5,
          0.5,
          0,
          (targetIndex + 0.01) / DEFAULT_MUTATION_CANDIDATE_NEW_LOCI.length
        ])
      );

      expect(mutated.traits.has(locus)).toBe(true);
    });
  });

  describe('speciation and cladogenesis', () => {
    it('detects speciation threshold', () => {
      const parent = createGenomeV2();
      setTrait(parent, 'metabolism', 0.5);
      setTrait(parent, 'harvest', 0.5);
      setTrait(parent, 'aggression', 0.5);

      const childSimilar = createGenomeV2();
      setTrait(childSimilar, 'metabolism', 0.51);
      setTrait(childSimilar, 'harvest', 0.5);
      setTrait(childSimilar, 'aggression', 0.5);

      const childDifferent = createGenomeV2();
      setTrait(childDifferent, 'metabolism', 0.8);
      setTrait(childDifferent, 'harvest', 0.5);
      setTrait(childDifferent, 'aggression', 0.5);

      const config: Partial<SimulationConfig> = {
        speciationThreshold: 0.25
      };

      expect(shouldSpeciateV2(parent, childSimilar, config as SimulationConfig)).toBe(false);
      expect(shouldSpeciateV2(parent, childDifferent, config as SimulationConfig)).toBe(true);
    });

    it('detects cladogenesis threshold', () => {
      const founder = createGenomeV2();
      setTrait(founder, 'metabolism', 0.5);
      setTrait(founder, 'harvest', 0.5);
      setTrait(founder, 'aggression', 0.5);

      const childSimilar = createGenomeV2();
      setTrait(childSimilar, 'metabolism', 0.51);
      setTrait(childSimilar, 'harvest', 0.5);
      setTrait(childSimilar, 'aggression', 0.5);

      const childDifferent = createGenomeV2();
      setTrait(childDifferent, 'metabolism', 0.9);
      setTrait(childDifferent, 'harvest', 0.5);
      setTrait(childDifferent, 'aggression', 0.5);

      const config: Partial<SimulationConfig> = {
        cladogenesisThreshold: 1.0
      };

      expect(shouldFoundCladeV2(founder, childSimilar, config as SimulationConfig)).toBe(false);
      expect(shouldFoundCladeV2(founder, childDifferent, config as SimulationConfig)).toBe(false);

      const childVeryDifferent = createGenomeV2();
      setTrait(childVeryDifferent, 'metabolism', 0.9);
      setTrait(childVeryDifferent, 'harvest', 0.1);
      setTrait(childVeryDifferent, 'aggression', 0.9);

      expect(shouldFoundCladeV2(founder, childVeryDifferent, config as SimulationConfig)).toBe(true);
    });

    it('requires positive threshold for cladogenesis', () => {
      const founder = createGenomeV2();
      setTrait(founder, 'metabolism', 0.5);

      const child = createGenomeV2();
      setTrait(child, 'metabolism', 0.9);

      const config: Partial<SimulationConfig> = {
        cladogenesisThreshold: -1
      };

      expect(shouldFoundCladeV2(founder, child, config as SimulationConfig)).toBe(false);
    });
  });

  describe('trait accessors', () => {
    it('gets metabolism', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'metabolism', 0.75);
      expect(getMetabolismV2(genome)).toBe(0.75);
    });

    it('gets harvest', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'harvest', 0.65);
      expect(getHarvestV2(genome)).toBe(0.65);
    });

    it('gets aggression', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'aggression', 0.45);
      expect(getAggressionV2(genome)).toBe(0.45);
    });

    it('gets harvestEfficiency2', () => {
      const genome = createGenomeV2();
      setTrait(genome, 'harvestEfficiency2', 0.85);
      expect(getHarvestEfficiency2V2(genome)).toBe(0.85);
    });

    it('returns defaults for missing traits', () => {
      const genome = createGenomeV2();
      expect(getMetabolismV2(genome)).toBe(0.6);
      expect(getHarvestV2(genome)).toBe(0.6);
      expect(getAggressionV2(genome)).toBe(0.4);
      expect(getHarvestEfficiency2V2(genome)).toBe(0.5);
    });
  });

  describe('createGenomeV2InitialAgents', () => {
    it('creates agent seeds with genomeV2 from legacy genome', () => {
      const seeds = createGenomeV2InitialAgents({ seed: 42 });
      expect(seeds.length).toBeGreaterThan(0);
      for (const seed of seeds) {
        expect(seed.genomeV2).toBeDefined();
        expect(seed.genome).toBeDefined();
        expect(getTrait(seed.genomeV2!, 'metabolism')).toBe(seed.genome.metabolism);
        expect(getTrait(seed.genomeV2!, 'harvest')).toBe(seed.genome.harvest);
        expect(getTrait(seed.genomeV2!, 'aggression')).toBe(seed.genome.aggression);
      }
    });

    it('creates reproducible agent seeds for the same seed', () => {
      const seeds1 = createGenomeV2InitialAgents({ seed: 123 });
      const seeds2 = createGenomeV2InitialAgents({ seed: 123 });
      expect(seeds1.length).toBe(seeds2.length);
      for (let i = 0; i < seeds1.length; i++) {
        expect(seeds1[i].x).toBe(seeds2[i].x);
        expect(seeds1[i].y).toBe(seeds2[i].y);
        expect(seeds1[i].genome).toEqual(seeds2[i].genome);
      }
    });

    it('creates different agent seeds for different seeds', () => {
      const seeds1 = createGenomeV2InitialAgents({ seed: 42 });
      const seeds2 = createGenomeV2InitialAgents({ seed: 99 });
      let anyDifferent = false;
      for (let i = 0; i < Math.min(seeds1.length, seeds2.length); i++) {
        if (seeds1[i].x !== seeds2[i].x || seeds1[i].genome.metabolism !== seeds2[i].genome.metabolism) {
          anyDifferent = true;
          break;
        }
      }
      expect(anyDifferent).toBe(true);
    });

    it('respects config overrides', () => {
      const seeds = createGenomeV2InitialAgents({
        seed: 42,
        config: { initialAgents: 50, width: 64, height: 64 }
      });
      expect(seeds.length).toBe(50);
      for (const seed of seeds) {
        expect(seed.x).toBeGreaterThanOrEqual(0);
        expect(seed.x).toBeLessThan(64);
        expect(seed.y).toBeGreaterThanOrEqual(0);
        expect(seed.y).toBeLessThan(64);
      }
    });

    it('sets genomeV2 for all agents', () => {
      const seeds = createGenomeV2InitialAgents({ seed: 42 });
      for (const seed of seeds) {
        expect(seed.genomeV2).toBeDefined();
        expect(seed.genomeV2!.traits.size).toBeGreaterThan(0);
      }
    });

    it('preserves agent position and energy', () => {
      const seeds = createGenomeV2InitialAgents({ seed: 42 });
      for (const seed of seeds) {
        expect(seed.x).toBeGreaterThanOrEqual(0);
        expect(seed.y).toBeGreaterThanOrEqual(0);
        expect(seed.energy).toBeGreaterThan(0);
      }
    });

    it('preserves lineage and species IDs', () => {
      const seeds = createGenomeV2InitialAgents({ seed: 42 });
      for (const seed of seeds) {
        expect(seed.lineage).toBeGreaterThan(0);
        expect(seed.species).toBeGreaterThan(0);
      }
    });
  });
});
