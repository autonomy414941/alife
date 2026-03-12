import { parseGeneratedAtCli, runCladeActivityRelabelNullSmokeStudy } from './clade-activity-relabel-null-smoke-study';

const OFFSPRING_SETTLEMENT_ECOLOGY_SCORING_VALUES = [false, true];
const options = parseGeneratedAtCli(process.argv.slice(2));
const study = runCladeActivityRelabelNullSmokeStudy({
  label: 'Offspring ecology settlement smoke study',
  generatedAt: options.generatedAt,
  question:
    'Does ecology-scored juvenile placement improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, and encounter restraint are already enabled but lineage settlement crowding remains off?',
  prediction:
    'If random birth placement is diluting ecological inheritance, the ecology-scored endpoint should exceed the disabled baseline on persistentActivityMeanDeltaVsNullMean while keeping matched birth schedules intact.',
  settingName: 'offspringSettlementEcologyScoring',
  valueConfigName: 'offspringSettlementEcologyScoringValues',
  values: OFFSPRING_SETTLEMENT_ECOLOGY_SCORING_VALUES,
  fixedConfig: {
    lineageHarvestCrowdingPenalty: 1,
    lineageDispersalCrowdingPenalty: 1,
    lineageEncounterRestraint: 1,
    lineageOffspringSettlementCrowdingPenalty: 0
  }
});

process.stdout.write(
  JSON.stringify(study, null, 2) + '\n'
);
