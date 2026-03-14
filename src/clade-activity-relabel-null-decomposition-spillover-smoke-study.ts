import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const DECOMPOSITION_SPILLOVER_FRACTION_VALUES = [0, 0.5];
const { decompositionSpilloverFraction: _decompositionSpilloverFraction, ...FIXED_CONFIG } =
  BEST_SHORT_STACK_SIMULATION_CONFIG;

export function runCladeActivityRelabelNullDecompositionSpilloverSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Decomposition spillover smoke study',
        generatedAt,
        question:
          'Does spilling half of recycled biomass into wrapped cardinal neighbors improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, encounter restraint, and ecology-scored offspring settlement are already enabled?',
        prediction:
          'If point-local decomposition is trapping nutrient feedback too tightly, the 0.5 spillover endpoint should improve persistentWindowFractionDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
        settingName: 'decompositionSpilloverFraction',
        valueConfigName: 'decompositionSpilloverFractionValues',
        values: DECOMPOSITION_SPILLOVER_FRACTION_VALUES,
        fixedConfig: FIXED_CONFIG
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullDecompositionSpilloverSmokeStudyCli(process.argv.slice(2));
}
