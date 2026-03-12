import { buildBestShortStackSimulationConfig } from './clade-activity-relabel-null-best-short-stack';
import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD = -1;
const CLADOGENESIS_TRAIT_NOVELTY_THRESHOLD_VALUES = [-1, 0.02];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Cladogenesis trait novelty smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does requiring ecological trait novelty before cladogenesis improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
  prediction:
    'If redundant founders are diluting persistent activity, a small positive trait-novelty gate should improve persistentActivityMeanDeltaVsNullMean while keeping the relabel-null birth schedules matched within each setting.',
  settingName: 'cladogenesisTraitNoveltyThreshold',
  valueConfigName: 'cladogenesisTraitNoveltyThresholdValues',
  values: CLADOGENESIS_TRAIT_NOVELTY_THRESHOLD_VALUES,
  fixedConfig: buildBestShortStackSimulationConfig({
    cladogenesisEcologyAdvantageThreshold: CLADOGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD
  })
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
