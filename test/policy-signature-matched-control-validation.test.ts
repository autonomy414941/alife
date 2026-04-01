import { describe, expect, it } from 'vitest';
import { runPolicySignatureMatchedControlValidation } from '../src/policy-signature-matched-control-validation';

describe('policy-signature-matched-control-validation', () => {
  it('produces signature-stratified matched comparisons', { timeout: 30000 }, () => {
    const artifact = runPolicySignatureMatchedControlValidation({
      seeds: [9201],
      steps: 30,
      generatedAt: '2026-04-01T00:00:00.000Z'
    });

    expect(artifact.generatedAt).toBe('2026-04-01T00:00:00.000Z');
    expect(artifact.config.policyMutationProbability).toBe(0.65);
    expect(artifact.signatures.length).toBeGreaterThan(0);
    expect(artifact.signatures[0].signature.key).toContain('|');
    expect(artifact.signatures[0].overall.matchedComparison.matchedBins).toBeGreaterThanOrEqual(0);
    expect(artifact.interpretation.summary).toContain('signature');
  });

  it('reports per-signature run support fractions', { timeout: 30000 }, () => {
    const artifact = runPolicySignatureMatchedControlValidation({
      seeds: [9202],
      steps: 25
    });

    const signature = artifact.signatures[0];
    expect(signature.support.harvestPositiveRunFraction).toBeGreaterThanOrEqual(0);
    expect(signature.support.harvestPositiveRunFraction).toBeLessThanOrEqual(1);
    expect(signature.support.survivalPositiveRunFraction).toBeGreaterThanOrEqual(0);
    expect(signature.support.reproductionPositiveRunFraction).toBeGreaterThanOrEqual(0);
  });
});
