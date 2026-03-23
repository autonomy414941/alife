import { describe, expect, it } from 'vitest';
import { runPolicyFitnessThresholdRegimePanel } from '../src/policy-fitness-threshold-regime-panel';

describe('policy fitness threshold regime panel', () => {
  it('builds a bounded threshold-grid artifact with gate observability', () => {
    const artifact = runPolicyFitnessThresholdRegimePanel({
      generatedAt: '2026-03-23T00:00:00.000Z',
      runs: 1,
      steps: 5,
      seed: 321,
      seedStep: 1,
      reproductionHarvestThresholds: [0.3, 0.6],
      movementEnergyReserveThresholds: [4],
      movementMinRecentHarvestThresholds: [0.25, 0.5]
    });

    expect(artifact.generatedAt).toBe('2026-03-23T00:00:00.000Z');
    expect(artifact.regimes).toHaveLength(4);
    expect(artifact.config.reproductionHarvestThresholds).toEqual([0.3, 0.6]);
    expect(artifact.regimes.every((regime) => regime.runs.length === 1)).toBe(true);
    expect(artifact.regimes.every((regime) => regime.overall.policyMetrics.exposures > 0)).toBe(true);
    expect(artifact.regimes.every((regime) => regime.overall.controlMetrics.exposures > 0)).toBe(true);
    expect(
      artifact.regimes.every(
        (regime) =>
          regime.overall.decisionObservability.movementDecisionGatedFraction >= 0 &&
          regime.overall.decisionObservability.reproductionDecisionGatedFraction >= 0
      )
    ).toBe(true);
    expect(artifact.interpretation.bestRegimeId).not.toBeNull();
    expect(artifact.interpretation.worstRegimeId).not.toBeNull();
  });
});
