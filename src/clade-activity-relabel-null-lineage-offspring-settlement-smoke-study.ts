import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTIES = [0, 1];

export function runCladeActivityRelabelNullLineageOffspringSettlementSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Lineage offspring settlement smoke study',
        generatedAt,
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
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullLineageOffspringSettlementSmokeStudyCli(process.argv.slice(2));
}
