import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD_VALUES = [-1, 0.1];

export function runCladeActivityRelabelNullCladogenesisEcologyGateSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Cladogenesis ecology gate smoke study',
        generatedAt,
        question:
          'Does requiring a positive ecology-score improvement before founding a diverged clade improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
        prediction:
          'If weak founder quality is the remaining bottleneck, a small positive cladogenesis ecology gate should improve persistentActivityMeanDeltaVsNullMean without changing the matched birth schedules.',
        settingName: 'cladogenesisEcologyAdvantageThreshold',
        valueConfigName: 'cladogenesisEcologyAdvantageThresholdValues',
        values: CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD_VALUES,
        fixedConfig: BEST_SHORT_STACK_SIMULATION_CONFIG
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullCladogenesisEcologyGateSmokeStudyCli(process.argv.slice(2));
}
