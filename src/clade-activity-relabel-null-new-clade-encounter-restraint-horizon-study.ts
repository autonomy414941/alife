import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import {
  BASELINE_CLADE_HABITAT_COUPLING_HORIZON_ARTIFACT as STATIC_HABITAT_BASELINE_ARTIFACT,
  HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
  HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE
} from './clade-activity-relabel-null-new-clade-establishment-horizon-study';
import {
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES
} from './clade-activity-relabel-null-new-clade-encounter-restraint-smoke-study';
import {
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
  buildConfiguredFounderEstablishmentStudyInput,
  compareFounderGraceFollowupStudies,
  loadEmbeddedStudyFromArtifact,
  requireResolvedStudyConfig
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

const QUESTION =
  'Does newCladeEncounterRestraintGraceBoost=2 preserve the short-horizon newborn encounter-restraint gain on the canonical 4000-step relabel-null panel when compared against the founder-grace static habitat baseline?';
const PREDICTION =
  'If post-founding same-lineage conflict still suppresses concurrent clade survival after settlement grace, the encounter-restraint run should improve activeCladeDeltaVsNullMean versus the boost-0 founder-grace baseline while keeping matched birth schedules on the canonical horizon surface.';

export const BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_establishment_horizon_2026-03-14.json';
export const NEW_CLADE_ENCOUNTER_RESTRAINT_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_encounter_restraint_horizon_2026-03-14.json';
export const HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST =
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[0];
export const HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST =
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES[1];

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  founderGraceBirthScheduleMatchedAllSeeds: boolean;
  encounterRestraintBirthScheduleMatchedAllSeeds: boolean;
  founderGracePersistentWindowFractionDeltaVsNullMean: number;
  encounterRestraintPersistentWindowFractionDeltaVsNullMean: number;
  persistentWindowFractionDeltaImprovementVsFounderGrace: number;
  founderGracePersistentActivityMeanDeltaVsNullMean: number;
  encounterRestraintPersistentActivityMeanDeltaVsNullMean: number;
  persistentActivityMeanImprovementVsFounderGrace: number;
  founderGraceActiveCladeDeltaVsNullMean: number;
  encounterRestraintActiveCladeDeltaVsNullMean: number;
  activeCladeDeltaImprovementVsFounderGrace: number;
  founderGraceDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
  encounterRestraintDiagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    baselineArtifact: string;
    staticHabitatBaselineArtifact: string;
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    newCladeSettlementCrowdingGraceTicks: number;
    baselineNewCladeEncounterRestraintGraceBoost: number;
    encounterRestraintNewCladeEncounterRestraintGraceBoost: number;
    founderGraceSimulationConfig: Partial<SimulationConfig>;
    encounterRestraintSimulationConfig: Partial<SimulationConfig>;
  };
  comparison: CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[];
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport;
}

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  baselineStudy?: CladeActivityRelabelNullStudyExport;
  encounterRestraintStudy?: CladeActivityRelabelNullStudyExport;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyInput = {}
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const founderGraceStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
    FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST
  );
  const encounterRestraintStudyInput = buildConfiguredFounderEstablishmentStudyInput(
    NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
    FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    input.studyInput,
    generatedAt,
    HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST
  );
  const resolvedStudyConfig = requireResolvedStudyConfig(
    encounterRestraintStudyInput,
    'New-clade encounter-restraint horizon study'
  );
  const baselineStudy = input.baselineStudy ?? loadFounderGraceBaselineStudy();
  const encounterRestraintStudy =
    input.encounterRestraintStudy ?? runCladeActivityRelabelNullStudy(encounterRestraintStudyInput);

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      baselineArtifact: BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
      staticHabitatBaselineArtifact: STATIC_HABITAT_BASELINE_ARTIFACT,
      steps: resolvedStudyConfig.steps,
      windowSize: resolvedStudyConfig.windowSize,
      burnIn: resolvedStudyConfig.burnIn,
      seeds: resolvedStudyConfig.seeds,
      stopWhenExtinct: resolvedStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedStudyConfig.cladogenesisThresholds,
      cladeHabitatCoupling: HORIZON_NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: HORIZON_STATIC_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: HORIZON_FOUNDER_GRACE_NEW_CLADE_SETTLEMENT_CROWDING_GRACE_TICKS,
      baselineNewCladeEncounterRestraintGraceBoost:
        HORIZON_BASELINE_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      encounterRestraintNewCladeEncounterRestraintGraceBoost:
        HORIZON_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST,
      founderGraceSimulationConfig: founderGraceStudyInput.simulation?.config ?? {},
      encounterRestraintSimulationConfig: encounterRestraintStudyInput.simulation?.config ?? {}
    },
    comparison: compareNewCladeEncounterRestraintHorizonStudies(encounterRestraintStudy, baselineStudy),
    encounterRestraintStudy
  };
}

export function compareNewCladeEncounterRestraintHorizonStudies(
  encounterRestraintStudy: CladeActivityRelabelNullStudyExport,
  baselineStudy: CladeActivityRelabelNullStudyExport
): CladeActivityRelabelNullNewCladeEncounterRestraintHorizonComparison[] {
  return compareFounderGraceFollowupStudies(
    encounterRestraintStudy,
    baselineStudy,
    'Encounter-restraint study'
  ).map((comparison) => ({
    cladogenesisThreshold: comparison.cladogenesisThreshold,
    minSurvivalTicks: comparison.minSurvivalTicks,
    founderGraceBirthScheduleMatchedAllSeeds: comparison.founderGraceBirthScheduleMatchedAllSeeds,
    encounterRestraintBirthScheduleMatchedAllSeeds: comparison.currentBirthScheduleMatchedAllSeeds,
    founderGracePersistentWindowFractionDeltaVsNullMean:
      comparison.founderGracePersistentWindowFractionDeltaVsNullMean,
    encounterRestraintPersistentWindowFractionDeltaVsNullMean:
      comparison.currentPersistentWindowFractionDeltaVsNullMean,
    persistentWindowFractionDeltaImprovementVsFounderGrace:
      comparison.persistentWindowFractionDeltaImprovementVsFounderGrace,
    founderGracePersistentActivityMeanDeltaVsNullMean:
      comparison.founderGracePersistentActivityMeanDeltaVsNullMean,
    encounterRestraintPersistentActivityMeanDeltaVsNullMean:
      comparison.currentPersistentActivityMeanDeltaVsNullMean,
    persistentActivityMeanImprovementVsFounderGrace:
      comparison.persistentActivityMeanImprovementVsFounderGrace,
    founderGraceActiveCladeDeltaVsNullMean: comparison.founderGraceActiveCladeDeltaVsNullMean,
    encounterRestraintActiveCladeDeltaVsNullMean: comparison.currentActiveCladeDeltaVsNullMean,
    activeCladeDeltaImprovementVsFounderGrace:
      comparison.activeCladeDeltaImprovementVsFounderGrace,
    founderGraceDiagnostics: comparison.founderGraceDiagnostics,
    encounterRestraintDiagnostics: comparison.currentDiagnostics
  }));
}

function loadFounderGraceBaselineStudy(): CladeActivityRelabelNullStudyExport {
  return loadEmbeddedStudyFromArtifact(
    BASELINE_NEW_CLADE_ESTABLISHMENT_HORIZON_ARTIFACT,
    'founderGraceStudy',
    'a new-clade establishment horizon study export'
  );
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEncounterRestraintHorizonStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
