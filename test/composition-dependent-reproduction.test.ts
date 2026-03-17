import { describe, expect, it } from 'vitest';
import { LifeSimulation } from '../src/simulation';

describe('Composition-Dependent Reproduction', () => {
  it('allows reproduction when pool fractions meet thresholds', () => {
    const sim = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0.3,
        reproductionMinSecondaryFraction: 0.2,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 12,
          energySecondary: 8,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.5 }
        }
      ]
    });

    const before = sim.snapshot();
    expect(before.population).toBe(1);

    sim.step();

    const after = sim.snapshot();
    expect(after.population).toBeGreaterThan(1);
  });

  it('blocks reproduction when primary pool fraction is below threshold', () => {
    const sim = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0.5,
        reproductionMinSecondaryFraction: 0.2,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 8,
          energySecondary: 12,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.5 }
        }
      ]
    });

    const before = sim.snapshot();
    expect(before.population).toBe(1);

    sim.step();

    const after = sim.snapshot();
    expect(after.population).toBe(1);
  });

  it('blocks reproduction when secondary pool fraction is below threshold', () => {
    const sim = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0.3,
        reproductionMinSecondaryFraction: 0.5,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 15,
          energySecondary: 5,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.5 }
        }
      ]
    });

    const before = sim.snapshot();
    expect(before.population).toBe(1);

    sim.step();

    const after = sim.snapshot();
    expect(after.population).toBe(1);
  });

  it('allows reproduction with zero thresholds (backward compatibility)', () => {
    const sim = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0,
        reproductionMinSecondaryFraction: 0,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 2,
          energySecondary: 18,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.5 }
        }
      ]
    });

    const before = sim.snapshot();
    expect(before.population).toBe(1);

    sim.step();

    const after = sim.snapshot();
    expect(after.population).toBeGreaterThan(1);
  });

  it('differentiates viability for specialists vs generalists under composition constraints', () => {
    const specialist = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0.4,
        reproductionMinSecondaryFraction: 0.4,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 18,
          energySecondary: 2,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.1 }
        }
      ]
    });

    const generalist = new LifeSimulation({
      seed: 1,
      config: {
        width: 5,
        height: 5,
        reproduceThreshold: 10,
        reproduceProbability: 1.0,
        offspringEnergyFraction: 0.5,
        reproductionMinPrimaryFraction: 0.4,
        reproductionMinSecondaryFraction: 0.4,
        maxResource2: 10,
        resource2Regen: 0.5,
        metabolismCostBase: 0,
        moveCost: 0
      },
      initialAgents: [
        {
          x: 2,
          y: 2,
          energy: 20,
          energyPrimary: 10,
          energySecondary: 10,
          genome: { metabolism: 0.5, harvest: 0.5, aggression: 0.2, harvestEfficiency2: 0.5 }
        }
      ]
    });

    specialist.step();
    generalist.step();

    const specialistAfter = specialist.snapshot();
    const generalistAfter = generalist.snapshot();

    expect(specialistAfter.population).toBe(1);
    expect(generalistAfter.population).toBeGreaterThan(1);
  });
});
