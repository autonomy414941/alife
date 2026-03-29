import { beforeAll, describe, it, expect } from 'vitest';
import { runGradedMovementPolicySmoke } from '../src/graded-movement-policy-smoke';

describe('graded-movement-policy-smoke', () => {
  let results: ReturnType<typeof runGradedMovementPolicySmoke>;

  beforeAll(
    () => {
      results = runGradedMovementPolicySmoke(42);
    },
    40000
  );

  it('runs without crashing', () => {
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
  });

  it('produces different outcomes for different steepness values', () => {
    const blockedFractions = results.map((r) => r.blockedByEnergyReserveFraction);
    const uniqueBlockedFractions = new Set(blockedFractions.map((f) => f.toFixed(3)));
    expect(uniqueBlockedFractions.size).toBeGreaterThan(1);
  });

  it('shows graded policy is active for agents', () => {
    for (const result of results) {
      expect(result.movementPolicyAgentFraction).toBeGreaterThan(0);
    }
  });

  it('binary threshold (steepness=0) differs from graded (steepness>0)', () => {
    const binary = results.find((r) => r.steepness === 0);
    const graded = results.find((r) => r.steepness === 1.0);

    expect(binary).toBeDefined();
    expect(graded).toBeDefined();
    expect(binary!.blockedByEnergyReserveFraction).not.toBe(graded!.blockedByEnergyReserveFraction);
  });
});
