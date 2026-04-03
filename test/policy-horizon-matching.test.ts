import { describe, expect, it } from 'vitest';
import { compareExposureArmsAtHorizon } from '../src/policy-horizon-matching';
import { ExposureWithHorizons } from '../src/policy-horizon-shared';

function makeExposure(input: {
  agentId: number;
  survived: boolean;
  secondaryResourceFraction: number;
  sameLineageShare: number;
}): ExposureWithHorizons {
  return {
    record: {
      tick: 1,
      agentId: input.agentId,
      fertilityBin: 1,
      crowdingBin: 1,
      ageBin: 1,
      disturbancePhase: 0,
      harvestIntake: 1,
      survived: true,
      offspringProduced: 0,
      movementPolicyGated: false,
      reproductionPolicyGated: false,
      harvestPolicyGuided: false,
      hasAnyPolicy: true,
      hasMovementPolicy: false,
      hasReproductionPolicy: false,
      hasHarvestPolicy: false,
      observation: {
        age: 20,
        localFertility: 1,
        localCrowding: 2,
        disturbancePhase: 0,
        ticksSinceDisturbance: 80,
        recentDisturbanceCount: 0,
        primaryResourceLevel: 4,
        secondaryResourceLevel: 4,
        secondaryResourceFraction: input.secondaryResourceFraction,
        sameLineageCrowding: 1,
        sameLineageShare: input.sameLineageShare
      }
    },
    horizons: new Map([[20, { survived: input.survived, reproduced: false }]])
  };
}

describe('policy-horizon-matching', () => {
  it('uses richer observation keys to separate coarse-bin matches', () => {
    const coupled = [
      makeExposure({ agentId: 1, survived: true, secondaryResourceFraction: 0.1, sameLineageShare: 0.1 }),
      makeExposure({ agentId: 2, survived: true, secondaryResourceFraction: 0.8, sameLineageShare: 0.9 })
    ];
    const decoupled = [
      makeExposure({ agentId: 3, survived: true, secondaryResourceFraction: 0.1, sameLineageShare: 0.1 }),
      makeExposure({ agentId: 4, survived: false, secondaryResourceFraction: 0.4, sameLineageShare: 0.4 })
    ];

    const coarse = compareExposureArmsAtHorizon(coupled, decoupled, 20, 'coarse_bins');
    const rich = compareExposureArmsAtHorizon(coupled, decoupled, 20, 'rich_observation');

    expect(coarse.matchedContexts).toBe(1);
    expect(coarse.weightedSurvivalAdvantage).toBeCloseTo(0.5);
    expect(rich.matchedContexts).toBe(1);
    expect(rich.matchedExposureWeight).toBe(1);
    expect(rich.weightedSurvivalAdvantage).toBeCloseTo(0);
  });
});
