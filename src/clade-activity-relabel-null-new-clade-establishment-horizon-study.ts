import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import {
  BASELINE_BEST_SHORT_STACK_ARTIFACT,
} from './clade-activity-relabel-null-clade-habitat-coupling-horizon-study';
import {
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
  STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
  buildConfiguredFounderEstablishmentStudyInput,
  loadEmbeddedStudyFromArtifact,
  requireResolvedStudyConfig
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING
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
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_clade_habitat_coupling_horizon_2026-03-13.json';
export const HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE = STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE;
export const HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS =
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[0];
export const HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS = FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS;

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

export interface CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  currentNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  currentNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullStaticHabitatFounderHabitatScheduleMatchedAllSeeds: boolean;
  habitatMatchedNullFounderGraceFounderHabitatScheduleMatchedAllSeeds: boolean;
  currentNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  currentNullFounderGraceActiveCladeDeltaVsNullMean: number;
  currentNullFounderGraceImprovementVsStaticHabitat: number;
  habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean: number;
  habitatMatchedNullFounderGraceImprovementVsStaticHabitat: number;
  activeCladeImprovementShiftVsCurrentNull: number;
  founderGraceStillImprovesVsStaticHabitatUnderCurrentNull: boolean;
  founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull: boolean;
}

export interface CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    currentNullMatchedNullFounderContext: 'none';
    habitatMatchedNullFounderContext: 'founderHabitatBin';
    staticHabitatSimulationConfig: Partial<SimulationConfig>;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison[];
  currentNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport;
  habitatMatchedNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  currentNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  currentNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const staticHabitatStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(
    founderGraceStudyInput,
    'New-clade establishment horizon study'
  );
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

export function runCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const currentNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...input.studyInput,
    matchedNullFounderContext: 'none'
  };
  const habitatMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...input.studyInput,
    matchedNullFounderContext: 'founderHabitatBin'
  };

  const staticHabitatCurrentNullStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    currentNullStudyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceCurrentNullStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    currentNullStudyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const staticHabitatHabitatMatchedStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    habitatMatchedNullStudyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceHabitatMatchedStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    habitatMatchedNullStudyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(
    founderGraceCurrentNullStudyInput,
    'New-clade establishment founder habitat validation study'
  );

  const currentNullBaselineStudy =
    input.currentNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatCurrentNullStudyInput);
  const currentNullFounderGraceStudy =
    input.currentNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceCurrentNullStudyInput);
  const habitatMatchedNullBaselineStudy =
    input.habitatMatchedNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatHabitatMatchedStudyInput);
  const habitatMatchedNullFounderGraceStudy =
    input.habitatMatchedNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceHabitatMatchedStudyInput);

  const currentNullStudy = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt,
    studyInput: currentNullStudyInput,
    baselineStudy: currentNullBaselineStudy,
    founderGraceStudy: currentNullFounderGraceStudy
  });
  const habitatMatchedNullStudy = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt,
    studyInput: habitatMatchedNullStudyInput,
    baselineStudy: habitatMatchedNullBaselineStudy,
    founderGraceStudy: habitatMatchedNullFounderGraceStudy
  });

  return {
    generatedAt,
    question:
      'Does founder grace still improve activeCladeDeltaVsNullMean versus the static habitat baseline when the relabel-null also matches founder habitat bins at birth?',
    prediction:
      'If the founder-grace gain is not only selecting easy founder habitats, the founder-grace run should still improve activeCladeDeltaVsNullMean versus the static habitat baseline under the founderHabitatBin-matched null, even if absolute deltas shrink.',
    config: {
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      currentNullMatchedNullFounderContext: 'none',
      habitatMatchedNullFounderContext: 'founderHabitatBin',
      staticHabitatSimulationConfig: staticHabitatCurrentNullStudyInput.simulation?.config ?? {},
      founderGraceSimulationConfig: founderGraceCurrentNullStudyInput.simulation?.config ?? {}
    },
    comparison: compareNewCladeEstablishmentFounderHabitatValidation(
      currentNullStudy,
      habitatMatchedNullStudy,
      habitatMatchedNullBaselineStudy,
      habitatMatchedNullFounderGraceStudy
    ),
    currentNullStudy,
    habitatMatchedNullStudy
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

function loadStaticHabitatBaselineStudy(): CladeActivityRelabelNullStudyExport {
  return loadEmbeddedStudyFromArtifact(
    BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
    'habitatCoupledStudy',
    'a habitat-coupling horizon study export'
  );
}

function compareNewCladeEstablishmentFounderHabitatValidation(
  currentNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport,
  habitatMatchedNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport,
  habitatMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport,
  habitatMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison[] {
  return currentNullStudy.comparison.map((currentComparison) => {
    const habitatMatchedComparison = habitatMatchedNullStudy.comparison.find(
      (candidate) =>
        candidate.cladogenesisThreshold === currentComparison.cladogenesisThreshold &&
        candidate.minSurvivalTicks === currentComparison.minSurvivalTicks
    );
    if (!habitatMatchedComparison) {
      throw new Error(
        `Habitat-matched validation study is missing threshold ${currentComparison.cladogenesisThreshold} / minSurvivalTicks=${currentComparison.minSurvivalTicks}`
      );
    }

    const currentNullStaticHabitatActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Current-null static habitat diagnostics',
      currentComparison.staticHabitatDiagnostics
    );
    const currentNullFounderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Current-null founder-grace diagnostics',
      currentComparison.founderGraceDiagnostics
    );
    const habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched static habitat diagnostics',
      habitatMatchedComparison.staticHabitatDiagnostics
    );
    const habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Habitat-matched founder-grace diagnostics',
      habitatMatchedComparison.founderGraceDiagnostics
    );
    const currentNullFounderGraceImprovementVsStaticHabitat =
      currentNullFounderGraceActiveCladeDeltaVsNullMean - currentNullStaticHabitatActiveCladeDeltaVsNullMean;
    const habitatMatchedNullFounderGraceImprovementVsStaticHabitat =
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean -
      habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean;

    return {
      cladogenesisThreshold: currentComparison.cladogenesisThreshold,
      minSurvivalTicks: currentComparison.minSurvivalTicks,
      currentNullStaticHabitatBirthScheduleMatchedAllSeeds:
        currentComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      currentNullFounderGraceBirthScheduleMatchedAllSeeds:
        currentComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatMatchedNullStaticHabitatBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.staticHabitatBirthScheduleMatchedAllSeeds,
      habitatMatchedNullFounderGraceBirthScheduleMatchedAllSeeds:
        habitatMatchedComparison.founderGraceBirthScheduleMatchedAllSeeds,
      habitatMatchedNullStaticHabitatFounderHabitatScheduleMatchedAllSeeds:
        founderHabitatScheduleMatchedAllSeeds(
          habitatMatchedNullBaselineStudy,
          currentComparison.cladogenesisThreshold
        ),
      habitatMatchedNullFounderGraceFounderHabitatScheduleMatchedAllSeeds:
        founderHabitatScheduleMatchedAllSeeds(
          habitatMatchedNullFounderGraceStudy,
          currentComparison.cladogenesisThreshold
        ),
      currentNullStaticHabitatActiveCladeDeltaVsNullMean,
      currentNullFounderGraceActiveCladeDeltaVsNullMean,
      currentNullFounderGraceImprovementVsStaticHabitat,
      habitatMatchedNullStaticHabitatActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceActiveCladeDeltaVsNullMean,
      habitatMatchedNullFounderGraceImprovementVsStaticHabitat,
      activeCladeImprovementShiftVsCurrentNull:
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat -
        currentNullFounderGraceImprovementVsStaticHabitat,
      founderGraceStillImprovesVsStaticHabitatUnderCurrentNull:
        currentNullFounderGraceImprovementVsStaticHabitat > 0,
      founderGraceStillImprovesVsStaticHabitatUnderHabitatMatchedNull:
        habitatMatchedNullFounderGraceImprovementVsStaticHabitat > 0
    };
  });
}

function founderHabitatScheduleMatchedAllSeeds(
  study: CladeActivityRelabelNullStudyExport,
  cladogenesisThreshold: number
): boolean {
  const thresholdResult = study.thresholdResults.find(
    (candidate) => candidate.cladogenesisThreshold === cladogenesisThreshold
  );
  if (!thresholdResult) {
    throw new Error(`Study is missing cladogenesis threshold ${cladogenesisThreshold}`);
  }

  return thresholdResult.seedResults.every((seedResult) => seedResult.founderHabitatScheduleMatched === true);
}

function requireActiveCladeDeltaVsNullMean(
  label: string,
  diagnostics: CladeActivityRelabelNullDiagnosticSnapshot
): number {
  if (diagnostics.activeCladeDeltaVsNullMean === null) {
    throw new Error(`${label} is missing activeCladeDeltaVsNullMean diagnostics`);
  }

  return diagnostics.activeCladeDeltaVsNullMean;
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
