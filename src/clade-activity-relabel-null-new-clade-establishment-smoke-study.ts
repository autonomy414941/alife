import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE as SHARED_NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  NEW_CLADE_ESTABLISHMENT_GRACE_TICKS as SHARED_NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
  NEW_CLADE_ESTABLISHMENT_SMOKE_FIXED_CONFIG,
  NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
  runConfiguredFounderEstablishmentSmokeStudy
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';

export const NEW_CLADE_ESTABLISHMENT_GRACE_TICKS = SHARED_NEW_CLADE_ESTABLISHMENT_GRACE_TICKS;
export const NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING = FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE =
  SHARED_NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE;

export interface RunCladeActivityRelabelNullNewCladeEstablishmentSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentSmokeStudyInput = {}
) {
  return runConfiguredFounderEstablishmentSmokeStudy(
    NEW_CLADE_ESTABLISHMENT_SWEEP_DEFINITION,
    NEW_CLADE_ESTABLISHMENT_SMOKE_FIXED_CONFIG,
    input
  );
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
