import { describe, expect, it } from 'vitest';
import { runSubstrateSpendingPolicySmoke } from '../src/substrate-spending-policy-smoke';

describe('substrate spending policy smoke', () => {
  it('produces a bounded artifact showing policy-driven reserve retention differences', () => {
    const artifact = runSubstrateSpendingPolicySmoke({
      generatedAt: '2026-03-24T00:00:00.000Z',
      steps: 6
    });

    expect(artifact.generatedAt).toBe('2026-03-24T00:00:00.000Z');
    expect(artifact.arms).toHaveLength(3);

    const control = artifact.arms.find((arm) => arm.label === 'control');
    const primaryBiased = artifact.arms.find((arm) => arm.label === 'primary_biased');
    const secondaryBiased = artifact.arms.find((arm) => arm.label === 'secondary_biased');

    expect(control).toBeDefined();
    expect(primaryBiased).toBeDefined();
    expect(secondaryBiased).toBeDefined();

    expect(primaryBiased?.finalSecondary).toBeGreaterThan(control?.finalSecondary ?? 0);
    expect(primaryBiased?.cumulativeSecondarySpent).toBeLessThan(control?.cumulativeSecondarySpent ?? 0);
    expect(secondaryBiased?.finalSecondary).toBeLessThan(control?.finalSecondary ?? 0);
    expect(secondaryBiased?.cumulativeSecondarySpent).toBeGreaterThan(control?.cumulativeSecondarySpent ?? 0);
    expect(artifact.interpretation.primaryBiasedRetainsMoreSecondary).toBe(true);
    expect(artifact.interpretation.secondaryBiasedBurnsMoreSecondary).toBe(true);
  });
});
