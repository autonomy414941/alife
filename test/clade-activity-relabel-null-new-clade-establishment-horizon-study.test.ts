import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
  runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy,
  HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
} from '../src/clade-activity-relabel-null-new-clade-establishment-horizon-study';

describe('runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy', () => {
  it('compares the static habitat baseline against founder grace on the canonical horizon surface', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
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
              cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
              adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
              newCladeSettlementCrowdingGraceTicks:
                HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
            }
          }
        },
        generatedAt
      )
    );
    const result = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
      generatedAt,
      baselineStudy,
      studyInput
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.baselineArtifact).toBe(BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT);
    expect(result.config.bestShortStackBaselineArtifact).toBe(
      'docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json'
    );
    expect(result.config.steps).toBe(6);
    expect(result.config.windowSize).toBe(1);
    expect(result.config.burnIn).toBe(2);
    expect(result.config.seeds).toEqual([77]);
    expect(result.config.minSurvivalTicks).toEqual([1]);
    expect(result.config.cladogenesisThresholds).toEqual([0]);
    expect(result.config.cladeHabitatCoupling).toBe(HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING);
    expect(result.config.adaptiveCladeHabitatMemoryRate).toBe(HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE);
    expect(result.config.baselineNewCladeSettlementCrowdingGraceTicks).toBe(
      HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
    );
    expect(result.config.founderGraceNewCladeSettlementCrowdingGraceTicks).toBe(
      HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
    );
    expect(result.config.staticHabitatSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks:
        HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
    });
    expect(result.config.founderGraceSimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks:
        HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
    });
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      staticHabitatBirthScheduleMatchedAllSeeds: true,
      founderGraceBirthScheduleMatchedAllSeeds: true,
      staticHabitatPersistentWindowFractionDeltaVsNullMean: 0,
      founderGracePersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsStaticHabitat: 0,
      staticHabitatPersistentActivityMeanDeltaVsNullMean: 0,
      founderGracePersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsStaticHabitat: 0,
      staticHabitatDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      founderGraceDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.founderGraceStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison[0].staticHabitatDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.comparison[0].staticHabitatDiagnostics).toEqual(
      result.comparison[0].founderGraceDiagnostics
    );
  });
});
