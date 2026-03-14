import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CladeActivityRelabelNullSmokeStudyExport,
  parseGeneratedAtCli
} from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport,
  HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
  HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
  NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT
} from './clade-activity-relabel-null-new-clade-encounter-restraint-horizon-study';
import { NEW_CLADE_ENCOUNTER_RESTRAINT_SMOKE_ARTIFACT } from './clade-activity-relabel-null-new-clade-encounter-restraint-smoke-study';

const QUESTION =
  'Should newCladeEncounterRestraintGraceBoost=2 stay on the founder-grace experiment surface after the March 14 smoke and canonical-horizon relabel-null validations?';
const PREDICTION =
  'If the newborn encounter-restraint boost is a keeper, its smoke active-clade gain should survive the canonical horizon instead of being overwhelmed by threshold-specific matched-null growth.';

export const NEW_CLADE_ENCOUNTER_RESTRAINT_REVIEW_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_encounter_restraint_review_2026-03-14.json';

type EncounterRestraintSmokeStudyExport = CladeActivityRelabelNullSmokeStudyExport<
  'newCladeEncounterRestraintGraceBoost',
  number
>;

export interface CladeActivityRelabelNullNewCladeEncounterRestraintReviewSmokeSummary {
  baselineNewCladeEncounterRestraintGraceBoost: number;
  encounterRestraintNewCladeEncounterRestraintGraceBoost: number;
  baselineActiveCladeDeltaVsNullMean: number | null;
  encounterRestraintActiveCladeDeltaVsNullMean: number | null;
  activeCladeDeltaImprovementVsBaseline: number | null;
  baselinePersistentActivityMeanDeltaVsNullMean: number;
  encounterRestraintPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsBaseline: number;
  baselineRawNewCladeActivityMeanDeltaVsNullMean: number;
  encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean: number;
  rawNewCladeActivityMeanImprovementVsBaseline: number;
  baselinePersistencePenaltyVsRawDeltaMean: number;
  encounterRestraintPersistencePenaltyVsRawDeltaMean: number;
  persistencePenaltyChangeVsBaseline: number;
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary {
  cladogenesisThreshold: number;
  comparisons: number;
  minSurvivalTicks: number[];
  actualActiveCladeGainVsFounderGrace: number;
  matchedNullActiveCladeGainVsFounderGrace: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  rawNewCladeActivityMeanImprovementVsFounderGrace: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  persistencePenaltyChangeVsFounderGrace: number;
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintReviewHorizonSummary {
  comparisonCount: number;
  meanActiveCladeDeltaImprovementVsFounderGrace: number;
  meanPersistentActivityMeanImprovementVsFounderGrace: number;
  meanRawNewCladeActivityMeanImprovementVsFounderGrace: number;
  meanPersistencePenaltyChangeVsFounderGrace: number;
  thresholdSummaries: CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary[];
}

export type CladeActivityRelabelNullNewCladeEncounterRestraintReviewVerdict =
  | 'keep'
  | 'prune'
  | 'needsMoreEvidence';

export interface CladeActivityRelabelNullNewCladeEncounterRestraintReviewDecision {
  verdict: CladeActivityRelabelNullNewCladeEncounterRestraintReviewVerdict;
  canonicalAction:
    | 'keepOnFounderGraceSurface'
    | 'retireFromFutureCanonicalStacks'
    | 'narrowToDiagnosticOnly';
  smokeActiveCladeDeltaImprovementVsBaseline: number | null;
  meanHorizonActiveCladeDeltaImprovementVsFounderGrace: number;
  strongestSupportThreshold: number | null;
  strongestRegressionThreshold: number | null;
  explanation: string;
  reasons: string[];
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintReviewExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    smokeArtifact: string;
    horizonArtifact: string;
    baselineNewCladeEncounterRestraintGraceBoost: number;
    encounterRestraintNewCladeEncounterRestraintGraceBoost: number;
  };
  smokeSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewSmokeSummary;
  horizonSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewHorizonSummary;
  decision: CladeActivityRelabelNullNewCladeEncounterRestraintReviewDecision;
}

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintReviewInput {
  generatedAt?: string;
  smokeStudy?: EncounterRestraintSmokeStudyExport;
  horizonStudy?: CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintReview(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintReviewInput = {}
): CladeActivityRelabelNullNewCladeEncounterRestraintReviewExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const smokeStudy = input.smokeStudy ?? loadEncounterRestraintSmokeStudy();
  const horizonStudy = input.horizonStudy ?? loadEncounterRestraintHorizonStudy();
  const smokeSummary = summarizeEncounterRestraintSmokeStudy(
    smokeStudy,
    horizonStudy.config.baselineNewCladeEncounterRestraintGraceBoost,
    horizonStudy.config.encounterRestraintNewCladeEncounterRestraintGraceBoost
  );
  const horizonSummary = summarizeEncounterRestraintHorizonStudy(horizonStudy);
  const decision = decideEncounterRestraintReview(smokeSummary, horizonSummary);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      smokeArtifact: NEW_CLADE_ENCOUNTER_RESTRAINT_SMOKE_ARTIFACT,
      horizonArtifact: NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT,
      baselineNewCladeEncounterRestraintGraceBoost:
        horizonStudy.config.baselineNewCladeEncounterRestraintGraceBoost,
      encounterRestraintNewCladeEncounterRestraintGraceBoost:
        horizonStudy.config.encounterRestraintNewCladeEncounterRestraintGraceBoost
    },
    smokeSummary,
    horizonSummary,
    decision
  };
}

export function decideEncounterRestraintReview(
  smokeSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewSmokeSummary,
  horizonSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewHorizonSummary
): CladeActivityRelabelNullNewCladeEncounterRestraintReviewDecision {
  const strongestSupport = horizonSummary.thresholdSummaries.reduce<
    CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary | null
  >(
    (best, summary) =>
      best === null || summary.activeCladeDeltaImprovementVsFounderGrace > best.activeCladeDeltaImprovementVsFounderGrace
        ? summary
        : best,
    null
  );
  const strongestRegression = horizonSummary.thresholdSummaries.reduce<
    CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary | null
  >(
    (worst, summary) =>
      worst === null || summary.activeCladeDeltaImprovementVsFounderGrace < worst.activeCladeDeltaImprovementVsFounderGrace
        ? summary
        : worst,
    null
  );
  const smokeActiveImprovement = smokeSummary.activeCladeDeltaImprovementVsBaseline;
  const keepsSmokeGain =
    smokeActiveImprovement !== null &&
    smokeActiveImprovement > 0 &&
    horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace > 0 &&
    horizonSummary.thresholdSummaries.every(
      (summary) => summary.activeCladeDeltaImprovementVsFounderGrace >= 0
    );

  if (keepsSmokeGain) {
    return {
      verdict: 'keep',
      canonicalAction: 'keepOnFounderGraceSurface',
      smokeActiveCladeDeltaImprovementVsBaseline: smokeActiveImprovement,
      meanHorizonActiveCladeDeltaImprovementVsFounderGrace:
        horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace,
      strongestSupportThreshold: strongestSupport?.cladogenesisThreshold ?? null,
      strongestRegressionThreshold: strongestRegression?.cladogenesisThreshold ?? null,
      explanation:
        'The short-run active-clade gain survives the canonical horizon without any threshold-specific active-clade regressions.',
      reasons: [
        `Smoke active-clade delta improved by ${formatSignedNumber(smokeActiveImprovement)}.`,
        `Mean horizon active-clade delta improved by ${formatSignedNumber(
          horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace
        )}.`
      ]
    };
  }

  const supportMagnitude = Math.max(
    strongestSupport?.activeCladeDeltaImprovementVsFounderGrace ?? Number.NEGATIVE_INFINITY,
    0
  );
  const regressionMagnitude = Math.abs(
    strongestRegression?.activeCladeDeltaImprovementVsFounderGrace ?? 0
  );
  const shouldPrune =
    smokeActiveImprovement !== null &&
    smokeActiveImprovement > 0 &&
    horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace <= 0 &&
    strongestRegression !== null &&
    strongestRegression.activeCladeDeltaImprovementVsFounderGrace < 0 &&
    regressionMagnitude >= supportMagnitude;

  if (shouldPrune) {
    return {
      verdict: 'prune',
      canonicalAction: 'retireFromFutureCanonicalStacks',
      smokeActiveCladeDeltaImprovementVsBaseline: smokeActiveImprovement,
      meanHorizonActiveCladeDeltaImprovementVsFounderGrace:
        horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace,
      strongestSupportThreshold: strongestSupport?.cladogenesisThreshold ?? null,
      strongestRegressionThreshold: strongestRegression.cladogenesisThreshold,
      explanation:
        'The smoke gain does not survive the canonical horizon, and the strongest threshold-specific regression is larger than the strongest rescue.',
      reasons: buildPruneReasons(
        smokeSummary,
        horizonSummary,
        strongestRegression,
        strongestSupport
      )
    };
  }

  return {
    verdict: 'needsMoreEvidence',
    canonicalAction: 'narrowToDiagnosticOnly',
    smokeActiveCladeDeltaImprovementVsBaseline: smokeActiveImprovement,
    meanHorizonActiveCladeDeltaImprovementVsFounderGrace:
      horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace,
    strongestSupportThreshold: strongestSupport?.cladogenesisThreshold ?? null,
    strongestRegressionThreshold: strongestRegression?.cladogenesisThreshold ?? null,
    explanation:
      'The smoke and horizon evidence disagree, but the threshold split is not yet decisive enough to keep the knob on the canonical founder-grace surface.',
    reasons: [
      `Smoke active-clade delta changed by ${formatNullableSignedNumber(smokeActiveImprovement)}.`,
      `Mean horizon active-clade delta changed by ${formatSignedNumber(
        horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace
      )}.`
    ]
  };
}

function buildPruneReasons(
  smokeSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewSmokeSummary,
  horizonSummary: CladeActivityRelabelNullNewCladeEncounterRestraintReviewHorizonSummary,
  strongestRegression: CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary,
  strongestSupport: CladeActivityRelabelNullNewCladeEncounterRestraintReviewThresholdSummary | null
): string[] {
  const reasons = [
    `Smoke active-clade delta improved by ${formatNullableSignedNumber(
      smokeSummary.activeCladeDeltaImprovementVsBaseline
    )}, but the mean horizon change reversed to ${formatSignedNumber(
      horizonSummary.meanActiveCladeDeltaImprovementVsFounderGrace
    )}.`,
    `Threshold ${strongestRegression.cladogenesisThreshold} actual active clades rose by ${formatSignedNumber(
      strongestRegression.actualActiveCladeGainVsFounderGrace
    )}, but the matched null rose by ${formatSignedNumber(
      strongestRegression.matchedNullActiveCladeGainVsFounderGrace
    )}, producing an active-clade delta regression of ${formatSignedNumber(
      strongestRegression.activeCladeDeltaImprovementVsFounderGrace
    )}.`
  ];

  if (
    strongestSupport !== null &&
    strongestSupport.activeCladeDeltaImprovementVsFounderGrace > 0
  ) {
    reasons.push(
      `Threshold ${strongestSupport.cladogenesisThreshold} only recovers ${formatSignedNumber(
        strongestSupport.activeCladeDeltaImprovementVsFounderGrace
      )}, which is smaller than the threshold ${strongestRegression.cladogenesisThreshold} regression.`
    );
  }

  if (strongestSupport !== null && strongestSupport.persistentActivityMeanImprovementVsFounderGrace < 0) {
    reasons.push(
      `The best active-clade rescue still loses persistent activity by ${formatSignedNumber(
        strongestSupport.persistentActivityMeanImprovementVsFounderGrace
      )}.`
    );
  }

  return reasons;
}

function summarizeEncounterRestraintSmokeStudy(
  study: EncounterRestraintSmokeStudyExport,
  baselineBoost: number,
  encounterBoost: number
): CladeActivityRelabelNullNewCladeEncounterRestraintReviewSmokeSummary {
  const baselineResult = study.results.find(
    (result) => result.newCladeEncounterRestraintGraceBoost === baselineBoost
  );
  const encounterResult = study.results.find(
    (result) => result.newCladeEncounterRestraintGraceBoost === encounterBoost
  );

  if (!baselineResult || !encounterResult) {
    throw new Error(
      `Encounter-restraint smoke study must contain boost ${baselineBoost} and boost ${encounterBoost} results`
    );
  }

  return {
    baselineNewCladeEncounterRestraintGraceBoost: baselineBoost,
    encounterRestraintNewCladeEncounterRestraintGraceBoost: encounterBoost,
    baselineActiveCladeDeltaVsNullMean: baselineResult.summary.diagnostics.activeCladeDeltaVsNullMean,
    encounterRestraintActiveCladeDeltaVsNullMean:
      encounterResult.summary.diagnostics.activeCladeDeltaVsNullMean,
    activeCladeDeltaImprovementVsBaseline: subtractNullable(
      encounterResult.summary.diagnostics.activeCladeDeltaVsNullMean,
      baselineResult.summary.diagnostics.activeCladeDeltaVsNullMean
    ),
    baselinePersistentActivityMeanDeltaVsNullMean:
      baselineResult.summary.persistentActivityMeanDeltaVsNullMean,
    encounterRestraintPersistentActivityMeanDeltaVsNullMean:
      encounterResult.summary.persistentActivityMeanDeltaVsNullMean,
    persistentActivityMeanImprovementVsBaseline:
      encounterResult.summary.persistentActivityMeanDeltaVsNullMean -
      baselineResult.summary.persistentActivityMeanDeltaVsNullMean,
    baselineRawNewCladeActivityMeanDeltaVsNullMean:
      baselineResult.summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean,
    encounterRestraintRawNewCladeActivityMeanDeltaVsNullMean:
      encounterResult.summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean,
    rawNewCladeActivityMeanImprovementVsBaseline:
      encounterResult.summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean -
      baselineResult.summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean,
    baselinePersistencePenaltyVsRawDeltaMean:
      baselineResult.summary.diagnostics.persistencePenaltyVsRawDeltaMean,
    encounterRestraintPersistencePenaltyVsRawDeltaMean:
      encounterResult.summary.diagnostics.persistencePenaltyVsRawDeltaMean,
    persistencePenaltyChangeVsBaseline:
      encounterResult.summary.diagnostics.persistencePenaltyVsRawDeltaMean -
      baselineResult.summary.diagnostics.persistencePenaltyVsRawDeltaMean
  };
}

function summarizeEncounterRestraintHorizonStudy(
  study: CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport
): CladeActivityRelabelNullNewCladeEncounterRestraintReviewHorizonSummary {
  if (study.comparison.length === 0) {
    throw new Error('Encounter-restraint horizon study must contain at least one comparison row');
  }

  const thresholdBuckets = new Map<
    number,
    CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport['comparison']
  >();

  for (const comparison of study.comparison) {
    const bucket = thresholdBuckets.get(comparison.cladogenesisThreshold);
    if (bucket) {
      bucket.push(comparison);
    } else {
      thresholdBuckets.set(comparison.cladogenesisThreshold, [comparison]);
    }
  }

  const thresholdSummaries = [...thresholdBuckets.entries()]
    .sort(([leftThreshold], [rightThreshold]) => leftThreshold - rightThreshold)
    .map(([cladogenesisThreshold, comparisons]) => ({
      cladogenesisThreshold,
      comparisons: comparisons.length,
      minSurvivalTicks: comparisons.map((comparison) => comparison.minSurvivalTicks),
      actualActiveCladeGainVsFounderGrace: mean(
        comparisons.map(
          (comparison) =>
            comparison.encounterRestraintDiagnostics.actualActiveCladesMean -
            comparison.founderGraceDiagnostics.actualActiveCladesMean
        )
      ),
      matchedNullActiveCladeGainVsFounderGrace: mean(
        comparisons.map(
          (comparison) =>
            requireNumber(comparison.encounterRestraintDiagnostics.matchedNullActiveCladesMean) -
            requireNumber(comparison.founderGraceDiagnostics.matchedNullActiveCladesMean)
        )
      ),
      activeCladeDeltaImprovementVsFounderGrace: mean(
        comparisons.map((comparison) =>
          requireNumber(comparison.activeCladeDeltaImprovementVsFounderGrace)
        )
      ),
      rawNewCladeActivityMeanImprovementVsFounderGrace: mean(
        comparisons.map(
          (comparison) =>
            comparison.encounterRestraintDiagnostics.rawNewCladeActivityMeanDeltaVsNullMean -
            comparison.founderGraceDiagnostics.rawNewCladeActivityMeanDeltaVsNullMean
        )
      ),
      persistentActivityMeanImprovementVsFounderGrace: mean(
        comparisons.map((comparison) => comparison.persistentActivityMeanImprovementVsFounderGrace)
      ),
      persistencePenaltyChangeVsFounderGrace: mean(
        comparisons.map(
          (comparison) =>
            comparison.encounterRestraintDiagnostics.persistencePenaltyVsRawDeltaMean -
            comparison.founderGraceDiagnostics.persistencePenaltyVsRawDeltaMean
        )
      )
    }));

  return {
    comparisonCount: study.comparison.length,
    meanActiveCladeDeltaImprovementVsFounderGrace: mean(
      study.comparison.map((comparison) => requireNumber(comparison.activeCladeDeltaImprovementVsFounderGrace))
    ),
    meanPersistentActivityMeanImprovementVsFounderGrace: mean(
      study.comparison.map((comparison) => comparison.persistentActivityMeanImprovementVsFounderGrace)
    ),
    meanRawNewCladeActivityMeanImprovementVsFounderGrace: mean(
      study.comparison.map(
        (comparison) =>
          comparison.encounterRestraintDiagnostics.rawNewCladeActivityMeanDeltaVsNullMean -
          comparison.founderGraceDiagnostics.rawNewCladeActivityMeanDeltaVsNullMean
      )
    ),
    meanPersistencePenaltyChangeVsFounderGrace: mean(
      study.comparison.map(
        (comparison) =>
          comparison.encounterRestraintDiagnostics.persistencePenaltyVsRawDeltaMean -
          comparison.founderGraceDiagnostics.persistencePenaltyVsRawDeltaMean
      )
    ),
    thresholdSummaries
  };
}

function loadEncounterRestraintSmokeStudy(): EncounterRestraintSmokeStudyExport {
  return readArtifact(NEW_CLADE_ENCOUNTER_RESTRAINT_SMOKE_ARTIFACT);
}

function loadEncounterRestraintHorizonStudy(): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  return readArtifact(NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT);
}

function readArtifact<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, '..', path), 'utf8')) as T;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Cannot calculate mean of an empty value set');
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function subtractNullable(left: number | null, right: number | null): number | null {
  if (left === null || right === null) {
    return null;
  }

  return left - right;
}

function requireNumber(value: number | null): number {
  if (value === null) {
    throw new Error('Encounter-restraint review requires non-null diagnostic values');
  }

  return value;
}

function formatSignedNumber(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function formatNullableSignedNumber(value: number | null): string {
  return value === null ? 'null' : formatSignedNumber(value);
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const review = runCladeActivityRelabelNullNewCladeEncounterRestraintReview({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(review, null, 2) + '\n');
}
