import { Agent, AgentSeed, GenomeV2 } from './types';
import {
  clampGenomeV2TraitValue,
  getGenomeV2TraitDefinition,
  isActiveGenomeV2Trait,
  setTrait
} from './genome-v2';
import { LocalEcologicalContext, realizePhenotype, resolveExpressedTrait } from './phenotype';

export const INTERNAL_STATE_LAST_HARVEST = 'last_harvest_total';
export const INTERNAL_STATE_HARVEST_WINDOW_3 = 'harvest_window_3_mean';
export const INTERNAL_STATE_HARVEST_WINDOW_5 = 'harvest_window_5_mean';
export const INTERNAL_STATE_HARVEST_DECAY_WEIGHTED = 'harvest_decay_weighted';
export const INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD = 'reproduction_harvest_threshold';
export const INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS = 'reproduction_harvest_threshold_steepness';
export const INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD = 'movement_energy_reserve_threshold';
export const INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS = 'movement_energy_reserve_threshold_steepness';
export const INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST = 'movement_min_recent_harvest';
export const INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS = 'movement_min_recent_harvest_steepness';
export const INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE = 'harvest_secondary_preference';
export const INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD = 'harvest_primary_threshold';
export const INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS = 'harvest_primary_threshold_steepness';
export const INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE = 'spending_secondary_preference';
export const DEFAULT_HARVEST_SECONDARY_PREFERENCE = 0.5;
export const DEFAULT_SPENDING_SECONDARY_PREFERENCE = 0.5;
export const DEFAULT_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS = 1.0;
export const DEFAULT_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS = 1.0;
export const DEFAULT_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS = 1.0;
export const DEFAULT_HARVEST_PRIMARY_THRESHOLD_STEEPNESS = 1.0;
export const POLICY_NEAR_THRESHOLD_MARGIN = 1;

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
  hasHarvestPolicy: boolean;
  hasMovementPolicy: boolean;
  hasReproductionPolicy: boolean;
  hasSpendingPolicy?: boolean;
}

export const POLICY_PARAMETER_KEYS = [
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS,
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD,
  INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE
];

export const HARVEST_WINDOW_3_SIZE = 3;
export const HARVEST_WINDOW_5_SIZE = 5;
export const HARVEST_DECAY_FACTOR = 0.7;

export const TRANSIENT_MEMORY_KEYS = [
  INTERNAL_STATE_LAST_HARVEST,
  INTERNAL_STATE_HARVEST_WINDOW_3,
  INTERNAL_STATE_HARVEST_WINDOW_5,
  INTERNAL_STATE_HARVEST_DECAY_WEIGHTED
];

interface HarvestHistory {
  window3: number[];
  window5: number[];
}

const HARVEST_HISTORY_KEY = 'harvest_history_raw';

function getHarvestHistory(agent: Pick<BehavioralStateCarrier, 'transientState'>): HarvestHistory {
  const raw = agent.transientState?.get(HARVEST_HISTORY_KEY);
  if (!raw) {
    return { window3: [], window5: [] };
  }
  const encoded = Math.floor(raw);
  const window3Count = encoded % 10;
  const window5Count = Math.floor(encoded / 10) % 10;
  const window3: number[] = [];
  const window5: number[] = [];

  for (let i = 0; i < window3Count; i++) {
    const key = `harvest_h3_${i}`;
    const value = agent.transientState?.get(key) ?? 0;
    window3.push(value);
  }

  for (let i = 0; i < window5Count; i++) {
    const key = `harvest_h5_${i}`;
    const value = agent.transientState?.get(key) ?? 0;
    window5.push(value);
  }

  return { window3, window5 };
}

function setHarvestHistory(agent: Agent, history: HarvestHistory): void {
  if (!agent.transientState) {
    if (!shouldPersistBehavioralMemory(agent)) {
      return;
    }

    agent.transientState = new Map();
  }

  const encoded = history.window3.length + history.window5.length * 10;
  agent.transientState.set(HARVEST_HISTORY_KEY, encoded);

  for (let i = 0; i < history.window3.length; i++) {
    agent.transientState.set(`harvest_h3_${i}`, history.window3[i]);
  }

  for (let i = 0; i < history.window5.length; i++) {
    agent.transientState.set(`harvest_h5_${i}`, history.window5[i]);
  }
}

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
  seed: Pick<AgentSeed, 'policyState' | 'transientState' | 'internalState' | 'genomeV2'>
): MutableBehavioralStateCarrier {
  let result: MutableBehavioralStateCarrier;

  if (seed.policyState !== undefined || seed.transientState !== undefined) {
    result = {
      policyState: clonePolicyState(seed.policyState),
      transientState: cloneTransientState(seed.transientState)
    };
  } else {
    result = splitLegacyInternalState(seed.internalState);
  }

  if (seed.genomeV2 && result.policyState) {
    for (const [key, value] of result.policyState) {
      if (getGenomeV2TraitDefinition(key) && !seed.genomeV2.traits.has(key)) {
        setTrait(seed.genomeV2, key, value);
      }
    }
    result.policyState = undefined;
  }

  return result;
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
      const mutatedValue = clampPolicyParameterValue(key, currentValue + delta);
      policyState.set(key, mutatedValue);
    }
  }
}

export function inheritBehavioralState(
  parent: Pick<Agent, 'policyState' | 'transientState' | 'genomeV2'>,
  mutationOptions?: MutatePolicyOptions
): MutableBehavioralStateCarrier {
  const policyState = parent.genomeV2 ? undefined : clonePolicyState(parent.policyState);
  const transientState = cloneTransientState(parent.transientState);

  if (transientState) {
    for (const key of TRANSIENT_MEMORY_KEYS) {
      if (transientState.has(key)) {
        transientState.set(key, 0);
      }
    }
  }

  if (policyState && mutationOptions && !parent.genomeV2) {
    mutatePolicyParameters(policyState, mutationOptions);
  }

  return {
    policyState,
    transientState
  };
}

export function setTransientStateValue(agent: Agent, key: string, value: number): void {
  if (!agent.transientState) {
    if (!shouldPersistBehavioralMemory(agent)) {
      return;
    }

    agent.transientState = new Map();
  }

  agent.transientState.set(key, value);
}

function shouldPersistBehavioralMemory(agent: Agent): boolean {
  return resolveBehavioralPolicyFlags(agent).hasAnyPolicy;
}

export function updateHarvestMemory(agent: Agent, harvestTotal: number): void {
  setTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST, harvestTotal);

  const history = getHarvestHistory(agent);

  history.window3.push(harvestTotal);
  if (history.window3.length > HARVEST_WINDOW_3_SIZE) {
    history.window3.shift();
  }

  history.window5.push(harvestTotal);
  if (history.window5.length > HARVEST_WINDOW_5_SIZE) {
    history.window5.shift();
  }

  setHarvestHistory(agent, history);

  const mean3 = history.window3.length > 0
    ? history.window3.reduce((sum, v) => sum + v, 0) / history.window3.length
    : 0;

  const mean5 = history.window5.length > 0
    ? history.window5.reduce((sum, v) => sum + v, 0) / history.window5.length
    : 0;

  const previousDecay = getTransientStateValue(agent, INTERNAL_STATE_HARVEST_DECAY_WEIGHTED, 0);
  const decayWeighted = previousDecay * HARVEST_DECAY_FACTOR + harvestTotal * (1 - HARVEST_DECAY_FACTOR);

  setTransientStateValue(agent, INTERNAL_STATE_HARVEST_WINDOW_3, mean3);
  setTransientStateValue(agent, INTERNAL_STATE_HARVEST_WINDOW_5, mean5);
  setTransientStateValue(agent, INTERNAL_STATE_HARVEST_DECAY_WEIGHTED, decayWeighted);
}

export function getPolicyStateValue(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  key: string,
  fallback = 0
): number {
  return resolveExpressedTrait(agent, key) ?? fallback;
}

export function getTransientStateValue(
  agent: Pick<BehavioralStateCarrier, 'transientState'>,
  key: string,
  fallback = 0
): number {
  return agent.transientState?.get(key) ?? fallback;
}

export function getHarvestWindow3Mean(agent: Pick<BehavioralStateCarrier, 'transientState'>): number {
  return getTransientStateValue(agent, INTERNAL_STATE_HARVEST_WINDOW_3, 0);
}

export function getHarvestWindow5Mean(agent: Pick<BehavioralStateCarrier, 'transientState'>): number {
  return getTransientStateValue(agent, INTERNAL_STATE_HARVEST_WINDOW_5, 0);
}

export function getHarvestDecayWeighted(agent: Pick<BehavioralStateCarrier, 'transientState'>): number {
  return getTransientStateValue(agent, INTERNAL_STATE_HARVEST_DECAY_WEIGHTED, 0);
}

export function getEffectiveRecentHarvest(
  agent: Pick<BehavioralStateCarrier, 'transientState'>,
  memoryMode: 'instant' | 'window3' | 'window5' | 'decay' = 'instant'
): number {
  switch (memoryMode) {
    case 'window3':
      return getHarvestWindow3Mean(agent);
    case 'window5':
      return getHarvestWindow5Mean(agent);
    case 'decay':
      return getHarvestDecayWeighted(agent);
    case 'instant':
    default:
      return getTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST, 0);
  }
}

export function resolveHarvestSecondaryPreference(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  primaryAvailable?: number,
  enabled = true,
  context?: LocalEcologicalContext
): number | undefined {
  if (!enabled) {
    return undefined;
  }
  return resolveHarvestSecondaryPreferenceFromBasePreference(
    agent,
    getBaseHarvestSecondaryPreference(agent, context),
    primaryAvailable
  );
}

function getBaseHarvestSecondaryPreference(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  context?: LocalEcologicalContext
): number | undefined {
  return realizePhenotype(agent, context).harvestSecondaryPreference;
}

export function resolveSpendingSecondaryPreference(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 }
): number | undefined {
  return realizePhenotype(agent).spendingSecondaryPreference;
}

export function resolveCoupledSpendingSecondaryPreference(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  enabled = true
): number | undefined {
  if (!enabled) {
    return undefined;
  }
  const phenotype = realizePhenotype(agent);
  const spendingPreference = phenotype.spendingSecondaryPreference;
  const harvestPreference = resolveHarvestSecondaryPreferenceFromBasePreference(
    agent,
    phenotype.harvestSecondaryPreference
  );

  if (harvestPreference === undefined) {
    return spendingPreference;
  }

  const reservePreservationPreference = 1 - harvestPreference;
  if (spendingPreference === undefined) {
    return reservePreservationPreference;
  }

  return (spendingPreference + reservePreservationPreference) / 2;
}

function resolveHarvestSecondaryPreferenceFromBasePreference(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 },
  basePreference: number | undefined,
  primaryAvailable?: number
): number | undefined {
  if (basePreference === undefined) {
    return undefined;
  }

  if (primaryAvailable === undefined) {
    return basePreference;
  }

  const threshold = getPolicyStateValue(agent, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD);
  const steepness = getPolicyStateValue(
    agent,
    INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS,
    DEFAULT_HARVEST_PRIMARY_THRESHOLD_STEEPNESS
  );

  if (threshold <= 0) {
    return basePreference;
  }

  return computeGradedHarvestSecondaryPreference(
    primaryAvailable,
    threshold,
    steepness,
    basePreference
  );
}

export function resolveBehavioralPolicyFlags(
  agent: Pick<BehavioralStateCarrier, 'policyState'> & { genomeV2?: GenomeV2 }
): BehavioralPolicyFlags {
  const hasReproductionPolicy =
    isActivePolicyParameter(agent, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS);
  const hasMovementPolicy =
    isActivePolicyParameter(agent, INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS);
  const hasHarvestPolicy =
    isActivePolicyParameter(agent, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD) ||
    isActivePolicyParameter(agent, INTERNAL_STATE_HARVEST_PRIMARY_THRESHOLD_STEEPNESS);
  const hasSpendingPolicy =
    isActivePolicyParameter(agent, INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE);

  return {
    hasAnyPolicy: hasHarvestPolicy || hasReproductionPolicy || hasMovementPolicy || hasSpendingPolicy,
    hasHarvestPolicy,
    hasMovementPolicy,
    hasReproductionPolicy,
    hasSpendingPolicy
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

export function isActivePolicyParameter(
  carrier: { policyState?: ReadonlyMap<string, number>; genomeV2?: GenomeV2 } | ReadonlyMap<string, number> | undefined,
  key: string
): boolean {
  if (carrier instanceof Map) {
    const value = resolveExpressedTrait({ policyState: carrier }, key);
    return value === undefined ? false : isActiveGenomeV2Trait(key, value, true);
  }

  if (!carrier) {
    return false;
  }

  const stateCarrier = carrier as { policyState?: ReadonlyMap<string, number>; genomeV2?: GenomeV2 };
  const value = resolveExpressedTrait(stateCarrier, key);
  return value === undefined ? false : isActiveGenomeV2Trait(key, value, true);
}

export function isNearPolicyThreshold(
  value: number,
  threshold: number,
  margin = POLICY_NEAR_THRESHOLD_MARGIN
): boolean {
  return threshold > 0 && Math.abs(value - threshold) <= Math.max(0, margin);
}

function clampPolicyParameterValue(key: string, value: number): number {
  if (getGenomeV2TraitDefinition(key)) {
    return clampGenomeV2TraitValue(key, value);
  }

  return Math.max(0, value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function migratePolicyStateToGenomeV2(agent: Agent): void {
  if (!agent.genomeV2 || !agent.policyState) {
    return;
  }

  for (const [key, value] of agent.policyState) {
    if (getGenomeV2TraitDefinition(key)) {
      setTrait(agent.genomeV2, key, value);
    }
  }

  agent.policyState = undefined;
}

export function computeGradedReproductionProbability(
  recentHarvest: number,
  threshold: number,
  steepness: number,
  enabled = true
): number {
  if (!enabled) {
    return 1;
  }
  if (threshold <= 0) {
    return 1;
  }

  if (steepness <= 0) {
    return recentHarvest >= threshold ? 1 : 0;
  }

  const normalizedDistance = (recentHarvest - threshold) / Math.max(1, threshold);
  const scaledDistance = normalizedDistance * steepness;
  return 1 / (1 + Math.exp(-scaledDistance));
}

export function computeGradedMovementProbability(
  value: number,
  threshold: number,
  steepness: number
): number {
  if (threshold <= 0) {
    return 1;
  }

  if (steepness <= 0) {
    return value >= threshold ? 1 : 0;
  }

  const normalizedDistance = (value - threshold) / Math.max(1, threshold);
  const scaledDistance = normalizedDistance * steepness;
  return 1 / (1 + Math.exp(-scaledDistance));
}

export function computeGradedHarvestSecondaryPreference(
  primaryAvailable: number,
  threshold: number,
  steepness: number,
  basePreference: number
): number {
  if (threshold <= 0 || steepness <= 0) {
    return basePreference;
  }

  const normalizedDistance = (primaryAvailable - threshold) / Math.max(1, threshold);
  const scaledDistance = normalizedDistance * steepness;
  const primaryPreference = 1 / (1 + Math.exp(-scaledDistance));
  const scarcityBias = 1 - 2 * primaryPreference;

  if (scarcityBias >= 0) {
    return basePreference + (1 - basePreference) * scarcityBias;
  }

  return basePreference * (1 + scarcityBias);
}
