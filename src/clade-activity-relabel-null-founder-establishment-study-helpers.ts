import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  BEST_SHORT_STACK_SIMULATION_CONFIG,
  buildCladeActivityRelabelNullBestShortStackStudyInput
} from './clade-activity-relabel-null-best-short-stack';
import { compareCladeActivityRelabelNullStudies } from './clade-activity-relabel-null-best-short-stack-study';
import { runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

type StudySettingValue = boolean | number | string;

export const FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING = 0.75;
export const NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0.2;
export const STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0;
export const NEW_CLADE_ESTABLISHMENT_GRACE_TICKS = [0, 36] as const;
export const FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS = NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[1];
export const FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES = [-1, 0.1] as const;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES = [0, 2] as const;

export const NEW_CLADE_ESTABLISHMENT_SMOKE_FIXED_CONFIG: Partial<SimulationConfig> = {
  ...BEST_SHORT_STACK_SIMULATION_CONFIG,
  cladeHabitatCoupling: FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  adaptiveCladeHabitatMemoryRate: NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
};

export const STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG: Partial<SimulationConfig> = {
  ...BEST_SHORT_STACK_SIMULATION_CONFIG,
  cladeHabitatCoupling: FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  adaptiveCladeHabitatMemoryRate: STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
};

export const FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG: Partial<SimulationConfig> = {
  ...STATIC_HABITAT_FOUNDER_ESTABLISHMENT_FIXED_CONFIG,
  newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS
};

export interface FounderEstablishmentStudySweepDefinition<
  TSettingName extends keyof SimulationConfig & string,
  TValue extends StudySettingValue
> {
  label: string;
  question: string;
  prediction: string;
  settingName: TSettingName;
  valueConfigName?: string;
  values: readonly TValue[];
}

export interface RunFounderEstablishmentSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export interface ResolvedCladeActivityRelabelNullStudyConfig {
  steps: number;
  windowSize: number;
  burnIn: number;
  seeds: number[];
  stopWhenExtinct: boolean;
  minSurvivalTicks: number[];
  cladogenesisThresholds: number[];
}

export interface FounderGraceFollowupComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  currentBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  currentPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  currentPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  currentActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  currentDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export const NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION = {
  label: 'New-clade establishment smoke study',
  question:
    'Does a short settlement-crowding grace for just-founded clades reduce the remaining active-clade deficit on top of the habitat-memory baseline, or are new clades already surviving long enough once they appear?',
  prediction:
    'If the current habitat stack still loses clades during the first few post-founding settlement attempts, giving newborn clades a short settlement-crowding grace should improve activeCladeDeltaVsNullMean without breaking matched relabel-null birth schedules.',
  settingName: 'newCladeSettlementCrowdingGraceTicks',
  valueConfigName: 'newCladeSettlementCrowdingGraceTicksValues',
  values: NEW_CLADE_ESTABLISHMENT_GRACE_TICKS
} as const satisfies FounderEstablishmentStudySweepDefinition<
  'newCladeSettlementCrowdingGraceTicks',
  (typeof NEW_CLADE_ESTABLISHMENT_GRACE_TICKS)[number]
>;

export const FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION = {
  label: 'Founder-grace ecology-gate smoke study',
  question:
    'On the static habitat baseline with founder grace already enabled, does a modest cladogenesis ecology gate recover persistence without giving back the active-clade gain?',
  prediction:
    'If short founder grace is letting weak founders survive long enough to dilute persistence, raising cladogenesisEcologyAdvantageThreshold from -1 to 0.1 should keep birth schedules matched, preserve positive persistent activity, and improve activeCladeDeltaVsNullMean.',
  settingName: 'cladogenesisEcologyAdvantageThreshold',
  valueConfigName: 'cladogenesisEcologyAdvantageThresholdValues',
  values: FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES
} as const satisfies FounderEstablishmentStudySweepDefinition<
  'cladogenesisEcologyAdvantageThreshold',
  (typeof FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES)[number]
>;

export const NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION = {
  label: 'New-clade encounter restraint smoke study',
  question:
    'After founder settlement is already protected, does temporarily boosting same-lineage encounter restraint for just-founded clades reduce the active-clade deficit on the static habitat baseline?',
  prediction:
    'If founders are being thinned by early within-lineage conflict after site acquisition, a newborn-only encounter-restraint boost should improve activeCladeDeltaVsNullMean while keeping matched relabel-null birth schedules and positive persistent activity.',
  settingName: 'newCladeEncounterRestraintGraceBoost',
  valueConfigName: 'newCladeEncounterRestraintGraceBoostValues',
  values: NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES
} as const satisfies FounderEstablishmentStudySweepDefinition<
  'newCladeEncounterRestraintGraceBoost',
  (typeof NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES)[number]
>;

export function runConfiguredFounderEstablishmentSmokeStudy<
  TSettingName extends keyof SimulationConfig & string,
  TValue extends StudySettingValue
>(
  definition: FounderEstablishmentStudySweepDefinition<TSettingName, TValue>,
  fixedConfig: Partial<SimulationConfig>,
  input: RunFounderEstablishmentSmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: definition.label,
    generatedAt: input.generatedAt,
    question: definition.question,
    prediction: definition.prediction,
    settingName: definition.settingName,
    valueConfigName: definition.valueConfigName,
    values: definition.values,
    fixedConfig,
    studyInput: input.studyInput
  });
}

export function buildConfiguredFounderEstablishmentStudyInput<
  TSettingName extends keyof SimulationConfig & string,
  TValue extends StudySettingValue
>(
  definition: FounderEstablishmentStudySweepDefinition<TSettingName, TValue>,
  fixedConfig: Partial<SimulationConfig>,
  studyInput: RunCladeActivityRelabelNullStudyInput | undefined,
  generatedAt: string,
  value: TValue
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullBestShortStackStudyInput(
    {
      ...studyInput,
      simulation: {
        ...studyInput?.simulation,
        config: {
          ...(studyInput?.simulation?.config ?? {}),
          ...fixedConfig,
          [definition.settingName]: value
        }
      }
    },
    generatedAt
  );
}

export function requireResolvedStudyConfig(
  studyInput: RunCladeActivityRelabelNullStudyInput,
  label: string
): ResolvedCladeActivityRelabelNullStudyConfig {
  if (
    studyInput.steps === undefined ||
    studyInput.windowSize === undefined ||
    studyInput.burnIn === undefined ||
    studyInput.seeds === undefined ||
    studyInput.stopWhenExtinct === undefined ||
    studyInput.minSurvivalTicks === undefined ||
    studyInput.cladogenesisThresholds === undefined
  ) {
    throw new Error(`${label} requires a fully resolved study input`);
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

export function loadEmbeddedStudyFromArtifact(
  artifactPath: string,
  exportKey: string,
  exportDescription: string
): CladeActivityRelabelNullStudyExport {
  const baselineArtifactPath = resolve(__dirname, '..', artifactPath);
  const parsed = JSON.parse(readFileSync(baselineArtifactPath, 'utf8')) as Record<string, unknown>;
  const candidate = parsed[exportKey];

  if (!isCladeActivityRelabelNullStudyExport(candidate)) {
    throw new Error(`Baseline artifact ${artifactPath} is not ${exportDescription}`);
  }

  return candidate;
}

export function compareFounderGraceFollowupStudies(
  currentStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport,
  currentLabel: string
): FounderGraceFollowupComparison[] {
  return compareCladeActivityRelabelNullStudies(currentStudy, baselineStudy).map((comparison) => {
    const baselineThresholdResult = baselineStudy.thresholdResults.find(
      (thresholdResult) => thresholdResult.cladogenesisThreshold === comparison.cladogenesisThreshold
    );
    if (!baselineThresholdResult) {
      throw new Error(
        `Baseline study is missing cladogenesis threshold ${comparison.cladogenesisThreshold}`
      );
    }

    const founderGraceActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      'Founder-grace baseline',
      comparison.baselineDiagnostics
    );
    const currentActiveCladeDeltaVsNullMean = requireActiveCladeDeltaVsNullMean(
      currentLabel,
      comparison.currentDiagnostics
    );

    return {
      cladogenesisThreshold: comparison.cladogenesisThreshold,
      minSurvivalTicks: comparison.minSurvivalTicks,
      founderGraceBirthScheduleMatchedAllSeeds: baselineThresholdResult.seedResults.every(
        (seedResult) => seedResult.birthScheduleMatched
      ),
      currentBirthScheduleMatchedAllSeeds: comparison.birthScheduleMatchedAllSeeds,
      founderGracePersistentWindowFractionDeltaVsNullMean:
        comparison.baselinePersistentWindowFractionDeltaVsNullMean,
      currentPersistentWindowFractionDeltaVsNullMean:
        comparison.currentPersistentWindowFractionDeltaVsNullMean,
      persistentWindowFractionDeltaImprovementVsFounderGrace:
        comparison.persistentWindowFractionDeltaImprovementVsBaseline,
      founderGracePersistentActivityMeanDeltaVsNullMean:
        comparison.baselinePersistentActivityMeanDeltaVsNullMean,
      currentPersistentActivityMeanDeltaVsNullMean:
        comparison.currentPersistentActivityMeanDeltaVsNullMean,
      persistentActivityMeanImprovementVsFounderGrace:
        comparison.persistentActivityMeanImprovementVsBaseline,
      founderGraceActiveCladeDeltaVsNullMean,
      currentActiveCladeDeltaVsNullMean,
      activeCladeDeltaImprovementVsFounderGrace:
        currentActiveCladeDeltaVsNullMean - founderGraceActiveCladeDeltaVsNullMean,
      founderGraceDiagnostics: comparison.baselineDiagnostics,
      currentDiagnostics: comparison.currentDiagnostics
    };
  });
}

function isCladeActivityRelabelNullStudyExport(
  value: unknown
): value is CladeActivityRelabelNullStudyExport {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { thresholdResults?: unknown }).thresholdResults) &&
    (value as { thresholdResults: unknown[] }).thresholdResults.length > 0
  );
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
