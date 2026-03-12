import { describe, expect, it } from 'vitest';
import { runCladeActivityRelabelNullStudy } from '../src/activity';
import {
  BASELINE_RELABEL_NULL_ARTIFACT,
  buildCladeActivityRelabelNullBestShortStackStudyInput,
  DEFAULT_BEST_SHORT_STACK_STUDY_INPUT,
  runCladeActivityRelabelNullBestShortStackStudy
} from '../src/clade-activity-relabel-null-best-short-stack-study';

describe('runCladeActivityRelabelNullBestShortStackStudy', () => {
  it('preserves the best short stack defaults and compares against a provided baseline study', () => {
    expect(DEFAULT_BEST_SHORT_STACK_STUDY_INPUT.steps).toBe(4000);
    expect(DEFAULT_BEST_SHORT_STACK_STUDY_INPUT.minSurvivalTicks).toEqual([50, 100]);
    expect(DEFAULT_BEST_SHORT_STACK_STUDY_INPUT.cladogenesisThresholds).toEqual([1, 1.2]);
    expect(DEFAULT_BEST_SHORT_STACK_STUDY_INPUT.simulation?.config).toMatchObject({
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      lineageOffspringSettlementCrowdingPenalty: 0,
      offspringSettlementEcologyScoring: true,
      encounterRiskAversion: 0,
      decompositionSpilloverFraction: 0
    });

    const generatedAt = '2026-03-12T00:00:00.000Z';
    const studyInputOverrides = {
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
    };

    const baselineStudy = runCladeActivityRelabelNullStudy(
      buildCladeActivityRelabelNullBestShortStackStudyInput(studyInputOverrides, generatedAt)
    );

    const result = runCladeActivityRelabelNullBestShortStackStudy({
      generatedAt,
      baselineStudy,
      studyInput: studyInputOverrides
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config.baselineArtifact).toBe(BASELINE_RELABEL_NULL_ARTIFACT);
    expect(result.config.studyInput.steps).toBe(6);
    expect(result.config.studyInput.windowSize).toBe(1);
    expect(result.config.studyInput.burnIn).toBe(2);
    expect(result.config.studyInput.simulation?.config).toMatchObject({
      width: 1,
      height: 1,
      lineageHarvestCrowdingPenalty: 1,
      lineageDispersalCrowdingPenalty: 1,
      lineageEncounterRestraint: 1,
      lineageOffspringSettlementCrowdingPenalty: 0,
      offspringSettlementEcologyScoring: true,
      encounterRiskAversion: 0,
      decompositionSpilloverFraction: 0
    });
    expect(result.study.config.minSurvivalTicks).toEqual([1]);
    expect(result.study.config.cladogenesisThresholds).toEqual([0]);
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison[0]).toMatchObject({
      cladogenesisThreshold: 0,
      minSurvivalTicks: 1,
      birthScheduleMatchedAllSeeds: true,
      baselinePersistentWindowFractionDeltaVsNullMean: 0,
      currentPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsBaseline: 0,
      baselinePersistentActivityMeanDeltaVsNullMean: 0,
      currentPersistentActivityMeanDeltaVsNullMean: 0,
      persistentActivityMeanImprovementVsBaseline: 0
    });
  });
});
