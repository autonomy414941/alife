import { describe, expect, it } from 'vitest';
import { runExperiment } from '../src/experiment';

describe('runExperiment', () => {
  it('is deterministic for the same seed sweep configuration', () => {
    const input = {
      runs: 3,
      steps: 6,
      analyticsWindow: 3,
      seed: 91,
      seedStep: 2,
      generatedAt: '2026-02-21T00:00:00.000Z'
    };

    const first = runExperiment(input);
    const second = runExperiment(input);

    expect(first).toEqual(second);
    expect(first.runs.map((run) => run.seed)).toEqual([91, 93, 95]);
    expect(first.aggregate.runs).toBe(3);
  });

  it('supports extinction-stop experiments and aggregates run lengths', () => {
    const result = runExperiment({
      runs: 2,
      steps: 10,
      analyticsWindow: 5,
      seed: 300,
      stopWhenExtinct: true,
      simulation: {
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
      },
      generatedAt: '2026-02-21T00:00:00.000Z'
    });

    expect(result.runs).toHaveLength(2);
    expect(result.runs.every((run) => run.stepsExecuted === 1)).toBe(true);
    expect(result.runs.every((run) => run.extinct)).toBe(true);
    expect(result.aggregate.extinctRuns).toBe(2);
    expect(result.aggregate.extinctionRate).toBe(1);
    expect(result.aggregate.stepsExecuted).toEqual({ mean: 1, min: 1, max: 1 });
    expect(result.aggregate.finalPopulation).toEqual({ mean: 0, min: 0, max: 0 });
    expect(result.aggregate.finalSpeciesExtinctionRate).toEqual({ mean: 1, min: 1, max: 1 });
    expect(result.aggregate.finalSpeciesNetDiversificationRate).toEqual({ mean: -1, min: -1, max: -1 });
  });
});
