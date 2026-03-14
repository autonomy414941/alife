import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES,
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  FounderEstablishmentStudySweepDefinition,
  FounderGraceFollowupComparison,
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES,
  NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
  ResolvedCladeActivityRelabelNullStudyConfig,
  buildConfiguredFounderEstablishmentStudyInput,
  compareFounderGraceFollowupStudies,
  loadEmbeddedStudyFromArtifact,
  requireResolvedStudyConfig
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import { CladeActivityRelabelNullStudyExport, SimulationConfig } from './types';

type FounderGraceFollowupSettingValue = boolean | number | string;

export const FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_establishment_horizon_2026-03-14.json';

export interface FounderGraceFollowupHorizonDefinition<
  TSettingName extends keyof SimulationConfig & string,
  TValue extends FounderGraceFollowupSettingValue
> {
  artifact: string;
  baselineArtifact: string;
  baselineExportKey: string;
  baselineExportDescription: string;
  horizonStudyLabel: string;
  question: string;
  prediction: string;
  comparisonLabel: string;
  sweepDefinition: FounderEstablishmentStudySweepDefinition<TSettingName, TValue>;
  fixedConfig: Partial<SimulationConfig>;
  baselineValue: TValue;
  currentValue: TValue;
}

export interface RunConfiguredFounderGraceFollowupHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  currentStudy?: CladeActivityRelabelNullStudyExport;
}

export interface ConfiguredFounderGraceFollowupHorizonStudyResult {
  generatedAt: string;
  question: string;
  prediction: string;
  resolvedStudyConfig: ResolvedCladeActivityRelabelNullStudyConfig;
  baselineStudyInput: RunCladeActivityRelabelNullStudyInput;
  currentStudyInput: RunCladeActivityRelabelNullStudyInput;
  baselineStudy: CladeActivityRelabelNullStudyExport;
  currentStudy: CladeActivityRelabelNullStudyExport;
  comparison: FounderGraceFollowupComparison[];
}

export const FOUNDER_GRACE_FOLLOWUP_HORIZON_DEFINITIONS = {
  newCladeEncounterRestraint: {
    artifact: 'docs/clade_activity_relabel_null_new_clade_encounter_restraint_horizon_2026-03-14.json',
    baselineArtifact: FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT,
    baselineExportKey: 'founderGraceStudy',
    baselineExportDescription: 'a new-clade establishment horizon study export',
    horizonStudyLabel: 'New-clade encounter-restraint horizon study',
    question:
      'Does newCladeEncounterRestraintGraceBoost=2 preserve the short-horizon newborn encounter-restraint gain on the canonical 4000-step relabel-null panel when compared against the founder-grace static habitat baseline?',
    prediction:
      'If post-founding same-lineage conflict still suppresses concurrent clade survival after settlement grace, the encounter-restraint run should improve activeCladeDeltaVsNullMean versus the boost-0 founder-grace baseline while keeping matched birth schedules on the canonical horizon surface.',
    comparisonLabel: 'Encounter-restraint study',
    sweepDefinition: NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
    fixedConfig: FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    baselineValue: NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[0],
    currentValue: NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[1]
  },
  founderGraceEcologyGate: {
    artifact: 'docs/clade_activity_relabel_null_founder_grace_ecology_gate_horizon_2026-03-14.json',
    baselineArtifact: FOUNDER_GRACE_BASELINE_HORIZON_ARTIFACT,
    baselineExportKey: 'founderGraceStudy',
    baselineExportDescription: 'a new-clade establishment horizon study export',
    horizonStudyLabel: 'Founder-grace ecology-gate horizon study',
    question:
      'Does cladogenesisEcologyAdvantageThreshold=0.1 preserve or improve founder-grace coexistence on the canonical 4000-step relabel-null panel when compared against the founder-grace baseline at -1?',
    prediction:
      'If ecology gating filters weak founders rather than broadly suppressing new clades, the 0.1 run should improve activeCladeDeltaVsNullMean versus the -1 founder-grace baseline and recover threshold-1.0 persistent activity while keeping matched birth schedules.',
    comparisonLabel: 'Ecology-gate study',
    sweepDefinition: FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
    fixedConfig: FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    baselineValue: FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES[0],
    currentValue: FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES[1]
  }
} as const;

export function runConfiguredFounderGraceFollowupHorizonStudy<
  TSettingName extends keyof SimulationConfig & string,
  TValue extends FounderGraceFollowupSettingValue
>(
  definition: FounderGraceFollowupHorizonDefinition<TSettingName, TValue>,
  input: RunConfiguredFounderGraceFollowupHorizonStudyInput = {}
): ConfiguredFounderGraceFollowupHorizonStudyResult {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baselineStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    definition.sweepDefinition,
    definition.fixedConfig,
    input.studyInput,
    generatedAt,
    definition.baselineValue
  );
  const currentStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    definition.sweepDefinition,
    definition.fixedConfig,
    input.studyInput,
    generatedAt,
    definition.currentValue
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(
    currentStudyInput,
    definition.horizonStudyLabel
  );
  const baselineStudy =
    input.baselineStudy ??
    loadEmbeddedStudyFromArtifact(
      definition.baselineArtifact,
      definition.baselineExportKey,
      definition.baselineExportDescription
    );
  const currentStudy = input.currentStudy ?? runCladeActivityRelabelNullStudy(currentStudyInput);

  return {
    generatedAt,
    question: definition.question,
    prediction: definition.prediction,
    resolvedStudyConfig,
    baselineStudyInput,
    currentStudyInput,
    baselineStudy,
    currentStudy,
    comparison: compareFounderGraceFollowupStudies(
      currentStudy,
      baselineStudy,
      definition.comparisonLabel
    )
  };
}
