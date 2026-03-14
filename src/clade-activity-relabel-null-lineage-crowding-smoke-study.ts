import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const LINEAGE_HARVEST_CROWDING_PENALTIES = [0, 1];

export function runCladeActivityRelabelNullLineageCrowdingSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Lineage crowding smoke study',
        generatedAt,
        question:
          'Does lineage-local harvest self-limitation move the short threshold-1.0 relabel-null delta upward without breaking the matched birth schedule?',
        prediction:
          'If rare-clade advantage matters here, the positive penalty endpoint should make persistentActivityMeanDeltaVsNullMean less negative than the zero-penalty baseline.',
        settingName: 'lineageHarvestCrowdingPenalty',
        valueConfigName: 'lineageHarvestCrowdingPenaltyValues',
        values: LINEAGE_HARVEST_CROWDING_PENALTIES
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullLineageCrowdingSmokeStudyCli(process.argv.slice(2));
}
