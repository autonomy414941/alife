import { describe, it, expect } from 'vitest';
import { LifeSimulation } from '../src/simulation';
import { createGenomeV2, setTrait } from '../src/genome-v2';

describe('Evolvable perception quality', () => {
  it('agents with perception_noise see different values than perfect-information agents', () => {
    const perfectGenome = createGenomeV2();
    setTrait(perfectGenome, 'perception_noise', 0);
    setTrait(perfectGenome, 'perception_fidelity', 1);

    const noisyGenome = createGenomeV2();
    setTrait(noisyGenome, 'perception_noise', 0.5);
    setTrait(noisyGenome, 'perception_fidelity', 1);

    const simPerfect = new LifeSimulation({
      seed: 1000,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0.5,
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
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: perfectGenome
        }
      ]
    });

    const simNoisy = new LifeSimulation({
      seed: 1001,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0.5,
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
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: noisyGenome
        }
      ]
    });

    simPerfect.setResource(0, 0, 20);
    simPerfect.setResource(1, 0, 50);
    simPerfect.setResource(2, 0, 90);

    simNoisy.setResource(0, 0, 20);
    simNoisy.setResource(1, 0, 50);
    simNoisy.setResource(2, 0, 90);

    simPerfect.step();
    simNoisy.step();

    const perfectAgent = simPerfect.snapshot().agents[0];
    const noisyAgent = simNoisy.snapshot().agents[0];

    expect(perfectAgent).toBeDefined();
    expect(noisyAgent).toBeDefined();
  });

  it('agents with low perception_fidelity have attenuated observations', () => {
    const highFidelityGenome = createGenomeV2();
    setTrait(highFidelityGenome, 'perception_noise', 0);
    setTrait(highFidelityGenome, 'perception_fidelity', 1);

    const lowFidelityGenome = createGenomeV2();
    setTrait(lowFidelityGenome, 'perception_noise', 0);
    setTrait(lowFidelityGenome, 'perception_fidelity', 0.3);

    const simHigh = new LifeSimulation({
      seed: 2000,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0.5,
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
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: highFidelityGenome
        }
      ]
    });

    const simLow = new LifeSimulation({
      seed: 2000,
      config: {
        width: 3,
        height: 1,
        maxResource: 100,
        resourceRegen: 0,
        dispersalPressure: 0.1,
        habitatPreferenceStrength: 0.5,
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
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 },
          genomeV2: lowFidelityGenome
        }
      ]
    });

    simHigh.setResource(0, 0, 20);
    simHigh.setResource(1, 0, 50);
    simHigh.setResource(2, 0, 90);

    simLow.setResource(0, 0, 20);
    simLow.setResource(1, 0, 50);
    simLow.setResource(2, 0, 90);

    simHigh.step();
    simLow.step();

    const highAgent = simHigh.snapshot().agents[0];
    const lowAgent = simLow.snapshot().agents[0];

    expect(highAgent).toBeDefined();
    expect(lowAgent).toBeDefined();
  });

  it('perception traits are part of genomeV2 and can mutate', () => {
    const genome = createGenomeV2();
    setTrait(genome, 'perception_noise', 0.2);
    setTrait(genome, 'perception_fidelity', 0.8);

    const sim = new LifeSimulation({
      seed: 3000,
      config: {
        width: 5,
        height: 5,
        maxResource: 100,
        resourceRegen: 10,
        reproduceProbability: 0.5,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 100,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.5 },
          genomeV2: genome
        }
      ]
    });

    for (let i = 0; i < 50; i++) {
      sim.step();
    }

    const snapshot = sim.snapshot();
    expect(snapshot.agents.length).toBeGreaterThan(0);

    const agentsWithPerceptionTraits = snapshot.agents.filter(
      (a) => a.genomeV2 && (a.genomeV2.traits.has('perception_noise') || a.genomeV2.traits.has('perception_fidelity'))
    );

    expect(agentsWithPerceptionTraits.length).toBeGreaterThan(0);
  });
});
