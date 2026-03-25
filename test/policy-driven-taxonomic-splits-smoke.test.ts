import { describe, it, expect } from 'vitest';
import { runPolicyDrivenTaxonomicSplitsSmoke } from '../src/policy-driven-taxonomic-splits-smoke';

describe('policy-driven taxonomic splits smoke study', () => {
  it('runs bounded simulations and reports taxonomic diversity', { timeout: 60000 }, () => {
    const results = runPolicyDrivenTaxonomicSplitsSmoke();

    expect(results.length).toBe(3);

    for (const result of results) {
      expect(result.finalAgents).toBeGreaterThan(0);
      expect(result.speciesCount).toBeGreaterThanOrEqual(1);
      expect(result.cladeCount).toBeGreaterThanOrEqual(1);
      expect(result.finalStep).toBe(100);
    }

    const lowThresholdResult = results.find(r => r.scenario === 'low-speciation-threshold');
    expect(lowThresholdResult).toBeDefined();
    expect(lowThresholdResult!.speciesCount).toBeGreaterThanOrEqual(1);

    const highMutationResult = results.find(r => r.scenario === 'high-mutation');
    expect(highMutationResult).toBeDefined();
  });

  it('produces interpretable summary for each scenario', { timeout: 60000 }, () => {
    const results = runPolicyDrivenTaxonomicSplitsSmoke();

    for (const result of results) {
      expect(result.summary).toContain(result.scenario);
      expect(result.summary).toContain('agents');
      expect(result.summary).toContain('species');
      expect(result.summary).toContain('clades');
    }
  });
});
