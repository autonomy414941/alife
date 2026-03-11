import { runCladeActivityRelabelNullStudy } from './activity';

interface CliOptions {
  generatedAt?: string;
}

interface LineageCrowdingSmokeResult {
  lineageHarvestCrowdingPenalty: number;
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

const LINEAGE_HARVEST_CROWDING_PENALTIES = [0, 1];

const options = parseCli(process.argv.slice(2));
const generatedAt = options.generatedAt ?? new Date().toISOString();
const results = LINEAGE_HARVEST_CROWDING_PENALTIES.map((lineageHarvestCrowdingPenalty) =>
  runResultForPenalty(lineageHarvestCrowdingPenalty, generatedAt)
);

process.stdout.write(
  JSON.stringify(
    {
      generatedAt,
      question:
        'Does lineage-local harvest self-limitation move the short threshold-1.0 relabel-null delta upward without breaking the matched birth schedule?',
      prediction:
        'If rare-clade advantage matters here, the positive penalty endpoint should make persistentActivityMeanDeltaVsNullMean less negative than the zero-penalty baseline.',
      config: {
        ...DEFAULT_STUDY_INPUT,
        lineageHarvestCrowdingPenaltyValues: [...LINEAGE_HARVEST_CROWDING_PENALTIES]
      },
      results
    },
    null,
    2
  ) + '\n'
);

function runResultForPenalty(lineageHarvestCrowdingPenalty: number, generatedAt: string): LineageCrowdingSmokeResult {
  const studyInput = {
    ...DEFAULT_STUDY_INPUT,
    simulation: {
      config: {
        lineageHarvestCrowdingPenalty
      }
    },
    generatedAt
  };
  const study = runCladeActivityRelabelNullStudy(studyInput);
  const thresholdResult = study.thresholdResults[0];
  if (!thresholdResult) {
    throw new Error('Lineage crowding smoke study produced no threshold results');
  }
  const aggregate = thresholdResult.aggregates[0];
  if (!aggregate) {
    throw new Error('Lineage crowding smoke study produced no aggregate results');
  }

  return {
    lineageHarvestCrowdingPenalty,
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
