import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { buildDisturbanceColonizationConfig } from './clade-activity-relabel-null-disturbance-colonization';
import {
  compareCladeActivityRelabelNullStudies
} from './clade-activity-relabel-null-best-short-stack-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does generic localizedOpening still improve the canonical 4000-step relabel-null panel on top of the best short stack, or was the short-horizon active-clade gain only a transient disturbance burst?';
const PREDICTION =
  'If localized openings create durable recolonization niches rather than a brief founder spike, the disturbed run should improve activeCladeDeltaVsNullMean and persistentActivityMeanDeltaVsNullMean versus the disturbance-off best short stack at cladogenesis thresholds 1.0 and 1.2.';
export const BASELINE_BEST_SHORT_STACK_ARTIFACT = 'docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json';

export interface CladeActivityRelabelNullDisturbanceOpeningHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  baselineBirthScheduleMatchedAllSeeds: boolean;
  localizedOpeningBirthScheduleMatchedAllSeeds: boolean;
  baselinePersistentWindowFractionDeltaVsNullMean: number;
  localizedOpeningPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsBaseline: number;
  baselinePersistentActivityMeanDeltaVsNullMean: number;
  localizedOpeningPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsBaseline: number;
  baselineDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  localizedOpeningDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullDisturbanceOpeningHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    baselineSimulationConfig: Partial<SimulationConfig>;
    localizedOpeningSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullDisturbanceOpeningHorizonComparison[];
  localizedOpeningStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullDisturbanceOpeningHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  localizedOpeningStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullDisturbanceOpeningHorizonStudy(
  input: RunCladeActivityRelabelNullDisturbanceOpeningHorizonStudyInput = {}
): CladeActivityRelabelNullDisturbanceOpeningHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baselineStudyInput = buildDisturbanceOpeningStudyInput(input.studyInput, generatedAt, 'off');
  const localizedOpeningStudyInput = buildDisturbanceOpeningStudyInput(input.studyInput, generatedAt, 'localizedOpening');
  const resolvedStudyConfig = requireResolvedStudyConfig(baselineStudyInput);
  const baselineStudy = input.baselineStudy ?? loadBaselineBestShortStackStudy();
  const localizedOpeningStudy = input.localizedOpeningStudy ?? runCladeActivityRelabelNullStudy(localizedOpeningStudyInput);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_BEST_SHORT_STACK_ARTIFACT,
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      baselineSimulationConfig: baselineStudyInput.simulation?.config ?? {},
      localizedOpeningSimulationConfig: localizedOpeningStudyInput.simulation?.config ?? {}
    },
    comparison: compareDisturbanceOpeningHorizonStudies(localizedOpeningStudy, baselineStudy),
    localizedOpeningStudy
  };
}

export function compareDisturbanceOpeningHorizonStudies(
  localizedOpeningStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullDisturbanceOpeningHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(localizedOpeningStudy, baselineStudy).map((comparison) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (thresholdResult) => thresholdResult.cladogenesisThreshold === comparison.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${comparison.cladogenesisThreshold}`
      );
    }

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      baselineBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      localizedOpeningBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      baselinePersistentWindowFractionDeltaVsNullMean: comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      localizedOpeningPersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsBaseline:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      baselinePersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      localizedOpeningPersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsBaseline: comparison.persistentActivityMeanImprovementVsBaseline,
      baselineDiagnostics: comparison.baselineDiagnostics,
      localizedOpeningDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildDisturbanceOpeningStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  mode: 'off' | 'localizedOpening'
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          ...buildDisturbanceColonizationConfig(mode)
        }
      }
    },
    generatedAt
  );
}

function requireResolvedStudyConfig(studyInput: RunCladeActivityRelabelNullStudyInput): {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
} {
  if (
    studyInput.steps === undefined ||
    studyInput.windowSize === undefined ||
    studyInput.burnIn === undefined ||
    studyInput.seeds === undefined ||
    studyInput.stopWhenExtinct === undefined ||
    studyInput.minSurvivalTicks === undefined ||
    studyInput.cladogenesisThresholds === undefined
  ) {
    throw new Error('Disturbance opening horizon study requires a fully resolved study input');
  }

  return {
    steps: studyInput.steps,
    windowSize: studyInput.windowSize,
    burnIn: studyInput.burnIn,
    seeds: studyInput.seeds,
    stopWhenExtinct: studyInput.stopWhenExtinct,
    minSurvivalTicks: studyInput.minSurvivalTicks,
    cladogenesisThresholds: studyInput.cladogenesisThresholds
  };
}

function loadBaselineBestShortStackStudy(): CladeActivityRelabelNullStudyExport {
  const baselineArtifactPath = resolve(__dirname, '..', BASELINE_BEST_SHORT_STACK_ARTIFACT);
  const parsed = JSON.parse(readFileSync(baselineArtifactPath, 'utf8')) as {
    study?: CladeActivityRelabelNullStudyExport;
  };

  if (!parsed.study || !Array.isArray(parsed.study.thresholdResults) || parsed.study.thresholdResults.length === 0) {
    throw new Error(
      `Baseline artifact ${BASELINE_BEST_SHORT_STACK_ARTIFACT} is not a best-short-stack study export`
    );
  }

  return parsed.study;
}

export function runCladeActivityRelabelNullDisturbanceOpeningHorizonStudyCli(
  args: string[],
  dependencies: {
    runStudy?: (input: { generatedAt?: string }) => unknown;
    emitOutput?: typeof emitStudyJsonOutput;
  } = {}
): void {
  const options = parseGeneratedAtCli(args);
  const study = (dependencies.runStudy ?? runCladeActivityRelabelNullDisturbanceOpeningHorizonStudy)({
    generatedAt: options.generatedAt
  });

  (dependencies.emitOutput ?? emitStudyJsonOutput)(study, options);
}

if (require.main === module) {
  runCladeActivityRelabelNullDisturbanceOpeningHorizonStudyCli(process.argv.slice(2));
}
