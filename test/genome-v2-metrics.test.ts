import { describe, expect, it } from 'vitest';
import { LifeSimulation } from '../src/simulation';
import { createGenomeV2, setTrait } from '../src/genome-v2';

describe('GenomeV2 trait metrics in StepSummary', () => {
  it('includes generic trait metrics when agents have genomeV2', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 3,
        maxResource: 10,
        resourceRegen: 1,
        metabolismCostBase: 0.1,
        reproduceThreshold: 15,
        reproduceProbability: 0.1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 20,
          genome: { metabolism: 0.5, harvest: 0.6, aggression: 0.3 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.5);
            setTrait(g, 'harvest', 0.6);
            setTrait(g, 'aggression', 0.3);
            setTrait(g, 'habitat_preference', 1.2);
            setTrait(g, 'trophic_level', 0.4);
            return g;
          })()
        },
        {
          x: 1,
          y: 1,
          energy: 15,
          genome: { metabolism: 0.7, harvest: 0.5, aggression: 0.4 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.7);
            setTrait(g, 'harvest', 0.5);
            setTrait(g, 'aggression', 0.4);
            setTrait(g, 'habitat_preference', 0.8);
            return g;
          })()
        }
      ]
    });

    const summary = sim.step();

    expect(summary.genomeV2Metrics).toBeDefined();
    expect(summary.genomeV2Metrics!.traits).toBeDefined();
    expect(summary.genomeV2Metrics!.traits.length).toBeGreaterThan(0);

    const metabolismMetrics = summary.genomeV2Metrics!.traits.find(
      (t) => t.key === 'metabolism'
    );
    expect(metabolismMetrics).toBeDefined();
    expect(metabolismMetrics!.prevalence).toBe(1);
    expect(metabolismMetrics!.mean).toBeCloseTo(0.6, 1);
    expect(metabolismMetrics!.variance).toBeGreaterThan(0);

    const habitatMetrics = summary.genomeV2Metrics!.traits.find(
      (t) => t.key === 'habitat_preference'
    );
    expect(habitatMetrics).toBeDefined();
    expect(habitatMetrics!.prevalence).toBe(1);
    expect(habitatMetrics!.mean).toBeCloseTo(1.0, 1);
  });

  it('computes selection differential for traits', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 3,
        maxResource: 10,
        resourceRegen: 1,
        metabolismCostBase: 0.1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 0.5, harvest: 0.6, aggression: 0.3 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.5);
            setTrait(g, 'harvest', 0.6);
            return g;
          })()
        },
        {
          x: 1,
          y: 1,
          energy: 20,
          genome: { metabolism: 0.7, harvest: 0.8, aggression: 0.4 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.7);
            setTrait(g, 'harvest', 0.8);
            return g;
          })()
        }
      ]
    });

    const summary = sim.step();

    expect(summary.genomeV2Metrics).toBeDefined();

    const harvestMetrics = summary.genomeV2Metrics!.traits.find((t) => t.key === 'harvest');
    expect(harvestMetrics).toBeDefined();
    expect(harvestMetrics!.selectionDifferential).toBeGreaterThan(0);
  });

  it('returns undefined when no agents have genomeV2', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 3,
        maxResource: 10,
        resourceRegen: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 0.5, harvest: 0.6, aggression: 0.3 }
        }
      ]
    });

    const summary = sim.step();

    expect(summary.genomeV2Metrics).toBeUndefined();
  });

  it('reports prevalence correctly for optional traits', () => {
    const sim = new LifeSimulation({
      seed: 42,
      config: {
        width: 3,
        height: 3,
        maxResource: 10,
        resourceRegen: 1
      },
      initialAgents: [
        {
          x: 0,
          y: 0,
          energy: 10,
          genome: { metabolism: 0.5, harvest: 0.6, aggression: 0.3 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.5);
            setTrait(g, 'harvest', 0.6);
            setTrait(g, 'trophic_level', 0.4);
            return g;
          })()
        },
        {
          x: 1,
          y: 1,
          energy: 15,
          genome: { metabolism: 0.7, harvest: 0.5, aggression: 0.4 },
          genomeV2: (() => {
            const g = createGenomeV2();
            setTrait(g, 'metabolism', 0.7);
            setTrait(g, 'harvest', 0.5);
            return g;
          })()
        }
      ]
    });

    const summary = sim.step();

    const trophicMetrics = summary.genomeV2Metrics!.traits.find(
      (t) => t.key === 'trophic_level'
    );
    expect(trophicMetrics).toBeDefined();
    expect(trophicMetrics!.prevalence).toBeCloseTo(0.5, 2);
  });
});
