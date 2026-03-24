import { describe, it, expect } from 'vitest';
import {
  DEFAULT_HARVEST_SECONDARY_PREFERENCE,
  DEFAULT_SPENDING_SECONDARY_PREFERENCE,
  inheritBehavioralState,
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE,
  mutatePolicyParameters,
  normalizeSeedBehavioralState,
  resolveHarvestSecondaryPreference,
  resolveSpendingSecondaryPreference,
  resolveBehavioralPolicyFlags,
  computeGradedReproductionProbability,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_LAST_HARVEST
} from '../src/behavioral-control';

describe('behavioral-control', () => {
  describe('inheritBehavioralState', () => {
    it('returns empty state when parent has no behavioral state', () => {
      const parent = { policyState: undefined, transientState: undefined };
      const result = inheritBehavioralState(parent);
      expect(result).toEqual({ policyState: undefined, transientState: undefined });
    });

    it('clones parent policy state and resets transient memory', () => {
      const parent = {
        policyState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
          [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.75],
          [INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.25]
        ]),
        transientState: new Map([[INTERNAL_STATE_LAST_HARVEST, 5.0]])
      };
      const result = inheritBehavioralState(parent);

      expect(result.policyState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
      expect(result.policyState?.get(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE)).toBe(0.75);
      expect(result.policyState?.get(INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE)).toBe(0.25);
      expect(result.transientState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
    });

    it('mutates policy parameters when mutation options are provided', () => {
      const parent = {
        policyState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
          [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 10.0],
          [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.6],
          [INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.3]
        ]),
        transientState: new Map([[INTERNAL_STATE_LAST_HARVEST, 3]])
      };

      const result = inheritBehavioralState(parent, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => 0.8
      });

      const mutatedRepThreshold = result.policyState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD);
      const mutatedMoveReserve = result.policyState?.get(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD);
      const mutatedHarvestPreference = result.policyState?.get(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE);
      const mutatedSpendingPreference = result.policyState?.get(INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE);

      expect(mutatedRepThreshold).toBeDefined();
      expect(mutatedMoveReserve).toBeDefined();
      expect(mutatedHarvestPreference).toBeDefined();
      expect(mutatedSpendingPreference).toBeDefined();
      expect(mutatedRepThreshold).not.toBe(2.0);
      expect(mutatedMoveReserve).not.toBe(10.0);
      expect(mutatedHarvestPreference).not.toBe(0.6);
      expect(mutatedSpendingPreference).not.toBe(0.3);
      expect(result.transientState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
    });

    it('does not mutate when mutation probability is zero', () => {
      const parent = {
        policyState: new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]]),
        transientState: undefined
      };

      const result = inheritBehavioralState(parent, {
        mutationProbability: 0,
        mutationMagnitude: 10.0,
        randomFloat: () => 0.5
      });

      expect(result.policyState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
    });
  });

  describe('normalizeSeedBehavioralState', () => {
    it('splits legacy internal state into policy and transient maps', () => {
      const result = normalizeSeedBehavioralState({
        internalState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 1.5],
          [INTERNAL_STATE_LAST_HARVEST, 4]
        ])
      });

      expect(result.policyState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(1.5);
      expect(result.transientState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(4);
    });
  });

  describe('mutatePolicyParameters', () => {
    it('mutates policy parameters based on probability', () => {
      const state = new Map([
        [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
        [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 10.0],
        [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 1.5],
        [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.5],
        [INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.25]
      ]);

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => 0.8
      });

      const delta = (0.8 - 0.5) * 2 * 0.5;
      expect(state.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0 + delta);
      expect(state.get(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD)).toBe(10.0 + delta);
      expect(state.get(INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST)).toBe(1.5 + delta);
      expect(state.get(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE)).toBe(0.5 + delta);
      expect(state.get(INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE)).toBe(0.25 + delta);
    });

    it('clamps mutated values to minimum of zero', () => {
      const state = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.1]]);

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 1.0,
        randomFloat: () => 0.0
      });

      expect(state.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(0);
    });

    it('clamps harvest preference mutations to the unit interval', () => {
      const state = new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.9]]);
      const randomValues = [0.5, 1.0];

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => randomValues.shift() ?? 1.0
      });

      expect(state.get(INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE)).toBe(1);
    });

    it('clamps spending preference mutations to the unit interval', () => {
      const state = new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.1]]);
      const randomValues = [0.5, 0.0];

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => randomValues.shift() ?? 0.0
      });

      expect(state.get(INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE)).toBe(0);
    });

    it('skips mutation when probability check fails', () => {
      const state = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]]);

      mutatePolicyParameters(state, {
        mutationProbability: 0.5,
        mutationMagnitude: 1.0,
        randomFloat: () => 0.6
      });

      expect(state.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
    });

    it('skips keys not present in policy state', () => {
      const state = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]]);

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => 0.8
      });

      expect(state.has(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD)).toBe(false);
    });
  });

  describe('resolveBehavioralPolicyFlags', () => {
    it('detects harvest, movement, and reproduction policies independently', () => {
      const movementOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 8]])
      });
      const reproductionOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.5]])
      });
      const harvestOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0]])
      });
      const spendingOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 1]])
      });

      expect(movementOnly).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: true,
        hasReproductionPolicy: false,
        hasSpendingPolicy: false
      });
      expect(reproductionOnly).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: true,
        hasSpendingPolicy: false
      });
      expect(harvestOnly).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: true,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasSpendingPolicy: false
      });
      expect(spendingOnly).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasSpendingPolicy: true
      });
    });

    it('treats non-positive thresholds as default behavior', () => {
      const flags = resolveBehavioralPolicyFlags({
        policyState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0],
          [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, -1]
        ])
      });

      expect(flags).toEqual({
        hasAnyPolicy: false,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasSpendingPolicy: false
      });
    });
  });

  describe('resolveHarvestSecondaryPreference', () => {
    it('returns undefined when no harvest policy is present', () => {
      expect(resolveHarvestSecondaryPreference({ policyState: undefined })).toBeUndefined();
    });

    it('clamps stored harvest preference values to a valid share', () => {
      expect(
        resolveHarvestSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 2]])
        })
      ).toBe(1);
      expect(
        resolveHarvestSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, -1]])
        })
      ).toBe(0);
    });

    it('keeps zero as an explicit primary-only harvest preference', () => {
      expect(
        resolveHarvestSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0]])
        })
      ).toBe(0);
      expect(DEFAULT_HARVEST_SECONDARY_PREFERENCE).toBe(0.5);
    });
  });

  describe('resolveSpendingSecondaryPreference', () => {
    it('returns undefined when no spending policy is present', () => {
      expect(resolveSpendingSecondaryPreference({ policyState: undefined })).toBeUndefined();
    });

    it('clamps stored spending preference values to a valid share', () => {
      expect(
        resolveSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 2]])
        })
      ).toBe(1);
      expect(
        resolveSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, -1]])
        })
      ).toBe(0);
    });

    it('keeps zero as an explicit primary-first spending preference', () => {
      expect(
        resolveSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0]])
        })
      ).toBe(0);
      expect(DEFAULT_SPENDING_SECONDARY_PREFERENCE).toBe(0.5);
    });
  });

  describe('computeGradedReproductionProbability', () => {
    it('returns 1 when threshold is zero or negative', () => {
      expect(computeGradedReproductionProbability(5, 0, 1)).toBe(1);
      expect(computeGradedReproductionProbability(5, -1, 1)).toBe(1);
    });

    it('returns binary threshold behavior when steepness is zero', () => {
      expect(computeGradedReproductionProbability(10, 5, 0)).toBe(1);
      expect(computeGradedReproductionProbability(5, 5, 0)).toBe(1);
      expect(computeGradedReproductionProbability(4, 5, 0)).toBe(0);
    });

    it('returns 0.5 when harvest exactly equals threshold', () => {
      expect(computeGradedReproductionProbability(10, 10, 1)).toBeCloseTo(0.5, 5);
      expect(computeGradedReproductionProbability(5, 5, 2)).toBeCloseTo(0.5, 5);
    });

    it('returns higher probability when harvest exceeds threshold', () => {
      const prob = computeGradedReproductionProbability(15, 10, 1);
      expect(prob).toBeGreaterThan(0.5);
      expect(prob).toBeLessThan(1);
    });

    it('returns lower probability when harvest is below threshold', () => {
      const prob = computeGradedReproductionProbability(5, 10, 1);
      expect(prob).toBeLessThan(0.5);
      expect(prob).toBeGreaterThan(0);
    });

    it('steepness increases gradient slope', () => {
      const gentleSlope = computeGradedReproductionProbability(15, 10, 0.5);
      const steepSlope = computeGradedReproductionProbability(15, 10, 2);
      expect(steepSlope).toBeGreaterThan(gentleSlope);
    });

    it('uses normalized distance relative to threshold magnitude', () => {
      const smallThreshold = computeGradedReproductionProbability(12, 10, 1);
      const largeThreshold = computeGradedReproductionProbability(120, 100, 1);
      expect(smallThreshold).toBeCloseTo(largeThreshold, 3);
    });

    it('asymptotes toward 0 and 1 at extremes', () => {
      const veryLow = computeGradedReproductionProbability(1, 10, 2);
      const veryHigh = computeGradedReproductionProbability(100, 10, 2);
      expect(veryLow).toBeGreaterThan(0);
      expect(veryLow).toBeLessThan(0.2);
      expect(veryHigh).toBeGreaterThan(0.9);
      expect(veryHigh).toBeLessThan(1);
    });
  });
});
