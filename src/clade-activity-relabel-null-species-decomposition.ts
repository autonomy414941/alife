import { findThresholdResult, mean } from './activity-thresholds';
import {
  CladeActivityRelabelNullSeedResult,
  CladeActivityRelabelNullStudyExport
} from './types';

export interface CladeActivityRelabelNullSpeciesDecompositionComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  upstreamSpeciesGeneration: {
    founderGraceActiveSpeciesMean: number;
    ecologyGateActiveSpeciesMean: number;
    activeSpeciesGainVsFounderGrace: number;
    founderGracePersistentWindowFractionMean: number;
    ecologyGatePersistentWindowFractionMean: number;
    persistentWindowFractionGainVsFounderGrace: number;
    founderGracePersistentActivityMean: number;
    ecologyGatePersistentActivityMean: number;
    persistentActivityMeanGainVsFounderGrace: number;
  };
  downstreamCladeStructuring: {
    founderGraceActiveCladeToSpeciesRatioMean: number;
    ecologyGateActiveCladeToSpeciesRatioMean: number;
    activeCladeToSpeciesRatioGainVsFounderGrace: number;
    founderGracePersistentWindowFractionDeltaVsSpeciesMean: number;
    ecologyGatePersistentWindowFractionDeltaVsSpeciesMean: number;
    persistentWindowFractionDeltaGainVsFounderGrace: number;
    founderGracePersistentActivityMeanDeltaVsSpeciesMean: number;
    ecologyGatePersistentActivityMeanDeltaVsSpeciesMean: number;
    persistentActivityMeanDeltaGainVsFounderGrace: number;
  };
}

export function compareCladeActivityRelabelNullSpeciesDecomposition(
  currentStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullSpeciesDecompositionComparison[] {
  return currentStudy.thresholdResults.flatMap((currentThresholdResult) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (candidate) => candidate.cladogenesisThreshold === currentThresholdResult.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${currentThresholdResult.cladogenesisThreshold}`
      );
    }

    const minSurvivalTicks = [
      ...new Set(currentThresholdResult.aggregates.map((aggregate) => aggregate.minSurvivalTicks))
    ];

    return minSurvivalTicks.map((threshold) => {
      const founderGraceUpstream = summarizeUpstreamSpeciesGeneration(
        baselineThresholdResult.seedResults,
        threshold
      );
      const ecologyGateUpstream = summarizeUpstreamSpeciesGeneration(
        currentThresholdResult.seedResults,
        threshold
      );
      const founderGraceDownstream = summarizeDownstreamCladeStructuring(
        baselineThresholdResult.seedResults,
        threshold
      );
      const ecologyGateDownstream = summarizeDownstreamCladeStructuring(
        currentThresholdResult.seedResults,
        threshold
      );

      return {
        cladogenesisThreshold: currentThresholdResult.cladogenesisThreshold,
        minSurvivalTicks: threshold,
        upstreamSpeciesGeneration: {
          founderGraceActiveSpeciesMean: founderGraceUpstream.activeSpeciesMean,
          ecologyGateActiveSpeciesMean: ecologyGateUpstream.activeSpeciesMean,
          activeSpeciesGainVsFounderGrace:
            ecologyGateUpstream.activeSpeciesMean - founderGraceUpstream.activeSpeciesMean,
          founderGracePersistentWindowFractionMean: founderGraceUpstream.persistentWindowFractionMean,
          ecologyGatePersistentWindowFractionMean: ecologyGateUpstream.persistentWindowFractionMean,
          persistentWindowFractionGainVsFounderGrace:
            ecologyGateUpstream.persistentWindowFractionMean -
            founderGraceUpstream.persistentWindowFractionMean,
          founderGracePersistentActivityMean: founderGraceUpstream.persistentActivityMean,
          ecologyGatePersistentActivityMean: ecologyGateUpstream.persistentActivityMean,
          persistentActivityMeanGainVsFounderGrace:
            ecologyGateUpstream.persistentActivityMean - founderGraceUpstream.persistentActivityMean
        },
        downstreamCladeStructuring: {
          founderGraceActiveCladeToSpeciesRatioMean: founderGraceDownstream.activeCladeToSpeciesRatioMean,
          ecologyGateActiveCladeToSpeciesRatioMean: ecologyGateDownstream.activeCladeToSpeciesRatioMean,
          activeCladeToSpeciesRatioGainVsFounderGrace:
            ecologyGateDownstream.activeCladeToSpeciesRatioMean -
            founderGraceDownstream.activeCladeToSpeciesRatioMean,
          founderGracePersistentWindowFractionDeltaVsSpeciesMean:
            founderGraceDownstream.persistentWindowFractionDeltaVsSpeciesMean,
          ecologyGatePersistentWindowFractionDeltaVsSpeciesMean:
            ecologyGateDownstream.persistentWindowFractionDeltaVsSpeciesMean,
          persistentWindowFractionDeltaGainVsFounderGrace:
            ecologyGateDownstream.persistentWindowFractionDeltaVsSpeciesMean -
            founderGraceDownstream.persistentWindowFractionDeltaVsSpeciesMean,
          founderGracePersistentActivityMeanDeltaVsSpeciesMean:
            founderGraceDownstream.persistentActivityMeanDeltaVsSpeciesMean,
          ecologyGatePersistentActivityMeanDeltaVsSpeciesMean:
            ecologyGateDownstream.persistentActivityMeanDeltaVsSpeciesMean,
          persistentActivityMeanDeltaGainVsFounderGrace:
            ecologyGateDownstream.persistentActivityMeanDeltaVsSpeciesMean -
            founderGraceDownstream.persistentActivityMeanDeltaVsSpeciesMean
        }
      };
    });
  });
}

export function supportsRelabelNullSpeciesDecomposition(
  study: CladeActivityRelabelNullStudyExport
): boolean {
  return study.thresholdResults.every((thresholdResult) =>
    thresholdResult.seedResults.every(
      (seedResult) =>
        'actualSpeciesRawSummary' in seedResult &&
        seedResult.actualSpeciesRawSummary !== undefined &&
        'actualSpeciesThresholds' in seedResult &&
        Array.isArray(seedResult.actualSpeciesThresholds)
    )
  );
}

function summarizeUpstreamSpeciesGeneration(
  seedResults: CladeActivityRelabelNullSeedResult[],
  minSurvivalTicks: number
) {
  return {
    activeSpeciesMean: mean(seedResults.map((seedResult) => seedResult.finalSummary.activeSpecies)),
    persistentWindowFractionMean: mean(
      seedResults.map(
        (seedResult) =>
          findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.actualSpeciesThresholds)
            .persistentWindowFraction
      )
    ),
    persistentActivityMean: mean(
      seedResults.map(
        (seedResult) =>
          findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.actualSpeciesThresholds).summary
            .postBurnInPersistentNewActivityMean
      )
    )
  };
}

function summarizeDownstreamCladeStructuring(
  seedResults: CladeActivityRelabelNullSeedResult[],
  minSurvivalTicks: number
) {
  return {
    activeCladeToSpeciesRatioMean: mean(
      seedResults.map((seedResult) =>
        divideOrZero(seedResult.finalSummary.activeClades, seedResult.finalSummary.activeSpecies)
      )
    ),
    persistentWindowFractionDeltaVsSpeciesMean: mean(
      seedResults.map((seedResult) => {
        const actualThreshold = findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds);
        const speciesThreshold = findThresholdResult(
          seedResult.seed,
          minSurvivalTicks,
          seedResult.actualSpeciesThresholds
        );

        return actualThreshold.actual.persistentWindowFraction - speciesThreshold.persistentWindowFraction;
      })
    ),
    persistentActivityMeanDeltaVsSpeciesMean: mean(
      seedResults.map((seedResult) => {
        const actualThreshold = findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds);
        const speciesThreshold = findThresholdResult(
          seedResult.seed,
          minSurvivalTicks,
          seedResult.actualSpeciesThresholds
        );

        return (
          actualThreshold.actual.summary.postBurnInPersistentNewActivityMean -
          speciesThreshold.summary.postBurnInPersistentNewActivityMean
        );
      })
    )
  };
}

function divideOrZero(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
