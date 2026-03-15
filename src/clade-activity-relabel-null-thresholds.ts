import {
  buildActivitySeedPanelThresholdAggregate,
  buildNullableNumericAggregate,
  buildNumericAggregate,
  divideOrNull,
  findThresholdResult,
  mean
} from './activity-thresholds';
import {
  CladeActivityProbeSummary,
  CladeActivityRelabelNullAggregateDiagnostics,
  CladeActivityRelabelNullLossMode,
  CladeActivityRelabelNullSeedDiagnostics,
  CladeActivityRelabelNullSeedResult,
  CladeActivityRelabelNullThresholdAggregate,
  CladeActivityRelabelNullThresholdSeedResult,
  CladeActivitySeedPanelThresholdSeedResult
} from './types';

export function buildCladeActivityRelabelNullThresholdSeedResult(input: {
  minSurvivalTicks: number;
  actual: CladeActivitySeedPanelThresholdSeedResult;
  matchedNull: CladeActivitySeedPanelThresholdSeedResult;
  finalPopulation: number;
  actualActiveClades: number;
  matchedNullActiveClades: number;
  actualRawSummary: CladeActivityProbeSummary;
  matchedNullRawSummary: CladeActivityProbeSummary;
}): CladeActivityRelabelNullThresholdSeedResult {
  const rawNewCladeActivityMeanDeltaVsNull =
    input.actualRawSummary.postBurnInNewActivityMean - input.matchedNullRawSummary.postBurnInNewActivityMean;
  const persistentActivityMeanDeltaVsNull =
    input.actual.summary.postBurnInPersistentNewActivityMean -
    input.matchedNull.summary.postBurnInPersistentNewActivityMean;
  const diagnostics = buildCladeActivityRelabelNullSeedDiagnostics({
    finalPopulation: input.finalPopulation,
    actualActiveClades: input.actualActiveClades,
    matchedNullActiveClades: input.matchedNullActiveClades,
    actualRawNewCladeActivityMean: input.actualRawSummary.postBurnInNewActivityMean,
    matchedNullRawNewCladeActivityMean: input.matchedNullRawSummary.postBurnInNewActivityMean,
    actualPersistentActivityMean: input.actual.summary.postBurnInPersistentNewActivityMean,
    matchedNullPersistentActivityMean: input.matchedNull.summary.postBurnInPersistentNewActivityMean
  });

  return {
    minSurvivalTicks: input.minSurvivalTicks,
    actual: input.actual,
    matchedNull: input.matchedNull,
    actualToNullPersistentWindowFractionRatio: divideOrNull(
      input.actual.persistentWindowFraction,
      input.matchedNull.persistentWindowFraction
    ),
    persistentWindowFractionDeltaVsNull:
      input.actual.persistentWindowFraction - input.matchedNull.persistentWindowFraction,
    actualToNullPersistentActivityMeanRatio: divideOrNull(
      input.actual.summary.postBurnInPersistentNewActivityMean,
      input.matchedNull.summary.postBurnInPersistentNewActivityMean
    ),
    persistentActivityMeanDeltaVsNull,
    actualToNullPersistentAbundanceWeightedActivityMeanRatio: divideOrNull(
      input.actual.summary.postBurnInPersistentNewAbundanceWeightedActivityMean,
      input.matchedNull.summary.postBurnInPersistentNewAbundanceWeightedActivityMean
    ),
    persistentAbundanceWeightedActivityMeanDeltaVsNull:
      input.actual.summary.postBurnInPersistentNewAbundanceWeightedActivityMean -
      input.matchedNull.summary.postBurnInPersistentNewAbundanceWeightedActivityMean,
    diagnostics: {
      ...diagnostics,
      rawNewCladeActivityMeanDeltaVsNull,
      persistentActivityMeanDeltaVsNull
    }
  };
}

export function buildCladeActivityRelabelNullThresholdAggregate(
  minSurvivalTicks: number,
  seedResults: CladeActivityRelabelNullSeedResult[]
): CladeActivityRelabelNullThresholdAggregate {
  const thresholdResults = seedResults.map((seedResult) =>
    findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds)
  );
  const actualSeedResults = seedResults.map((seedResult) => ({
    seed: seedResult.seed,
    thresholds: seedResult.thresholds.map((threshold) => threshold.actual)
  }));
  const matchedNullSeedResults = seedResults.map((seedResult) => ({
    seed: seedResult.seed,
    thresholds: seedResult.thresholds.map((threshold) => threshold.matchedNull)
  }));

  return {
    minSurvivalTicks,
    actual: buildActivitySeedPanelThresholdAggregate(minSurvivalTicks, actualSeedResults),
    matchedNull: buildActivitySeedPanelThresholdAggregate(minSurvivalTicks, matchedNullSeedResults),
    actualToNullPersistentWindowFractionRatio: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.actualToNullPersistentWindowFractionRatio === null
          ? []
          : [threshold.actualToNullPersistentWindowFractionRatio]
      )
    ),
    persistentWindowFractionDeltaVsNull: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentWindowFractionDeltaVsNull)
    ),
    actualToNullPersistentActivityMeanRatio: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.actualToNullPersistentActivityMeanRatio === null
          ? []
          : [threshold.actualToNullPersistentActivityMeanRatio]
      )
    ),
    persistentActivityMeanDeltaVsNull: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentActivityMeanDeltaVsNull)
    ),
    actualToNullPersistentAbundanceWeightedActivityMeanRatio: buildNullableNumericAggregate(
      thresholdResults.flatMap((threshold) =>
        threshold.actualToNullPersistentAbundanceWeightedActivityMeanRatio === null
          ? []
          : [threshold.actualToNullPersistentAbundanceWeightedActivityMeanRatio]
      )
    ),
    persistentAbundanceWeightedActivityMeanDeltaVsNull: buildNumericAggregate(
      thresholdResults.map((threshold) => threshold.persistentAbundanceWeightedActivityMeanDeltaVsNull)
    ),
    diagnostics: buildCladeActivityRelabelNullThresholdAggregateDiagnostics(thresholdResults)
  };
}

export function buildCladeActivityRelabelNullSeedDiagnostics(input: {
  finalPopulation: number;
  actualActiveClades: number;
  matchedNullActiveClades: number;
  actualRawNewCladeActivityMean: number;
  matchedNullRawNewCladeActivityMean: number;
  actualPersistentActivityMean: number;
  matchedNullPersistentActivityMean: number;
}): Omit<
  CladeActivityRelabelNullSeedDiagnostics,
  'rawNewCladeActivityMeanDeltaVsNull' | 'persistentActivityMeanDeltaVsNull'
> {
  const activeCladeDeltaVsNull = input.actualActiveClades - input.matchedNullActiveClades;
  const rawNewCladeActivityMeanDeltaVsNull =
    input.actualRawNewCladeActivityMean - input.matchedNullRawNewCladeActivityMean;
  const persistentActivityMeanDeltaVsNull =
    input.actualPersistentActivityMean - input.matchedNullPersistentActivityMean;
  const persistencePenaltyVsRawDelta = rawNewCladeActivityMeanDeltaVsNull - persistentActivityMeanDeltaVsNull;

  return {
    finalPopulation: input.finalPopulation,
    actualActiveClades: input.actualActiveClades,
    matchedNullActiveClades: input.matchedNullActiveClades,
    activeCladeDeltaVsNull,
    actualRawNewCladeActivityMean: input.actualRawNewCladeActivityMean,
    matchedNullRawNewCladeActivityMean: input.matchedNullRawNewCladeActivityMean,
    actualPersistentActivityMean: input.actualPersistentActivityMean,
    matchedNullPersistentActivityMean: input.matchedNullPersistentActivityMean,
    persistencePenaltyVsRawDelta,
    dominantLossMode: inferCladeActivityRelabelNullLossMode({
      activeCladeDeltaVsNull,
      rawNewCladeActivityMeanDeltaVsNull,
      persistencePenaltyVsRawDelta
    })
  };
}

export function buildCladeActivityRelabelNullThresholdAggregateDiagnostics(
  thresholdResults: CladeActivityRelabelNullThresholdSeedResult[]
): CladeActivityRelabelNullAggregateDiagnostics {
  const diagnostics = thresholdResults.map((threshold) => threshold.diagnostics);

  return {
    finalPopulation: buildNumericAggregate(diagnostics.map((diagnostic) => diagnostic.finalPopulation)),
    actualActiveClades: buildNumericAggregate(diagnostics.map((diagnostic) => diagnostic.actualActiveClades)),
    matchedNullActiveClades: buildNumericAggregate(diagnostics.map((diagnostic) => diagnostic.matchedNullActiveClades)),
    activeCladeDeltaVsNull: buildNumericAggregate(diagnostics.map((diagnostic) => diagnostic.activeCladeDeltaVsNull)),
    actualRawNewCladeActivityMean: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.actualRawNewCladeActivityMean)
    ),
    matchedNullRawNewCladeActivityMean: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.matchedNullRawNewCladeActivityMean)
    ),
    rawNewCladeActivityMeanDeltaVsNull: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.rawNewCladeActivityMeanDeltaVsNull)
    ),
    actualPersistentActivityMean: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.actualPersistentActivityMean)
    ),
    matchedNullPersistentActivityMean: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.matchedNullPersistentActivityMean)
    ),
    persistentActivityMeanDeltaVsNull: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.persistentActivityMeanDeltaVsNull)
    ),
    persistencePenaltyVsRawDelta: buildNumericAggregate(
      diagnostics.map((diagnostic) => diagnostic.persistencePenaltyVsRawDelta)
    ),
    dominantLossMode: inferCladeActivityRelabelNullLossMode({
      activeCladeDeltaVsNull: mean(diagnostics.map((diagnostic) => diagnostic.activeCladeDeltaVsNull)),
      rawNewCladeActivityMeanDeltaVsNull: mean(
        diagnostics.map((diagnostic) => diagnostic.rawNewCladeActivityMeanDeltaVsNull)
      ),
      persistencePenaltyVsRawDelta: mean(diagnostics.map((diagnostic) => diagnostic.persistencePenaltyVsRawDelta))
    })
  };
}

export function inferCladeActivityRelabelNullLossMode(input: {
  activeCladeDeltaVsNull: number;
  rawNewCladeActivityMeanDeltaVsNull: number;
  persistencePenaltyVsRawDelta: number;
}): CladeActivityRelabelNullLossMode {
  const founderSuppression = Math.max(0, -input.rawNewCladeActivityMeanDeltaVsNull);
  const persistenceFailure = Math.max(0, input.persistencePenaltyVsRawDelta);
  const activeCladeDeficit = Math.max(0, -input.activeCladeDeltaVsNull);
  const largestDeficit = Math.max(founderSuppression, persistenceFailure, activeCladeDeficit);

  if (largestDeficit === 0) {
    return 'matchedOrBetter';
  }
  if (activeCladeDeficit === largestDeficit) {
    return 'activeCladeDeficit';
  }
  if (persistenceFailure === largestDeficit) {
    return 'persistenceFailure';
  }
  return 'founderSuppression';
}
