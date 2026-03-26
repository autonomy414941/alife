import { describe, it, expect } from 'vitest';
import { runGradedHarvestPolicySmoke } from '../src/graded-harvest-policy-smoke';

describe('graded-harvest-policy-smoke', () => {
  it('runs without crashing and graded harvest guides decisions', { timeout: 60000 }, () => {
    const results = runGradedHarvestPolicySmoke(42);
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.harvestPolicyAgentFraction).toBeGreaterThan(0);
    }

    const gradedResults = results.filter((r) => r.threshold > 0 && r.steepness > 0);
    expect(gradedResults.length).toBeGreaterThan(0);
    for (const result of gradedResults) {
      expect(result.harvestDecisionGuidedFraction).toBeGreaterThan(0);
    }
  });
});
