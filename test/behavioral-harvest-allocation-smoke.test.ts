import { describe, expect, it } from 'vitest';
import { runBehavioralHarvestAllocationSmoke } from '../src/behavioral-harvest-allocation-smoke';

describe('behavioral harvest allocation smoke', () => {
  it('produces a bounded artifact showing harvest-policy activation in live simulation', () => {
    const artifact = runBehavioralHarvestAllocationSmoke({
      generatedAt: '2026-03-22T00:00:00.000Z',
      seed: 460321,
      steps: 20
    });

    expect(artifact.generatedAt).toBe('2026-03-22T00:00:00.000Z');
    expect(artifact.run.stepsExecuted).toBe(20);
    expect(artifact.run.meanHarvestPolicyAgentFraction).toBeGreaterThan(0.2);
    expect(artifact.run.meanHarvestDecisionGuidedFraction).toBeGreaterThan(0.05);
    expect(artifact.run.finalPolicyCarrierSecondaryEnergyShare).toBeGreaterThan(
      artifact.run.finalControlSecondaryEnergyShare
    );
    expect(artifact.interpretation.activated).toBe(true);
  });
});
