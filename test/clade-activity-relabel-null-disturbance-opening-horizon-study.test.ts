import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import { buildDisturbanceColonizationConfig } from '../src/clade-activity-relabel-null-disturbance-colonization';
import { runCladeActivityRelabelNullDisturbanceOpeningHorizonStudy } from '../src/clade-activity-relabel-null-disturbance-opening-horizon-study';

describe('runCladeActivityRelabelNullDisturbanceOpeningHorizonStudy', () => {
  it('compares the best short stack baseline against localized openings on the canonical horizon surface', () => {
    const generatedAt = '2026-03-13T00:00:00.000Z';
    const studyInput = {
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
    } as const;
    const baselineStudy = runCladeActivityRelabelNullStudy(
      buildCladeActivityRelabelNullBestShortStackStudyInput(
        {
          ...studyInput,
          simulation: {
            ...studyInput.simulation,
            config: {
              ...studyInput.simulation.config,
              ...buildDisturbanceColonizationConfig('off')
            }
          }
        },
        generatedAt
      )
    );
    const result = runCladeActivityRelabelNullDisturbanceOpeningHorizonStudy({
      generatedAt,
      baselineStudy,
      studyInput
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.baselineArtifact).toBe('docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json');
    expect(result.config.steps).toBe(6);
    expect(result.config.windowSize).toBe(1);
    expect(result.config.burnIn).toBe(2);
    expect(result.config.seeds).toEqual([77]);
    expect(result.config.minSurvivalTicks).toEqual([1]);
    expect(result.config.cladogenesisThresholds).toEqual([0]);
    expect(result.config.baselineSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      disturbanceInterval: 0,
      disturbanceSettlementOpeningTicks: 0,
      disturbanceSettlementOpeningBonus: 0,
      disturbanceSettlementOpeningLineageAbsentOnly: false
    });
    expect(result.config.localizedOpeningSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      disturbanceInterval: 50,
      disturbanceEnergyLoss: 0.5,
      disturbanceRadius: 2,
      disturbanceRefugiaFraction: 0.5,
      disturbanceSettlementOpeningTicks: 10,
      disturbanceSettlementOpeningBonus: 0.75,
      disturbanceSettlementOpeningLineageAbsentOnly: false
    });
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      baselineBirthScheduleMatchedAllSeeds: true,
      localizedOpeningBirthScheduleMatchedAllSeeds: true,
      baselinePersistentWindowFractionDeltaVsNullMean: 0,
      localizedOpeningPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsBaseline: 0,
      baselinePersistentActivityMeanDeltaVsNullMean: 0,
      localizedOpeningPersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsBaseline: 0,
      baselineDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      localizedOpeningDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.localizedOpeningStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison[0].baselineDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.comparison[0].baselineDiagnostics).toEqual(result.comparison[0].localizedOpeningDiagnostics);
  });
});
