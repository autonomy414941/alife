import { describe, expect, it } from 'vitest';
import { CladeActivityRelabelNullSmokeStudyExport } from '../src/clade-activity-relabel-null-smoke-study';
import {
  decideEncounterRestraintReview,
  runCladeActivityRelabelNullNewCladeEncounterRestraintReview
} from '../src/clade-activity-relabel-null-new-clade-encounter-restraint-review';
import {
  CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport,
  HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
  HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST
} from '../src/clade-activity-relabel-null-new-clade-encounter-restraint-horizon-study';

type EncounterRestraintSmokeStudyExport = CladeActivityRelabelNullSmokeStudyExport<
  'newCladeEncounterRestraintGraceBoost',
  number
>;

describe('runCladeActivityRelabelNullNewCladeEncounterRestraintReview', () => {
  it('prunes the encounter-restraint axis when the threshold-1.0 regression dominates the threshold-1.2 rescue', () => {
    const generatedAt = '2026-03-14T00:00:00.000Z';
    const smokeStudy = buildSmokeStudy({
      baselineActiveCladeDeltaVsNullMean: -28.5,
      encounterRestraintActiveCladeDeltaVsNullMean: -27.25,
      baselinePersistentActivityMeanDeltaVsNullMean: 17.428571428571416,
      encounterRestraintPersistentActivityMeanDeltaVsNullMean: 18.642857142857125,
      baselineRawNewCladeActivityMeanDeltaVsNullMean: 11.75,
      encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 14.9375,
      baselinePersistencePenaltyVsRawDeltaMean: -5.678571428571416,
      encounterRestraintPersistencePenaltyVsRawDeltaMean: -3.7053571428571246
    });
    const horizonStudy = buildHorizonStudy([
      {
        cladogenesisThreshold: 1,
        minSurvivalTicks: 50,
        founderGraceActualActiveCladesMean: 50,
        encounterRestraintActualActiveCladesMean: 54,
        founderGraceMatchedNullActiveCladesMean: 73.75,
        encounterRestraintMatchedNullActiveCladesMean: 82,
        founderGraceRawNewCladeActivityMeanDeltaVsNullMean: 15.703947368421083,
        encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 22.05921052631581,
        founderGracePersistencePenaltyVsRawDeltaMean: -19.7825391180654,
        encounterRestraintPersistencePenaltyVsRawDeltaMean: -30.02187055476523,
        persistentActivityMeanImprovementVsFounderGrace: 16.594594594594554
      },
      {
        cladogenesisThreshold: 1,
        minSurvivalTicks: 100,
        founderGraceActualActiveCladesMean: 50,
        encounterRestraintActualActiveCladesMean: 54,
        founderGraceMatchedNullActiveCladesMean: 73.75,
        encounterRestraintMatchedNullActiveCladesMean: 82,
        founderGraceRawNewCladeActivityMeanDeltaVsNullMean: 15.703947368421083,
        encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 22.05921052631581,
        founderGracePersistencePenaltyVsRawDeltaMean: -33.07307965860598,
        encounterRestraintPersistencePenaltyVsRawDeltaMean: -35.062411095305805,
        persistentActivityMeanImprovementVsFounderGrace: 8.344594594594554
      },
      {
        cladogenesisThreshold: 1.2,
        minSurvivalTicks: 50,
        founderGraceActualActiveCladesMean: 51.75,
        encounterRestraintActualActiveCladesMean: 53.5,
        founderGraceMatchedNullActiveCladesMean: 75.5,
        encounterRestraintMatchedNullActiveCladesMean: 76.5,
        founderGraceRawNewCladeActivityMeanDeltaVsNullMean: 14.631578947368425,
        encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 11.763157894736835,
        founderGracePersistencePenaltyVsRawDeltaMean: -15.963015647226186,
        encounterRestraintPersistencePenaltyVsRawDeltaMean: -12.649004267425312,
        persistentActivityMeanImprovementVsFounderGrace: -6.1824324324324635
      },
      {
        cladogenesisThreshold: 1.2,
        minSurvivalTicks: 100,
        founderGraceActualActiveCladesMean: 51.75,
        encounterRestraintActualActiveCladesMean: 53.5,
        founderGraceMatchedNullActiveCladesMean: 75.5,
        encounterRestraintMatchedNullActiveCladesMean: 76.5,
        founderGraceRawNewCladeActivityMeanDeltaVsNullMean: 14.631578947368425,
        encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 11.763157894736835,
        founderGracePersistencePenaltyVsRawDeltaMean: -34.88869132290185,
        encounterRestraintPersistencePenaltyVsRawDeltaMean: -20.959815078236147,
        persistentActivityMeanImprovementVsFounderGrace: -16.79729729729729
      }
    ]);

    const result = runCladeActivityRelabelNullNewCladeEncounterRestraintReview({
      generatedAt,
      smokeStudy,
      horizonStudy
    });

    expect(result.generatedAt).toBe(generatedAt);
    expect(result.config).toMatchObject({
      baselineNewCladeEncounterRestraintGraceBoost: 0,
      encounterRestraintNewCladeEncounterRestraintGraceBoost: 2
    });
    expect(result.smokeSummary).toMatchObject({
      activeCladeDeltaImprovementVsBaseline: 1.25,
      persistentActivityMeanImprovementVsBaseline: 1.2142857142857082,
      rawNewCladeActivityMeanImprovementVsBaseline: 3.1875
    });
    expect(result.horizonSummary).toMatchObject({
      comparisonCount: 4,
      meanActiveCladeDeltaImprovementVsFounderGrace: -1.75
    });
    expect(result.horizonSummary.thresholdSummaries).toHaveLength(2);
    expect(result.horizonSummary.thresholdSummaries[0]).toMatchObject({
      cladogenesisThreshold: 1,
      comparisons: 2,
      minSurvivalTicks: [50, 100],
      actualActiveCladeGainVsFounderGrace: 4,
      matchedNullActiveCladeGainVsFounderGrace: 8.25,
      activeCladeDeltaImprovementVsFounderGrace: -4.25,
      rawNewCladeActivityMeanImprovementVsFounderGrace: 6.355263157894726,
      persistentActivityMeanImprovementVsFounderGrace: 12.469594594594554
    });
    expect(result.horizonSummary.thresholdSummaries[0].persistencePenaltyChangeVsFounderGrace).toBeCloseTo(
      -6.114331436699826
    );
    expect(result.horizonSummary.thresholdSummaries[1]).toMatchObject({
      cladogenesisThreshold: 1.2,
      comparisons: 2,
      minSurvivalTicks: [50, 100],
      actualActiveCladeGainVsFounderGrace: 1.75,
      matchedNullActiveCladeGainVsFounderGrace: 1,
      activeCladeDeltaImprovementVsFounderGrace: 0.75,
      rawNewCladeActivityMeanImprovementVsFounderGrace: -2.8684210526315894,
      persistentActivityMeanImprovementVsFounderGrace: -11.489864864864877,
      persistencePenaltyChangeVsFounderGrace: 8.621443812233288
    });
    expect(result.decision).toMatchObject({
      verdict: 'prune',
      canonicalAction: 'retireFromFutureCanonicalStacks',
      smokeActiveCladeDeltaImprovementVsBaseline: 1.25,
      meanHorizonActiveCladeDeltaImprovementVsFounderGrace: -1.75,
      strongestSupportThreshold: 1.2,
      strongestRegressionThreshold: 1
    });
    expect(result.decision.reasons[1]).toContain('Threshold 1');
    expect(result.decision.reasons[2]).toContain('Threshold 1.2 only recovers +0.75');
  });

  it('keeps the axis when every horizon threshold preserves the smoke gain', () => {
    const decision = decideEncounterRestraintReview(
      {
        baselineNewCladeEncounterRestraintGraceBoost: 0,
        encounterRestraintNewCladeEncounterRestraintGraceBoost: 2,
        baselineActiveCladeDeltaVsNullMean: -5,
        encounterRestraintActiveCladeDeltaVsNullMean: -3.5,
        activeCladeDeltaImprovementVsBaseline: 1.5,
        baselinePersistentActivityMeanDeltaVsNullMean: 4,
        encounterRestraintPersistentActivityMeanDeltaVsNullMean: 5,
        persistentActivityMeanImprovementVsBaseline: 1,
        baselineRawNewCladeActivityMeanDeltaVsNullMean: 2,
        encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: 3,
        rawNewCladeActivityMeanImprovementVsBaseline: 1,
        baselinePersistencePenaltyVsRawDeltaMean: -1,
        encounterRestraintPersistencePenaltyVsRawDeltaMean: -0.5,
        persistencePenaltyChangeVsBaseline: 0.5
      },
      {
        comparisonCount: 2,
        meanActiveCladeDeltaImprovementVsFounderGrace: 1,
        meanPersistentActivityMeanImprovementVsFounderGrace: 0.5,
        meanRawNewCladeActivityMeanImprovementVsFounderGrace: 0.75,
        meanPersistencePenaltyChangeVsFounderGrace: 0.25,
        thresholdSummaries: [
          {
            cladogenesisThreshold: 1,
            comparisons: 1,
            minSurvivalTicks: [50],
            actualActiveCladeGainVsFounderGrace: 2,
            matchedNullActiveCladeGainVsFounderGrace: 1,
            activeCladeDeltaImprovementVsFounderGrace: 1,
            rawNewCladeActivityMeanImprovementVsFounderGrace: 1,
            persistentActivityMeanImprovementVsFounderGrace: 0.5,
            persistencePenaltyChangeVsFounderGrace: 0.25
          },
          {
            cladogenesisThreshold: 1.2,
            comparisons: 1,
            minSurvivalTicks: [50],
            actualActiveCladeGainVsFounderGrace: 1.5,
            matchedNullActiveCladeGainVsFounderGrace: 0.5,
            activeCladeDeltaImprovementVsFounderGrace: 1,
            rawNewCladeActivityMeanImprovementVsFounderGrace: 0.5,
            persistentActivityMeanImprovementVsFounderGrace: 0.5,
            persistencePenaltyChangeVsFounderGrace: 0.25
          }
        ]
      }
    );

    expect(decision).toMatchObject({
      verdict: 'keep',
      canonicalAction: 'keepOnFounderGraceSurface',
      strongestSupportThreshold: 1,
      strongestRegressionThreshold: 1,
      meanHorizonActiveCladeDeltaImprovementVsFounderGrace: 1
    });
  });
});

function buildSmokeStudy(input: {
  baselineActiveCladeDeltaVsNullMean: number;
  encounterRestraintActiveCladeDeltaVsNullMean: number;
  baselinePersistentActivityMeanDeltaVsNullMean: number;
  encounterRestraintPersistentActivityMeanDeltaVsNullMean: number;
  baselineRawNewCladeActivityMeanDeltaVsNullMean: number;
  encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: number;
  baselinePersistencePenaltyVsRawDeltaMean: number;
  encounterRestraintPersistencePenaltyVsRawDeltaMean: number;
}): EncounterRestraintSmokeStudyExport {
  return {
    generatedAt: '2026-03-14T00:00:00.000Z',
    question: 'question',
    prediction: 'prediction',
    config: {
      newCladeEncounterRestraintGraceBoostValues: [0, 2]
    },
    results: [
      {
        newCladeEncounterRestraintGraceBoost: 0,
        studyInput: {} as never,
        summary: {
          birthScheduleMatchedAllSeeds: true,
          persistentWindowFractionDeltaVsNullMean: 0,
          persistentActivityMeanDeltaVsNullMean: input.baselinePersistentActivityMeanDeltaVsNullMean,
          diagnostics: {
            finalPopulationMean: 0,
            actualActiveCladesMean: 0,
            matchedNullActiveCladesMean: 0,
            activeCladeDeltaVsNullMean: input.baselineActiveCladeDeltaVsNullMean,
            rawNewCladeActivityMeanDeltaVsNullMean: input.baselineRawNewCladeActivityMeanDeltaVsNullMean,
            persistencePenaltyVsRawDeltaMean: input.baselinePersistencePenaltyVsRawDeltaMean,
            dominantLossMode: 'activeCladeDeficit'
          }
        },
        study: {} as never
      },
      {
        newCladeEncounterRestraintGraceBoost: 2,
        studyInput: {} as never,
        summary: {
          birthScheduleMatchedAllSeeds: true,
          persistentWindowFractionDeltaVsNullMean: 0,
          persistentActivityMeanDeltaVsNullMean: input.encounterRestraintPersistentActivityMeanDeltaVsNullMean,
          diagnostics: {
            finalPopulationMean: 0,
            actualActiveCladesMean: 0,
            matchedNullActiveCladesMean: 0,
            activeCladeDeltaVsNullMean: input.encounterRestraintActiveCladeDeltaVsNullMean,
            rawNewCladeActivityMeanDeltaVsNullMean: input.encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean,
            persistencePenaltyVsRawDeltaMean: input.encounterRestraintPersistencePenaltyVsRawDeltaMean,
            dominantLossMode: 'activeCladeDeficit'
          }
        },
        study: {} as never
      }
    ]
  };
}

function buildHorizonStudy(
  rows: Array<{
    cladogenesisThreshold: number;
    minSurvivalTicks: number;
    founderGraceActualActiveCladesMean: number;
    encounterRestraintActualActiveCladesMean: number;
    founderGraceMatchedNullActiveCladesMean: number;
    encounterRestraintMatchedNullActiveCladesMean: number;
    founderGraceRawNewCladeActivityMeanDeltaVsNullMean: number;
    encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: number;
    founderGracePersistencePenaltyVsRawDeltaMean: number;
    encounterRestraintPersistencePenaltyVsRawDeltaMean: number;
    persistentActivityMeanImprovementVsFounderGrace: number;
  }>
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  return {
    generatedAt: '2026-03-14T00:00:00.000Z',
    question: 'question',
    prediction: 'prediction',
    config: {
      baselineArtifact: 'baseline.json',
      staticHabitatBaselineArtifact: 'static.json',
      steps: 4000,
      windowSize: 100,
      burnIn: 200,
      seeds: [1],
      stopWhenExtinct: true,
      minSurvivalTicks: [50, 100],
      cladogenesisThresholds: [1, 1.2],
      cladeHabitatCoupling: 0.75,
      adaptiveCladeHabitatMemoryRate: 0,
      newCladeSettlementCrowdingGraceTicks: 36,
      baselineNewCladeEncounterRestraintGraceBoost:
        HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      encounterRestraintNewCladeEncounterRestraintGraceBoost:
        HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      founderGraceSimulationConfig: {},
      encounterRestraintSimulationConfig: {}
    },
    comparison: rows.map((row) => ({
      cladogenesisThreshold: row.cladogenesisThreshold,
      minSurvivalTicks: row.minSurvivalTicks,
      founderGraceBirthScheduleMatchedAllSeeds: true,
      encounterRestraintBirthScheduleMatchedAllSeeds: true,
      founderGracePersistentWindowFractionDeltaVsNullMean: 0,
      encounterRestraintPersistentWindowFractionDeltaVsNullMean: 0,
      persistentWindowFractionDeltaImprovementVsFounderGrace: 0,
      founderGracePersistentActivityMeanDeltaVsNullMean: 0,
      encounterRestraintPersistentActivityMeanDeltaVsNullMean:
        row.persistentActivityMeanImprovementVsFounderGrace,
      persistentActivityMeanImprovementVsFounderGrace:
        row.persistentActivityMeanImprovementVsFounderGrace,
      founderGraceActiveCladeDeltaVsNullMean:
        row.founderGraceActualActiveCladesMean - row.founderGraceMatchedNullActiveCladesMean,
      encounterRestraintActiveCladeDeltaVsNullMean:
        row.encounterRestraintActualActiveCladesMean - row.encounterRestraintMatchedNullActiveCladesMean,
      activeCladeDeltaImprovementVsFounderGrace:
        row.encounterRestraintActualActiveCladesMean -
        row.encounterRestraintMatchedNullActiveCladesMean -
        (row.founderGraceActualActiveCladesMean - row.founderGraceMatchedNullActiveCladesMean),
      founderGraceDiagnostics: {
        finalPopulationMean: 0,
        actualActiveCladesMean: row.founderGraceActualActiveCladesMean,
        matchedNullActiveCladesMean: row.founderGraceMatchedNullActiveCladesMean,
        activeCladeDeltaVsNullMean:
          row.founderGraceActualActiveCladesMean - row.founderGraceMatchedNullActiveCladesMean,
        rawNewCladeActivityMeanDeltaVsNullMean: row.founderGraceRawNewCladeActivityMeanDeltaVsNullMean,
        persistencePenaltyVsRawDeltaMean: row.founderGracePersistencePenaltyVsRawDeltaMean,
        dominantLossMode: 'activeCladeDeficit'
      },
      encounterRestraintDiagnostics: {
        finalPopulationMean: 0,
        actualActiveCladesMean: row.encounterRestraintActualActiveCladesMean,
        matchedNullActiveCladesMean: row.encounterRestraintMatchedNullActiveCladesMean,
        activeCladeDeltaVsNullMean:
          row.encounterRestraintActualActiveCladesMean - row.encounterRestraintMatchedNullActiveCladesMean,
        rawNewCladeActivityMeanDeltaVsNullMean:
          row.encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean,
        persistencePenaltyVsRawDeltaMean: row.encounterRestraintPersistencePenaltyVsRawDeltaMean,
        dominantLossMode: 'activeCladeDeficit'
      }
    })),
    encounterRestraintStudy: {} as never
  };
}
