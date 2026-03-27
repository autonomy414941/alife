import { describe, it, expect } from 'vitest';
import { runGradedHarvestFitnessPilot } from '../src/graded-harvest-fitness-pilot';

describe('graded-harvest-fitness-pilot', () => {
  it('runs fitness differentiation pilot across steepness values', { timeout: 240000 }, () => {
    const seeds = [42];
    const steepnessValues = [0, 1.0];
    const basePreferences = [0.1, 0.9];

    const results = runGradedHarvestFitnessPilot(seeds, steepnessValues, basePreferences, { steps: 20 });

    expect(results).toBeDefined();
    expect(results.length).toBe(seeds.length * steepnessValues.length * basePreferences.length);

    for (const result of results) {
      expect(result.finalPopulation).toBeGreaterThanOrEqual(0);
      expect(result.totalBirths).toBeGreaterThanOrEqual(0);
      expect(result.meanEnergy).toBeGreaterThan(0);
      expect(result.avgPopulation).toBeGreaterThan(0);
      expect(result.reproductiveSuccess).toBeGreaterThanOrEqual(0);
      expect(result.reproductiveSuccess).toBeLessThanOrEqual(1);
    }

    const binary = results.filter((r) => r.steepness === 0);
    const graded = results.filter((r) => r.steepness > 0);
    const lowPreference = results.filter((r) => r.basePreference === 0.1);
    const highPreference = results.filter((r) => r.basePreference === 0.9);

    expect(binary.length).toBeGreaterThan(0);
    expect(graded.length).toBeGreaterThan(0);
    expect(lowPreference.length).toBeGreaterThan(0);
    expect(highPreference.length).toBeGreaterThan(0);
  });
});
