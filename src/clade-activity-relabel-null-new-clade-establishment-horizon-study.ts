import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  BASELINE_BEST_SHORT_STACK_ARTIFACT,
  CladeActivityRelabelNullCladeHabitatCouplingHorizonStudyExport
} from './clade-activity-relabel-null-clade-habitat-coupling-horizon-study';
import {
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS
} from './clade-activity-relabel-null-new-clade-establishment-smoke-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does newCladeSettlementCrowdingGraceTicks=36 preserve the short-horizon founder-support gain on the canonical 4000-step relabel-null panel when compared against the static cladeHabitatCoupling=0.75 baseline with adaptive memory disabled?';
const PREDICTION =
  'If the settlement-grace gain is not just an adaptive-memory stack artifact, the founder-grace run should improve persistentActivityMeanDeltaVsNullMean and activeCladeDeltaVsNullMean versus the static habitat baseline at cladogenesis thresholds 1.0 and 1.2 without breaking matched birth schedules.';

export const HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING =
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json';
export const HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE = 0;
export const HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS =
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[0];
export const HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS =
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[1];

export interface CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  staticHabitatBirthScheduleMatchedAllSeeds: boolean;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  staticHabitatPersistentWindowFractionDeltaVsNullMean: number;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsStaticHabitat: number;
  staticHabitatPersistentActivityMeanDeltaVsNullMean: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsStaticHabitat: number;
  staticHabitatDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    bestShortStackBaselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    baselineNewCladeSettlementCrowdingGraceTicks: number;
    founderGraceNewCladeSettlementCrowdingGraceTicks: number;
    staticHabitatSimulationConfig: Partial<SimulationConfig>;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison[];
  founderGraceStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEstablishmentHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  founderGraceStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const staticHabitatStudyInput = buildNewCladeEstablishmentHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceStudyInput = buildNewCladeEstablishmentHorizonStudyInput(
    input.studyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(founderGraceStudyInput);
  const baselineStudy = input.baselineStudy ?? loadStaticHabitatBaselineStudy();
  const founderGraceStudy = input.founderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceStudyInput);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
      bestShortStackBaselineArtifact: BASELINE_BEST_SHORT_STACK_ARTIFACT,
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      baselineNewCladeSettlementCrowdingGraceTicks:
        HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
      founderGraceNewCladeSettlementCrowdingGraceTicks:
        HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
      staticHabitatSimulationConfig: staticHabitatStudyInput.simulation?.config ?? {},
      founderGraceSimulationConfig: founderGraceStudyInput.simulation?.config ?? {}
    },
    comparison: compareNewCladeEstablishmentHorizonStudies(founderGraceStudy, baselineStudy),
    founderGraceStudy
  };
}

export function compareNewCladeEstablishmentHorizonStudies(
  founderGraceStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison[] {
  return compareCladeActivityRelabelNullStudies(founderGraceStudy, baselineStudy).map((comparison) => {
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
      staticHabitatBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      founderGraceBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      staticHabitatPersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      founderGracePersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsStaticHabitat:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      staticHabitatPersistentActivityMeanDeltaVsNullMean: comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      founderGracePersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsStaticHabitat:
        comparison.persistentActivityMeanImprovementVsBaseline,
      staticHabitatDiagnostics: comparison.baselineDiagnostics,
      founderGraceDiagnostics: comparison.currentDiagnostics
    };
  });
}

function buildNewCladeEstablishmentHorizonStudyInput(
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  newCladeSettlementCrowdingGraceTicks: number
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
          adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
          newCladeSettlementCrowdingGraceTicks
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
    throw new Error('New-clade establishment horizon study requires a fully resolved study input');
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

function loadStaticHabitatBaselineStudy(): CladeActivityRelabelNullStudyExport {
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

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
