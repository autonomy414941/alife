import {
  buildMatchedSchedulePseudoClades,
  DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY,
  deriveRelabelSeed,
  RunCladeActivityRelabelNullStudyInput
} from './activity';
import { mean } from './activity-thresholds';
import {
  buildConfiguredFounderEstablishmentStudyInput,
  FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  requireResolvedStudyConfig
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
  FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT,
  HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
  HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
} from './clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation } from './simulation';
import { SimulationConfig, StepSummary, TaxonHistory } from './types';

const QUESTION =
  'On the canonical founder-grace versus ecology-gate horizon panel, which final active-clade age buckets still trail the matched null, and where does the ecology gate change that deficit?';
const PREDICTION =
  'If ecology gating helps by screening weak founders rather than only shrinking later matched-null expansion, its active-clade delta improvement should concentrate in founder-age buckets rather than only in established clades.';

const AGE_BUCKET_REVIEW_LABEL = 'Founder-grace ecology-gate age-bucket review';
const LATE_MAINTENANCE_MIN_AGE = Math.max(...DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY.minSurvivalTicks);

export const FOUNDER_GRACE_ECOLOGY_GATE_AGE_BUCKET_REVIEW_ARTIFACT =
  'docs/clade_activity_relabel_null_founder_grace_ecology_gate_age_bucket_review_2026-03-14.json';

export interface CladeActivityRelabelNullAgeBucketDefinition {
  label: string;
  minAgeInclusive: number;
  maxAgeInclusive: number | null;
  description: string;
}

export interface CladeActivityRelabelNullAgeBucketCounts {
  ageBucketLabel: string;
  minAgeInclusive: number;
  maxAgeInclusive: number | null;
  actualActiveClades: number;
  matchedNullActiveClades: number;
  activeCladeDeltaVsNull: number;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSeedSummary
  extends CladeActivityRelabelNullAgeBucketCounts {
  seed: number;
  relabelSeed: number;
  finalTick: number;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketComparison {
  ageBucketLabel: string;
  minAgeInclusive: number;
  maxAgeInclusive: number | null;
  founderGraceSeedResults: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSeedSummary[];
  founderGraceActualActiveCladesMean: number;
  founderGraceMatchedNullActiveCladesMean: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  ecologyGateSeedResults: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSeedSummary[];
  ecologyGateActualActiveCladesMean: number;
  ecologyGateMatchedNullActiveCladesMean: number;
  ecologyGateActiveCladeDeltaVsNullMean: number;
  actualActiveCladeGainVsFounderGrace: number;
  matchedNullActiveCladeGainVsFounderGrace: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketThresholdSummary {
  cladogenesisThreshold: number;
  bucketComparisons: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketComparison[];
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSummary {
  ageBucketLabel: string;
  minAgeInclusive: number;
  maxAgeInclusive: number | null;
  comparisons: number;
  cladogenesisThresholds: number[];
  founderGraceActualActiveCladesMean: number;
  founderGraceMatchedNullActiveCladesMean: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  ecologyGateActualActiveCladesMean: number;
  ecologyGateMatchedNullActiveCladesMean: number;
  ecologyGateActiveCladeDeltaVsNullMean: number;
  actualActiveCladeGainVsFounderGrace: number;
  matchedNullActiveCladeGainVsFounderGrace: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
}

export interface CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReviewExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    horizonArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    newCladeSettlementCrowdingGraceTicks: number;
    founderGraceCladogenesisEcologyAdvantageThreshold: number;
    ecologyGateCladogenesisEcologyAdvantageThreshold: number;
    ageBuckets: CladeActivityRelabelNullAgeBucketDefinition[];
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    ecologyGateSimulationConfig: Partial<SimulationConfig>;
  };
  bucketSummary: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSummary[];
  thresholdSummaries: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketThresholdSummary[];
}

export interface RunCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReviewInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  ageBuckets?: CladeActivityRelabelNullAgeBucketDefinition[];
}

interface ResolvedRelabelNullStudyInput extends RunCladeActivityRelabelNullStudyInput {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

interface StudyAgeBucketReplayThresholdResult {
  cladogenesisThreshold: number;
  bucketResults: Array<{
    ageBucket: CladeActivityRelabelNullAgeBucketDefinition;
    seedResults: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSeedSummary[];
  }>;
}

export const FOUNDER_GRACE_ECOLOGY_GATE_AGE_BUCKETS = [
  {
    label: 'founderGraceWindow',
    minAgeInclusive: 0,
    maxAgeInclusive: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS - 1,
    description: 'Clades still inside the 36-tick founder settlement-grace window.'
  },
  {
    label: 'earlyMaintenance',
    minAgeInclusive: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
    maxAgeInclusive: LATE_MAINTENANCE_MIN_AGE - 1,
    description:
      'Clades that cleared founder grace but have not yet reached the longest canonical persistence threshold.'
  },
  {
    label: 'established100Plus',
    minAgeInclusive: LATE_MAINTENANCE_MIN_AGE,
    maxAgeInclusive: null,
    description: 'Clades old enough to count as later-maintenance survivors on the canonical horizon panel.'
  }
] as const satisfies readonly CladeActivityRelabelNullAgeBucketDefinition[];

export function compareActiveCladeAgeBuckets(input: {
  clades: TaxonHistory[];
  matchedNullClades: TaxonHistory[];
  finalTick: number;
  ageBuckets?: CladeActivityRelabelNullAgeBucketDefinition[];
}): CladeActivityRelabelNullAgeBucketCounts[] {
  const ageBuckets = normalizeAgeBuckets(input.ageBuckets ?? [...FOUNDER_GRACE_ECOLOGY_GATE_AGE_BUCKETS]);

  return ageBuckets.map((ageBucket) => {
    const actualActiveClades = countActiveCladesInBucket(input.clades, input.finalTick, ageBucket);
    const matchedNullActiveClades = countActiveCladesInBucket(
      input.matchedNullClades,
      input.finalTick,
      ageBucket
    );

    return {
      ageBucketLabel: ageBucket.label,
      minAgeInclusive: ageBucket.minAgeInclusive,
      maxAgeInclusive: ageBucket.maxAgeInclusive,
      actualActiveClades,
      matchedNullActiveClades,
      activeCladeDeltaVsNull: actualActiveClades - matchedNullActiveClades
    };
  });
}

export function runCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReview(
  input: RunCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReviewInput = {}
): CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReviewExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const ageBuckets = normalizeAgeBuckets(input.ageBuckets ?? [...FOUNDER_GRACE_ECOLOGY_GATE_AGE_BUCKETS]);
  const founderGraceStudyInput = buildResolvedStudyInput(
    HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
    generatedAt,
    input.studyInput
  );
  const ecologyGateStudyInput = buildResolvedStudyInput(
    HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
    generatedAt,
    input.studyInput
  );

  const founderGraceReplay = runStudyAgeBucketReplay(founderGraceStudyInput, ageBuckets);
  const ecologyGateReplay = runStudyAgeBucketReplay(ecologyGateStudyInput, ageBuckets);
  const thresholdSummaries = buildThresholdSummaries(founderGraceReplay, ecologyGateReplay);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
      horizonArtifact: FOUNDER_GRACE_ECOLOGY_GATE_HORIZON_ARTIFACT,
      steps: founderGraceStudyInput.steps,
      windowSize: founderGraceStudyInput.windowSize,
      burnIn: founderGraceStudyInput.burnIn,
      seeds: founderGraceStudyInput.seeds,
      stopWhenExtinct: founderGraceStudyInput.stopWhenExtinct,
      minSurvivalTicks: founderGraceStudyInput.minSurvivalTicks,
      cladogenesisThresholds: founderGraceStudyInput.cladogenesisThresholds,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      founderGraceCladogenesisEcologyAdvantageThreshold:
        HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      ecologyGateCladogenesisEcologyAdvantageThreshold:
        HORIZON_ECOLOGY_GATE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      ageBuckets,
      founderGraceSimulationConfig: founderGraceStudyInput.simulation?.config ?? {},
      ecologyGateSimulationConfig: ecologyGateStudyInput.simulation?.config ?? {}
    },
    bucketSummary: buildBucketSummary(thresholdSummaries, ageBuckets),
    thresholdSummaries
  };
}

function buildResolvedStudyInput(
  cladogenesisEcologyAdvantageThreshold: number,
  generatedAt: string,
  studyInput?: RunCladeActivityRelabelNullStudyInput
): ResolvedRelabelNullStudyInput {
  const configuredInput = buildConfiguredFounderEstablishmentStudyInput(
    FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
    FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    studyInput,
    generatedAt,
    cladogenesisEcologyAdvantageThreshold
  );
  const resolved = requireResolvedStudyConfig(configuredInput, AGE_BUCKET_REVIEW_LABEL);

  return {
    ...configuredInput,
    ...resolved
  };
}

function runStudyAgeBucketReplay(
  studyInput: ResolvedRelabelNullStudyInput,
  ageBuckets: CladeActivityRelabelNullAgeBucketDefinition[]
): StudyAgeBucketReplayThresholdResult[] {
  return studyInput.cladogenesisThresholds.map((cladogenesisThreshold) => {
    const seedBucketResults = studyInput.seeds.map((seed) => {
      const { finalSummary, history } = runStudySeedSimulation(studyInput, cladogenesisThreshold, seed);
      const relabelSeed = deriveRelabelSeed(seed, cladogenesisThreshold);
      const matchedNullClades = buildMatchedSchedulePseudoClades({
        species: history.species,
        clades: history.clades,
        maxTick: finalSummary.tick,
        relabelSeed
      });

      return {
        seed,
        relabelSeed,
        finalTick: finalSummary.tick,
        bucketCounts: compareActiveCladeAgeBuckets({
          clades: history.clades,
          matchedNullClades,
          finalTick: finalSummary.tick,
          ageBuckets
        })
      };
    });

    return {
      cladogenesisThreshold,
      bucketResults: ageBuckets.map((ageBucket) => ({
        ageBucket,
        seedResults: seedBucketResults.map((seedResult) => ({
          ...findBucketCount(seedResult.bucketCounts, ageBucket.label),
          seed: seedResult.seed,
          relabelSeed: seedResult.relabelSeed,
          finalTick: seedResult.finalTick
        }))
      }))
    };
  });
}

function runStudySeedSimulation(
  studyInput: ResolvedRelabelNullStudyInput,
  cladogenesisThreshold: number,
  seed: number
): { finalSummary: StepSummary; history: ReturnType<LifeSimulation['history']> } {
  const simulation = new LifeSimulation({
    ...studyInput.simulation,
    seed,
    config: {
      ...studyInput.simulation?.config,
      cladogenesisThreshold
    }
  });

  let finalSummary: StepSummary | undefined;
  for (let step = 0; step < studyInput.steps; step += 1) {
    finalSummary = simulation.step();
    if (studyInput.stopWhenExtinct && finalSummary.population === 0) {
      break;
    }
  }

  if (!finalSummary) {
    throw new Error('Founder-grace ecology-gate age-bucket review produced no step data');
  }

  return {
    finalSummary,
    history: simulation.history()
  };
}

function buildThresholdSummaries(
  founderGraceReplay: StudyAgeBucketReplayThresholdResult[],
  ecologyGateReplay: StudyAgeBucketReplayThresholdResult[]
): CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketThresholdSummary[] {
  return founderGraceReplay.map((founderGraceThreshold) => {
    const ecologyGateThreshold = ecologyGateReplay.find(
      (threshold) => threshold.cladogenesisThreshold === founderGraceThreshold.cladogenesisThreshold
    );
    if (!ecologyGateThreshold) {
      throw new Error(
        `Ecology-gate replay is missing cladogenesis threshold ${founderGraceThreshold.cladogenesisThreshold}`
      );
    }

    return {
      cladogenesisThreshold: founderGraceThreshold.cladogenesisThreshold,
      bucketComparisons: founderGraceThreshold.bucketResults.map((founderGraceBucketResult) => {
        const ecologyGateBucketResult = ecologyGateThreshold.bucketResults.find(
          (bucketResult) => bucketResult.ageBucket.label === founderGraceBucketResult.ageBucket.label
        );
        if (!ecologyGateBucketResult) {
          throw new Error(
            `Ecology-gate replay is missing age bucket ${founderGraceBucketResult.ageBucket.label}`
          );
        }

        const founderGraceActualActiveCladesMean = mean(
          founderGraceBucketResult.seedResults.map((seedResult) => seedResult.actualActiveClades)
        );
        const founderGraceMatchedNullActiveCladesMean = mean(
          founderGraceBucketResult.seedResults.map((seedResult) => seedResult.matchedNullActiveClades)
        );
        const founderGraceActiveCladeDeltaVsNullMean = mean(
          founderGraceBucketResult.seedResults.map((seedResult) => seedResult.activeCladeDeltaVsNull)
        );
        const ecologyGateActualActiveCladesMean = mean(
          ecologyGateBucketResult.seedResults.map((seedResult) => seedResult.actualActiveClades)
        );
        const ecologyGateMatchedNullActiveCladesMean = mean(
          ecologyGateBucketResult.seedResults.map((seedResult) => seedResult.matchedNullActiveClades)
        );
        const ecologyGateActiveCladeDeltaVsNullMean = mean(
          ecologyGateBucketResult.seedResults.map((seedResult) => seedResult.activeCladeDeltaVsNull)
        );

        return {
          ageBucketLabel: founderGraceBucketResult.ageBucket.label,
          minAgeInclusive: founderGraceBucketResult.ageBucket.minAgeInclusive,
          maxAgeInclusive: founderGraceBucketResult.ageBucket.maxAgeInclusive,
          founderGraceSeedResults: founderGraceBucketResult.seedResults,
          founderGraceActualActiveCladesMean,
          founderGraceMatchedNullActiveCladesMean,
          founderGraceActiveCladeDeltaVsNullMean,
          ecologyGateSeedResults: ecologyGateBucketResult.seedResults,
          ecologyGateActualActiveCladesMean,
          ecologyGateMatchedNullActiveCladesMean,
          ecologyGateActiveCladeDeltaVsNullMean,
          actualActiveCladeGainVsFounderGrace:
            ecologyGateActualActiveCladesMean - founderGraceActualActiveCladesMean,
          matchedNullActiveCladeGainVsFounderGrace:
            ecologyGateMatchedNullActiveCladesMean - founderGraceMatchedNullActiveCladesMean,
          activeCladeDeltaImprovementVsFounderGrace:
            ecologyGateActiveCladeDeltaVsNullMean - founderGraceActiveCladeDeltaVsNullMean
        };
      })
    };
  });
}

function buildBucketSummary(
  thresholdSummaries: CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketThresholdSummary[],
  ageBuckets: CladeActivityRelabelNullAgeBucketDefinition[]
): CladeActivityRelabelNullFounderGraceEcologyGateAgeBucketSummary[] {
  return ageBuckets.map((ageBucket) => {
    const comparisons = thresholdSummaries.flatMap((thresholdSummary) =>
      thresholdSummary.bucketComparisons.filter(
        (bucketComparison) => bucketComparison.ageBucketLabel === ageBucket.label
      )
    );

    return {
      ageBucketLabel: ageBucket.label,
      minAgeInclusive: ageBucket.minAgeInclusive,
      maxAgeInclusive: ageBucket.maxAgeInclusive,
      comparisons: comparisons.length,
      cladogenesisThresholds: thresholdSummaries.map((thresholdSummary) => thresholdSummary.cladogenesisThreshold),
      founderGraceActualActiveCladesMean: mean(
        comparisons.map((comparison) => comparison.founderGraceActualActiveCladesMean)
      ),
      founderGraceMatchedNullActiveCladesMean: mean(
        comparisons.map((comparison) => comparison.founderGraceMatchedNullActiveCladesMean)
      ),
      founderGraceActiveCladeDeltaVsNullMean: mean(
        comparisons.map((comparison) => comparison.founderGraceActiveCladeDeltaVsNullMean)
      ),
      ecologyGateActualActiveCladesMean: mean(
        comparisons.map((comparison) => comparison.ecologyGateActualActiveCladesMean)
      ),
      ecologyGateMatchedNullActiveCladesMean: mean(
        comparisons.map((comparison) => comparison.ecologyGateMatchedNullActiveCladesMean)
      ),
      ecologyGateActiveCladeDeltaVsNullMean: mean(
        comparisons.map((comparison) => comparison.ecologyGateActiveCladeDeltaVsNullMean)
      ),
      actualActiveCladeGainVsFounderGrace: mean(
        comparisons.map((comparison) => comparison.actualActiveCladeGainVsFounderGrace)
      ),
      matchedNullActiveCladeGainVsFounderGrace: mean(
        comparisons.map((comparison) => comparison.matchedNullActiveCladeGainVsFounderGrace)
      ),
      activeCladeDeltaImprovementVsFounderGrace: mean(
        comparisons.map((comparison) => comparison.activeCladeDeltaImprovementVsFounderGrace)
      )
    };
  });
}

function normalizeAgeBuckets(
  ageBuckets: CladeActivityRelabelNullAgeBucketDefinition[]
): CladeActivityRelabelNullAgeBucketDefinition[] {
  if (ageBuckets.length === 0) {
    throw new Error('Founder-grace ecology-gate age-bucket review requires at least one age bucket');
  }

  const sortedBuckets = [...ageBuckets].sort((left, right) => left.minAgeInclusive - right.minAgeInclusive);
  const labels = new Set<string>();
  let previousMaxAgeInclusive: number | null = null;

  sortedBuckets.forEach((ageBucket, index) => {
    if (labels.has(ageBucket.label)) {
      throw new Error(`Founder-grace ecology-gate age buckets must be unique: ${ageBucket.label}`);
    }
    labels.add(ageBucket.label);

    if (!Number.isInteger(ageBucket.minAgeInclusive) || ageBucket.minAgeInclusive < 0) {
      throw new Error(`Age bucket ${ageBucket.label} must use a non-negative integer minAgeInclusive`);
    }
    if (
      ageBucket.maxAgeInclusive !== null &&
      (!Number.isInteger(ageBucket.maxAgeInclusive) || ageBucket.maxAgeInclusive < ageBucket.minAgeInclusive)
    ) {
      throw new Error(`Age bucket ${ageBucket.label} must use maxAgeInclusive >= minAgeInclusive`);
    }
    if (
      previousMaxAgeInclusive !== null &&
      ageBucket.minAgeInclusive <= previousMaxAgeInclusive
    ) {
      throw new Error('Founder-grace ecology-gate age buckets must not overlap');
    }
    if (previousMaxAgeInclusive === null && index > 0) {
      throw new Error('Founder-grace ecology-gate age buckets cannot follow an open-ended bucket');
    }

    previousMaxAgeInclusive = ageBucket.maxAgeInclusive;
  });

  return sortedBuckets;
}

function countActiveCladesInBucket(
  taxa: TaxonHistory[],
  finalTick: number,
  ageBucket: CladeActivityRelabelNullAgeBucketDefinition
): number {
  return taxa.filter((taxon) => isActiveTaxonInBucket(taxon, finalTick, ageBucket)).length;
}

function isActiveTaxonInBucket(
  taxon: TaxonHistory,
  finalTick: number,
  ageBucket: CladeActivityRelabelNullAgeBucketDefinition
): boolean {
  const lastPoint = taxon.timeline[taxon.timeline.length - 1];
  if (!lastPoint || lastPoint.tick !== finalTick || lastPoint.population <= 0) {
    return false;
  }

  const age = finalTick - taxon.firstSeenTick;
  return age >= ageBucket.minAgeInclusive && (ageBucket.maxAgeInclusive === null || age <= ageBucket.maxAgeInclusive);
}

function findBucketCount(
  bucketCounts: CladeActivityRelabelNullAgeBucketCounts[],
  ageBucketLabel: string
): CladeActivityRelabelNullAgeBucketCounts {
  const bucketCount = bucketCounts.find((candidate) => candidate.ageBucketLabel === ageBucketLabel);
  if (!bucketCount) {
    throw new Error(`Missing age bucket count for ${ageBucketLabel}`);
  }
  return bucketCount;
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const review = runCladeActivityRelabelNullFounderGraceEcologyGateAgeBucketReview({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(review, options);
}
