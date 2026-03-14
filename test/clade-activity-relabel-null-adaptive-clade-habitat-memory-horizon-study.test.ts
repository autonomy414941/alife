import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from '../src/clade-activity-relabel-null-best-short-stack';
import {
  ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING
} from '../src/clade-activity-relabel-null-adaptive-clade-habitat-memory-smoke-study';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
  HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
  runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudy
} from '../src/clade-activity-relabel-null-adaptive-clade-habitat-memory-horizon-study';

describe('runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudy', () => {
  it('compares static versus adaptive clade habitat memory on the canonical habitat-coupled horizon surface', () => {
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
              cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING,
              adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
            }
          }
        },
        generatedAt
      )
    );
    const result = runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudy({
      generatedAt,
      baselineStudy,
      studyInput
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.baselineArtifact).toBe(BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT);
    expect(result.config.habitatCouplingBaselineArtifact).toBe(
      'docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json'
    );
    expect(result.config.steps).toBe(6);
    expect(result.config.windowSize).toBe(1);
    expect(result.config.burnIn).toBe(2);
    expect(result.config.seeds).toEqual([77]);
    expect(result.config.minSurvivalTicks).toEqual([1]);
    expect(result.config.cladogenesisThresholds).toEqual([0]);
    expect(result.config.cladeHabitatCoupling).toBe(ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING);
    expect(result.config.adaptiveCladeHabitatMemoryRate).toBe(HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE);
    expect(result.config.staticMemorySimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
    });
    expect(result.config.adaptiveMemorySimulationConfig).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      offspringSettlementEcologyScoring: true,
      cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
    });
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      staticMemoryBirthScheduleMatchedAllSeeds: true,
      adaptiveMemoryBirthScheduleMatchedAllSeeds: true,
      staticMemoryPersistentWindowFractionDeltaVsNullMean: 0,
      adaptiveMemoryPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsStaticMemory: 0,
      staticMemoryPersistentActivityMeanDeltaVsNullMean: 0,
      adaptiveMemoryPersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsStaticMemory: 0,
      staticMemoryDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      },
      adaptiveMemoryDiagnostics: {
        activeCladeDeltaVsNullMean: 0,
        rawNewCladeActivityMeanDeltaVsNullMean: 0,
        persistencePenaltyVsRawDeltaMean: 0,
        dominantLossMode: 'matchedOrBetter'
      }
    });
    expect(result.adaptiveMemoryStudy.config.minSurvivalTicks).toEqual([1]);
    expect(result.comparison[0].staticMemoryDiagnostics.finalPopulationMean).toBeGreaterThan(0);
    expect(result.comparison[0].staticMemoryDiagnostics).toEqual(
      result.comparison[0].adaptiveMemoryDiagnostics
    );
  });
});
