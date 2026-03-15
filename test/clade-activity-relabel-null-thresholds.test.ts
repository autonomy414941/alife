import { describe, expect, it } from 'vitest';
import { buildActivitySeedPanelThresholdSeedResult } from '../src/activity-thresholds';
import {
  buildCladeActivityRelabelNullThresholdAggregate,
  buildCladeActivityRelabelNullThresholdSeedResult,
  inferCladeActivityRelabelNullLossMode
} from '../src/clade-activity-relabel-null-thresholds';
import {
  CladeActivityPersistenceSummary,
  CladeActivityProbeSummary,
  CladeActivityRelabelNullSeedResult,
  StepSummary
} from '../src/types';

function createPersistenceSummary(
  meanPersistentActivity: number,
  windowsWithPersistentActivity: number,
  meanPersistentAbundanceWeightedActivity = meanPersistentActivity,
  evaluableWindows = 4
): CladeActivityPersistenceSummary {
  return {
    minSurvivalTicks: 50,
    postBurnInWindows: evaluableWindows,
    censoredPostBurnInWindows: 0,
    evaluablePostBurnInWindows: evaluableWindows,
    postBurnInWindowsWithPersistentNewActivity: windowsWithPersistentActivity,
    postBurnInPersistentNewClades: windowsWithPersistentActivity,
    postBurnInPersistentNewActivityMean: meanPersistentActivity,
    postBurnInPersistentNewActivityMin: meanPersistentActivity,
    postBurnInPersistentNewActivityMax: meanPersistentActivity,
    postBurnInPersistentNewAbundanceWeightedActivityMean: meanPersistentAbundanceWeightedActivity,
    postBurnInPersistentNewAbundanceWeightedActivityMin: meanPersistentAbundanceWeightedActivity,
    postBurnInPersistentNewAbundanceWeightedActivityMax: meanPersistentAbundanceWeightedActivity,
    finalPersistentNewActivity: meanPersistentActivity,
    finalPersistentNewAbundanceWeightedActivity: meanPersistentAbundanceWeightedActivity,
    finalWindowCensored: false
  };
}

function createRawSummary(meanNewActivity: number): CladeActivityProbeSummary {
  return {
    stepsExecuted: 100,
    totalClades: 5,
    postBurnInWindows: 4,
    postBurnInWindowsWithNewActivity: 3,
    postBurnInNewClades: 3,
    postBurnInNewActivityMean: meanNewActivity,
    postBurnInNewActivityMin: meanNewActivity,
    postBurnInNewActivityMax: meanNewActivity,
    postBurnInNewAbundanceWeightedActivityMean: meanNewActivity,
    postBurnInNewAbundanceWeightedActivityMin: meanNewActivity,
    postBurnInNewAbundanceWeightedActivityMax: meanNewActivity,
    finalCumulativeActivity: 30,
    finalNormalizedCumulativeActivity: 0.3,
    finalNewActivity: meanNewActivity,
    finalNewAbundanceWeightedActivity: meanNewActivity
  };
}

function createFinalSummary(population: number, activeClades: number): StepSummary {
  return {
    tick: 100,
    population,
    births: 0,
    deaths: 0,
    meanEnergy: 0,
    meanGenome: { metabolism: 0, harvest: 0, aggression: 0 },
    activeClades,
    activeSpecies: 0,
    dominantSpeciesShare: 0,
    selectionDifferential: { metabolism: 0, harvest: 0, aggression: 0 },
    cladeExtinctions: 0,
    speciesExtinctions: 0,
    cumulativeExtinctClades: 0,
    cumulativeExtinctSpecies: 0
  };
}

function createSeedResult(input: {
  seed: number;
  finalPopulation: number;
  actualActiveClades: number;
  matchedNullActiveClades: number;
  actualRawMean: number;
  matchedNullRawMean: number;
  actualPersistentMean: number;
  matchedNullPersistentMean: number;
  actualPersistentWindows: number;
  matchedNullPersistentWindows: number;
}): CladeActivityRelabelNullSeedResult {
  const actual = buildActivitySeedPanelThresholdSeedResult({
    minSurvivalTicks: 50,
    summary: createPersistenceSummary(input.actualPersistentMean, input.actualPersistentWindows)
  });
  const matchedNull = buildActivitySeedPanelThresholdSeedResult({
    minSurvivalTicks: 50,
    summary: createPersistenceSummary(input.matchedNullPersistentMean, input.matchedNullPersistentWindows)
  });

  return {
    seed: input.seed,
    relabelSeed: input.seed + 1000,
    finalSummary: createFinalSummary(input.finalPopulation, input.actualActiveClades),
    actualRawSummary: createRawSummary(input.actualRawMean),
    matchedNullRawSummary: createRawSummary(input.matchedNullRawMean),
    actualBirthSchedule: [{ tick: 1, births: 1 }],
    matchedNullBirthSchedule: [{ tick: 1, births: 1 }],
    birthScheduleMatched: true,
    actualFounderHabitatSchedule: [],
    matchedNullFounderHabitatSchedule: [],
    founderHabitatScheduleMatched: null,
    actualFounderHabitatCrowdingSchedule: [],
    matchedNullFounderHabitatCrowdingSchedule: [],
    founderHabitatCrowdingScheduleMatched: null,
    thresholds: [
      buildCladeActivityRelabelNullThresholdSeedResult({
        minSurvivalTicks: 50,
        actual,
        matchedNull,
        finalPopulation: input.finalPopulation,
        actualActiveClades: input.actualActiveClades,
        matchedNullActiveClades: input.matchedNullActiveClades,
        actualRawSummary: createRawSummary(input.actualRawMean),
        matchedNullRawSummary: createRawSummary(input.matchedNullRawMean)
      })
    ]
  };
}

describe('buildCladeActivityRelabelNullThresholdSeedResult', () => {
  it('builds relabel-null ratios and per-seed diagnostics without changing the output shape', () => {
    const actual = buildActivitySeedPanelThresholdSeedResult({
      minSurvivalTicks: 50,
      summary: createPersistenceSummary(8, 3)
    });
    const matchedNull = buildActivitySeedPanelThresholdSeedResult({
      minSurvivalTicks: 50,
      summary: createPersistenceSummary(4, 2)
    });

    const threshold = buildCladeActivityRelabelNullThresholdSeedResult({
      minSurvivalTicks: 50,
      actual,
      matchedNull,
      finalPopulation: 42,
      actualActiveClades: 3,
      matchedNullActiveClades: 5,
      actualRawSummary: createRawSummary(10),
      matchedNullRawSummary: createRawSummary(6)
    });

    expect(threshold).toMatchObject({
      minSurvivalTicks: 50,
      actualToNullPersistentWindowFractionRatio: 1.5,
      persistentWindowFractionDeltaVsNull: 0.25,
      actualToNullPersistentActivityMeanRatio: 2,
      persistentActivityMeanDeltaVsNull: 4,
      actualToNullPersistentAbundanceWeightedActivityMeanRatio: 2,
      persistentAbundanceWeightedActivityMeanDeltaVsNull: 4,
      diagnostics: {
        finalPopulation: 42,
        actualActiveClades: 3,
        matchedNullActiveClades: 5,
        activeCladeDeltaVsNull: -2,
        rawNewCladeActivityMeanDeltaVsNull: 4,
        actualPersistentActivityMean: 8,
        matchedNullPersistentActivityMean: 4,
        persistentActivityMeanDeltaVsNull: 4,
        persistencePenaltyVsRawDelta: 0,
        dominantLossMode: 'activeCladeDeficit'
      }
    });
  });
});

describe('buildCladeActivityRelabelNullThresholdAggregate', () => {
  it('aggregates relabel-null diagnostics across seeds', () => {
    const aggregate = buildCladeActivityRelabelNullThresholdAggregate(50, [
      createSeedResult({
        seed: 1,
        finalPopulation: 12,
        actualActiveClades: 3,
        matchedNullActiveClades: 5,
        actualRawMean: 10,
        matchedNullRawMean: 6,
        actualPersistentMean: 8,
        matchedNullPersistentMean: 4,
        actualPersistentWindows: 3,
        matchedNullPersistentWindows: 2
      }),
      createSeedResult({
        seed: 2,
        finalPopulation: 18,
        actualActiveClades: 4,
        matchedNullActiveClades: 4,
        actualRawMean: 5,
        matchedNullRawMean: 5,
        actualPersistentMean: 2,
        matchedNullPersistentMean: 6,
        actualPersistentWindows: 1,
        matchedNullPersistentWindows: 2
      })
    ]);

    expect(aggregate.actual).toMatchObject({
      minSurvivalTicks: 50,
      seeds: 2,
      meanPersistentWindowFraction: 0.5,
      meanPersistentActivityMean: 5,
      meanPersistentAbundanceWeightedActivityMean: 5
    });
    expect(aggregate.matchedNull).toMatchObject({
      meanPersistentWindowFraction: 0.5,
      meanPersistentActivityMean: 5,
      meanPersistentAbundanceWeightedActivityMean: 5
    });
    expect(aggregate.actualToNullPersistentWindowFractionRatio).toMatchObject({
      definedSeeds: 2,
      mean: 1
    });
    expect(aggregate.actualToNullPersistentActivityMeanRatio.mean).toBeCloseTo(7 / 6, 10);
    expect(aggregate.actualToNullPersistentAbundanceWeightedActivityMeanRatio.mean).toBeCloseTo(7 / 6, 10);
    expect(aggregate.persistentWindowFractionDeltaVsNull.mean).toBeCloseTo(0, 10);
    expect(aggregate.persistentActivityMeanDeltaVsNull.mean).toBeCloseTo(0, 10);
    expect(aggregate.persistentAbundanceWeightedActivityMeanDeltaVsNull.mean).toBeCloseTo(0, 10);
    expect(aggregate.diagnostics).toMatchObject({
      finalPopulation: { mean: 15, min: 12, max: 18 },
      activeCladeDeltaVsNull: { mean: -1, min: -2, max: 0 },
      rawNewCladeActivityMeanDeltaVsNull: { mean: 2, min: 0, max: 4 },
      persistencePenaltyVsRawDelta: { mean: 2, min: 0, max: 4 },
      dominantLossMode: 'persistenceFailure'
    });
  });
});

describe('inferCladeActivityRelabelNullLossMode', () => {
  it('keeps the historical tie ordering for loss-mode classification', () => {
    expect(
      inferCladeActivityRelabelNullLossMode({
        activeCladeDeltaVsNull: 0,
        rawNewCladeActivityMeanDeltaVsNull: 0,
        persistencePenaltyVsRawDelta: 0
      })
    ).toBe('matchedOrBetter');
    expect(
      inferCladeActivityRelabelNullLossMode({
        activeCladeDeltaVsNull: -3,
        rawNewCladeActivityMeanDeltaVsNull: -3,
        persistencePenaltyVsRawDelta: 0
      })
    ).toBe('activeCladeDeficit');
    expect(
      inferCladeActivityRelabelNullLossMode({
        activeCladeDeltaVsNull: 0,
        rawNewCladeActivityMeanDeltaVsNull: -2,
        persistencePenaltyVsRawDelta: 2
      })
    ).toBe('persistenceFailure');
    expect(
      inferCladeActivityRelabelNullLossMode({
        activeCladeDeltaVsNull: 0,
        rawNewCladeActivityMeanDeltaVsNull: -4,
        persistencePenaltyVsRawDelta: 1
      })
    ).toBe('founderSuppression');
  });
});
