import { RunCladeActivityRelabelNullStudyInput } from './activity';
import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { NEW_CLADE_ESTABLISHMENT_GRACE_TICKS } from './clade-activity-relabel-null-new-clade-establishment-smoke-study';
import {
  emitStudyJsonOutput,
  parseGeneratedAtCli,
  runCladeActivityRelabelNullSmokeStudy
} from './clade-activity-relabel-null-smoke-study';

export const FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES = [-1, 0.1] as const;
export const FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING = 0.75;
export const FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0;
export const FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS = NEW_CLADE_ESTABLISHMENT_GRACE_TICKS[1];

export interface RunCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy(
  input: RunCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: 'Founder-grace ecology-gate smoke study',
    generatedAt: input.generatedAt,
    question:
      'On the static habitat baseline with founder grace already enabled, does a modest cladogenesis ecology gate recover persistence without giving back the active-clade gain?',
    prediction:
      'If short founder grace is letting weak founders survive long enough to dilute persistence, raising cladogenesisEcologyAdvantageThreshold from -1 to 0.1 should keep birth schedules matched, preserve positive persistent activity, and improve activeCladeDeltaVsNullMean.',
    settingName: 'cladogenesisEcologyAdvantageThreshold',
    valueConfigName: 'cladogenesisEcologyAdvantageThresholdValues',
    values: FOUNDER_GRACE_ECOLOGY_GATE_THRESHOLD_VALUES,
    fixedConfig: {
      ...BEST_SHORT_STACK_SIMULATION_CONFIG,
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
    },
    studyInput: input.studyInput
  });
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullFounderGraceEcologyGateSmokeStudy({
    generatedAt: options.generatedAt
  });
  emitStudyJsonOutput(study, options);
}
