import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const DECOMPOSITION_SPILLOVER_FRACTION_VALUES = [0, 0.5];
const { decompositionSpilloverFraction: _decompositionSpilloverFraction, ...FIXED_CONFIG } =
  BEST_SHORT_STACK_SIMULATION_CONFIG;
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Decomposition spillover smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does spilling half of recycled biomass into wrapped cardinal neighbors improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, encounter restraint, and ecology-scored offspring settlement are already enabled?',
  prediction:
    'If point-local decomposition is trapping nutrient feedback too tightly, the 0.5 spillover endpoint should improve persistentWindowFractionDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
  settingName: 'decompositionSpilloverFraction',
  valueConfigName: 'decompositionSpilloverFractionValues',
  values: DECOMPOSITION_SPILLOVER_FRACTION_VALUES,
  fixedConfig: FIXED_CONFIG
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
