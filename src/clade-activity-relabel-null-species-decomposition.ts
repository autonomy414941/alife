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
  nonSpeciesConditionedNull: {
    nullModel: 'permutedActualCladeProfiles';
    founderGraceNullActiveCladesMean: number;
    ecologyGateNullActiveCladesMean: number;
    founderGraceActiveCladeDeltaVsNullMean: number;
    ecologyGateActiveCladeDeltaVsNullMean: number;
    activeCladeDeltaGainVsFounderGrace: number;
    founderGraceNullPersistentWindowFractionMean: number;
    ecologyGateNullPersistentWindowFractionMean: number;
    founderGracePersistentWindowFractionDeltaVsNullMean: number;
    ecologyGatePersistentWindowFractionDeltaVsNullMean: number;
    persistentWindowFractionDeltaGainVsFounderGrace: number;
    founderGraceNullPersistentActivityMean: number;
    ecologyGateNullPersistentActivityMean: number;
    founderGracePersistentActivityMeanDeltaVsNullMean: number;
    ecologyGatePersistentActivityMeanDeltaVsNullMean: number;
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
      const founderGraceNonSpeciesConditionedNull = summarizeNonSpeciesConditionedNull(
        baselineThresholdResult.seedResults,
        threshold
      );
      const ecologyGateNonSpeciesConditionedNull = summarizeNonSpeciesConditionedNull(
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
        },
        nonSpeciesConditionedNull: {
          nullModel: 'permutedActualCladeProfiles',
          founderGraceNullActiveCladesMean: founderGraceNonSpeciesConditionedNull.activeCladesMean,
          ecologyGateNullActiveCladesMean: ecologyGateNonSpeciesConditionedNull.activeCladesMean,
          founderGraceActiveCladeDeltaVsNullMean:
            founderGraceNonSpeciesConditionedNull.activeCladeDeltaVsNullMean,
          ecologyGateActiveCladeDeltaVsNullMean:
            ecologyGateNonSpeciesConditionedNull.activeCladeDeltaVsNullMean,
          activeCladeDeltaGainVsFounderGrace:
            ecologyGateNonSpeciesConditionedNull.activeCladeDeltaVsNullMean -
            founderGraceNonSpeciesConditionedNull.activeCladeDeltaVsNullMean,
          founderGraceNullPersistentWindowFractionMean:
            founderGraceNonSpeciesConditionedNull.persistentWindowFractionMean,
          ecologyGateNullPersistentWindowFractionMean:
            ecologyGateNonSpeciesConditionedNull.persistentWindowFractionMean,
          founderGracePersistentWindowFractionDeltaVsNullMean:
            founderGraceNonSpeciesConditionedNull.persistentWindowFractionDeltaVsNullMean,
          ecologyGatePersistentWindowFractionDeltaVsNullMean:
            ecologyGateNonSpeciesConditionedNull.persistentWindowFractionDeltaVsNullMean,
          persistentWindowFractionDeltaGainVsFounderGrace:
            ecologyGateNonSpeciesConditionedNull.persistentWindowFractionDeltaVsNullMean -
            founderGraceNonSpeciesConditionedNull.persistentWindowFractionDeltaVsNullMean,
          founderGraceNullPersistentActivityMean:
            founderGraceNonSpeciesConditionedNull.persistentActivityMean,
          ecologyGateNullPersistentActivityMean:
            ecologyGateNonSpeciesConditionedNull.persistentActivityMean,
          founderGracePersistentActivityMeanDeltaVsNullMean:
            founderGraceNonSpeciesConditionedNull.persistentActivityMeanDeltaVsNullMean,
          ecologyGatePersistentActivityMeanDeltaVsNullMean:
            ecologyGateNonSpeciesConditionedNull.persistentActivityMeanDeltaVsNullMean,
          persistentActivityMeanDeltaGainVsFounderGrace:
            ecologyGateNonSpeciesConditionedNull.persistentActivityMeanDeltaVsNullMean -
            founderGraceNonSpeciesConditionedNull.persistentActivityMeanDeltaVsNullMean
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

export function supportsRelabelNullNonSpeciesConditionedNull(
  study: CladeActivityRelabelNullStudyExport
): boolean {
  return study.thresholdResults.every((thresholdResult) =>
    thresholdResult.seedResults.every(
      (seedResult) =>
        'nonSpeciesConditionedNullRawSummary' in seedResult &&
        seedResult.nonSpeciesConditionedNullRawSummary !== undefined &&
        'nonSpeciesConditionedNullFinalActiveClades' in seedResult &&
        typeof seedResult.nonSpeciesConditionedNullFinalActiveClades === 'number' &&
        'nonSpeciesConditionedNullThresholds' in seedResult &&
        Array.isArray(seedResult.nonSpeciesConditionedNullThresholds)
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

function summarizeNonSpeciesConditionedNull(
  seedResults: CladeActivityRelabelNullSeedResult[],
  minSurvivalTicks: number
) {
  return {
    activeCladesMean: mean(
      seedResults.map((seedResult) => requireNonSpeciesConditionedNullActiveClades(seedResult))
    ),
    activeCladeDeltaVsNullMean: mean(
      seedResults.map(
        (seedResult) =>
          seedResult.finalSummary.activeClades - requireNonSpeciesConditionedNullActiveClades(seedResult)
      )
    ),
    persistentWindowFractionMean: mean(
      seedResults.map(
        (seedResult) =>
          requireNonSpeciesConditionedNullThreshold(seedResult, minSurvivalTicks).persistentWindowFraction
      )
    ),
    persistentWindowFractionDeltaVsNullMean: mean(
      seedResults.map((seedResult) => {
        const actualThreshold = findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds);
        const nonSpeciesConditionedNullThreshold = requireNonSpeciesConditionedNullThreshold(
          seedResult,
          minSurvivalTicks
        );

        return (
          actualThreshold.actual.persistentWindowFraction -
          nonSpeciesConditionedNullThreshold.persistentWindowFraction
        );
      })
    ),
    persistentActivityMean: mean(
      seedResults.map(
        (seedResult) =>
          requireNonSpeciesConditionedNullThreshold(seedResult, minSurvivalTicks).summary
            .postBurnInPersistentNewActivityMean
      )
    ),
    persistentActivityMeanDeltaVsNullMean: mean(
      seedResults.map((seedResult) => {
        const actualThreshold = findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds);
        const nonSpeciesConditionedNullThreshold = requireNonSpeciesConditionedNullThreshold(
          seedResult,
          minSurvivalTicks
        );

        return (
          actualThreshold.actual.summary.postBurnInPersistentNewActivityMean -
          nonSpeciesConditionedNullThreshold.summary.postBurnInPersistentNewActivityMean
        );
      })
    )
  };
}

function requireNonSpeciesConditionedNullActiveClades(seedResult: CladeActivityRelabelNullSeedResult): number {
  if (typeof seedResult.nonSpeciesConditionedNullFinalActiveClades !== 'number') {
    throw new Error(`Seed ${seedResult.seed} is missing non-species-conditioned null active clade counts`);
  }

  return seedResult.nonSpeciesConditionedNullFinalActiveClades;
}

function requireNonSpeciesConditionedNullThreshold(
  seedResult: CladeActivityRelabelNullSeedResult,
  minSurvivalTicks: number
) {
  if (!seedResult.nonSpeciesConditionedNullThresholds) {
    throw new Error(`Seed ${seedResult.seed} is missing non-species-conditioned null thresholds`);
  }

  return findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.nonSpeciesConditionedNullThresholds);
}

function divideOrZero(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}
