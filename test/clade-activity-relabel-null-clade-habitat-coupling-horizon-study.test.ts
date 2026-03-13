import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import {
  HORIZON_CLADE_HABITAT_COUPLING,
  runCladeActivityRelabelNullCladeHabitatCouplingHorizonStudy
} from '../src/clade-activity-relabel-null-clade-habitat-coupling-horizon-study';

describe('runCladeActivityRelabelNullCladeHabitatCouplingHorizonStudy', () => {
  it('compares the best short stack baseline against habitat coupling on the canonical horizon surface', () => {
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
              cladeHabitatCoupling: 0
            }
          }
        },
        generatedAt
      )
    );
    const result = runCladeActivityRelabelNullCladeHabitatCouplingHorizonStudy({
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
    expect(result.config.cladeHabitatCoupling).toBe(HORIZON_CLADE_HABITAT_COUPLING);
    expect(result.config.baselineSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: 0
    });
    expect(result.config.habitatCoupledSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: HORIZON_CLADE_HABITAT_COUPLING
    });
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      baselineBirthScheduleMatchedAllSeeds: true,
      habitatCoupledBirthScheduleMatchedAllSeeds: true,
      baselinePersistentWindowFractionDeltaVsNullMean: 0,
      habitatCoupledPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsBaseline: 0,
      baselinePersistentActivityMeanDeltaVsNullMean: 0,
      habitatCoupledPersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsBaseline: 0,
      baselineDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      habitatCoupledDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.habitatCoupledStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison[0].baselineDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.comparison[0].baselineDiagnostics).toEqual(result.comparison[0].habitatCoupledDiagnostics);
  });
});
