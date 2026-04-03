import { describe, expect, it } from 'vitest';
import { runPolicyRichContextMatchingValidation } from '../src/policy-rich-context-matching-validation';

describe('policy-rich-context-matching-validation', () => {
  it('produces a bounded richer-matching comparison artifact', { timeout: 180000 }, () => {
    const artifact = runPolicyRichContextMatchingValidation({
      generatedAt: '2026-04-03T00:00:00.000Z',
      seeds: [9201],
      steps: 80,
      targetSignatureCount: 2
    });

    expect(artifact.generatedAt).toBe('2026-04-03T00:00:00.000Z');
    expect(artifact.config.seeds).toEqual([9201]);
    expect(artifact.config.delayedHorizons).toEqual([20, 50]);
    expect(artifact.selectedSignatures.length).toBeGreaterThan(0);

    for (const signature of artifact.selectedSignatures) {
      expect(signature.signature.key).toContain('|');
      expect(signature.delayedHorizons).toHaveLength(2);
      for (const horizon of signature.delayedHorizons) {
        expect(horizon.coarse.matchedContexts).toBeGreaterThanOrEqual(0);
        expect(horizon.richObservation.matchedContexts).toBeGreaterThanOrEqual(0);
        expect(typeof horizon.survivalDeltaShift).toBe('number');
      }
    }

    expect(artifact.interpretation.summary).toContain('positive');
  });
});
