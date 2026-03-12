import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTIES = [0, 1];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Lineage offspring settlement smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does lineage-aware offspring settlement improve the short threshold-1.0 relabel-null delta when harvest and adult dispersal crowding both remain enabled?',
  prediction:
    'If births are still re-clustering kin, the positive offspring-settlement penalty endpoint should match or exceed the current short persistentActivityMeanDeltaVsNullMean baseline.',
  settingName: 'lineageOffspringSettlementCrowdingPenalty',
  valueConfigName: 'lineageOffspringSettlementCrowdingPenaltyValues',
  values: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTIES,
  fixedConfig: {
    lineageHarvestCrowdingPenalty: 1,
    lineageDispersalCrowdingPenalty: 1
  }
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
