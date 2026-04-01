import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE
} from './behavioral-control';
import { PolicyFitnessRecord } from './policy-fitness';

export type PolicyGateStrength = 'open' | 'guarded' | 'strict';
export type PolicyResourceBias = 'primary' | 'balanced' | 'secondary';

export interface PolicySignatureAxisValues {
  reproductionGateValue: number;
  movementGateValue: number;
  resourceBiasValue: number;
}

export interface PolicySignature {
  key: string;
  reproductionGate: PolicyGateStrength;
  movementGate: PolicyGateStrength;
  resourceBias: PolicyResourceBias;
  axisValues: PolicySignatureAxisValues;
}

export const POLICY_SIGNATURE_OPEN_THRESHOLD = 0.05;
export const POLICY_SIGNATURE_STRICT_THRESHOLD = 0.2;
export const POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD = 0.4;
export const POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD = 0.6;

export function classifyPolicySignature(record: Pick<PolicyFitnessRecord, 'policyValues'>): PolicySignature {
  return classifyPolicySignatureFromValues(record.policyValues);
}

export function classifyPolicySignatureFromValues(
  policyValues: Readonly<Record<string, number>> | undefined
): PolicySignature {
  const axisValues = resolvePolicySignatureAxisValues(policyValues);
  const reproductionGate = classifyPolicyGateStrength(axisValues.reproductionGateValue);
  const movementGate = classifyPolicyGateStrength(axisValues.movementGateValue);
  const resourceBias = classifyPolicyResourceBias(axisValues.resourceBiasValue);

  return {
    key: buildPolicySignatureKey(reproductionGate, movementGate, resourceBias),
    reproductionGate,
    movementGate,
    resourceBias,
    axisValues
  };
}

export function resolvePolicySignatureAxisValues(
  policyValues: Readonly<Record<string, number>> | undefined
): PolicySignatureAxisValues {
  const reproductionGateValue = Math.max(0, policyValues?.[INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD] ?? 0);
  const movementEnergyReserveValue = Math.max(
    0,
    policyValues?.[INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD] ?? 0
  );
  const movementRecentHarvestValue = Math.max(
    0,
    policyValues?.[INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST] ?? 0
  );
  const movementGateValue = Math.max(movementEnergyReserveValue, movementRecentHarvestValue);
  const harvestSecondaryPreference = clampUnitInterval(
    policyValues?.[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE] ?? 0.5
  );
  const spendingSecondaryPreference = clampUnitInterval(
    policyValues?.[INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE] ?? 0.5
  );

  return {
    reproductionGateValue,
    movementGateValue,
    resourceBiasValue: (harvestSecondaryPreference + spendingSecondaryPreference) / 2
  };
}

export function buildPolicySignatureKey(
  reproductionGate: PolicyGateStrength,
  movementGate: PolicyGateStrength,
  resourceBias: PolicyResourceBias
): string {
  return `${reproductionGate}|${movementGate}|${resourceBias}`;
}

function classifyPolicyGateStrength(value: number): PolicyGateStrength {
  if (value <= POLICY_SIGNATURE_OPEN_THRESHOLD) {
    return 'open';
  }
  if (value <= POLICY_SIGNATURE_STRICT_THRESHOLD) {
    return 'guarded';
  }
  return 'strict';
}

function classifyPolicyResourceBias(value: number): PolicyResourceBias {
  if (value < POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD) {
    return 'primary';
  }
  if (value > POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD) {
    return 'secondary';
  }
  return 'balanced';
}

function clampUnitInterval(value: number): number {
  return Math.min(1, Math.max(0, value));
}
