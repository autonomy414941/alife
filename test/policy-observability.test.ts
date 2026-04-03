import { describe, expect, it } from 'vitest';
import { summarizePolicyObservability, PolicyDecisionStats } from '../src/policy-observability';
import { PolicyFitnessRecord } from '../src/policy-fitness';

describe('policy observability', () => {
  it('summarizes decision-time observation means from policy fitness records', () => {
    const decisionStats: PolicyDecisionStats = {
      harvestDecisions: 2,
      harvestPolicyGuided: 1,
      movement: {
        decisions: 2,
        policyGated: 0,
        energyReservePolicyActive: 0,
        recentHarvestPolicyActive: 0,
        blockedByEnergyReserve: 0,
        blockedByRecentHarvest: 0,
        energyReserveNearThreshold: 0,
        recentHarvestNearThreshold: 0
      },
      reproduction: {
        decisions: 1,
        policyGated: 0,
        harvestThresholdPolicyActive: 0,
        suppressedByHarvestThreshold: 0,
        harvestThresholdNearThreshold: 0
      }
    };

    const records: PolicyFitnessRecord[] = [
      buildRecord({
        observation: {
          age: 2,
          localFertility: 0.8,
          localCrowding: 3,
          disturbancePhase: 1,
          ticksSinceDisturbance: 4,
          recentDisturbanceCount: 1,
          primaryResourceLevel: 5,
          secondaryResourceLevel: 1,
          secondaryResourceFraction: 1 / 6,
          sameLineageCrowding: 2,
          sameLineageShare: 2 / 3
        }
      }),
      buildRecord({
        observation: {
          age: 4,
          localFertility: 1.2,
          localCrowding: 1,
          disturbancePhase: 0,
          ticksSinceDisturbance: 10,
          recentDisturbanceCount: 0,
          primaryResourceLevel: 3,
          secondaryResourceLevel: 3,
          secondaryResourceFraction: 0.5,
          sameLineageCrowding: 0,
          sameLineageShare: 0
        }
      })
    ];

    const summary = summarizePolicyObservability([], records, decisionStats);

    expect(summary.observations).toEqual({
      decisions: 2,
      meanAge: 3,
      meanLocalFertility: 1,
      meanLocalCrowding: 2,
      meanPrimaryResourceLevel: 4,
      meanSecondaryResourceLevel: 2,
      meanSecondaryResourceFraction: 1 / 3,
      meanTicksSinceDisturbance: 7,
      meanRecentDisturbanceCount: 0.5,
      meanSameLineageShare: 1 / 3
    });
  });
});

function buildRecord(overrides: Partial<PolicyFitnessRecord> = {}): PolicyFitnessRecord {
  return {
    tick: overrides.tick ?? 1,
    agentId: overrides.agentId ?? 1,
    fertilityBin: overrides.fertilityBin ?? 0,
    crowdingBin: overrides.crowdingBin ?? 0,
    ageBin: overrides.ageBin ?? 0,
    disturbancePhase: overrides.disturbancePhase ?? 0,
    harvestIntake: overrides.harvestIntake ?? 0,
    survived: overrides.survived ?? true,
    offspringProduced: overrides.offspringProduced ?? 0,
    movementPolicyGated: overrides.movementPolicyGated ?? false,
    reproductionPolicyGated: overrides.reproductionPolicyGated ?? false,
    harvestPolicyGuided: overrides.harvestPolicyGuided ?? false,
    hasAnyPolicy: overrides.hasAnyPolicy ?? false,
    hasHarvestPolicy: overrides.hasHarvestPolicy ?? false,
    hasMovementPolicy: overrides.hasMovementPolicy ?? false,
    hasReproductionPolicy: overrides.hasReproductionPolicy ?? false,
    hasSpendingPolicy: overrides.hasSpendingPolicy ?? false,
    observation: overrides.observation,
    policyValues: overrides.policyValues
  };
}
