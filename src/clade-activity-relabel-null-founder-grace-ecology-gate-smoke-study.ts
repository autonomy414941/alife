import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
  FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES as SHARED_FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES,
  FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
  FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS,
  STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE as SHARED_STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  runConfiguredFounderEstablishmentSmokeStudy
} from './clade-activity-relabel-null-founder-establishment-study-helpers';
import {
  emitStudyJsonOutput,
  parseGeneratedAtCli,
} from './clade-activity-relabel-null-smoke-study';

export const FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES =
  SHARED_FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES;
export const FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING =
  FOUNDER_ESTABLISHMENT_CLADE_HABITAT_COUPLING;
export const FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE =
  SHARED_STATIC_HABITAT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE;
export const FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS = FOUNDER_GRACE_SETTLEMENT_GRACE_TICKS;

export interface RunCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy(
  input: RunCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudyInput = {}
) {
  return runConfiguredFounderEstablishmentSmokeStudy(
    FOUNDER_GRACE_ECOLOGY_GATE_SWEEP_DEFINITION,
    FOUNDER_GRACE_FOLLOWUP_FIXED_CONFIG,
    input
  );
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
