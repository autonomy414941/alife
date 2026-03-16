import { describe, expect, it } from 'vitest';
import { LifeSimulation } from '../src/simulation';

describe('agent energy pool lifecycle', () => {
  it('tracks primary and secondary harvest separately while keeping scalar energy in sync', () => {
    const sim = new LifeSimulation({
      seed: 1,
      config: {
        width: 1,
        height: 1,
        maxResource: 20,
        maxResource2: 20,
        resourceRegen: 0,
        resource2Regen: 1,
        habitatPreferenceStrength: 0,
        trophicForagingPenalty: 0,
        defenseForagingPenalty: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 4,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0, harvestEfficiency2: 1 }
        }
      ]
    });

    sim.setResource(0, 0, 10);
    sim.setResource2(0, 0, 10);
    sim.step();

    const agent = sim.snapshot().agents[0]!;
    expect(agent.energy).toBeCloseTo(13, 10);
    expect(agent.energyPrimary).toBeCloseTo(11, 10);
    expect(agent.energySecondary).toBeCloseTo(2, 10);
  });

  it('splits offspring energy pools proportionally during reproduction', () => {
    const sim = new LifeSimulation({
      seed: 2,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceThreshold: 10,
        reproduceProbability: 1,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0,
        speciationThreshold: 10,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 12,
          energyPrimary: 9,
          energySecondary: 3,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.step();

    const agents = sim.snapshot().agents;
    const parent = agents.find((agent) => agent.age === 1)!;
    const child = agents.find((agent) => agent.age === 0)!;
    expect(parent.energy).toBeCloseTo(6, 10);
    expect(parent.energyPrimary).toBeCloseTo(4.5, 10);
    expect(parent.energySecondary).toBeCloseTo(1.5, 10);
    expect(child.energy).toBeCloseTo(6, 10);
    expect(child.energyPrimary).toBeCloseTo(4.5, 10);
    expect(child.energySecondary).toBeCloseTo(1.5, 10);
  });

  it('transfers encounter energy using the target pool composition', () => {
    const sim = new LifeSimulation({
      seed: 3,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        predationPressure: 0,
        defenseMitigation: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          energyPrimary: 2,
          energySecondary: 8,
          lineage: 1,
          species: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 1 }
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          energyPrimary: 9,
          energySecondary: 1,
          lineage: 2,
          species: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    sim.step();

    const agents = sim.snapshot().agents;
    const dominant = agents.find((agent) => agent.lineage === 1)!;
    const target = agents.find((agent) => agent.lineage === 2)!;

    expect(dominant.energy).toBeCloseTo(12.75, 10);
    expect(dominant.energyPrimary).toBeCloseTo(4.475, 10);
    expect(dominant.energySecondary).toBeCloseTo(8.275, 10);
    expect(target.energy).toBeCloseTo(7.25, 10);
    expect(target.energyPrimary).toBeCloseTo(6.525, 10);
    expect(target.energySecondary).toBeCloseTo(0.725, 10);
  });
});
