import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const ENCOUNTER_RISK_AVERSION_VALUES = [0, 1];
const { encounterRiskAversion: _encounterRiskAversion, ...FIXED_CONFIG } = BEST_SHORT_STACK_SIMULATION_CONFIG;
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Encounter-risk smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does opt-in encounter-risk aversion improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, encounter restraint, and ecology-scored offspring settlement are already enabled?',
  prediction:
    'If risk-blind cell choice is still concentrating vulnerable agents into harmful encounters, the risk-aware endpoint should improve persistentWindowFractionDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
  settingName: 'encounterRiskAversion',
  valueConfigName: 'encounterRiskAversionValues',
  values: ENCOUNTER_RISK_AVERSION_VALUES,
  fixedConfig: FIXED_CONFIG
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
