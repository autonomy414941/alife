import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does bestShortStack + cladeHabitatCoupling=0.75 improve the canonical 4000-step relabel-null panel versus the uncoupled best short stack, or was the 2026-03-11 sweep gain only a shorter-horizon artifact?';
const PREDICTION =
  'If clade-level habitat coupling creates durable niche separation, the coupled run should improve persistentActivityMeanDeltaVsNullMean versus the uncoupled best short stack at cladogenesis thresholds 1.0 and 1.2 without breaking birth-schedule matching.';

export const BASELINE_BEST_SHORT_STACK_ARTIFACT = 'docs/clade_activity_relabel_null_best_short_stack_2026-03-12.json';
export const HORIZON_CLADE_HABITAT_COUPLING = 0.75;

export interface CladeActivityRelabelNullCladeHabitatCouplingHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  baselineBirthScheduleMatchedAllSeeds: boolean;
  habitatCoupledBirthScheduleMatchedAllSeeds: boolean;
  baselinePersistentWindowFractionDeltaVsNullMean: number;
  habitatCoupledPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsBaseline: number;
  baselinePersistentActivityMeanDeltaVsNullMean: number;
  habitatCoupledPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsBaseline: number;
  baselineDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  habitatCoupledDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullCladeHabitatCouplingHorizonStudyExport {
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
    cladeHabitatCoupling: number;
    baselineSimulationConfig: Partial<SimulationConfig>;
    habitatCoupledSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullCladeHabitatCouplingHorizonComparison[];
  habitatCoupledStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullCladeHabitatCouplingHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatCoupledStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullCladeHabitatCouplingHorizonStudy(
  input: RunCladeActivityRelabelNullCladeHabitatCouplingHorizonStudyInput = {}
): CladeActivityRelabelNullCladeHabitatCouplingHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baselineStudyInput = buildCladeHabitatCouplingStudyInput(input.studyInput, generatedAt, 0);
  const habitatCoupledStudyInput = buildCladeHabitatCouplingStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_CLADE_HABITAT_COUPLING
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(habitatCoupledStudyInput);
  const baselineStudy = input.baselineStudy ?? loadBaselineBestShortStackStudy();
  const habitatCoupledStudy =
    input.habitatCoupledStudy ?? runCladeActivityRelabelNullStudy(habitatCoupledStudyInput);

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
      cladeHabitatCoupling: HORIZON_CLADE_HABITAT_COUPLING,
      baselineSimulationConfig: baselineStudyInput.simulation?.config ?? {},
      habitatCoupledSimulationConfig: habitatCoupledStudyInput.simulation?.config ?? {}
    },
    comparison: compareCladeHabitatCouplingHorizonStudies(habitatCoupledStudy, baselineStudy),
    habitatCoupledStudy
  };
}

export function compareCladeHabitatCouplingHorizonStudies(
  habitatCoupledStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullCladeHabitatCouplingHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(habitatCoupledStudy, baselineStudy).map((comparison) => {
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
      habitatCoupledBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      baselinePersistentWindowFractionDeltaVsNullMean: comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      habitatCoupledPersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsBaseline:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      baselinePersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      habitatCoupledPersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsBaseline: comparison.persistentActivityMeanImprovementVsBaseline,
      baselineDiagnostics: comparison.baselineDiagnostics,
      habitatCoupledDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildCladeHabitatCouplingStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  cladeHabitatCoupling: number
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          cladeHabitatCoupling
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
    throw new Error('Clade habitat coupling horizon study requires a fully resolved study input');
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

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullCladeHabitatCouplingHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
