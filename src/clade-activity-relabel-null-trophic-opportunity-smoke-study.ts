import { runCladeActivityRelabelNullStudy } from './activity';

interface CliOptions {
  generatedAt?: string;
}

interface TrophicOpportunitySmokeResult {
  trophicOpportunityAttraction: number;
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
        encounterRiskAversion: number;
        decompositionSpilloverFraction: number;
        trophicOpportunityAttraction: number;
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
const OFFSPRING_SETTLEMENT_ECOLOGY_SCORING = true;
const ENCOUNTER_RISK_AVERSION = 0;
const DECOMPOSITION_SPILLOVER_FRACTION = 0;
const TROPHIC_OPPORTUNITY_ATTRACTION_VALUES = [0, 1];

const options = parseCli(process.argv.slice(2));
const generatedAt = options.generatedAt ?? new Date().toISOString();
const results = TROPHIC_OPPORTUNITY_ATTRACTION_VALUES.map((trophicOpportunityAttraction) =>
  runResultForSetting(trophicOpportunityAttraction, generatedAt)
);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt,
      question:
        'Does adding prey-opportunity attraction improve the short threshold-1 relabel-null delta on top of the current best kin-aware ecology stack?',
      prediction:
        'If trophic traits need spatial opportunity before encounters to matter, the attraction-on endpoint should improve persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
      config: {
        ...DEFAULT_STUDY_INPUT,
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint: LINEAGE_ENCOUNTER_RESTRAINT,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY,
        offspringSettlementEcologyScoring: OFFSPRING_SETTLEMENT_ECOLOGY_SCORING,
        encounterRiskAversion: ENCOUNTER_RISK_AVERSION,
        decompositionSpilloverFraction: DECOMPOSITION_SPILLOVER_FRACTION,
        trophicOpportunityAttractionValues: [...TROPHIC_OPPORTUNITY_ATTRACTION_VALUES]
      },
      results
    },
    null,
    2
  ) + '\n'
);

function runResultForSetting(
  trophicOpportunityAttraction: number,
  generatedAt: string
): TrophicOpportunitySmokeResult {
  const studyInput = {
    ...DEFAULT_STUDY_INPUT,
    simulation: {
      config: {
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint: LINEAGE_ENCOUNTER_RESTRAINT,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY,
        offspringSettlementEcologyScoring: OFFSPRING_SETTLEMENT_ECOLOGY_SCORING,
        encounterRiskAversion: ENCOUNTER_RISK_AVERSION,
        decompositionSpilloverFraction: DECOMPOSITION_SPILLOVER_FRACTION,
        trophicOpportunityAttraction
      }
    },
    generatedAt
  };
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error('Trophic opportunity smoke study produced no threshold results');
  }
  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error('Trophic opportunity smoke study produced no aggregate results');
  }

  return {
    trophicOpportunityAttraction,
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
