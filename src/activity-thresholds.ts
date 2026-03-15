import { CladeSpeciesActivityCouplingRatioAggregate, NumericAggregate } from './types';

export interface ActivityThresholdSummaryLike {
  evaluablePostBurnInWindows: number;
  postBurnInWindowsWithPersistentNewActivity: number;
  postBurnInPersistentNewActivityMean: number;
  postBurnInPersistentNewAbundanceWeightedActivityMean: number;
}

export interface ActivityThresholdLike<TSummary extends ActivityThresholdSummaryLike> {
  minSurvivalTicks: number;
  summary: TSummary;
}

export interface ActivitySeedThresholdLike<TSummary extends ActivityThresholdSummaryLike>
  extends ActivityThresholdLike<TSummary> {
  persistentWindowFraction: number;
  allEvaluableWindowsPositive: boolean;
}

export interface ActivitySeedResultLike<
  TSummary extends ActivityThresholdSummaryLike,
  TThreshold extends ActivitySeedThresholdLike<TSummary>
> {
  seed: number;
  thresholds: TThreshold[];
}

export function buildActivitySeedPanelThresholdSeedResult<TSummary extends ActivityThresholdSummaryLike>(
  threshold: ActivityThresholdLike<TSummary>
): ActivitySeedThresholdLike<TSummary> {
  const evaluableWindows = threshold.summary.evaluablePostBurnInWindows;

  return {
    minSurvivalTicks: threshold.minSurvivalTicks,
    summary: threshold.summary,
    persistentWindowFraction:
      evaluableWindows === 0 ? 0 : threshold.summary.postBurnInWindowsWithPersistentNewActivity / evaluableWindows,
    allEvaluableWindowsPositive:
      evaluableWindows > 0 &&
      threshold.summary.postBurnInWindowsWithPersistentNewActivity === threshold.summary.evaluablePostBurnInWindows
  };
}

export function buildActivitySeedPanelThresholdAggregate<
  TSummary extends ActivityThresholdSummaryLike,
  TThreshold extends ActivitySeedThresholdLike<TSummary>,
  TSeedResult extends ActivitySeedResultLike<TSummary, TThreshold>
>(minSurvivalTicks: number, seedResults: TSeedResult[]): {
  minSurvivalTicks: number;
  seeds: number;
  seedsWithEvaluableWindows: number;
  seedsWithAllEvaluableWindowsPositive: number;
  minPersistentWindowFraction: number;
  meanPersistentWindowFraction: number;
  maxPersistentWindowFraction: number;
  minPersistentActivityMean: number;
  meanPersistentActivityMean: number;
  maxPersistentActivityMean: number;
  minPersistentAbundanceWeightedActivityMean: number;
  meanPersistentAbundanceWeightedActivityMean: number;
  maxPersistentAbundanceWeightedActivityMean: number;
} {
  const thresholdResults = seedResults.map((seedResult) =>
    findThresholdResult(seedResult.seed, minSurvivalTicks, seedResult.thresholds)
  );
  const persistentWindowFractions = thresholdResults.map((threshold) => threshold.persistentWindowFraction);
  const persistentActivityMeans = thresholdResults.map(
    (threshold) => threshold.summary.postBurnInPersistentNewActivityMean
  );
  const persistentAbundanceWeightedActivityMeans = thresholdResults.map(
    (threshold) => threshold.summary.postBurnInPersistentNewAbundanceWeightedActivityMean
  );

  return {
    minSurvivalTicks,
    seeds: thresholdResults.length,
    seedsWithEvaluableWindows: thresholdResults.filter((threshold) => threshold.summary.evaluablePostBurnInWindows > 0)
      .length,
    seedsWithAllEvaluableWindowsPositive: thresholdResults.filter((threshold) => threshold.allEvaluableWindowsPositive)
      .length,
    minPersistentWindowFraction: min(persistentWindowFractions),
    meanPersistentWindowFraction: mean(persistentWindowFractions),
    maxPersistentWindowFraction: max(persistentWindowFractions),
    minPersistentActivityMean: min(persistentActivityMeans),
    meanPersistentActivityMean: mean(persistentActivityMeans),
    maxPersistentActivityMean: max(persistentActivityMeans),
    minPersistentAbundanceWeightedActivityMean: min(persistentAbundanceWeightedActivityMeans),
    meanPersistentAbundanceWeightedActivityMean: mean(persistentAbundanceWeightedActivityMeans),
    maxPersistentAbundanceWeightedActivityMean: max(persistentAbundanceWeightedActivityMeans)
  };
}

export function findThresholdResult<TThreshold extends { minSurvivalTicks: number }>(
  seed: number,
  minSurvivalTicks: number,
  thresholds: TThreshold[]
): TThreshold {
  const threshold = thresholds.find((result) => result.minSurvivalTicks === minSurvivalTicks);
  if (!threshold) {
    throw new Error(`Missing threshold ${minSurvivalTicks} for seed ${seed}`);
  }
  return threshold;
}

export function buildNumericAggregate(values: number[]): NumericAggregate {
  return {
    mean: mean(values),
    min: min(values),
    max: max(values)
  };
}

export function buildNullableNumericAggregate(values: number[]): CladeSpeciesActivityCouplingRatioAggregate {
  if (values.length === 0) {
    return {
      definedSeeds: 0,
      mean: null,
      min: null,
      max: null
    };
  }

  return {
    definedSeeds: values.length,
    mean: mean(values),
    min: min(values),
    max: max(values)
  };
}

export function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function min(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((lowest, value) => Math.min(lowest, value), values[0]);
}

export function max(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((highest, value) => Math.max(highest, value), values[0]);
}

export function divideOrNull(numerator: number, denominator: number): number | null {
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}
