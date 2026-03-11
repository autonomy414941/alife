import { runCladeActivityRelabelNullStudy } from './activity';

interface CliOptions {
  generatedAt?: string;
}

interface LineageEncounterRestraintSmokeResult {
  lineageEncounterRestraint: number;
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
const LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY = 0;
const LINEAGE_ENCOUNTER_RESTRAINT_VALUES = [0, 1];

const options = parseCli(process.argv.slice(2));
const generatedAt = options.generatedAt ?? new Date().toISOString();
const results = LINEAGE_ENCOUNTER_RESTRAINT_VALUES.map((lineageEncounterRestraint) =>
  runResultForRestraint(lineageEncounterRestraint, generatedAt)
);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt,
      question:
        'Does reducing same-lineage encounter theft improve the short threshold-1.0 relabel-null delta when lineage-aware harvest and dispersal are already enabled?',
      prediction:
        'If kin-blind local conflict is eroding clade persistence, the restrained endpoint should keep persistentActivityMeanDeltaVsNullMean at least as high as the no-restraint baseline without relying on offspring-settlement crowding.',
      config: {
        ...DEFAULT_STUDY_INPUT,
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraintValues: [...LINEAGE_ENCOUNTER_RESTRAINT_VALUES],
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY
      },
      results
    },
    null,
    2
  ) + '\n'
);

function runResultForRestraint(
  lineageEncounterRestraint: number,
  generatedAt: string
): LineageEncounterRestraintSmokeResult {
  const studyInput = {
    ...DEFAULT_STUDY_INPUT,
    simulation: {
      config: {
        lineageHarvestCrowdingPenalty: LINEAGE_HARVEST_CROWDING_PENALTY,
        lineageDispersalCrowdingPenalty: LINEAGE_DISPERSAL_CROWDING_PENALTY,
        lineageEncounterRestraint,
        lineageOffspringSettlementCrowdingPenalty: LINEAGE_OFFSPRING_SETTLEMENT_CROWDING_PENALTY
      }
    },
    generatedAt
  };
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error('Lineage encounter restraint smoke study produced no threshold results');
  }
  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error('Lineage encounter restraint smoke study produced no aggregate results');
  }

  return {
    lineageEncounterRestraint,
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
