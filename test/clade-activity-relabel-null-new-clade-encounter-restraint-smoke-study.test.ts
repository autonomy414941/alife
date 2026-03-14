import { describe, expect, it } from 'vitest';
import {
  NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING,
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES,
  NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS,
  runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy
} from '../src/clade-activity-relabel-null-new-clade-encounter-restraint-smoke-study';

describe('runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy', () => {
  it('compares newborn encounter restraint on the static habitat baseline', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const result = runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy({
      generatedAt,
      studyInput: {
        steps: 6,
        windowSize: 1,
        burnIn: 2,
        seeds: [79],
        minSurvivalTicks: [1],
        cladogenesisThresholds: [0],
        stopWhenExtinct: true,
        simulation: {
          config: {
            width: 1,
            height: 1,
            maxResource: 0,
            resourceRegen: 0,
            metabolismCostBase: 0,
            moveCost: 0,
            harvestCap: 0,
            reproduceThreshold: 10,
            reproduceProbability: 1,
            offspringEnergyFraction: 0.5,
            mutationAmount: 0.2,
            speciationThreshold: 0,
            maxAge: 100
          },
          initialAgents: [
            {
              x: 0,
              y: 0,
              energy: 100,
              genome: { metabolism: 1, harvest: 1, aggression: 0.5 }
            }
          ]
        }
      }
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.newCladeEncounterRestraintGraceBoostValues).toEqual(
      NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES
    );
    expect(result.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].newCladeEncounterRestraintGraceBoost).toBe(0);
    expect(result.results[0].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS,
      newCladeEncounterRestraintGraceBoost: 0
    });
    expect(result.results[1].newCladeEncounterRestraintGraceBoost).toBe(2);
    expect(result.results[1].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS,
      newCladeEncounterRestraintGraceBoost: 2
    });
    expect(result.results[0].summary.birthScheduleMatchedAllSeeds).toBe(true);
    expect(result.results[1].summary.birthScheduleMatchedAllSeeds).toBe(true);
  });
});
