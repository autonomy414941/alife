import { describe, expect, it } from 'vitest';
import { runBehavioralHarvestNavigationSmoke } from '../src/behavioral-harvest-navigation-smoke';

describe('behavioral harvest navigation smoke', () => {
  it('produces a bounded artifact showing harvest-guided movement activation', () => {
    const artifact = runBehavioralHarvestNavigationSmoke({
      generatedAt: '2026-03-23T00:00:00.000Z',
      seed: 460522,
      steps: 1
    });

    expect(artifact.generatedAt).toBe('2026-03-23T00:00:00.000Z');
    expect(artifact.run.stepsExecuted).toBe(1);
    expect(artifact.run.policyCarrierSecondaryRichFraction).toBeGreaterThan(0.8);
    expect(artifact.run.controlPrimaryRichFraction).toBeGreaterThan(0.8);
    expect(artifact.run.policyCarrierSecondaryRichFraction).toBeGreaterThan(
      artifact.run.controlSecondaryRichFraction
    );
    expect(artifact.interpretation.activated).toBe(true);
  });
});
