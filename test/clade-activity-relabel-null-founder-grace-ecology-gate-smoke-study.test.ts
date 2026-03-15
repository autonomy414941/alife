import { describe, expect, it } from 'vitest';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES,
  runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy
} from '../src/clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';

describe('runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy', () => {
  it('compares cladogenesis ecology gating on top of founder grace for the static habitat baseline', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const result = runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy({
      generatedAt,
      studyInput: {
        steps: 6,
        windowSize: 1,
        burnIn: 2,
        seeds: [83],
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
    expect(result.config.cladogenesisEcologyAdvantageThresholdValues).toEqual(
      FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES
    );
    expect(result.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
    });
    expect(result.results).toHaveLength(2);
    expect(result.results[0].cladogenesisEcologyAdvantageThreshold).toBe(-1);
    expect(result.results[0].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: -1
    });
    expect(result.results[1].cladogenesisEcologyAdvantageThreshold).toBe(0.1);
    expect(result.results[1].studyInput.simulation?.config).toMatchObject({
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: 0.1
    });
    expect(result.results[0].summary.birthScheduleMatchedAllSeeds).toBe(true);
    expect(result.results[1].summary.birthScheduleMatchedAllSeeds).toBe(true);
    expect(result.results[0].summary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean).toBe(0);
    expect(result.results[1].summary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean).toBe(0);
  });
});
