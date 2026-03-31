import { describe, it, expect } from 'vitest';
import { runPostCouplingMatchedControlValidation } from '../src/post-coupling-matched-control-validation';

describe('post-coupling-matched-control-validation', () => {
  it('should complete matched control validation with policy mutation enabled in both arms', { timeout: 30000 }, () => {
    const artifact = runPostCouplingMatchedControlValidation({
      seeds: [9201],
      steps: 30,
      windowSize: 15,
      generatedAt: '2026-03-31T00:00:00.000Z'
    });

    expect(artifact.generatedAt).toBe('2026-03-31T00:00:00.000Z');
    expect(artifact.policyCoupled.label).toBe('policy_coupled');
    expect(artifact.policyDecoupled.label).toBe('policy_decoupled');
    expect(artifact.policyCoupled.policyMutationProbability).toBe(0.65);
    expect(artifact.policyDecoupled.policyMutationProbability).toBe(0.65);
    expect(artifact.policyCoupled.policyCouplingEnabled).toBe(true);
    expect(artifact.policyDecoupled.policyCouplingEnabled).toBe(false);
    expect(artifact.policyCoupled.runs).toHaveLength(1);
    expect(artifact.policyDecoupled.runs).toHaveLength(1);
    expect(artifact.policyCoupled.runs[0].finalPopulation).toBeGreaterThan(0);
    expect(artifact.policyDecoupled.runs[0].finalPopulation).toBeGreaterThan(0);
    expect(artifact.conclusion.outcome).toMatch(/survives|mixed|refuted/);
  });

  it('should produce deltas comparing coupled vs decoupled arms', { timeout: 30000 }, () => {
    const artifact = runPostCouplingMatchedControlValidation({
      seeds: [9202],
      steps: 30,
      windowSize: 15
    });

    expect(artifact.delta.effectiveRichness).toBeDefined();
    expect(artifact.delta.policySensitiveEffectiveRichness).toBeDefined();
    expect(artifact.delta.speciationRate).toBeDefined();
    expect(artifact.delta.netDiversificationRate).toBeDefined();
    expect(artifact.conclusion.comparisonToMarch30Delta.effectiveRichnessDeltaChange).toBeDefined();
  });

  it('should document the matched control methodology', { timeout: 30000 }, () => {
    const artifact = runPostCouplingMatchedControlValidation({
      seeds: [9201],
      steps: 30,
      windowSize: 15
    });

    expect(artifact.question).toContain('matched control');
    expect(artifact.methodology).toContain('policyMutationProbability=0.65');
    expect(artifact.methodology).toContain('policy-coupled');
    expect(artifact.methodology).toContain('policy-decoupled');
    expect(artifact.comparisonToMarch30).toContain('March 30');
  });
});
