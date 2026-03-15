import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
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
  compareNewCladeEstablishmentFounderCrowdingValidation,
  compareNewCladeEstablishmentFounderHabitatValidation,
  compareNewCladeEstablishmentHorizonStudies,
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison
} from './clade-activity-relabel-null-new-clade-establishment-comparisons';
import {
  NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING
} from './clade-activity-relabel-null-new-clade-establishment-smoke-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
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

export interface CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport {
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
    habitatMatchedNullFounderContext: 'founderHabitatBin';
    habitatAndCrowdingMatchedNullFounderContext: 'founderHabitatAndCrowdingBin';
    staticHabitatSimulationConfig: Partial<SimulationConfig>;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison[];
  habitatMatchedNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport;
  habitatAndCrowdingMatchedNullStudy: CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  habitatMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
  habitatAndCrowdingMatchedNullBaselineStudy?: CladeActivityRelabelNullStudyExport;
  habitatAndCrowdingMatchedNullFounderGraceStudy?: CladeActivityRelabelNullStudyExport;
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

export function runCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyInput = {}
): CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const habitatMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...input.studyInput,
    matchedNullFounderContext: 'founderHabitatBin'
  };
  const habitatAndCrowdingMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...input.studyInput,
    matchedNullFounderContext: 'founderHabitatAndCrowdingBin'
  };

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
  const staticHabitatHabitatAndCrowdingMatchedStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    habitatAndCrowdingMatchedNullStudyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const founderGraceHabitatAndCrowdingMatchedStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
    habitatAndCrowdingMatchedNullStudyInput,
    generatedAt,
    HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(
    founderGraceHabitatAndCrowdingMatchedStudyInput,
    'New-clade establishment founder crowding validation study'
  );

  const habitatMatchedNullBaselineStudy =
    input.habitatMatchedNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatHabitatMatchedStudyInput);
  const habitatMatchedNullFounderGraceStudy =
    input.habitatMatchedNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceHabitatMatchedStudyInput);
  const habitatAndCrowdingMatchedNullBaselineStudy =
    input.habitatAndCrowdingMatchedNullBaselineStudy ??
    runCladeActivityRelabelNullStudy(staticHabitatHabitatAndCrowdingMatchedStudyInput);
  const habitatAndCrowdingMatchedNullFounderGraceStudy =
    input.habitatAndCrowdingMatchedNullFounderGraceStudy ??
    runCladeActivityRelabelNullStudy(founderGraceHabitatAndCrowdingMatchedStudyInput);

  const habitatMatchedNullStudy = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt,
    studyInput: habitatMatchedNullStudyInput,
    baselineStudy: habitatMatchedNullBaselineStudy,
    founderGraceStudy: habitatMatchedNullFounderGraceStudy
  });
  const habitatAndCrowdingMatchedNullStudy = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt,
    studyInput: habitatAndCrowdingMatchedNullStudyInput,
    baselineStudy: habitatAndCrowdingMatchedNullBaselineStudy,
    founderGraceStudy: habitatAndCrowdingMatchedNullFounderGraceStudy
  });

  return {
    generatedAt,
    question:
      'Does founder grace still improve activeCladeDeltaVsNullMean versus the static habitat baseline when the relabel-null matches both founder habitat bins and local crowding bins at birth?',
    prediction:
      'If the founder-grace gain is not just selecting easy founder neighborhoods inside favorable habitats, the founder-grace run should still improve activeCladeDeltaVsNullMean versus the static habitat baseline under the founderHabitatAndCrowdingBin-matched null, even if the gain shrinks again versus the habitat-only matched null.',
    config: {
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      habitatMatchedNullFounderContext: 'founderHabitatBin',
      habitatAndCrowdingMatchedNullFounderContext: 'founderHabitatAndCrowdingBin',
      staticHabitatSimulationConfig: staticHabitatHabitatMatchedStudyInput.simulation?.config ?? {},
      founderGraceSimulationConfig: founderGraceHabitatMatchedStudyInput.simulation?.config ?? {}
    },
    comparison: compareNewCladeEstablishmentFounderCrowdingValidation(
      habitatMatchedNullStudy,
      habitatAndCrowdingMatchedNullStudy,
      habitatAndCrowdingMatchedNullBaselineStudy,
      habitatAndCrowdingMatchedNullFounderGraceStudy
    ),
    habitatMatchedNullStudy,
    habitatAndCrowdingMatchedNullStudy
  };
}

function loadStaticHabitatBaselineStudy(): CladeActivityRelabelNullStudyExport {
  return loadEmbeddedStudyFromArtifact(
    BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT,
    'habitatCoupledStudy',
    'a habitat-coupling horizon study export'
  );
}
export {
  compareNewCladeEstablishmentHorizonStudies
} from './clade-activity-relabel-null-new-clade-establishment-comparisons';
export type {
  CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationComparison,
  CladeActivityRelabelNullNewCladeEstablishmentHorizonComparison
} from './clade-activity-relabel-null-new-clade-establishment-comparisons';

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
