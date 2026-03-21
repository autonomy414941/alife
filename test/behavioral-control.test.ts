import { describe, it, expect } from 'vitest';
import {
  inheritInternalState,
  mutatePolicyParameters,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_LAST_HARVEST
} from '../src/behavioral-control';

describe('behavioral-control', () => {
  describe('inheritInternalState', () => {
    it('returns undefined when parent has no internal state', () => {
      const parent = { internalState: undefined };
      const result = inheritInternalState(parent);
      expect(result).toBeUndefined();
    });

    it('clones parent internal state and resets transient memory', () => {
      const parent = {
        internalState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
          [INTERNAL_STATE_LAST_HARVEST, 5.0]
        ])
      };
      const result = inheritInternalState(parent);

      expect(result?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
      expect(result?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(0);
    });

    it('mutates policy parameters when mutation options are provided', () => {
      const parent = {
        internalState: new Map([
          [INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0],
          [INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD, 10.0]
        ])
      };

      const result = inheritInternalState(parent, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => 0.8
      });

      const mutatedRepThreshold = result?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD);
      const mutatedMoveReserve = result?.get(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD);

      expect(mutatedRepThreshold).toBeDefined();
      expect(mutatedMoveReserve).toBeDefined();
      expect(mutatedRepThreshold).not.toBe(2.0);
      expect(mutatedMoveReserve).not.toBe(10.0);
    });

    it('does not mutate when mutation probability is zero', () => {
      const parent = {
        internalState: new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]])
      };

      const result = inheritInternalState(parent, {
        mutationProbability: 0,
        mutationMagnitude: 10.0,
        randomFloat: () => 0.5
      });

      expect(result?.get(INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD)).toBe(2.0);
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

    it('does not mutate transient memory keys', () => {
      const state = new Map([[INTERNAL_STATE_LAST_HARVEST, 5.0]]);

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 10.0,
        randomFloat: () => 0.5
      });

      expect(state.get(INTERNAL_STATE_LAST_HARVEST)).toBe(5.0);
    });

    it('skips keys not present in internal state', () => {
      const state = new Map([[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 2.0]]);

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 0.5,
        randomFloat: () => 0.8
      });

      expect(state.has(INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD)).toBe(false);
    });
  });
});
