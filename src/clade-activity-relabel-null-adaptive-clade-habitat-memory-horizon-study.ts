import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING
} from './clade-activity-relabel-null-adaptive-clade-habitat-memory-smoke-study';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  BASELINE_BEST_SHORT_STACK_ARTIFACT,
  CladeActivityRelabelNullCladeHabitatCouplingHorizonStudyExport
} from './clade-activity-relabel-null-clade-habitat-coupling-horizon-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does adaptiveCladeHabitatMemoryRate=0.2 preserve the short-horizon habitat-memory gain on the canonical 4000-step relabel-null panel on top of cladeHabitatCoupling=0.75, or does the advantage disappear once the habitat-coupled baseline is held fixed?';
const PREDICTION =
  'If adaptive clade habitat memory is improving durable niche tracking rather than only short-horizon persistence, the adaptive run should improve persistentActivityMeanDeltaVsNullMean versus static memory at cladogenesis thresholds 1.0 and 1.2 without breaking matched birth schedules.';

export const BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json';
export const HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE = 0;
export const HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0.2;

export interface CladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  staticMemoryBirthScheduleMatchedAllSeeds: boolean;
  adaptiveMemoryBirthScheduleMatchedAllSeeds: boolean;
  staticMemoryPersistentWindowFractionDeltaVsNullMean: number;
  adaptiveMemoryPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsStaticMemory: number;
  staticMemoryPersistentActivityMeanDeltaVsNullMean: number;
  adaptiveMemoryPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsStaticMemory: number;
  staticMemoryDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  adaptiveMemoryDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    habitatCouplingBaselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    staticMemorySimulationConfig: Partial<SimulationConfig>;
    adaptiveMemorySimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonComparison[];
  adaptiveMemoryStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  adaptiveMemoryStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudy(
  input: RunCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyInput = {}
): CladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const staticMemoryStudyInput = buildAdaptiveCladeHabitatMemoryHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
  );
  const adaptiveMemoryStudyInput = buildAdaptiveCladeHabitatMemoryHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(adaptiveMemoryStudyInput);
  const baselineStudy = input.baselineStudy ?? loadHabitatCouplingBaselineStudy();
  const adaptiveMemoryStudy =
    input.adaptiveMemoryStudy ?? runCladeActivityRelabelNullStudy(adaptiveMemoryStudyInput);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
      habitatCouplingBaselineArtifact: BASELINE_BEST_SHORT_STACK_ARTIFACT,
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      staticMemorySimulationConfig: staticMemoryStudyInput.simulation?.config ?? {},
      adaptiveMemorySimulationConfig: adaptiveMemoryStudyInput.simulation?.config ?? {}
    },
    comparison: compareAdaptiveCladeHabitatMemoryHorizonStudies(adaptiveMemoryStudy, baselineStudy),
    adaptiveMemoryStudy
  };
}

export function compareAdaptiveCladeHabitatMemoryHorizonStudies(
  adaptiveMemoryStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(adaptiveMemoryStudy, baselineStudy).map((comparison) => {
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
      staticMemoryBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      adaptiveMemoryBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      staticMemoryPersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      adaptiveMemoryPersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsStaticMemory:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      staticMemoryPersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      adaptiveMemoryPersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsStaticMemory:
        comparison.persistentActivityMeanImprovementVsBaseline,
      staticMemoryDiagnostics: comparison.baselineDiagnostics,
      adaptiveMemoryDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildAdaptiveCladeHabitatMemoryHorizonStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  adaptiveCladeHabitatMemoryRate: number
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING,
          adaptiveCladeHabitatMemoryRate
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
    throw new Error('Adaptive clade habitat memory horizon study requires a fully resolved study input');
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

function loadHabitatCouplingBaselineStudy(): CladeActivityRelabelNullStudyExport {
  const baselineArtifactPath = resolve(__dirname, '..', BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT);
  const parsed = JSON.parse(readFileSync(baselineArtifactPath, 'utf8')) as
    | CladeActivityRelabelNullCladeHabitatCouplingHorizonStudyExport
    | { habitatCoupledStudy?: CladeActivityRelabelNullStudyExport };
  const baselineStudy = 'habitatCoupledStudy' in parsed ? parsed.habitatCoupledStudy : undefined;

  if (
    !baselineStudy ||
    !Array.isArray(baselineStudy.thresholdResults) ||
    baselineStudy.thresholdResults.length === 0
  ) {
    throw new Error(
      `Baseline artifact ${BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT} is not a habitat-coupling horizon study export`
    );
  }

  return baselineStudy;
}

export function runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyCli(
  args: string[],
  dependencies: {
    runStudy?: (input: { generatedAt?: string }) => unknown;
    emitOutput?: typeof emitStudyJsonOutput;
  } = {}
): void {
  const options = parseGeneratedAtCli(args);
  const study = (
    dependencies.runStudy ?? runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudy
  )({
    generatedAt: options.generatedAt
  });

  (dependencies.emitOutput ?? emitStudyJsonOutput)(study, options);
}

if (require.main === module) {
  runCladeActivityRelabelNullAdaptiveCladeHabitatMemoryHorizonStudyCli(process.argv.slice(2));
}
