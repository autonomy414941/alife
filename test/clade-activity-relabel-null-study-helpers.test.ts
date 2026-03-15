import { describe, expect, it } from 'vitest';
import { buildActivitySeedPanelThresholdSeedResult } from '../src/activity-thresholds';
import { buildCladeActivityRelabelNullThresholdAggregate, buildCladeActivityRelabelNullThresholdSeedResult } from '../src/clade-activity-relabel-null-thresholds';
import {
  buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult,
  buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult,
  deriveRelabelSeed,
  resolveMatchedNullFounderContext
} from '../src/clade-activity-relabel-null-study-helpers';
import {
  CladeActivityPersistenceSummary,
  CladeActivityProbeSummary,
  CladeActivityRelabelNullSeedResult,
  CladeActivityRelabelNullThresholdResult,
  SpeciesActivityPersistenceSummary,
  SpeciesActivityProbeSummary,
  StepSummary
} from '../src/types';

function createPersistenceSummary(
  meanPersistentActivity: number,
  windowsWithPersistentActivity: number,
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
    finalPersistentNewActivity: meanPersistentActivity,
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
    finalCumulativeActivity: 30,
    finalNormalizedCumulativeActivity: 0.3,
    finalNewActivity: meanNewActivity
  };
}

function createSpeciesPersistenceSummary(
  meanPersistentActivity: number,
  windowsWithPersistentActivity: number,
  evaluableWindows = 4
): SpeciesActivityPersistenceSummary {
  return {
    minSurvivalTicks: 50,
    postBurnInWindows: evaluableWindows,
    censoredPostBurnInWindows: 0,
    evaluablePostBurnInWindows: evaluableWindows,
    postBurnInWindowsWithPersistentNewActivity: windowsWithPersistentActivity,
    postBurnInPersistentNewSpecies: windowsWithPersistentActivity,
    postBurnInPersistentNewActivityMean: meanPersistentActivity,
    postBurnInPersistentNewActivityMin: meanPersistentActivity,
    postBurnInPersistentNewActivityMax: meanPersistentActivity,
    finalPersistentNewActivity: meanPersistentActivity,
    finalWindowCensored: false
  };
}

function createSpeciesRawSummary(meanNewActivity: number): SpeciesActivityProbeSummary {
  return {
    stepsExecuted: 100,
    totalSpecies: 5,
    postBurnInWindows: 4,
    postBurnInWindowsWithNewActivity: 3,
    postBurnInNewSpecies: 3,
    postBurnInNewActivityMean: meanNewActivity,
    postBurnInNewActivityMin: meanNewActivity,
    postBurnInNewActivityMax: meanNewActivity,
    finalCumulativeActivity: 30,
    finalNormalizedCumulativeActivity: 0.3,
    finalNewActivity: meanNewActivity
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
  birthScheduleMatched?: boolean;
}): CladeActivityRelabelNullSeedResult {
  const actual = buildActivitySeedPanelThresholdSeedResult({
    minSurvivalTicks: 50,
    summary: createPersistenceSummary(input.actualPersistentMean, 3)
  });
  const matchedNull = buildActivitySeedPanelThresholdSeedResult({
    minSurvivalTicks: 50,
    summary: createPersistenceSummary(input.matchedNullPersistentMean, 2)
  });

  return {
    seed: input.seed,
    relabelSeed: input.seed + 1000,
    finalSummary: createFinalSummary(input.finalPopulation, input.actualActiveClades),
    actualRawSummary: createRawSummary(input.actualRawMean),
    actualSpeciesRawSummary: createSpeciesRawSummary(input.actualRawMean),
    matchedNullRawSummary: createRawSummary(input.matchedNullRawMean),
    actualBirthSchedule: [{ tick: 1, births: 1 }],
    matchedNullBirthSchedule: [{ tick: 1, births: 1 }],
    birthScheduleMatched: input.birthScheduleMatched ?? true,
    actualFounderHabitatSchedule: [],
    matchedNullFounderHabitatSchedule: [],
    founderHabitatScheduleMatched: null,
    actualFounderHabitatCrowdingSchedule: [],
    matchedNullFounderHabitatCrowdingSchedule: [],
    founderHabitatCrowdingScheduleMatched: null,
    actualSpeciesThresholds: [
      buildActivitySeedPanelThresholdSeedResult({
        minSurvivalTicks: 50,
        summary: createSpeciesPersistenceSummary(input.actualPersistentMean, 3)
      })
    ],
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

function createThresholdResult(seedResults: CladeActivityRelabelNullSeedResult[]): CladeActivityRelabelNullThresholdResult {
  return {
    cladogenesisThreshold: 1,
    seedResults,
    aggregates: [buildCladeActivityRelabelNullThresholdAggregate(50, seedResults)]
  };
}

describe('resolveMatchedNullFounderContext', () => {
  it('accepts the supported founder-context match modes and rejects unknown values', () => {
    expect(resolveMatchedNullFounderContext('none')).toBe('none');
    expect(resolveMatchedNullFounderContext('founderHabitatBin')).toBe('founderHabitatBin');
    expect(resolveMatchedNullFounderContext('founderHabitatAndCrowdingBin')).toBe(
      'founderHabitatAndCrowdingBin'
    );
    expect(() => resolveMatchedNullFounderContext('unknown')).toThrow(
      'matchedNullFounderContext must be one of "none", "founderHabitatBin", or "founderHabitatAndCrowdingBin"'
    );
  });
});

describe('deriveRelabelSeed', () => {
  it('is deterministic, non-zero, and sensitive to the cladogenesis threshold', () => {
    expect(deriveRelabelSeed(77, 1)).toBe(deriveRelabelSeed(77, 1));
    expect(deriveRelabelSeed(77, 1)).not.toBe(0);
    expect(deriveRelabelSeed(77, 1)).not.toBe(deriveRelabelSeed(77, 1.2));
  });
});

describe('buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult', () => {
  it('projects the first relabel-null threshold result into the sweep schema', () => {
    const thresholdResults = [
      createThresholdResult([
        createSeedResult({
          seed: 1,
          finalPopulation: 12,
          actualActiveClades: 3,
          matchedNullActiveClades: 5,
          actualRawMean: 10,
          matchedNullRawMean: 6,
          actualPersistentMean: 8,
          matchedNullPersistentMean: 4
        })
      ])
    ];

    expect(
      buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult({
        cladeHabitatCoupling: 0.75,
        thresholdResults
      })
    ).toMatchObject({
      cladeHabitatCoupling: 0.75,
      seedResults: thresholdResults[0]?.seedResults,
      aggregate: thresholdResults[0]?.aggregates[0],
      birthScheduleMatchedAllSeeds: true,
      actualToNullPersistentWindowFractionRatioMean: 1.5,
      persistentWindowFractionDeltaVsNullMean: 0.25,
      actualToNullPersistentActivityMeanRatioMean: 2,
      persistentActivityMeanDeltaVsNullMean: 4
    });
  });

  it('throws when the sweep study has no threshold results', () => {
    expect(() =>
      buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult({
        cladeHabitatCoupling: 0.5,
        thresholdResults: []
      })
    ).toThrow('Clade habitat coupling sweep produced no threshold results');
  });
});

describe('buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult', () => {
  it('keeps the all-seeds schedule flag aligned with the underlying threshold result', () => {
    const thresholdResults = [
      createThresholdResult([
        createSeedResult({
          seed: 2,
          finalPopulation: 18,
          actualActiveClades: 4,
          matchedNullActiveClades: 4,
          actualRawMean: 5,
          matchedNullRawMean: 5,
          actualPersistentMean: 2,
          matchedNullPersistentMean: 6,
          birthScheduleMatched: false
        })
      ])
    ];

    expect(
      buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult({
        cladeInteractionCoupling: 0.25,
        thresholdResults
      })
    ).toMatchObject({
      cladeInteractionCoupling: 0.25,
      birthScheduleMatchedAllSeeds: false,
      persistentActivityMeanDeltaVsNullMean: -4
    });
  });
});
