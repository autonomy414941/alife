import { describe, expect, it } from 'vitest';
import { runGenomeV2DistanceWeightingSmoke } from '../src/genome-v2-distance-weighting-smoke';

describe('genome-v2-distance-weighting-smoke', () => {
  it('shows fewer species originations under weighted distance in bounded seeded runs', () => {
    const artifact = runGenomeV2DistanceWeightingSmoke({
      generatedAt: '2026-03-26T00:00:00.000Z',
      seeds: [4101],
      steps: 40
    });

    expect(artifact.generatedAt).toBe('2026-03-26T00:00:00.000Z');
    expect(artifact.scenarios).toHaveLength(2);
    expect(artifact.conclusion.weightedReducedTotalSpeciesInAllScenarios).toBe(true);

    const thresholdHeavy = artifact.scenarios.find((scenario) => scenario.scenario === 'policy-threshold-heavy');
    expect(thresholdHeavy).toBeDefined();
    expect(thresholdHeavy!.deltas.meanTotalSpecies).toBeLessThan(0);
    expect(thresholdHeavy!.deltas.meanTotalClades).toBeLessThan(0);

    const mixed = artifact.scenarios.find((scenario) => scenario.scenario === 'mixed-divergence');
    expect(mixed).toBeDefined();
    expect(mixed!.deltas.meanTotalSpecies).toBeLessThan(0);
    expect(mixed!.weighted.config.genomeV2DistanceWeights).toEqual(artifact.config.weights);
  });
});
