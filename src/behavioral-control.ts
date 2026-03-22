import { Agent, AgentSeed } from './types';

export const INTERNAL_STATE_LAST_HARVEST = 'last_harvest_total';
export const INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD = 'reproduction_harvest_threshold';
export const INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD = 'movement_energy_reserve_threshold';
export const INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST = 'movement_min_recent_harvest';

export interface BehavioralStateCarrier {
  policyState?: ReadonlyMap<string, number>;
  transientState?: ReadonlyMap<string, number>;
}

export interface MutableBehavioralStateCarrier {
  policyState?: Map<string, number>;
  transientState?: Map<string, number>;
}

export interface BehavioralPolicyFlags {
  hasAnyPolicy: boolean;
  hasMovementPolicy: boolean;
  hasReproductionPolicy: boolean;
}

export const POLICY_PARAMETER_KEYS = [
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST
];

export const TRANSIENT_MEMORY_KEYS = [INTERNAL_STATE_LAST_HARVEST];

export function clonePolicyState(policyState: ReadonlyMap<string, number> | undefined): Map<string, number> | undefined {
  return policyState ? new Map(policyState) : undefined;
}

export function cloneTransientState(
  transientState: ReadonlyMap<string, number> | undefined
): Map<string, number> | undefined {
  return transientState ? new Map(transientState) : undefined;
}

export function splitLegacyInternalState(
  internalState: ReadonlyMap<string, number> | undefined
): MutableBehavioralStateCarrier {
  if (!internalState) {
    return {};
  }

  const policyState = new Map<string, number>();
  const transientState = new Map<string, number>();

  for (const [key, value] of internalState) {
    if (POLICY_PARAMETER_KEYS.includes(key)) {
      policyState.set(key, value);
      continue;
    }

    if (TRANSIENT_MEMORY_KEYS.includes(key)) {
      transientState.set(key, value);
    }
  }

  return {
    policyState: policyState.size > 0 ? policyState : undefined,
    transientState: transientState.size > 0 ? transientState : undefined
  };
}

export function normalizeSeedBehavioralState(
  seed: Pick<AgentSeed, 'policyState' | 'transientState' | 'internalState'>
): MutableBehavioralStateCarrier {
  if (seed.policyState !== undefined || seed.transientState !== undefined) {
    return {
      policyState: clonePolicyState(seed.policyState),
      transientState: cloneTransientState(seed.transientState)
    };
  }

  return splitLegacyInternalState(seed.internalState);
}

export interface MutatePolicyOptions {
  mutationProbability: number;
  mutationMagnitude: number;
  randomFloat: () => number;
}

export function mutatePolicyParameters(
  policyState: Map<string, number>,
  options: MutatePolicyOptions
): void {
  const { mutationProbability, mutationMagnitude, randomFloat } = options;

  for (const key of POLICY_PARAMETER_KEYS) {
    if (!policyState.has(key)) {
      continue;
    }

    if (randomFloat() < mutationProbability) {
      const currentValue = policyState.get(key)!;
      const delta = (randomFloat() - 0.5) * 2 * mutationMagnitude;
      const mutatedValue = Math.max(0, currentValue + delta);
      policyState.set(key, mutatedValue);
    }
  }
}

export function inheritBehavioralState(
  parent: Pick<Agent, 'policyState' | 'transientState'>,
  mutationOptions?: MutatePolicyOptions
): MutableBehavioralStateCarrier {
  const policyState = clonePolicyState(parent.policyState);
  const transientState = cloneTransientState(parent.transientState);

  if (transientState) {
    for (const key of TRANSIENT_MEMORY_KEYS) {
      if (transientState.has(key)) {
        transientState.set(key, 0);
      }
    }
  }

  if (policyState && mutationOptions) {
    mutatePolicyParameters(policyState, mutationOptions);
  }

  return {
    policyState,
    transientState
  };
}

export function setTransientStateValue(agent: Agent, key: string, value: number): void {
  if (!agent.transientState) {
    if (!agent.policyState) {
      return;
    }

    agent.transientState = new Map();
  }

  agent.transientState.set(key, value);
}

export function getPolicyStateValue(
  agent: Pick<BehavioralStateCarrier, 'policyState'>,
  key: string,
  fallback = 0
): number {
  return agent.policyState?.get(key) ?? fallback;
}

export function getTransientStateValue(
  agent: Pick<BehavioralStateCarrier, 'transientState'>,
  key: string,
  fallback = 0
): number {
  return agent.transientState?.get(key) ?? fallback;
}

export function resolveBehavioralPolicyFlags(
  agent: Pick<BehavioralStateCarrier, 'policyState'>
): BehavioralPolicyFlags {
  const hasReproductionPolicy =
    getPolicyStateValue(agent, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD) > 0;
  const hasMovementPolicy =
    getPolicyStateValue(agent, INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD) > 0 ||
    getPolicyStateValue(agent, INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST) > 0;

  return {
    hasAnyPolicy: hasReproductionPolicy || hasMovementPolicy,
    hasMovementPolicy,
    hasReproductionPolicy
  };
}

export function mergeBehavioralState(
  agent: Pick<BehavioralStateCarrier, 'policyState' | 'transientState'>
): Map<string, number> | undefined {
  if (!agent.policyState && !agent.transientState) {
    return undefined;
  }

  const merged = new Map<string, number>();
  for (const [key, value] of agent.policyState ?? []) {
    merged.set(key, value);
  }
  for (const [key, value] of agent.transientState ?? []) {
    merged.set(key, value);
  }

  return merged;
}
