import { Agent } from './types';

export const INTERNAL_STATE_LAST_HARVEST = 'last_harvest_total';
export const INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD = 'reproduction_harvest_threshold';
export const INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD = 'movement_energy_reserve_threshold';
export const INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST = 'movement_min_recent_harvest';

export function cloneInternalState(
  internalState: ReadonlyMap<string, number> | undefined
): Map<string, number> | undefined {
  return internalState ? new Map(internalState) : undefined;
}

export function inheritInternalState(parent: Pick<Agent, 'internalState'>): Map<string, number> | undefined {
  const nextState = cloneInternalState(parent.internalState);
  if (!nextState) {
    return undefined;
  }
  nextState.set(INTERNAL_STATE_LAST_HARVEST, 0);
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
