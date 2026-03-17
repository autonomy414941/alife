import { describe, it, expect } from 'vitest';
import {
  dominantEncounterOperator,
  pairwiseEncounterOperator,
  nonTransitiveEncounterOperator,
  EncounterOperatorContext
} from '../src/encounter';
import { Agent, Genome } from '../src/types';
import { LifeSimulation } from '../src/simulation';

function createAgent(
  id: number,
  aggression: number,
  energy: number,
  species = 1,
  lineage = 1,
  genomeOverrides: Partial<Genome> = {}
): Agent {
  return {
    id,
    species,
    lineage,
    x: 0,
    y: 0,
    energy,
    genome: {
      metabolism: 0.5,
      harvest: 0.5,
      aggression,
      ...genomeOverrides
    },
    age: 0,
    generation: 1,
    parentId: null
  };
}

function createContext(): EncounterOperatorContext {
  return {
    config: {
      predationPressure: 0,
      defenseMitigation: 0
    },
    blendedTrophicLevel: () => 0.5,
    blendedDefenseLevel: () => 0,
    lineageTransferMultiplier: () => 1
  };
}

describe('dominantEncounterOperator', () => {
  it('does nothing when there are fewer than 2 agents', () => {
    const agents = [createAgent(1, 0.5, 100)];
    const context = createContext();
    dominantEncounterOperator(agents, context);
    expect(agents[0].energy).toBe(100);
  });

  it('picks the most aggressive agent as dominant', () => {
    const agents = [
      createAgent(1, 0.3, 100),
      createAgent(2, 0.8, 100),
      createAgent(3, 0.5, 100)
    ];
    const context = createContext();
    dominantEncounterOperator(agents, context);

    const highAggAgent = agents.find(a => a.id === 2)!;
    const lowAggAgent1 = agents.find(a => a.id === 1)!;
    const lowAggAgent2 = agents.find(a => a.id === 3)!;

    expect(highAggAgent.energy).toBeGreaterThan(100);
    expect(lowAggAgent1.energy).toBeLessThan(100);
    expect(lowAggAgent2.energy).toBeLessThan(100);
  });

  it('uses energy as tiebreaker when aggression is equal', () => {
    const agents = [
      createAgent(1, 0.5, 80),
      createAgent(2, 0.5, 120)
    ];
    const context = createContext();
    dominantEncounterOperator(agents, context);

    const highEnergyAgent = agents.find(a => a.id === 2)!;
    const lowEnergyAgent = agents.find(a => a.id === 1)!;

    expect(highEnergyAgent.energy).toBeGreaterThan(120);
    expect(lowEnergyAgent.energy).toBeLessThan(80);
  });

  it('transfers energy from all subordinates to dominant', () => {
    const agents = [
      createAgent(1, 0.2, 100),
      createAgent(2, 0.9, 100),
      createAgent(3, 0.3, 100),
      createAgent(4, 0.4, 100)
    ];
    const context = createContext();
    const initialTotal = agents.reduce((sum, a) => sum + a.energy, 0);

    dominantEncounterOperator(agents, context);

    const finalTotal = agents.reduce((sum, a) => sum + a.energy, 0);
    const dominant = agents.find(a => a.id === 2)!;
    const subordinate1 = agents.find(a => a.id === 1)!;
    const subordinate2 = agents.find(a => a.id === 3)!;
    const subordinate3 = agents.find(a => a.id === 4)!;

    expect(finalTotal).toBeCloseTo(initialTotal, 5);
    expect(dominant.energy).toBeGreaterThan(100);
    expect(subordinate1.energy).toBeLessThan(100);
    expect(subordinate2.energy).toBeLessThan(100);
    expect(subordinate3.energy).toBeLessThan(100);
  });
});

describe('pairwiseEncounterOperator', () => {
  it('does nothing when there are fewer than 2 agents', () => {
    const agents = [createAgent(1, 0.5, 100)];
    const context = createContext();
    pairwiseEncounterOperator(agents, context);
    expect(agents[0].energy).toBe(100);
  });

  it('resolves each pair independently', () => {
    const agents = [
      createAgent(1, 0.3, 100),
      createAgent(2, 0.7, 100)
    ];
    const context = createContext();
    pairwiseEncounterOperator(agents, context);

    expect(agents[1].energy).toBeGreaterThan(100);
    expect(agents[0].energy).toBeLessThan(100);
  });

  it('processes all unique pairs exactly once', () => {
    const agents = [
      createAgent(1, 0.2, 100),
      createAgent(2, 0.5, 100),
      createAgent(3, 0.8, 100)
    ];
    const context = createContext();
    const initialTotal = agents.reduce((sum, a) => sum + a.energy, 0);

    pairwiseEncounterOperator(agents, context);

    const finalTotal = agents.reduce((sum, a) => sum + a.energy, 0);
    expect(finalTotal).toBeCloseTo(initialTotal, 5);

    expect(agents[2].energy).toBeGreaterThan(100);
    expect(agents[0].energy).toBeLessThan(100);
  });

  it('uses energy as tiebreaker when aggression is equal', () => {
    const agents = [
      createAgent(1, 0.5, 80),
      createAgent(2, 0.5, 120)
    ];
    const context = createContext();
    pairwiseEncounterOperator(agents, context);

    expect(agents[1].energy).toBeGreaterThan(120);
    expect(agents[0].energy).toBeLessThan(80);
  });

  it('differs from dominant operator in multi-agent scenarios', () => {
    const agentsDominant = [
      createAgent(1, 0.2, 100),
      createAgent(2, 0.5, 100),
      createAgent(3, 0.8, 100)
    ];
    const agentsPairwise = [
      createAgent(1, 0.2, 100),
      createAgent(2, 0.5, 100),
      createAgent(3, 0.8, 100)
    ];
    const context = createContext();

    dominantEncounterOperator(agentsDominant, context);
    pairwiseEncounterOperator(agentsPairwise, context);

    expect(agentsDominant[1].energy).not.toBeCloseTo(agentsPairwise[1].energy, 1);
  });

  it('distributes energy based on pairwise aggression differences', () => {
    const agents = [
      createAgent(1, 0.1, 100),
      createAgent(2, 0.5, 100),
      createAgent(3, 0.9, 100)
    ];
    const context = createContext();

    pairwiseEncounterOperator(agents, context);

    const highest = agents.find(a => a.id === 3)!;
    const middle = agents.find(a => a.id === 2)!;
    const lowest = agents.find(a => a.id === 1)!;

    expect(highest.energy).toBeGreaterThan(100);
    expect(lowest.energy).toBeLessThan(100);
    expect(middle.energy).toBeLessThan(112.5);
    expect(middle.energy).toBeGreaterThan(lowest.energy);
  });

  it('preserves total energy', () => {
    const agents = [
      createAgent(1, 0.2, 100),
      createAgent(2, 0.5, 100),
      createAgent(3, 0.8, 100),
      createAgent(4, 0.3, 100)
    ];
    const context = createContext();
    const initialTotal = agents.reduce((sum, a) => sum + a.energy, 0);

    pairwiseEncounterOperator(agents, context);

    const finalTotal = agents.reduce((sum, a) => sum + a.energy, 0);
    expect(finalTotal).toBeCloseTo(initialTotal, 5);
  });
});

describe('nonTransitiveEncounterOperator', () => {
  it('does nothing when there are fewer than 2 agents', () => {
    const agents = [createAgent(1, 0.5, 100)];
    const context = createContext();
    nonTransitiveEncounterOperator(agents, context);
    expect(agents[0].energy).toBe(100);
  });

  it('supports cyclic dominance across genome archetypes', () => {
    const context = createContext();

    const metabolismSpecialist = () =>
      createAgent(1, 0.1, 100, 1, 1, {
        metabolism: 0.95,
        harvest: 0.2
      });
    const aggressionSpecialist = () =>
      createAgent(2, 0.95, 100, 1, 2, {
        metabolism: 0.2,
        harvest: 0.1
      });
    const harvestSpecialist = () =>
      createAgent(3, 0.2, 100, 1, 3, {
        metabolism: 0.1,
        harvest: 0.95
      });

    const metabolismVsAggression = [metabolismSpecialist(), aggressionSpecialist()];
    nonTransitiveEncounterOperator(metabolismVsAggression, context);
    expect(metabolismVsAggression[0].energy).toBeGreaterThan(100);
    expect(metabolismVsAggression[1].energy).toBeLessThan(100);

    const aggressionVsHarvest = [aggressionSpecialist(), harvestSpecialist()];
    nonTransitiveEncounterOperator(aggressionVsHarvest, context);
    expect(aggressionVsHarvest[0].energy).toBeGreaterThan(100);
    expect(aggressionVsHarvest[1].energy).toBeLessThan(100);

    const harvestVsMetabolism = [harvestSpecialist(), metabolismSpecialist()];
    nonTransitiveEncounterOperator(harvestVsMetabolism, context);
    expect(harvestVsMetabolism[0].energy).toBeGreaterThan(100);
    expect(harvestVsMetabolism[1].energy).toBeLessThan(100);
  });

  it('falls back to aggression dominance within the same archetype', () => {
    const agents = [
      createAgent(1, 0.3, 100, 1, 1, { metabolism: 0.9, harvest: 0.2 }),
      createAgent(2, 0.8, 100, 1, 2, { metabolism: 0.95, harvest: 0.1 })
    ];
    const context = createContext();

    nonTransitiveEncounterOperator(agents, context);

    expect(agents[1].energy).toBeGreaterThan(100);
    expect(agents[0].energy).toBeLessThan(100);
  });

  it('preserves total energy across cyclic pair resolution', () => {
    const agents = [
      createAgent(1, 0.1, 100, 1, 1, { metabolism: 0.95, harvest: 0.2 }),
      createAgent(2, 0.95, 100, 1, 2, { metabolism: 0.2, harvest: 0.1 }),
      createAgent(3, 0.2, 100, 1, 3, { metabolism: 0.1, harvest: 0.95 })
    ];
    const context = createContext();
    const initialTotal = agents.reduce((sum, agent) => sum + agent.energy, 0);

    nonTransitiveEncounterOperator(agents, context);

    const finalTotal = agents.reduce((sum, agent) => sum + agent.energy, 0);
    expect(finalTotal).toBeCloseTo(initialTotal, 5);
  });
});

describe('encounter operator runtime substitution', () => {
  it('accepts pairwiseEncounterOperator at simulation construction', () => {
    const simWithPairwise = new LifeSimulation({
      seed: 42,
      encounterOperator: pairwiseEncounterOperator,
      config: { width: 10, height: 10, initialAgents: 20 }
    });

    expect(() => {
      for (let i = 0; i < 10; i++) {
        simWithPairwise.step();
      }
    }).not.toThrow();

    expect(simWithPairwise.snapshot().tick).toBe(10);
  });

  it('accepts dominantEncounterOperator explicitly', () => {
    const simWithDominant = new LifeSimulation({
      seed: 42,
      encounterOperator: dominantEncounterOperator,
      config: { width: 10, height: 10, initialAgents: 20 }
    });

    expect(() => {
      for (let i = 0; i < 10; i++) {
        simWithDominant.step();
      }
    }).not.toThrow();

    expect(simWithDominant.snapshot().tick).toBe(10);
  });

  it('accepts nonTransitiveEncounterOperator explicitly', () => {
    const simWithNonTransitive = new LifeSimulation({
      seed: 42,
      encounterOperator: nonTransitiveEncounterOperator,
      config: { width: 10, height: 10, initialAgents: 20 }
    });

    expect(() => {
      for (let i = 0; i < 10; i++) {
        simWithNonTransitive.step();
      }
    }).not.toThrow();

    expect(simWithNonTransitive.snapshot().tick).toBe(10);
  });

  it('produces different outcomes for dominant vs pairwise operators', () => {
    const sharedConfig = {
      seed: 123,
      config: {
        width: 10,
        height: 10,
        initialAgents: 50
      }
    };

    const simDominant = new LifeSimulation({
      ...sharedConfig,
      encounterOperator: dominantEncounterOperator
    });

    const simPairwise = new LifeSimulation({
      ...sharedConfig,
      encounterOperator: pairwiseEncounterOperator
    });

    for (let i = 0; i < 50; i++) {
      simDominant.step();
      simPairwise.step();
    }

    const countDominant = simDominant.snapshot().population;
    const countPairwise = simPairwise.snapshot().population;

    expect(countDominant).not.toBe(countPairwise);
  });
});
