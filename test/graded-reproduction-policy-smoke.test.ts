import { describe, it, expect } from 'vitest';
import { runGradedReproductionPolicySmoke } from '../src/graded-reproduction-policy-smoke';

describe('graded-reproduction-policy-smoke', () => {
  it('runs without crashing', () => {
    const results = runGradedReproductionPolicySmoke(42);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('produces different outcomes for different steepness values', () => {
    const results = runGradedReproductionPolicySmoke(42);
    const birthRates = results.map((r) => r.totalBirths);
    const uniqueBirthRates = new Set(birthRates);
    expect(uniqueBirthRates.size).toBeGreaterThan(1);
  });

  it('shows graded policy is active for agents', () => {
    const results = runGradedReproductionPolicySmoke(42);
    for (const result of results) {
      expect(result.reproductionPolicyAgentFraction).toBeGreaterThan(0);
    }
  });

  it('binary threshold (steepness=0) differs from graded (steepness>0)', () => {
    const results = runGradedReproductionPolicySmoke(42);
    const binary = results.find((r) => r.steepness === 0);
    const graded = results.find((r) => r.steepness === 1.0);

    expect(binary).toBeDefined();
    expect(graded).toBeDefined();
    expect(binary!.totalBirths).not.toBe(graded!.totalBirths);
  });
});
