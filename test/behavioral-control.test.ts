import { describe, it, expect } from 'vitest';
import {
  inheritBehavioralState,
  mutatePolicyParameters,
  normalizeSeedBehavioralState,
  resolveBehavioralPolicyFlags,
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
        policyState: new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]]),
        transientState: new Map([[INTERNAL_STATE_LAST_HARVEST, 5.0]])
      };
      const result = inheritBehavioralState(parent);

      expect(result.policyState?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
      expect(result.transientState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
    });

    it('mutates policy parameters when mutation options are provided', () => {
      const parent = {
        policyState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
          [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 10.0]
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

      expect(mutatedRepThreshold).toBeDefined();
      expect(mutatedMoveReserve).toBeDefined();
      expect(mutatedRepThreshold).not.toBe(2.0);
      expect(mutatedMoveReserve).not.toBe(10.0);
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
        [INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST, 1.5]
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
    it('detects movement and reproduction policies independently', () => {
      const movementOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 8]])
      });
      const reproductionOnly = resolveBehavioralPolicyFlags({
        policyState: new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.5]])
      });

      expect(movementOnly).toEqual({
        hasAnyPolicy: true,
        hasMovementPolicy: true,
        hasReproductionPolicy: false
      });
      expect(reproductionOnly).toEqual({
        hasAnyPolicy: true,
        hasMovementPolicy: false,
        hasReproductionPolicy: true
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
        hasMovementPolicy: false,
        hasReproductionPolicy: false
      });
    });
  });
});
