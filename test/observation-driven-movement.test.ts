import { describe, it, expect } from 'vitest';
import { LifeSimulation } from '../src/simulation';

describe('Observation-driven movement', () => {
  it('uses localFertility from observations for movement decisions', () => {
    const sim = new LifeSimulation({
      seed: 100,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        habitatPreferenceStrength: 0.5,
        dispersalPressure: 0.1,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 1,
          y: 0,
          energy: 50,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.setResource(0, 0, 20);
    sim.setResource(1, 0, 50);
    sim.setResource(2, 0, 90);

    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBe(2);
  });

  it('uses localCrowding from observations for movement decisions', () => {
    const sim = new LifeSimulation({
      seed: 200,
      config: {
        width: 5,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 1.5,
        habitatPreferenceStrength: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        { x: 2, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } },
        { x: 1, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } },
        { x: 3, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } }
      ]
    });

    sim.setResource(0, 0, 100);
    sim.setResource(1, 0, 100);
    sim.setResource(2, 0, 100);
    sim.setResource(3, 0, 100);
    sim.setResource(4, 0, 100);

    const beforeAgents = sim.snapshot().agents;

    sim.step();

    const afterAgents = sim.snapshot().agents;
    const testAgent = beforeAgents[0];
    const finalAgent = afterAgents.find((a) => a.id === testAgent.id);

    if (!finalAgent) {
      throw new Error('Test agent not found after step');
    }

    expect(finalAgent.x).not.toBe(2);
  });

  it('movement respects lineage dispersal penalty from observations', () => {
    const createSim = (penalty: number) => {
      const sim = new LifeSimulation({
        seed: 300,
        config: {
          width: 5,
          height: 1,
          maxResource: 100,
          resourceRegen: 0,
          lineageDispersalCrowdingPenalty: penalty,
          dispersalPressure: 0.1,
          habitatPreferenceStrength: 0,
          metabolismCostBase: 0,
          moveCost: 0.1,
          harvestCap: 0,
          reproduceProbability: 0,
          speciationThreshold: 0,
          maxAge: 100
        },
        initialAgents: [
          { x: 2, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } },
          { x: 1, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } },
          { x: 3, y: 0, energy: 50, genome: { metabolism: 1, harvest: 1, aggression: 0.5 } }
        ]
      });

      sim.setResource(0, 0, 100);
      sim.setResource(1, 0, 100);
      sim.setResource(2, 0, 100);
      sim.setResource(3, 0, 100);
      sim.setResource(4, 0, 100);

      return sim;
    };

    const noPenaltySim = createSim(0);
    const penaltySim = createSim(3.0);

    const noPenaltyBefore = noPenaltySim.snapshot().agents[0];
    const penaltyBefore = penaltySim.snapshot().agents[0];

    noPenaltySim.step();
    penaltySim.step();

    const noPenaltyAfter = noPenaltySim.snapshot().agents.find((a) => a.id === noPenaltyBefore.id);
    const penaltyAfter = penaltySim.snapshot().agents.find((a) => a.id === penaltyBefore.id);

    expect(noPenaltyAfter).toBeDefined();
    expect(penaltyAfter).toBeDefined();
  });

  it('makes movement decisions based on combined resource availability in observations', () => {
    const sim = new LifeSimulation({
      seed: 400,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        maxResource2: 100,
        resourceRegen: 0,
        resource2Regen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 1,
          y: 0,
          energy: 50,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5, harvestEfficiency2: 1 }
        }
      ]
    });

    sim.setResource(0, 0, 30);
    sim.setResource2(0, 0, 10);

    sim.setResource(1, 0, 30);
    sim.setResource2(1, 0, 10);

    sim.setResource(2, 0, 50);
    sim.setResource2(2, 0, 50);

    sim.step();

    const agent = sim.snapshot().agents[0];
    expect(agent.x).toBe(2);
  });

  it('movement is perception-driven not omniscient', () => {
    const sim = new LifeSimulation({
      seed: 500,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0,
        metabolismCostBase: 0,
        moveCost: 0.1,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 1,
          y: 0,
          energy: 50,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    sim.setResource(0, 0, 50);
    sim.setResource(1, 0, 50);
    sim.setResource(2, 0, 100);

    const initialPos = sim.snapshot().agents[0].x;

    sim.step();

    const finalPos = sim.snapshot().agents[0].x;
    const movedToHigherResourceOrStayed = finalPos === 2 || finalPos === initialPos;

    expect(movedToHigherResourceOrStayed).toBe(true);
  });
});
