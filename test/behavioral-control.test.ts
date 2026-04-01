import { describe, it, expect } from 'vitest';
import { createGenomeV2, setTrait } from '../src/genome-v2';
import {
  DEFAULT_HARVEST_SECONDARY_PREFERENCE,
  DEFAULT_SPENDING_SECONDARY_PREFERENCE,
  inheritBehavioralState,
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE,
  mutatePolicyParameters,
  normalizeSeedBehavioralState,
  resolveCoupledSpendingSecondaryPreference,
  resolveHarvestSecondaryPreference,
  resolveSpendingSecondaryPreference,
  resolveBehavioralPolicyFlags,
  computeGradedHarvestSecondaryPreference,
  computeGradedReproductionProbability,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_LAST_HARVEST,
  updateHarvestMemory,
  getHarvestWindow3Mean,
  getHarvestWindow5Mean,
  getHarvestDecayWeighted,
  getEffectiveRecentHarvest
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

    it('clamps centralized steepness policy mutations through shared trait metadata', () => {
      const state = new Map([[INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 9.9]]);
      const randomValues = [0.5, 1.0];

      mutatePolicyParameters(state, {
        mutationProbability: 1.0,
        mutationMagnitude: 5,
        randomFloat: () => randomValues.shift() ?? 1.0
      });

      expect(state.get(INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS)).toBe(10);
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

    it('recognizes genome-backed policy traits without policyState', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.6);
      setTrait(genomeV2, INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 1);

      expect(
        resolveBehavioralPolicyFlags({
          genomeV2,
          policyState: undefined
        })
      ).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: false,
        hasMovementPolicy: false,
        hasReproductionPolicy: true,
        hasSpendingPolicy: true
      });
    });

    it('recognizes presence-activated genome policy loci from shared metadata', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 0);

      expect(
        resolveBehavioralPolicyFlags({
          genomeV2,
          policyState: undefined
        })
      ).toEqual({
        hasAnyPolicy: true,
        hasHarvestPolicy: true,
        hasMovementPolicy: false,
        hasReproductionPolicy: false,
        hasSpendingPolicy: false
      });
    });
  });

  describe('resolveHarvestSecondaryPreference', () => {
    it('keeps graded harvest sensitive to inherited base preference', () => {
      const lowPreference = computeGradedHarvestSecondaryPreference(2, 5, 2, 0.1);
      const highPreference = computeGradedHarvestSecondaryPreference(2, 5, 2, 0.9);

      expect(lowPreference).toBeLessThan(highPreference);
      expect(lowPreference).toBeGreaterThan(0.1);
      expect(highPreference).toBeLessThanOrEqual(1);
    });

    it('uses base preference as the midpoint at the harvest threshold', () => {
      expect(computeGradedHarvestSecondaryPreference(5, 5, 2, 0.2)).toBeCloseTo(0.2, 10);
      expect(computeGradedHarvestSecondaryPreference(5, 5, 2, 0.8)).toBeCloseTo(0.8, 10);
    });

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

    it('propagates genome-backed base preference differences through graded harvest', () => {
      const lowGenome = createGenomeV2();
      const highGenome = createGenomeV2();
      setTrait(lowGenome, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.1);
      setTrait(highGenome, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0.9);
      setTrait(lowGenome, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD, 5);
      setTrait(highGenome, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD, 5);
      setTrait(lowGenome, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 2);
      setTrait(highGenome, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS, 2);

      const lowPreference = resolveHarvestSecondaryPreference({ genomeV2: lowGenome }, 2);
      const highPreference = resolveHarvestSecondaryPreference({ genomeV2: highGenome }, 2);

      expect(lowPreference).toBeDefined();
      expect(highPreference).toBeDefined();
      expect(lowPreference!).toBeLessThan(highPreference!);
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

  describe('resolveCoupledSpendingSecondaryPreference', () => {
    it('falls back to the explicit spending preference when no harvest preference is active', () => {
      expect(
        resolveCoupledSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.75]])
        })
      ).toBeCloseTo(0.75, 10);
    });

    it('uses the inverse harvest preference when no spending preference is active', () => {
      expect(
        resolveCoupledSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 1]])
        })
      ).toBeCloseTo(0, 10);
      expect(
        resolveCoupledSpendingSecondaryPreference({
          policyState: new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 0]])
        })
      ).toBeCloseTo(1, 10);
    });

    it('blends explicit spending preference with harvest-driven reserve preservation', () => {
      expect(
        resolveCoupledSpendingSecondaryPreference({
          policyState: new Map([
            [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, 1],
            [INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 0.6]
          ])
        })
      ).toBeCloseTo(0.3, 10);
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

  describe('updateHarvestMemory', () => {
    it('updates last harvest value', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      updateHarvestMemory(agent, 10);
      expect(agent.transientState?.get(INTERNAL_STATE_LAST_HARVEST)).toBe(10);
    });

    it('builds rolling window average for 3-tick window', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      updateHarvestMemory(agent, 10);
      expect(getHarvestWindow3Mean(agent)).toBeCloseTo(10, 5);
      updateHarvestMemory(agent, 20);
      expect(getHarvestWindow3Mean(agent)).toBeCloseTo(15, 5);
      updateHarvestMemory(agent, 30);
      expect(getHarvestWindow3Mean(agent)).toBeCloseTo(20, 5);
      updateHarvestMemory(agent, 40);
      expect(getHarvestWindow3Mean(agent)).toBeCloseTo(30, 5);
    });

    it('builds rolling window average for 5-tick window', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      for (let i = 1; i <= 5; i++) {
        updateHarvestMemory(agent, i * 10);
      }
      expect(getHarvestWindow5Mean(agent)).toBeCloseTo(30, 5);
      updateHarvestMemory(agent, 60);
      expect(getHarvestWindow5Mean(agent)).toBeCloseTo(40, 5);
    });

    it('builds decay-weighted average', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      updateHarvestMemory(agent, 10);
      const first = getHarvestDecayWeighted(agent);
      expect(first).toBeCloseTo(3, 5);
      updateHarvestMemory(agent, 10);
      const second = getHarvestDecayWeighted(agent);
      expect(second).toBeGreaterThan(first);
      expect(second).toBeLessThan(10);
    });

    it('decay-weighted converges toward stable value', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      for (let i = 0; i < 20; i++) {
        updateHarvestMemory(agent, 10);
      }
      expect(getHarvestDecayWeighted(agent)).toBeCloseTo(10, 1);
    });
  });

  describe('getEffectiveRecentHarvest', () => {
    it('returns instant harvest in instant mode', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      updateHarvestMemory(agent, 5);
      updateHarvestMemory(agent, 10);
      expect(getEffectiveRecentHarvest(agent, 'instant')).toBe(10);
    });

    it('returns 3-tick window mean in window3 mode', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      updateHarvestMemory(agent, 10);
      updateHarvestMemory(agent, 20);
      updateHarvestMemory(agent, 30);
      expect(getEffectiveRecentHarvest(agent, 'window3')).toBeCloseTo(20, 5);
    });

    it('returns 5-tick window mean in window5 mode', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      for (let i = 1; i <= 5; i++) {
        updateHarvestMemory(agent, i * 10);
      }
      expect(getEffectiveRecentHarvest(agent, 'window5')).toBeCloseTo(30, 5);
    });

    it('returns decay-weighted value in decay mode', () => {
      const agent = { id: 1, transientState: new Map(), policyState: new Map() } as any;
      for (let i = 0; i < 10; i++) {
        updateHarvestMemory(agent, 10);
      }
      const decay = getEffectiveRecentHarvest(agent, 'decay');
      expect(decay).toBeGreaterThan(5);
      expect(decay).toBeLessThan(15);
    });
  });
});
