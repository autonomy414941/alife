import { RunCladeActivityRelabelNullStudyInput } from './activity';
import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

export const ADAPTIVE_CLADE_HABITAT_MEMORY_RATES = [0, 0.2] as const;
export const ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING = 0.75;

export interface RunCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudy(
  input: RunCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: 'Adaptive clade habitat memory smoke study',
    generatedAt: input.generatedAt,
    question:
      'Does a small adaptive update to clade habitat memory reduce the remaining active-clade deficit on top of the best short stack plus cladeHabitatCoupling=0.75, or was the new persistence gain relying on founder-locked habitat memory?',
    prediction:
      'If founder-locked clade habitat memory is still overconstraining descendants after the habitat-coupling gain, a small settlement-weighted memory update should improve activeCladeDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean without breaking matched relabel-null birth schedules.',
    settingName: 'adaptiveCladeHabitatMemoryRate',
    valueConfigName: 'adaptiveCladeHabitatMemoryRates',
    values: ADAPTIVE_CLADE_HABITAT_MEMORY_RATES,
    fixedConfig: {
      ...BEST_SHORT_STACK_SIMULATION_CONFIG,
      cladeHabitatCoupling: ADAPTIVE_CLADE_HABITAT_MEMORY_CLADE_HABITAT_COUPLING
    },
    studyInput: input.studyInput
  });
}

export function runCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudy({
        generatedAt
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullAdaptiveCladeHabitatMemorySmokeStudyCli(process.argv.slice(2));
}
