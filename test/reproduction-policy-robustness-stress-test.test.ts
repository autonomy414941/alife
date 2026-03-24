import { describe, it, expect } from 'vitest';
import { runReproductionPolicyRobustnessStressTest } from '../src/reproduction-policy-robustness-stress-test';

describe('runReproductionPolicyRobustnessStressTest', () => {
  it('should produce artifact structure with 1 run, 10 steps', () => {
    const artifact = runReproductionPolicyRobustnessStressTest({
      generatedAt: '2026-03-24T00:00:00.000Z',
      runs: 1,
      steps: 10,
      seed: 90210,
      seedStep: 37
    });

    expect(artifact.generatedAt).toBe('2026-03-24T00:00:00.000Z');
    expect(artifact.question).toContain('March 23');
    expect(artifact.runs).toHaveLength(1);
    expect(artifact.runs[0].run).toBe(1);
    expect(artifact.runs[0].seed).toBe(90210);
    expect(artifact.overall.matchedComparison.matchedBins).toBeGreaterThanOrEqual(0);
    expect(artifact.support.harvestAdvantagePositiveRunFraction).toBeGreaterThanOrEqual(0);
    expect(artifact.support.harvestAdvantagePositiveRunFraction).toBeLessThanOrEqual(1);
    expect(artifact.conclusion.signal).toMatch(/^(robust|vanished|reversed|mixed)$/);
  });

  it('should separate reproduction-only from control in policy records', () => {
    const artifact = runReproductionPolicyRobustnessStressTest({
      runs: 1,
      steps: 10,
      seed: 90210
    });

    expect(artifact.overall.policyMetrics.exposures).toBeGreaterThan(0);
    expect(artifact.overall.controlMetrics.exposures).toBeGreaterThan(0);
    expect(artifact.overall.policyMetrics.reproductionPolicyGatedRate).toBeGreaterThanOrEqual(0);
    expect(artifact.overall.controlMetrics.reproductionPolicyGatedRate).toBe(0);
    expect(artifact.overall.policyMetrics.movementPolicyGatedRate).toBe(0);
    expect(artifact.overall.policyMetrics.harvestPolicyGuidedRate).toBe(0);
  });
});
