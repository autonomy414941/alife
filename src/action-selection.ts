import { Agent, GenomeV2 } from './types';
import { BehavioralStateCarrier, getPolicyStateValue } from './behavioral-control';

export type ActionType =
  | 'harvest_primary'
  | 'harvest_secondary'
  | 'move_toward_fertility'
  | 'reproduce_cautiously'
  | 'rest';

export interface ActionCandidate {
  type: ActionType;
  priority: number;
}

export interface ActionSelectionContext {
  primaryAvailable: number;
  secondaryAvailable: number;
  localFertility: number;
  localCrowding: number;
  energy: number;
  energyCapacity: number;
  recentHarvest: number;
  age: number;
}

export const ACTION_PRIORITY_TRAIT_PREFIX = 'action_priority_';
export const ACTION_THRESHOLD_TRAIT_PREFIX = 'action_threshold_';

export const ACTION_PRIORITY_HARVEST_PRIMARY = `${ACTION_PRIORITY_TRAIT_PREFIX}harvest_primary`;
export const ACTION_PRIORITY_HARVEST_SECONDARY = `${ACTION_PRIORITY_TRAIT_PREFIX}harvest_secondary`;
export const ACTION_PRIORITY_MOVE_TOWARD_FERTILITY = `${ACTION_PRIORITY_TRAIT_PREFIX}move_toward_fertility`;
export const ACTION_PRIORITY_REPRODUCE_CAUTIOUSLY = `${ACTION_PRIORITY_TRAIT_PREFIX}reproduce_cautiously`;
export const ACTION_PRIORITY_REST = `${ACTION_PRIORITY_TRAIT_PREFIX}rest`;

export const ACTION_THRESHOLD_HARVEST_PRIMARY = `${ACTION_THRESHOLD_TRAIT_PREFIX}harvest_primary`;
export const ACTION_THRESHOLD_HARVEST_SECONDARY = `${ACTION_THRESHOLD_TRAIT_PREFIX}harvest_secondary`;
export const ACTION_THRESHOLD_MOVE_TOWARD_FERTILITY = `${ACTION_THRESHOLD_TRAIT_PREFIX}move_toward_fertility`;
export const ACTION_THRESHOLD_REPRODUCE_CAUTIOUSLY = `${ACTION_THRESHOLD_TRAIT_PREFIX}reproduce_cautiously`;
export const ACTION_THRESHOLD_REST = `${ACTION_THRESHOLD_TRAIT_PREFIX}rest`;

export const DEFAULT_ACTION_PRIORITY = 0.5;
export const DEFAULT_ACTION_THRESHOLD = 0;

function getActionPriorityKey(actionType: ActionType): string {
  return `${ACTION_PRIORITY_TRAIT_PREFIX}${actionType}`;
}

function getActionThresholdKey(actionType: ActionType): string {
  return `${ACTION_THRESHOLD_TRAIT_PREFIX}${actionType}`;
}

function computeActionPriority(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  actionType: ActionType,
  context: ActionSelectionContext
): number {
  const basePriority = getPolicyStateValue(
    agent,
    getActionPriorityKey(actionType),
    DEFAULT_ACTION_PRIORITY
  );

  const threshold = getPolicyStateValue(
    agent,
    getActionThresholdKey(actionType),
    DEFAULT_ACTION_THRESHOLD
  );

  const contextValue = getContextValueForAction(actionType, context);

  if (threshold > 0 && contextValue < threshold) {
    return 0;
  }

  return basePriority;
}

function getContextValueForAction(
  actionType: ActionType,
  context: ActionSelectionContext
): number {
  switch (actionType) {
    case 'harvest_primary':
      return context.primaryAvailable;
    case 'harvest_secondary':
      return context.secondaryAvailable;
    case 'move_toward_fertility':
      return 1 - (context.energy / context.energyCapacity);
    case 'reproduce_cautiously':
      return context.recentHarvest;
    case 'rest':
      return context.energy / context.energyCapacity;
    default:
      return 0;
  }
}

export function selectAction(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  context: ActionSelectionContext
): ActionType {
  const candidates: ActionCandidate[] = [
    {
      type: 'harvest_primary',
      priority: computeActionPriority(agent, 'harvest_primary', context)
    },
    {
      type: 'harvest_secondary',
      priority: computeActionPriority(agent, 'harvest_secondary', context)
    },
    {
      type: 'move_toward_fertility',
      priority: computeActionPriority(agent, 'move_toward_fertility', context)
    },
    {
      type: 'reproduce_cautiously',
      priority: computeActionPriority(agent, 'reproduce_cautiously', context)
    },
    {
      type: 'rest',
      priority: computeActionPriority(agent, 'rest', context)
    }
  ];

  candidates.sort((a, b) => b.priority - a.priority);

  return candidates[0].type;
}

export function isActionSelectionEnabled(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 }
): boolean {
  const actionTypes: ActionType[] = [
    'harvest_primary',
    'harvest_secondary',
    'move_toward_fertility',
    'reproduce_cautiously',
    'rest'
  ];

  for (const actionType of actionTypes) {
    const priority = getPolicyStateValue(
      agent,
      getActionPriorityKey(actionType),
      DEFAULT_ACTION_PRIORITY
    );
    const threshold = getPolicyStateValue(
      agent,
      getActionThresholdKey(actionType),
      DEFAULT_ACTION_THRESHOLD
    );

    if (Math.abs(priority - DEFAULT_ACTION_PRIORITY) > 1e-6 || threshold > 0) {
      return true;
    }
  }

  return false;
}
