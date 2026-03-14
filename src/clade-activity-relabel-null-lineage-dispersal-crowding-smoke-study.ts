import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const LINEAGE_DISPERSAL_CROWDING_PENALTIES = [0, 1];

export function runCladeActivityRelabelNullLineageDispersalCrowdingSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Lineage dispersal crowding smoke study',
        generatedAt,
        question:
          'Does lineage-aware dispersal aversion improve the short threshold-1.0 relabel-null delta when harvest crowding remains enabled?',
        prediction:
          'If same-lineage over-clustering is still limiting clade persistence, the positive dispersal penalty endpoint should make persistentActivityMeanDeltaVsNullMean less negative than the zero-penalty baseline.',
        settingName: 'lineageDispersalCrowdingPenalty',
        valueConfigName: 'lineageDispersalCrowdingPenaltyValues',
        values: LINEAGE_DISPERSAL_CROWDING_PENALTIES,
        fixedConfig: {
          lineageHarvestCrowdingPenalty: 1
        }
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullLineageDispersalCrowdingSmokeStudyCli(process.argv.slice(2));
}
