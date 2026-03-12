import { runCladeActivityRelabelNullStudy } from './activity';

interface CliOptions {
  generatedAt?: string;
}

interface DecompositionSpilloverSmokeResult {
  decompositionSpilloverFraction: number;
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
const DECOMPOSITION_SPILLOVER_FRACTION_VALUES = [0, 0.5];

const options = parseCli(process.argv.slice(2));
const generatedAt = options.generatedAt ?? new Date().toISOString();
const results = DECOMPOSITION_SPILLOVER_FRACTION_VALUES.map((decompositionSpilloverFraction) =>
  runResultForSpillover(decompositionSpilloverFraction, generatedAt)
);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt,
      question:
        'Does spilling half of recycled biomass into wrapped cardinal neighbors improve the short threshold-1.0 relabel-null delta when harvest crowding, dispersal crowding, encounter restraint, and ecology-scored offspring settlement are already enabled?',
      prediction:
        'If point-local decomposition is trapping nutrient feedback too tightly, the 0.5 spillover endpoint should improve persistentWindowFractionDeltaVsNullMean or persistentActivityMeanDeltaVsNullMean without breaking matched birth schedules.',
      config: {
        ...DEFAULT_STUDY_INPUT,
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint: LINEAGE_ENCOUNTER_RESTRAINT,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY,
        offspringSettlementEcologyScoring: OFFSPRING_SETTLEMENT_ECOLOGY_SCORING,
        encounterRiskAversion: ENCOUNTER_RISK_AVERSION,
        decompositionSpilloverFractionValues: [...DECOMPOSITION_SPILLOVER_FRACTION_VALUES]
      },
      results
    },
    null,
    2
  ) + '\n'
);

function runResultForSpillover(
  decompositionSpilloverFraction: number,
  generatedAt: string
): DecompositionSpilloverSmokeResult {
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
        decompositionSpilloverFraction
      }
    },
    generatedAt
  };
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error('Decomposition spillover smoke study produced no threshold results');
  }
  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error('Decomposition spillover smoke study produced no aggregate results');
  }

  return {
    decompositionSpilloverFraction,
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
