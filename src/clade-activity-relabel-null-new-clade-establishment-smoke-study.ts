import { RunCladeActivityRelabelNullStudyInput } from './activity';
import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

export const NEW_CLADE_ESTABLISHMENT_GRACE_TICKS = [0, 36] as const;
export const NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING = 0.75;
export const NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE = 0.2;

export interface RunCladeActivityRelabelNullNewCladeEstablishmentSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy(
  input: RunCladeActivityRelabelNullNewCladeEstablishmentSmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: 'New-clade establishment smoke study',
    generatedAt: input.generatedAt,
    question:
      'Does a short settlement-crowding grace for just-founded clades reduce the remaining active-clade deficit on top of the habitat-memory baseline, or are new clades already surviving long enough once they appear?',
    prediction:
      'If the current habitat stack still loses clades during the first few post-founding settlement attempts, giving newborn clades a short settlement-crowding grace should improve activeCladeDeltaVsNullMean without breaking matched relabel-null birth schedules.',
    settingName: 'newCladeSettlementCrowdingGraceTicks',
    valueConfigName: 'newCladeSettlementCrowdingGraceTicksValues',
    values: NEW_CLADE_ESTABLISHMENT_GRACE_TICKS,
    fixedConfig: {
      ...BEST_SHORT_STACK_SIMULATION_CONFIG,
      cladeHabitatCoupling: NEW_CLADE_ESTABLISHMENT_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: NEW_CLADE_ESTABLISHMENT_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE
    },
    studyInput: input.studyInput
  });
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullNewCladeEstablishmentSmokeStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
