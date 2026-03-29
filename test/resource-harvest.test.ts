import { describe, expect, it } from 'vitest';
import { resolveHarvestPolicyPayoffMultiplier } from '../src/resource-harvest';

describe('resource harvest policy payoff', () => {
  it('stays neutral without an active or directional harvest policy', () => {
    expect(resolveHarvestPolicyPayoffMultiplier(10, 4)).toBe(1);
    expect(resolveHarvestPolicyPayoffMultiplier(10, 4, 0.5)).toBe(1);
  });

  it('rewards policies aligned with local resource composition and penalizes mismatches', () => {
    const primaryAligned = resolveHarvestPolicyPayoffMultiplier(10, 4, 0);
    const secondaryBiased = resolveHarvestPolicyPayoffMultiplier(10, 4, 1);

    expect(primaryAligned).toBeCloseTo(1.1071428571, 10);
    expect(secondaryBiased).toBeCloseTo(0.8928571429, 10);
    expect(primaryAligned).toBeGreaterThan(1);
    expect(secondaryBiased).toBeLessThan(1);
  });
});
