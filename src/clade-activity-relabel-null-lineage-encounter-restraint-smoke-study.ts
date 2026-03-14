import {
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy,
  type RunGeneratedAtStudyCliDependencies
} from './clade-activity-relabel-null-smoke-study';

const LINEAGE_ENCOUNTER_RESTRAINT_VALUES = [0, 1];

export function runCladeActivityRelabelNullLineageEncounterRestraintSmokeStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullSmokeStudy({
        label: 'Lineage encounter restraint smoke study',
        generatedAt,
        question:
          'Does reducing same-lineage encounter theft improve the short threshold-1.0 relabel-null delta when lineage-aware harvest and dispersal are already enabled?',
        prediction:
          'If kin-blind local conflict is eroding clade persistence, the restrained endpoint should keep persistentActivityMeanDeltaVsNullMean at least as high as the no-restraint baseline without relying on offspring-settlement crowding.',
        settingName: 'lineageEncounterRestraint',
        valueConfigName: 'lineageEncounterRestraintValues',
        values: LINEAGE_ENCOUNTER_RESTRAINT_VALUES,
        fixedConfig: {
          lineageHarvestCrowdingPenalty: 1,
          lineageDispersalCrowdingPenalty: 1,
          lineageOffspringSettlementCrowdingPenalty: 0
        }
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullLineageEncounterRestraintSmokeStudyCli(process.argv.slice(2));
}
