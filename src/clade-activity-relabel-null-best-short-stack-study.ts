import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runCladeActivityRelabelNullStudy, RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  DEFAULT_BEST_SHORT_STACK_STUDY_INPUT,
  buildCladeActivityRelabelNullBestShortStackStudyInput
} from './clade-activity-relabel-null-best-short-stack';
import { CladeActivityRelabelNullStudyExport } from './types';

export {
  BEST_SHORT_STACK_SIMULATION_CONFIG,
  DEFAULT_BEST_SHORT_STACK_STUDY_INPUT,
  buildCladeActivityRelabelNullBestShortStackStudyInput
} from './clade-activity-relabel-null-best-short-stack';

interface CliOptions {
  generatedAt?: string;
}

export interface CladeActivityRelabelNullBestShortStackComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  birthScheduleMatchedAllSeeds: boolean;
  baselinePersistentWindowFractionDeltaVsNullMean: number;
  currentPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsBaseline: number;
  baselinePersistentActivityMeanDeltaVsNullMean: number;
  currentPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsBaseline: number;
}

export interface CladeActivityRelabelNullBestShortStackStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    studyInput: RunCladeActivityRelabelNullStudyInput;
  };
  comparison: CladeActivityRelabelNullBestShortStackComparison[];
  study: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullBestShortStackStudyInput {
  generatedAt?: string;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export const BASELINE_RELABEL_NULL_ARTIFACT = 'docs/clade_activity_relabel_null_2026-03-10.json';

export function compareCladeActivityRelabelNullStudies(
  currentStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullBestShortStackComparison[] {
  return currentStudy.thresholdResults.flatMap((thresholdResult) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (candidate) => candidate.cladogenesisThreshold === thresholdResult.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${thresholdResult.cladogenesisThreshold}`
      );
    }

    const birthScheduleMatchedAllSeeds = thresholdResult.seedResults.every((seedResult) => seedResult.birthScheduleMatched);

    return thresholdResult.aggregates.map((aggregate) => {
      const baselineAggregate = baselineThresholdResult.aggregates.find(
        (candidate) => candidate.minSurvivalTicks === aggregate.minSurvivalTicks
      );
      if (!baselineAggregate) {
        throw new Error(
          `Baseline study is missing minSurvivalTicks=${aggregate.minSurvivalTicks} for cladogenesis threshold ${thresholdResult.cladogenesisThreshold}`
        );
      }

      return {
        cladogenesisThreshold: thresholdResult.cladogenesisThreshold,
        minSurvivalTicks: aggregate.minSurvivalTicks,
        birthScheduleMatchedAllSeeds,
        baselinePersistentWindowFractionDeltaVsNullMean: baselineAggregate.persistentWindowFractionDeltaVsNull.mean,
        currentPersistentWindowFractionDeltaVsNullMean: aggregate.persistentWindowFractionDeltaVsNull.mean,
        persistentWindowFractionDeltaImprovementVsBaseline:
          aggregate.persistentWindowFractionDeltaVsNull.mean - baselineAggregate.persistentWindowFractionDeltaVsNull.mean,
        baselinePersistentActivityMeanDeltaVsNullMean: baselineAggregate.persistentActivityMeanDeltaVsNull.mean,
        currentPersistentActivityMeanDeltaVsNullMean: aggregate.persistentActivityMeanDeltaVsNull.mean,
        persistentActivityMeanImprovementVsBaseline:
          aggregate.persistentActivityMeanDeltaVsNull.mean - baselineAggregate.persistentActivityMeanDeltaVsNull.mean
      };
    });
  });
}

export function runCladeActivityRelabelNullBestShortStackStudy(
  input: RunCladeActivityRelabelNullBestShortStackStudyInput = {}
): CladeActivityRelabelNullBestShortStackStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const studyInput = buildCladeActivityRelabelNullBestShortStackStudyInput(input.studyInput, generatedAt);
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const baselineStudy = input.baselineStudy ?? loadBaselineStudy();

  return {
    generatedAt,
    question:
      'Does the current best short-horizon kin-aware ecology stack still underperform the matched relabel-null on the canonical 4000-step clade activity panel, or has the recent short-run gain changed the long-horizon anti-evidence?',
    prediction:
      'If the short-horizon +29.25 threshold-1 gain reflects durable renewal rather than a transient burst, the best-stack run should improve persistentActivityMeanDeltaVsNullMean versus the 2026-03-10 baseline at cladogenesis thresholds 1.0 and 1.2.',
    config: {
      baselineArtifact: BASELINE_RELABEL_NULL_ARTIFACT,
      studyInput
    },
    comparison: compareCladeActivityRelabelNullStudies(study, baselineStudy),
    study
  };
}

function loadBaselineStudy(): CladeActivityRelabelNullStudyExport {
  const baselineArtifactPath = resolve(__dirname, '..', BASELINE_RELABEL_NULL_ARTIFACT);
  const parsed = JSON.parse(readFileSync(baselineArtifactPath, 'utf8')) as CladeActivityRelabelNullStudyExport;

  if (!Array.isArray(parsed.thresholdResults) || parsed.thresholdResults.length === 0) {
    throw new Error(`Baseline artifact ${BASELINE_RELABEL_NULL_ARTIFACT} is not a relabel-null study export`);
  }

  return parsed;
}

function parseCli(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--generated-at') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--generated-at requires a value');
      }
      options.generatedAt = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

if (require.main === module) {
  const options = parseCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullBestShortStackStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
