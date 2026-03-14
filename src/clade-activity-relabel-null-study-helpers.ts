import { findThresholdResult } from './activity-thresholds';
import {
  buildFounderHabitatCrowdingSchedule,
  buildFounderHabitatSchedule,
  founderHabitatCrowdingSchedulesEqual,
  founderHabitatSchedulesEqual,
  requiresFounderHabitatCrowdingMatch,
  requiresFounderHabitatMatch
} from './clade-activity-relabel-null-founder-context';
import {
  buildTaxonBirthSchedule,
  countActiveTaxaAtTick,
  taxonBirthSchedulesEqual
} from './clade-activity-relabel-null-matched-schedule';
import { buildCladeActivityRelabelNullThresholdSeedResult } from './clade-activity-relabel-null-thresholds';
import {
  CladeActivityProbeSummary,
  CladeActivityRelabelNullCladeHabitatCouplingSweepResult,
  CladeActivityRelabelNullCladeInteractionCouplingSweepResult,
  CladeActivityRelabelNullSeedResult,
  CladeActivityRelabelNullThresholdAggregate,
  CladeActivityRelabelNullThresholdResult,
  CladeActivitySeedPanelThresholdSeedResult,
  MatchedNullFounderContext,
  StepSummary,
  TaxonHistory
} from './types';

export function buildCladeActivityRelabelNullSeedResult(input: {
  seed: number;
  relabelSeed: number;
  finalSummary: StepSummary;
  actualClades: TaxonHistory[];
  matchedNullClades: TaxonHistory[];
  actualRawSummary: CladeActivityProbeSummary;
  matchedNullRawSummary: CladeActivityProbeSummary;
  actualThresholds: CladeActivitySeedPanelThresholdSeedResult[];
  matchedNullThresholds: CladeActivitySeedPanelThresholdSeedResult[];
  minSurvivalTicks: number[];
  matchedNullFounderContext: MatchedNullFounderContext;
}): CladeActivityRelabelNullSeedResult {
  const actualBirthSchedule = buildTaxonBirthSchedule(input.actualClades);
  const matchedNullBirthSchedule = buildTaxonBirthSchedule(input.matchedNullClades);
  const actualFounderHabitatSchedule = buildFounderHabitatSchedule(input.actualClades);
  const matchedNullFounderHabitatSchedule = buildFounderHabitatSchedule(input.matchedNullClades);
  const actualFounderHabitatCrowdingSchedule = buildFounderHabitatCrowdingSchedule(input.actualClades);
  const matchedNullFounderHabitatCrowdingSchedule = buildFounderHabitatCrowdingSchedule(input.matchedNullClades);
  const actualActiveClades = input.finalSummary.activeClades;
  const matchedNullActiveClades = countActiveTaxaAtTick(input.matchedNullClades, input.finalSummary.tick);

  return {
    seed: input.seed,
    relabelSeed: input.relabelSeed,
    finalSummary: input.finalSummary,
    actualRawSummary: input.actualRawSummary,
    matchedNullRawSummary: input.matchedNullRawSummary,
    actualBirthSchedule,
    matchedNullBirthSchedule,
    birthScheduleMatched: taxonBirthSchedulesEqual(actualBirthSchedule, matchedNullBirthSchedule),
    actualFounderHabitatSchedule,
    matchedNullFounderHabitatSchedule,
    founderHabitatScheduleMatched: requiresFounderHabitatMatch(input.matchedNullFounderContext)
      ? founderHabitatSchedulesEqual(actualFounderHabitatSchedule, matchedNullFounderHabitatSchedule)
      : null,
    actualFounderHabitatCrowdingSchedule,
    matchedNullFounderHabitatCrowdingSchedule,
    founderHabitatCrowdingScheduleMatched: requiresFounderHabitatCrowdingMatch(input.matchedNullFounderContext)
      ? founderHabitatCrowdingSchedulesEqual(
          actualFounderHabitatCrowdingSchedule,
          matchedNullFounderHabitatCrowdingSchedule
        )
      : null,
    thresholds: input.minSurvivalTicks.map((minSurvivalTicks) =>
      buildCladeActivityRelabelNullThresholdSeedResult({
        minSurvivalTicks,
        actual: findThresholdResult(input.seed, minSurvivalTicks, input.actualThresholds),
        matchedNull: findThresholdResult(input.seed, minSurvivalTicks, input.matchedNullThresholds),
        finalPopulation: input.finalSummary.population,
        actualActiveClades,
        matchedNullActiveClades,
        actualRawSummary: input.actualRawSummary,
        matchedNullRawSummary: input.matchedNullRawSummary
      })
    )
  };
}

export function buildCladeActivityRelabelNullCladeHabitatCouplingSweepResult(input: {
  cladeHabitatCoupling: number;
  thresholdResults: CladeActivityRelabelNullThresholdResult[];
}): CladeActivityRelabelNullCladeHabitatCouplingSweepResult {
  const { thresholdResult, aggregate } = requireSingleSweepThresholdResult(
    'Clade habitat coupling sweep',
    input.thresholdResults
  );

  return {
    cladeHabitatCoupling: input.cladeHabitatCoupling,
    ...buildRelabelNullSweepResultBase(thresholdResult, aggregate)
  };
}

export function buildCladeActivityRelabelNullCladeInteractionCouplingSweepResult(input: {
  cladeInteractionCoupling: number;
  thresholdResults: CladeActivityRelabelNullThresholdResult[];
}): CladeActivityRelabelNullCladeInteractionCouplingSweepResult {
  const { thresholdResult, aggregate } = requireSingleSweepThresholdResult(
    'Clade interaction coupling sweep',
    input.thresholdResults
  );

  return {
    cladeInteractionCoupling: input.cladeInteractionCoupling,
    ...buildRelabelNullSweepResultBase(thresholdResult, aggregate)
  };
}

export function deriveRelabelSeed(seed: number, cladogenesisThreshold: number): number {
  const thresholdSalt = Math.round(cladogenesisThreshold * 1000);
  return ((seed * 1664525 + 1013904223) ^ thresholdSalt ^ 0x9e3779b9) >>> 0 || 1;
}

export function resolveMatchedNullFounderContext(value: MatchedNullFounderContext | string): MatchedNullFounderContext {
  if (value === 'none' || value === 'founderHabitatBin' || value === 'founderHabitatAndCrowdingBin') {
    return value;
  }

  throw new Error(
    `matchedNullFounderContext must be one of "none", "founderHabitatBin", or "founderHabitatAndCrowdingBin"; received ${String(value)}`
  );
}

function requireSingleSweepThresholdResult(
  studyLabel: string,
  thresholdResults: CladeActivityRelabelNullThresholdResult[]
): {
  thresholdResult: CladeActivityRelabelNullThresholdResult;
  aggregate: CladeActivityRelabelNullThresholdAggregate;
} {
  const thresholdResult = thresholdResults[0];
  if (!thresholdResult) {
    throw new Error(`${studyLabel} produced no threshold results`);
  }

  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error(`${studyLabel} produced no aggregate results`);
  }

  return {
    thresholdResult,
    aggregate
  };
}

function buildRelabelNullSweepResultBase(
  thresholdResult: CladeActivityRelabelNullThresholdResult,
  aggregate: CladeActivityRelabelNullThresholdAggregate
) {
  return {
    seedResults: thresholdResult.seedResults,
    aggregate,
    birthScheduleMatchedAllSeeds: thresholdResult.seedResults.every((seedResult) => seedResult.birthScheduleMatched),
    actualToNullPersistentWindowFractionRatioMean: aggregate.actualToNullPersistentWindowFractionRatio.mean,
    persistentWindowFractionDeltaVsNullMean: aggregate.persistentWindowFractionDeltaVsNull.mean,
    actualToNullPersistentActivityMeanRatioMean: aggregate.actualToNullPersistentActivityMeanRatio.mean,
    persistentActivityMeanDeltaVsNullMean: aggregate.persistentActivityMeanDeltaVsNull.mean
  };
}
