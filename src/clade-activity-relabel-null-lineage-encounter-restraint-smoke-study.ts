import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const LINEAGE_ENCOUNTER_RESTRAINT_VALUES = [0, 1];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Lineage encounter restraint smoke study',
  generatedAt: options.generatedAt,
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
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
