import { describe, it, expect } from 'vitest';
import {
  selectAction,
  isActionSelectionEnabled,
  ActionSelectionContext,
  ACTION_PRIORITY_HARVEST_PRIMARY,
  ACTION_PRIORITY_HARVEST_SECONDARY,
  ACTION_PRIORITY_MOVE_TOWARD_FERTILITY,
  ACTION_PRIORITY_REPRODUCE_CAUTIOUSLY,
  ACTION_PRIORITY_REST,
  ACTION_THRESHOLD_HARVEST_PRIMARY,
  ACTION_THRESHOLD_HARVEST_SECONDARY,
  ACTION_THRESHOLD_MOVE_TOWARD_FERTILITY
} from '../src/action-selection';
import { createGenomeV2, setTrait } from '../src/genome-v2';

describe('action-selection', () => {
  const createContext = (overrides: Partial<ActionSelectionContext> = {}): ActionSelectionContext => ({
    primaryAvailable: 10,
    secondaryAvailable: 5,
    localFertility: 1.0,
    localCrowding: 2,
    energy: 50,
    energyCapacity: 100,
    recentHarvest: 8,
    age: 10,
    ...overrides
  });

  describe('selectAction', () => {
    it('should select action with highest priority', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.9);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.3);
      setTrait(genomeV2, ACTION_PRIORITY_MOVE_TOWARD_FERTILITY, 0.2);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext();

      const action = selectAction(agent, context);
      expect(action).toBe('harvest_primary');
    });

    it('should select secondary harvest when prioritized', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.2);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.9);
      setTrait(genomeV2, ACTION_PRIORITY_MOVE_TOWARD_FERTILITY, 0.3);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext();

      const action = selectAction(agent, context);
      expect(action).toBe('harvest_secondary');
    });

    it('should select movement when prioritized', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.2);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.3);
      setTrait(genomeV2, ACTION_PRIORITY_MOVE_TOWARD_FERTILITY, 0.9);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext();

      const action = selectAction(agent, context);
      expect(action).toBe('move_toward_fertility');
    });

    it('should respect action thresholds', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.9);
      setTrait(genomeV2, ACTION_THRESHOLD_HARVEST_PRIMARY, 20);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.3);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext({ primaryAvailable: 5 });

      const action = selectAction(agent, context);
      expect(action).not.toBe('harvest_primary');
    });

    it('should allow action when threshold is met', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.9);
      setTrait(genomeV2, ACTION_THRESHOLD_HARVEST_PRIMARY, 5);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_SECONDARY, 0.3);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext({ primaryAvailable: 10 });

      const action = selectAction(agent, context);
      expect(action).toBe('harvest_primary');
    });

    it('should select reproduce_cautiously when prioritized', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_REPRODUCE_CAUTIOUSLY, 0.95);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.3);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext();

      const action = selectAction(agent, context);
      expect(action).toBe('reproduce_cautiously');
    });

    it('should select rest when prioritized', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_REST, 0.95);
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.3);

      const agent = { genomeV2, policyState: undefined };
      const context = createContext();

      const action = selectAction(agent, context);
      expect(action).toBe('rest');
    });
  });

  describe('isActionSelectionEnabled', () => {
    it('should return false when all priorities are default', () => {
      const genomeV2 = createGenomeV2();
      const agent = { genomeV2, policyState: undefined };

      expect(isActionSelectionEnabled(agent)).toBe(false);
    });

    it('should return true when any priority is non-default', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_PRIORITY_HARVEST_PRIMARY, 0.7);

      const agent = { genomeV2, policyState: undefined };

      expect(isActionSelectionEnabled(agent)).toBe(true);
    });

    it('should return true when any threshold is set', () => {
      const genomeV2 = createGenomeV2();
      setTrait(genomeV2, ACTION_THRESHOLD_HARVEST_PRIMARY, 10);

      const agent = { genomeV2, policyState: undefined };

      expect(isActionSelectionEnabled(agent)).toBe(true);
    });

    it('should return false for agent without genomeV2', () => {
      const agent = { policyState: undefined };

      expect(isActionSelectionEnabled(agent)).toBe(false);
    });
  });
});
