import {
  BEST_SHORT_STACK_SIMULATION_CONFIG,
  buildBestShortStackSimulationConfig
} from './clade-activity-relabel-null-best-short-stack';
import { RunCladeActivityRelabelNullStudyInput } from './activity';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

export const DISTURBANCE_COLONIZATION_MODES = [
  'off',
  'localizedOpening',
  'localizedOpeningLineageAbsent'
] as const;

export type DisturbanceColonizationMode = (typeof DISTURBANCE_COLONIZATION_MODES)[number];

export interface RunCladeActivityRelabelNullDisturbanceColonizationSmokeStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

export function runCladeActivityRelabelNullDisturbanceColonizationSmokeStudy(
  input: RunCladeActivityRelabelNullDisturbanceColonizationSmokeStudyInput = {}
) {
  return runCladeActivityRelabelNullSmokeStudy({
    label: 'Disturbance colonization smoke study',
    generatedAt: input.generatedAt,
    question:
      'Can localized disturbance plus temporary offspring-settlement openings, especially when bonus access is limited to lineages not already locally present, reduce the best short stack active-clade deficit without breaking matched relabel-null birth schedules?',
    prediction:
      'If the current short-stack loss is partly caused by dominant clades instantly refilling every vacancy, the lineage-absent opening mode should improve activeCladeDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean versus both the disturbance-off baseline and the generic localized opening regime.',
    settingName: 'disturbanceMode',
    valueConfigName: 'disturbanceModes',
    values: DISTURBANCE_COLONIZATION_MODES,
    fixedConfig: BEST_SHORT_STACK_SIMULATION_CONFIG,
    studyInput: input.studyInput,
    buildSettingConfig: (mode: DisturbanceColonizationMode) =>
      mode === 'off'
        ? {
            disturbanceInterval: 0,
            disturbanceEnergyLoss: 0,
            disturbanceResourceLoss: 0,
            disturbanceRadius: -1,
            disturbanceRefugiaFraction: 0,
            disturbanceSettlementOpeningTicks: 0,
            disturbanceSettlementOpeningBonus: 0,
            disturbanceSettlementOpeningLineageAbsentOnly: false
          }
        : buildBestShortStackSimulationConfig({
            disturbanceInterval: 50,
            disturbanceEnergyLoss: 0.5,
            disturbanceResourceLoss: 0,
            disturbanceRadius: 2,
            disturbanceRefugiaFraction: 0.5,
            disturbanceSettlementOpeningTicks: 10,
            disturbanceSettlementOpeningBonus: 0.75,
            disturbanceSettlementOpeningLineageAbsentOnly: mode === 'localizedOpeningLineageAbsent'
          })
  });
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const study = runCladeActivityRelabelNullDisturbanceColonizationSmokeStudy({
    generatedAt: options.generatedAt
  });
  process.stdout.write(JSON.stringify(study, null, 2) + '\n');
}
