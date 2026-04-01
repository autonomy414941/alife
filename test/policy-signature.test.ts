import { describe, expect, it } from 'vitest';
import {
  classifyPolicySignature,
  classifyPolicySignatureFromValues,
  POLICY_SIGNATURE_OPEN_THRESHOLD,
  POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD,
  POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD,
  POLICY_SIGNATURE_STRICT_THRESHOLD
} from '../src/policy-signature';

describe('policy-signature', () => {
  it('classifies neutral policy values as open balanced', () => {
    const signature = classifyPolicySignatureFromValues({
      reproduction_harvest_threshold: 0,
      movement_energy_reserve_threshold: 0,
      movement_min_recent_harvest: 0,
      harvest_secondary_preference: 0.5,
      spending_secondary_preference: 0.5
    });

    expect(signature.key).toBe('open|open|balanced');
    expect(signature.axisValues.resourceBiasValue).toBe(0.5);
  });

  it('uses the stronger movement gate and mean resource bias when classifying a record', () => {
    const signature = classifyPolicySignature({
      policyValues: {
        reproduction_harvest_threshold: POLICY_SIGNATURE_STRICT_THRESHOLD + 0.01,
        movement_energy_reserve_threshold: POLICY_SIGNATURE_OPEN_THRESHOLD + 0.01,
        movement_min_recent_harvest: POLICY_SIGNATURE_STRICT_THRESHOLD + 0.02,
        harvest_secondary_preference: POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD - 0.01,
        spending_secondary_preference: POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD + 0.01
      }
    });

    expect(signature.reproductionGate).toBe('strict');
    expect(signature.movementGate).toBe('strict');
    expect(signature.resourceBias).toBe('balanced');
  });

  it('separates primary and secondary resource bias regimes', () => {
    expect(
      classifyPolicySignatureFromValues({
        reproduction_harvest_threshold: 0,
        movement_energy_reserve_threshold: 0,
        movement_min_recent_harvest: 0,
        harvest_secondary_preference: 0.1,
        spending_secondary_preference: 0.2
      }).resourceBias
    ).toBe('primary');

    expect(
      classifyPolicySignatureFromValues({
        reproduction_harvest_threshold: 0,
        movement_energy_reserve_threshold: 0,
        movement_min_recent_harvest: 0,
        harvest_secondary_preference: 0.9,
        spending_secondary_preference: 0.8
      }).resourceBias
    ).toBe('secondary');
  });
});
