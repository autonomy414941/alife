import { describe, expect, it } from 'vitest';
import { runPerceptionQualityValidation } from '../src/perception-quality-validation';

describe('perception-quality-validation', () => {
  it('produces a bounded paired artifact for limited-perception movement', () => {
    const artifact = runPerceptionQualityValidation({
      generatedAt: '2026-04-04T00:00:00.000Z',
      seeds: [4401, 4402],
      steps: 20
    });

    expect(artifact.generatedAt).toBe('2026-04-04T00:00:00.000Z');
    expect(artifact.config.seeds).toEqual([4401, 4402]);
    expect(artifact.config.steps).toBe(20);
    expect(artifact.summary.seeds).toBe(2);
    expect(artifact.checks).toHaveLength(2);
    expect(artifact.summary.seedsWithMovementActivity).toBe(2);
    expect(['positive', 'neutral', 'negative']).toContain(artifact.summary.verdict);

    for (const check of artifact.checks) {
      expect(check.perfectInformation.meanMovementDecisionsPerStep).toBeGreaterThan(0);
      expect(check.limitedPerception.meanMovementDecisionsPerStep).toBeGreaterThan(0);
      expect(Number.isFinite(check.delta.finalPopulation)).toBe(true);
      expect(Number.isFinite(check.delta.extantDescendants)).toBe(true);
    }

    expect(artifact.summary.interpretation).toContain('Verdict');
  });
});
