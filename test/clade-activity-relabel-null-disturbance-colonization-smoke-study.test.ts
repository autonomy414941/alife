import { describe, expect, it } from 'vitest';
import {
  DISTURBANCE_COLONIZATION_MODES,
  runCladeActivityRelabelNullDisturbanceColonizationSmokeStudy
} from '../src/clade-activity-relabel-null-disturbance-colonization-smoke-study';

describe('runCladeActivityRelabelNullDisturbanceColonizationSmokeStudy', () => {
  it('compares disturbance-off against a localized opening regime on top of the best short stack', () => {
    const generatedAt = '2026-03-12T00:00:00.000Z';
    const result = runCladeActivityRelabelNullDisturbanceColonizationSmokeStudy({
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
    expect(result.config.disturbanceModes).toEqual(DISTURBANCE_COLONIZATION_MODES);
    expect(result.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].disturbanceMode).toBe('off');
    expect(result.results[0].studyInput.simulation?.config).toMatchObject({
      disturbanceInterval: 0,
      disturbanceSettlementOpeningTicks: 0,
      disturbanceSettlementOpeningBonus: 0
    });
    expect(result.results[1].disturbanceMode).toBe('localizedOpening');
    expect(result.results[1].studyInput.simulation?.config).toMatchObject({
      disturbanceInterval: 50,
      disturbanceEnergyLoss: 0.5,
      disturbanceRadius: 2,
      disturbanceRefugiaFraction: 0.5,
      disturbanceSettlementOpeningTicks: 10,
      disturbanceSettlementOpeningBonus: 0.75
    });
    expect(result.results[0].summary.birthScheduleMatchedAllSeeds).toBe(true);
    expect(result.results[1].summary.birthScheduleMatchedAllSeeds).toBe(true);
  });
});
