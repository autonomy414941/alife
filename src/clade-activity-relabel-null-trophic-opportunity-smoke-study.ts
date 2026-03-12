import { BEST_SHORT_STACK_SIMULATION_CONFIG } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const TROPHIC_OPPORTUNITY_ATTRACTION_VALUES = [0, 1];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Trophic opportunity smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does adding prey-opportunity attraction improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
  prediction:
    'If trophic traits need spatial opportunity before encounters to matter, the attraction-on endpoint should improve persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
  settingName: 'trophicOpportunityAttraction',
  valueConfigName: 'trophicOpportunityAttractionValues',
  values: TROPHIC_OPPORTUNITY_ATTRACTION_VALUES,
  fixedConfig: BEST_SHORT_STACK_SIMULATION_CONFIG
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
