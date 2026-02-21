import { describe, expect, it } from 'vitest';
import { LifeSimulation } from '../src/simulation';

describe('LifeSimulation', () => {
  it('is deterministic with the same seed', () => {
    const a = new LifeSimulation({ seed: 42 });
    const b = new LifeSimulation({ seed: 42 });

    a.run(40);
    b.run(40);

    expect(a.snapshot()).toEqual(b.snapshot());
  });

  it('creates mutated offspring when reproduction triggers', () => {
    const sim = new LifeSimulation({
      seed: 7,
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
        mutationAmount: 0.3,
        speciationThreshold: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 30,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
        }
      ]
    });

    const before = sim.snapshot().agents[0].genome;
    const summary = sim.step();
    const after = sim.snapshot().agents;

    expect(summary.births).toBe(1);
    expect(after).toHaveLength(2);

    const child = after.find((agent) => agent.age === 0);
    const parent = after.find((agent) => agent.age === 1);
    expect(child).toBeDefined();
    expect(parent).toBeDefined();
    expect(child!.lineage).toBe(parent!.lineage);
    expect(child!.species).not.toBe(parent!.species);
    expect(summary.activeSpecies).toBe(2);
    expect(summary.activeClades).toBe(1);

    const delta =
      Math.abs(child!.genome.metabolism - before.metabolism) +
      Math.abs(child!.genome.harvest - before.harvest) +
      Math.abs(child!.genome.aggression - before.aggression);

    expect(delta).toBeGreaterThan(0);
  });

  it('lets aggressive agents steal energy in shared cells', () => {
    const sim = new LifeSimulation({
      seed: 11,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 1 },
          lineage: 1
        },
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 2
        }
      ]
    });

    sim.step();
    const agents = sim.snapshot().agents;

    const dominant = agents.find((agent) => agent.lineage === 1)!;
    const passive = agents.find((agent) => agent.lineage === 2)!;

    expect(dominant.energy).toBeGreaterThan(10);
    expect(passive.energy).toBeLessThan(10);
  });

  it('removes agents that run out of energy', () => {
    const sim = new LifeSimulation({
      seed: 3,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 0.2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 }
        }
      ]
    });

    const summary = sim.step();

    expect(summary.population).toBe(0);
    expect(summary.deaths).toBe(1);
  });

  it('tracks clade/species diversity and dominant species share', () => {
    const sim = new LifeSimulation({
      seed: 19,
      config: {
        width: 100,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 1,
          species: 1
        },
        {
          x: 50,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 2,
          species: 1
        },
        {
          x: 80,
          y: 0,
          energy: 10,
          genome: { metabolism: 1, harvest: 1, aggression: 0.2 },
          lineage: 3,
          species: 2
        }
      ]
    });

    const summary = sim.step();

    expect(summary.activeClades).toBe(3);
    expect(summary.activeSpecies).toBe(2);
    expect(summary.dominantSpeciesShare).toBeCloseTo(2 / 3, 10);
  });

  it('reports energy-weighted trait selection differentials', () => {
    const sim = new LifeSimulation({
      seed: 23,
      config: {
        width: 100,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 0,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 9,
          genome: { metabolism: 2, harvest: 1, aggression: 0.9 }
        },
        {
          x: 50,
          y: 0,
          energy: 3,
          genome: { metabolism: 1, harvest: 2, aggression: 0.1 }
        }
      ]
    });

    const summary = sim.step();

    expect(summary.selectionDifferential.metabolism).toBeCloseTo(0.25, 10);
    expect(summary.selectionDifferential.harvest).toBeCloseTo(-0.25, 10);
    expect(summary.selectionDifferential.aggression).toBeCloseTo(0.2, 10);
  });

  it('tracks clade and species lifecycle history across ticks', () => {
    const sim = new LifeSimulation({
      seed: 31,
      config: {
        width: 1,
        height: 1,
        maxResource: 0,
        resourceRegen: 0,
        metabolismCostBase: 1,
        moveCost: 0,
        harvestCap: 0,
        reproduceProbability: 0,
        maxAge: 100
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 2,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 1,
          species: 1
        },
        {
          x: 0,
          y: 0,
          energy: 1,
          genome: { metabolism: 1, harvest: 1, aggression: 0 },
          lineage: 2,
          species: 2
        }
      ]
    });

    const step1 = sim.step();
    expect(step1.speciesExtinctions).toBe(1);
    expect(step1.cladeExtinctions).toBe(1);
    expect(step1.cumulativeExtinctSpecies).toBe(1);
    expect(step1.cumulativeExtinctClades).toBe(1);

    const step2 = sim.step();
    expect(step2.speciesExtinctions).toBe(1);
    expect(step2.cladeExtinctions).toBe(1);
    expect(step2.cumulativeExtinctSpecies).toBe(2);
    expect(step2.cumulativeExtinctClades).toBe(2);

    const history = sim.history();
    expect(history.extinctSpecies).toBe(2);
    expect(history.extinctClades).toBe(2);

    const species1 = history.species.find((entry) => entry.id === 1);
    const species2 = history.species.find((entry) => entry.id === 2);
    expect(species1).toBeDefined();
    expect(species2).toBeDefined();
    expect(species1!.extinctTick).toBe(2);
    expect(species2!.extinctTick).toBe(1);
    expect(species1!.totalBirths).toBe(1);
    expect(species1!.totalDeaths).toBe(1);
    expect(species2!.totalBirths).toBe(1);
    expect(species2!.totalDeaths).toBe(1);
    expect(species2!.timeline).toEqual([
      { tick: 0, population: 1, births: 1, deaths: 0 },
      { tick: 1, population: 0, births: 0, deaths: 1 }
    ]);
    expect(species1!.timeline).toEqual([
      { tick: 0, population: 1, births: 1, deaths: 0 },
      { tick: 1, population: 1, births: 0, deaths: 0 },
      { tick: 2, population: 0, births: 0, deaths: 1 }
    ]);
  });
});
