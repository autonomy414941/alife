import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD_VALUES = [-1, 0.1];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Cladogenesis ecology gate smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does requiring a positive ecology-score improvement before founding a diverged clade improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
  prediction:
    'If weak founder quality is the remaining bottleneck, a small positive cladogenesis ecology gate should improve persistentActivityMeanDeltaVsNullMean without changing the matched birth schedules.',
  settingName: 'cladogenesisEcologyAdvantageThreshold',
  valueConfigName: 'cladogenesisEcologyAdvantageThresholdValues',
  values: CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD_VALUES,
  fixedConfig: BEST_SHORT_STACK_SIMULATION_CONFIG
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
