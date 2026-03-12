import { runCladeActivityRelabelNullStudy } from './activity';

interface CliOptions {
  generatedAt?: string;
}

interface OffspringEcologySettlementSmokeResult {
  offspringSettlementEcologyScoring: boolean;
  studyInput: {
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    simulation: {
      config: {
        lineageHarvestCrowdingPenalty: number;
        lineageDispersalCrowdingPenalty: number;
        lineageEncounterRestraint: number;
        lineageOffspringSettlementCrowdingPenalty: number;
        offspringSettlementEcologyScoring: boolean;
      };
    };
    generatedAt: string;
  };
  summary: {
    birthScheduleMatchedAllSeeds: boolean;
    persistentWindowFractionDeltaVsNullMean: number;
    persistentActivityMeanDeltaVsNullMean: number;
  };
  study: ReturnType<typeof runCladeActivityRelabelNullStudy>;
}

const DEFAULT_STUDY_INPUT = {
  steps: 1000,
  windowSize: 100,
  burnIn: 200,
  seeds: [20260307, 20260308, 20260309, 20260310],
  stopWhenExtinct: true,
  minSurvivalTicks: [50],
  cladogenesisThresholds: [1]
};

const LINEAGE_HARVEST_CROWDING_PENALTY = 1;
const LINEAGE_DISPERSAL_CROWDING_PENALTY = 1;
const LINEAGE_ENCOUNTER_RESTRAINT = 1;
const LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY = 0;
const OFFSPRING_SETTLEMENT_ECOLOGY_SCORING_VALUES = [false, true];

const options = parseCli(process.argv.slice(2));
const generatedAt = options.generatedAt ?? new Date().toISOString();
const results = OFFSPRING_SETTLEMENT_ECOLOGY_SCORING_VALUES.map((offspringSettlementEcologyScoring) =>
  runResultForSetting(offspringSettlementEcologyScoring, generatedAt)
);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt,
      question:
        'Does ecology-scored juvenile placement improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, and encounter restraint are already enabled but lineage settlement crowding remains off?',
      prediction:
        'If random birth placement is diluting ecological inheritance, the ecology-scored endpoint should exceed the disabled baseline on persistentActivityMeanDeltaVsNullMean while keeping matched birth schedules intact.',
      config: {
        ...DEFAULT_STUDY_INPUT,
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint: LINEAGE_ENCOUNTER_RESTRAINT,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY,
        offspringSettlementEcologyScoringValues: [...OFFSPRING_SETTLEMENT_ECOLOGY_SCORING_VALUES]
      },
      results
    },
    null,
    2
  ) + '\n'
);

function runResultForSetting(
  offspringSettlementEcologyScoring: boolean,
  generatedAt: string
): OffspringEcologySettlementSmokeResult {
  const studyInput = {
    ...DEFAULT_STUDY_INPUT,
    simulation: {
      config: {
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint: LINEAGE_ENCOUNTER_RESTRAINT,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY,
        offspringSettlementEcologyScoring
      }
    },
    generatedAt
  };
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error('Offspring ecology settlement smoke study produced no threshold results');
  }
  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error('Offspring ecology settlement smoke study produced no aggregate results');
  }

  return {
    offspringSettlementEcologyScoring,
    studyInput,
    summary: {
      birthScheduleMatchedAllSeeds: thresholdResult.seedResults.every((seedResult) => seedResult.birthScheduleMatched),
      persistentWindowFractionDeltaVsNullMean: aggregate.persistentWindowFractionDeltaVsNull.mean,
      persistentActivityMeanDeltaVsNullMean: aggregate.persistentActivityMeanDeltaVsNull.mean
    },
    study
  };
}

function parseCli(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--generated-at') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('--generated-at requires a value');
      }
      options.generatedAt = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}
