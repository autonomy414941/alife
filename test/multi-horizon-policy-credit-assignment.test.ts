import { describe, it, expect } from 'vitest';
import {
  runMultiHorizonPolicyCreditAssignment,
  MULTI_HORIZON_POLICY_CREDIT_ASSIGNMENT_ARTIFACT
} from '../src/multi-horizon-policy-credit-assignment';
import { writeFileSync } from 'fs';

describe('multi-horizon policy credit assignment', () => {
  it('runs and produces artifact', { timeout: 180000 }, () => {
    const result = runMultiHorizonPolicyCreditAssignment({
      generatedAt: '2026-04-02T00:00:00.000Z',
      seeds: [9201],
      steps: 60
    });

    expect(result.generatedAt).toBe('2026-04-02T00:00:00.000Z');
    expect(result.config.seeds).toEqual([9201]);
    expect(result.config.steps).toBe(60);
    expect(result.config.horizons).toEqual([1, 5, 20, 50]);
    expect(result.signatures.length).toBeGreaterThan(0);

    for (const signature of result.signatures) {
      expect(signature.signature.key).toBeTruthy();
      expect(signature.runs.length).toBe(1);
      expect(signature.overall.matchedBins).toBeGreaterThanOrEqual(0);

      for (const horizon of result.config.horizons) {
        expect(signature.overall.horizons[horizon]).toBeDefined();
        expect(typeof signature.overall.horizons[horizon].weightedHarvestAdvantage).toBe('number');
        expect(typeof signature.overall.horizons[horizon].weightedSurvivalAdvantage).toBe('number');
        expect(typeof signature.overall.horizons[horizon].weightedReproductionAdvantage).toBe('number');
      }
    }

    expect(result.interpretation.summary).toBeTruthy();
    expect(Array.isArray(result.interpretation.positiveHorizonEffects)).toBe(true);
  });

  it('can write artifact file', { timeout: 300000 }, () => {
    const result = runMultiHorizonPolicyCreditAssignment({
      generatedAt: '2026-04-02T00:00:00.000Z',
      seeds: [9201, 9202],
      steps: 120
    });

    writeFileSync(MULTI_HORIZON_POLICY_CREDIT_ASSIGNMENT_ARTIFACT, JSON.stringify(result, null, 2));
    expect(true).toBe(true);
  });
});
