import { Agent } from './types';

export const INTERNAL_STATE_LAST_HARVEST = 'last_harvest_total';
export const INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD = 'reproduction_harvest_threshold';
export const INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD = 'movement_energy_reserve_threshold';
export const INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST = 'movement_min_recent_harvest';

export interface BehavioralPolicyFlags {
  hasAnyPolicy: boolean;
  hasMovementPolicy: boolean;
  hasReproductionPolicy: boolean;
}

export function cloneInternalState(
  internalState: ReadonlyMap<string, number> | undefined
): Map<string, number> | undefined {
  return internalState ? new Map(internalState) : undefined;
}

export const POLICY_PARAMETER_KEYS = [
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST
];

const TRANSIENT_MEMORY_KEYS = [INTERNAL_STATE_LAST_HARVEST];

export interface MutatePolicyOptions {
  mutationProbability: number;
  mutationMagnitude: number;
  randomFloat: () => number;
}

export function mutatePolicyParameters(
  internalState: Map<string, number>,
  options: MutatePolicyOptions
): void {
  const { mutationProbability, mutationMagnitude, randomFloat } = options;

  for (const key of POLICY_PARAMETER_KEYS) {
    if (!internalState.has(key)) {
      continue;
    }

    if (randomFloat() < mutationProbability) {
      const currentValue = internalState.get(key)!;
      const delta = (randomFloat() - 0.5) * 2 * mutationMagnitude;
      const mutatedValue = Math.max(0, currentValue + delta);
      internalState.set(key, mutatedValue);
    }
  }
}

export function inheritInternalState(
  parent: Pick<Agent, 'internalState'>,
  mutationOptions?: MutatePolicyOptions
): Map<string, number> | undefined {
  const nextState = cloneInternalState(parent.internalState);
  if (!nextState) {
    return undefined;
  }

  for (const key of TRANSIENT_MEMORY_KEYS) {
    if (nextState.has(key)) {
      nextState.set(key, 0);
    }
  }

  if (mutationOptions) {
    mutatePolicyParameters(nextState, mutationOptions);
  }

  return nextState;
}

export function setInternalStateValue(agent: Agent, key: string, value: number): void {
  if (!agent.internalState) {
    return;
  }
  agent.internalState.set(key, value);
}

export function getInternalStateValue(agent: Pick<Agent, 'internalState'>, key: string, fallback = 0): number {
  return agent.internalState?.get(key) ?? fallback;
}

export function resolveBehavioralPolicyFlags(agent: Pick<Agent, 'internalState'>): BehavioralPolicyFlags {
  const hasReproductionPolicy =
    getInternalStateValue(agent, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD) > 0;
  const hasMovementPolicy =
    getInternalStateValue(agent, INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD) > 0 ||
    getInternalStateValue(agent, INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST) > 0;

  return {
    hasAnyPolicy: hasReproductionPolicy || hasMovementPolicy,
    hasMovementPolicy,
    hasReproductionPolicy
  };
}
