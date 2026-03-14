import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS,
  NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES as SHARED_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES,
  NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
  STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE as SHARED_STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  runConfiguredFounderEstablishmentSmokeStudy
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';

export const NEW_CLADE_ENCOUNTER_RESTRAINT_SMOKE_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_encounter_restraint_smoke_2026-03-14.json';
export const NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES =
  SHARED_NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING =
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE =
  SHARED_STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS = FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS;

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudyInput = {}
) {
  return runConfiguredFounderEstablishmentSmokeStudy(
    NEW_CLADE_ENCOUNTER_RESTRAINT_SWEEP_DEFINITION,
    FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    input
  );
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
