import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
  STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
  buildConfiguredFounderEstablishmentStudyInput,
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
import { CladeActivityRelabelNullStudyExport, SimulationConfig } from './types';

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

export const HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING =
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE = STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE;
export const HORIZON_BASELINE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS =
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[0];
export const HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS = FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS;

export function buildHorizonStudyExport(
  generatedAt: string,
  question: string,
  prediction: string,
  baselineArtifact: string,
  bestShortStackBaselineArtifact: string,
  staticHabitatStudyInput: RunCladeActivityRelabelNullStudyInput,
  founderGraceStudyInput: RunCladeActivityRelabelNullStudyInput,
  baselineStudy: CladeActivityRelabelNullStudyExport,
  founderGraceStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport {
  const resolvedStudyConfig = requireResolvedStudyConfig(
    founderGraceStudyInput,
    'buildHorizonStudyExport'
  );

  return {
    generatedAt,
    question,
    prediction,
    config: {
      baselineArtifact,
      bestShortStackBaselineArtifact,
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

export function buildFounderHabitatValidationExport(
  generatedAt: string,
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  currentNullBaselineStudy: CladeActivityRelabelNullStudyExport | undefined,
  currentNullFounderGraceStudy: CladeActivityRelabelNullStudyExport | undefined,
  habitatMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport | undefined,
  habitatMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport | undefined,
  buildHorizonStudy: (
    generatedAt: string,
    studyInput: RunCladeActivityRelabelNullStudyInput,
    baselineStudy: CladeActivityRelabelNullStudyExport,
    founderGraceStudy: CladeActivityRelabelNullStudyExport
  ) => CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentFounderHabitatValidationStudyExport {
  const currentNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...studyInput,
    matchedNullFounderContext: 'none'
  };
  const habitatMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...studyInput,
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
    'buildFounderHabitatValidationExport'
  );

  const currentNullBaselineStudyResolved =
    currentNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatCurrentNullStudyInput);
  const currentNullFounderGraceStudyResolved =
    currentNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceCurrentNullStudyInput);
  const habitatMatchedNullBaselineStudyResolved =
    habitatMatchedNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatHabitatMatchedStudyInput);
  const habitatMatchedNullFounderGraceStudyResolved =
    habitatMatchedNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceHabitatMatchedStudyInput);

  const currentNullStudy = buildHorizonStudy(
    generatedAt,
    currentNullStudyInput,
    currentNullBaselineStudyResolved,
    currentNullFounderGraceStudyResolved
  );
  const habitatMatchedNullStudy = buildHorizonStudy(
    generatedAt,
    habitatMatchedNullStudyInput,
    habitatMatchedNullBaselineStudyResolved,
    habitatMatchedNullFounderGraceStudyResolved
  );

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
      habitatMatchedNullBaselineStudyResolved,
      habitatMatchedNullFounderGraceStudyResolved
    ),
    currentNullStudy,
    habitatMatchedNullStudy
  };
}

export function buildFounderCrowdingValidationExport(
  generatedAt: string,
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  habitatMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport | undefined,
  habitatMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport | undefined,
  habitatAndCrowdingMatchedNullBaselineStudy: CladeActivityRelabelNullStudyExport | undefined,
  habitatAndCrowdingMatchedNullFounderGraceStudy: CladeActivityRelabelNullStudyExport | undefined,
  buildHorizonStudy: (
    generatedAt: string,
    studyInput: RunCladeActivityRelabelNullStudyInput,
    baselineStudy: CladeActivityRelabelNullStudyExport,
    founderGraceStudy: CladeActivityRelabelNullStudyExport
  ) => CladeActivityRelabelNullNewCladeEstablishmentHorizonStudyExport
): CladeActivityRelabelNullNewCladeEstablishmentFounderCrowdingValidationStudyExport {
  const habitatMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...studyInput,
    matchedNullFounderContext: 'founderHabitatBin'
  };
  const habitatAndCrowdingMatchedNullStudyInput: RunCladeActivityRelabelNullStudyInput = {
    ...studyInput,
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
    'buildFounderCrowdingValidationExport'
  );

  const habitatMatchedNullBaselineStudyResolved =
    habitatMatchedNullBaselineStudy ?? runCladeActivityRelabelNullStudy(staticHabitatHabitatMatchedStudyInput);
  const habitatMatchedNullFounderGraceStudyResolved =
    habitatMatchedNullFounderGraceStudy ?? runCladeActivityRelabelNullStudy(founderGraceHabitatMatchedStudyInput);
  const habitatAndCrowdingMatchedNullBaselineStudyResolved =
    habitatAndCrowdingMatchedNullBaselineStudy ??
    runCladeActivityRelabelNullStudy(staticHabitatHabitatAndCrowdingMatchedStudyInput);
  const habitatAndCrowdingMatchedNullFounderGraceStudyResolved =
    habitatAndCrowdingMatchedNullFounderGraceStudy ??
    runCladeActivityRelabelNullStudy(founderGraceHabitatAndCrowdingMatchedStudyInput);

  const habitatMatchedNullStudy = buildHorizonStudy(
    generatedAt,
    habitatMatchedNullStudyInput,
    habitatMatchedNullBaselineStudyResolved,
    habitatMatchedNullFounderGraceStudyResolved
  );
  const habitatAndCrowdingMatchedNullStudy = buildHorizonStudy(
    generatedAt,
    habitatAndCrowdingMatchedNullStudyInput,
    habitatAndCrowdingMatchedNullBaselineStudyResolved,
    habitatAndCrowdingMatchedNullFounderGraceStudyResolved
  );

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
      habitatAndCrowdingMatchedNullBaselineStudyResolved,
      habitatAndCrowdingMatchedNullFounderGraceStudyResolved
    ),
    habitatMatchedNullStudy,
    habitatAndCrowdingMatchedNullStudy
  };
}
