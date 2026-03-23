import { describe, expect, it } from 'vitest';
import { runPolicyFitnessSurfacePanel } from '../src/policy-fitness-surface-panel';

describe('policy fitness surface panel', () => {
  it('builds a bounded surface comparison artifact', () => {
    const artifact = runPolicyFitnessSurfacePanel({
      generatedAt: '2026-03-23T00:00:00.000Z',
      runs: 1,
      steps: 5,
      seed: 321,
      seedStep: 1
    });

    expect(artifact.generatedAt).toBe('2026-03-23T00:00:00.000Z');
    expect(artifact.arms).toHaveLength(4);
    expect(artifact.arms.map((arm) => arm.arm)).toEqual([
      'movement_only',
      'reproduction_only',
      'harvest_only',
      'combined'
    ]);
    expect(artifact.arms.every((arm) => arm.runs.length === 1)).toBe(true);
    expect(artifact.arms.every((arm) => arm.overall.armMetrics.exposures > 0)).toBe(true);
    expect(artifact.noPolicy.overall.metrics.exposures).toBeGreaterThan(0);
    expect(artifact.arms[0]?.runs[0]?.finalSummary.policyObservability?.movement.decisions).toBeGreaterThan(0);
    expect(artifact.arms[0]?.runs[0]?.finalSummary.policyObservability?.reproduction.decisions).toBeGreaterThan(0);
    expect(['movement_only', 'reproduction_only', 'harvest_only', 'combined', 'combination', 'none', 'mixed']).toContain(
      artifact.interpretation.dominantHarm
    );
  });
});
