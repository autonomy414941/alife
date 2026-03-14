import { describe, expect, it } from 'vitest';
import {
  NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
  runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy
} from '../src/clade-activity-relabel-null-new-clade-establishment-smoke-study';

describe('runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy', () => {
  it('compares the habitat-memory baseline against a bounded new-clade settlement grace', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const result = runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy({
      generatedAt,
      studyInput: {
        steps: 6,
        windowSize: 1,
        burnIn: 2,
        seeds: [77],
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
    expect(result.config.newCladeSettlementCrowdingGraceTicksValues).toEqual(NEW_CLADE_ESTABLISHMENT_GRACE_TICKS);
    expect(result.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].newCladeSettlementCrowdingGraceTicks).toBe(0);
    expect(result.results[0].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: 0
    });
    expect(result.results[1].newCladeSettlementCrowdingGraceTicks).toBe(36);
    expect(result.results[1].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: 36
    });
    expect(result.results[0].summary.birthScheduleMatchedAllSeeds).toBe(true);
    expect(result.results[1].summary.birthScheduleMatchedAllSeeds).toBe(true);
  });
});
