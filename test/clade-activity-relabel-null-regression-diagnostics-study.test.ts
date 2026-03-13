import { describe, expect, it } from 'vitest';
import {
  CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS,
  rankCladeActivityRelabelNullRegressionDiagnosticsResults,
  runCladeActivityRelabelNullRegressionDiagnosticsStudy
} from '../src/clade-activity-relabel-null-regression-diagnostics-study';

describe('runCladeActivityRelabelNullRegressionDiagnosticsStudy', () => {
  it('compares the selected regression scenarios on top of the best short stack', () => {
    const generatedAt = '2026-03-12T00:00:00.000Z';
    const result = runCladeActivityRelabelNullRegressionDiagnosticsStudy({
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
    expect(result.question).toContain('default-off add-on knobs');
    expect(result.prediction).toContain('March 11-12 add-ons');
    expect(result.config).toMatchObject({
      steps: 6,
      windowSize: 1,
      burnIn: 2,
      seeds: [77],
      stopWhenExtinct: true,
      minSurvivalTicks: [1],
      cladogenesisThresholds: [0],
      baselineSimulationConfig: {
        width: 1,
        height: 1,
        lineageHarvestCrowdingPenalty: 1,
        lineageDispersalCrowdingPenalty: 1,
        lineageEncounterRestraint: 1,
        lineageOffspringSettlementCrowdingPenalty: 0,
        offspringSettlementEcologyScoring: true,
        decompositionSpilloverFraction: 0
      }
    });
    expect(result.config.rankingOrder).toEqual([
      'birthScheduleMatchedAllSeeds desc',
      'persistentActivityMeanDeltaVsNullMean desc',
      'activeCladeDeltaVsNullMean desc',
      'persistencePenaltyVsRawDeltaMean asc',
      'rawNewCladeActivityMeanDeltaVsNullMean desc'
    ]);
    expect(result.config.scenarios).toEqual(
      CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS.map(({ scenario, label, configOverrides }) => ({
        scenario,
        label,
        configOverrides
      }))
    );
    expect(result.results).toHaveLength(CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS.length);
    expect(result.results[0]).toMatchObject({
      scenario: 'bestShortStack',
      label: 'Best short stack',
      configOverrides: {},
      birthScheduleMatchedAllSeeds: true,
      overallRank: 1,
      persistentActivityRank: 1,
      activeCladeRank: 1,
      rawActivityRank: 1,
      persistencePenaltyRank: 1,
      deltaVsBestShortStack: {
        persistentWindowFractionDeltaVsNullMean: 0,
        persistentActivityMeanDeltaVsNullMean: 0,
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0
      }
    });
    const disturbanceScenario = result.results.find((entry) => entry.scenario === 'disturbanceLocalizedOpening');
    expect(disturbanceScenario).toMatchObject({
      label: 'Disturbance localized opening',
      configOverrides: {
        disturbanceInterval: 50,
        disturbanceEnergyLoss: 0.5,
        disturbanceRadius: 2,
        disturbanceRefugiaFraction: 0.5,
        disturbanceSettlementOpeningTicks: 10,
        disturbanceSettlementOpeningBonus: 0.75
      }
    });
  });

  it('ranks scenarios by persistent delta, then active clades, then persistence penalty', () => {
    const ranked = rankCladeActivityRelabelNullRegressionDiagnosticsResults(
      [
        {
          scenario: 'bestShortStack',
          label: 'Best short stack',
          configOverrides: {},
          birthScheduleMatchedAllSeeds: true,
          persistentWindowFractionDeltaVsNullMean: 0.2,
          persistentActivityMeanDeltaVsNullMean: 10,
          activeCladeDeltaVsNullMean: -3,
          rawNewCladeActivityMeanDeltaVsNullMean: 2,
          persistencePenaltyVsRawDeltaMean: 4,
          dominantLossMode: 'activeCladeDeficit',
          deltaVsBestShortStack: {
            persistentWindowFractionDeltaVsNullMean: 0,
            persistentActivityMeanDeltaVsNullMean: 0,
            activeCladeDeltaVsNullMean: 0,
            rawNewCladeActivityMeanDeltaVsNullMean: 0,
            persistencePenaltyVsRawDeltaMean: 0
          }
        },
        {
          scenario: 'lineageOffspringSettlementCrowding',
          label: 'Lineage offspring settlement penalty',
          configOverrides: {
            lineageOffspringSettlementCrowdingPenalty: 1
          },
          birthScheduleMatchedAllSeeds: true,
          persistentWindowFractionDeltaVsNullMean: 0.1,
          persistentActivityMeanDeltaVsNullMean: 8,
          activeCladeDeltaVsNullMean: -1,
          rawNewCladeActivityMeanDeltaVsNullMean: 1,
          persistencePenaltyVsRawDeltaMean: 2,
          dominantLossMode: 'persistenceFailure',
          deltaVsBestShortStack: {
            persistentWindowFractionDeltaVsNullMean: -0.1,
            persistentActivityMeanDeltaVsNullMean: -2,
            activeCladeDeltaVsNullMean: 2,
            rawNewCladeActivityMeanDeltaVsNullMean: -1,
            persistencePenaltyVsRawDeltaMean: -2
          }
        },
        {
          scenario: 'cladogenesisEcologyGate',
          label: 'Cladogenesis ecology gate',
          configOverrides: {
            cladogenesisEcologyAdvantageThreshold: 0.1
          },
          birthScheduleMatchedAllSeeds: true,
          persistentWindowFractionDeltaVsNullMean: 0.15,
          persistentActivityMeanDeltaVsNullMean: 8,
          activeCladeDeltaVsNullMean: -1,
          rawNewCladeActivityMeanDeltaVsNullMean: 3,
          persistencePenaltyVsRawDeltaMean: 1,
          dominantLossMode: 'founderSuppression',
          deltaVsBestShortStack: {
            persistentWindowFractionDeltaVsNullMean: -0.05,
            persistentActivityMeanDeltaVsNullMean: -2,
            activeCladeDeltaVsNullMean: 2,
            rawNewCladeActivityMeanDeltaVsNullMean: 1,
            persistencePenaltyVsRawDeltaMean: -3
          }
        },
        {
          scenario: 'decompositionSpillover',
          label: 'Decomposition spillover',
          configOverrides: {
            decompositionSpilloverFraction: 0.5
          },
          birthScheduleMatchedAllSeeds: false,
          persistentWindowFractionDeltaVsNullMean: 0.25,
          persistentActivityMeanDeltaVsNullMean: 12,
          activeCladeDeltaVsNullMean: -0.5,
          rawNewCladeActivityMeanDeltaVsNullMean: 5,
          persistencePenaltyVsRawDeltaMean: 0.5,
          dominantLossMode: 'matchedOrBetter',
          deltaVsBestShortStack: {
            persistentWindowFractionDeltaVsNullMean: 0.05,
            persistentActivityMeanDeltaVsNullMean: 2,
            activeCladeDeltaVsNullMean: 2.5,
            rawNewCladeActivityMeanDeltaVsNullMean: 3,
            persistencePenaltyVsRawDeltaMean: -3.5
          }
        }
      ],
      ['bestShortStack', 'cladogenesisEcologyGate', 'lineageOffspringSettlementCrowding', 'decompositionSpillover']
    );

    expect(ranked.map((entry) => entry.scenario)).toEqual([
      'bestShortStack',
      'cladogenesisEcologyGate',
      'lineageOffspringSettlementCrowding',
      'decompositionSpillover'
    ]);
    expect(ranked.map((entry) => entry.overallRank)).toEqual([1, 2, 3, 4]);
    expect(ranked.find((entry) => entry.scenario === 'bestShortStack')).toMatchObject({
      persistentActivityRank: 2,
      activeCladeRank: 4,
      rawActivityRank: 3,
      persistencePenaltyRank: 4
    });
    expect(ranked.find((entry) => entry.scenario === 'cladogenesisEcologyGate')).toMatchObject({
      persistentActivityRank: 3,
      activeCladeRank: 2,
      rawActivityRank: 2,
      persistencePenaltyRank: 2
    });
    expect(ranked.find((entry) => entry.scenario === 'lineageOffspringSettlementCrowding')).toMatchObject({
      persistentActivityRank: 4,
      activeCladeRank: 3,
      rawActivityRank: 4,
      persistencePenaltyRank: 3
    });
    expect(ranked.find((entry) => entry.scenario === 'decompositionSpillover')).toMatchObject({
      persistentActivityRank: 1,
      activeCladeRank: 1,
      rawActivityRank: 1,
      persistencePenaltyRank: 1
    });
  });
});
