import { RunCladeActivityRelabelNullStudyInput } from './activity';
import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';
import { NEW_CLADE_ESTABLISHMENT_GRACE_TICKS } from './clade-activity-relabel-null-new-clade-establishment-smoke-study';

export const NEW_CLADE_ENCOUNTER_RESTRAINT_SMOKE_ARTIFACT =
  'docs/clade_activity_relabel_null_new_clade_encounter_restraint_smoke_2026-03-14.json';
export const NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES = [0, 2] as const;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING = 0.75;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0;
export const NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS = NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[1];

export interface RunCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy(
  input: RunCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: 'New-clade encounter restraint smoke study',
    generatedAt: input.generatedAt,
    question:
      'After founder settlement is already protected, does temporarily boosting same-lineage encounter restraint for just-founded clades reduce the active-clade deficit on the static habitat baseline?',
    prediction:
      'If founders are being thinned by early within-lineage conflict after site acquisition, a newborn-only encounter-restraint boost should improve activeCladeDeltaVsNullMean while keeping matched relabel-null birth schedules and positive persistent activity.',
    settingName: 'newCladeEncounterRestraintGraceBoost',
    valueConfigName: 'newCladeEncounterRestraintGraceBoostValues',
    values: NEW_CLADE_ENCOUNTER_RESTRAINT_GRACE_BOOST_VALUES,
    fixedConfig: {
      ...BEST_SHORT_STACK_SIMULATION_CONFIG,
      cladeHabitatCoupling: NEW_CLADE_ENCOUNTER_RESTRAINT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ENCOUNTER_RESTRAINT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: NEW_CLADE_ENCOUNTER_RESTRAINT_SETTLEMENT_GRACE_TICKS
    },
    studyInput: input.studyInput
  });
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEncounterRestraintSmokeStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
