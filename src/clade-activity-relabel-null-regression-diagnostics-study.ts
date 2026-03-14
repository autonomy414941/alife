import { RunCladeActivityRelabelNullStudyInput } from './activity';
import {
  BEST_SHORT_STACK_SIMULATION_CONFIG,
  buildCladeActivityRelabelNullShortSmokeStudyInput
} from './clade-activity-relabel-null-best-short-stack';
import {
  CladeActivityRelabelNullSmokeSummary,
  runGeneratedAtStudyCli,
  runCladeActivityRelabelNullSmokeStudy
} from './clade-activity-relabel-null-smoke-study';
import type { RunGeneratedAtStudyCliDependencies } from './clade-activity-relabel-null-smoke-study';
import { CladeActivityRelabelNullLossMode, SimulationConfig } from './types';

export const CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS = [
  {
    scenario: 'bestShortStack',
    label: 'Best short stack',
    configOverrides: {}
  },
  {
    scenario: 'lineageOffspringSettlementCrowding',
    label: 'Lineage offspring settlement penalty',
    configOverrides: {
      lineageOffspringSettlementCrowdingPenalty: 1
    }
  },
  {
    scenario: 'decompositionSpillover',
    label: 'Decomposition spillover',
    configOverrides: {
      decompositionSpilloverFraction: 0.5
    }
  },
  {
    scenario: 'cladogenesisEcologyGate',
    label: 'Cladogenesis ecology gate',
    configOverrides: {
      cladogenesisEcologyAdvantageThreshold: 0.1
    }
  },
  {
    scenario: 'cladogenesisTraitNoveltyGate',
    label: 'Cladogenesis trait novelty gate',
    configOverrides: {
      cladogenesisEcologyAdvantageThreshold: -1,
      cladogenesisTraitNoveltyThreshold: 0.02
    }
  },
  {
    scenario: 'disturbanceLocalizedOpening',
    label: 'Disturbance localized opening',
    configOverrides: {
      disturbanceInterval: 50,
      disturbanceEnergyLoss: 0.5,
      disturbanceResourceLoss: 0,
      disturbanceRadius: 2,
      disturbanceRefugiaFraction: 0.5,
      disturbanceSettlementOpeningTicks: 10,
      disturbanceSettlementOpeningBonus: 0.75
    }
  }
] as const satisfies ReadonlyArray<{
  scenario: string;
  label: string;
  configOverrides: Partial<SimulationConfig>;
}>;

export type CladeActivityRelabelNullRegressionDiagnosticsScenario =
  (typeof CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS)[number]['scenario'];

export interface CladeActivityRelabelNullRegressionDiagnosticsScenarioDefinition {
  scenario: CladeActivityRelabelNullRegressionDiagnosticsScenario;
  label: string;
  configOverrides: Partial<SimulationConfig>;
}

export interface CladeActivityRelabelNullRegressionDiagnosticsDelta {
  persistentWindowFractionDeltaVsNullMean: number;
  persistentActivityMeanDeltaVsNullMean: number;
  activeCladeDeltaVsNullMean: number | null;
  rawNewCladeActivityMeanDeltaVsNullMean: number;
  persistencePenaltyVsRawDeltaMean: number;
}

export interface CladeActivityRelabelNullRegressionDiagnosticsBaseResult {
  scenario: CladeActivityRelabelNullRegressionDiagnosticsScenario;
  label: string;
  configOverrides: Partial<SimulationConfig>;
  birthScheduleMatchedAllSeeds: boolean;
  persistentWindowFractionDeltaVsNullMean: number;
  persistentActivityMeanDeltaVsNullMean: number;
  activeCladeDeltaVsNullMean: number | null;
  rawNewCladeActivityMeanDeltaVsNullMean: number;
  persistencePenaltyVsRawDeltaMean: number;
  dominantLossMode: CladeActivityRelabelNullLossMode;
  deltaVsBestShortStack: CladeActivityRelabelNullRegressionDiagnosticsDelta;
}

export interface CladeActivityRelabelNullRegressionDiagnosticsRankedResult
  extends CladeActivityRelabelNullRegressionDiagnosticsBaseResult {
  overallRank: number;
  persistentActivityRank: number;
  activeCladeRank: number;
  rawActivityRank: number;
  persistencePenaltyRank: number;
}

export interface CladeActivityRelabelNullRegressionDiagnosticsStudyExport {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    baselineSimulationConfig: Partial<SimulationConfig>;
    rankingOrder: string[];
    scenarios: Array<{
      scenario: CladeActivityRelabelNullRegressionDiagnosticsScenario;
      label: string;
      configOverrides: Partial<SimulationConfig>;
    }>;
  };
  results: CladeActivityRelabelNullRegressionDiagnosticsRankedResult[];
}

export interface RunCladeActivityRelabelNullRegressionDiagnosticsStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
  scenarios?: readonly CladeActivityRelabelNullRegressionDiagnosticsScenario[];
}

const QUESTION =
  'Which recent default-off add-on knobs are pure short-horizon regressions on top of the current best stack, and which ones mainly fail through active-clade deficit versus raw-to-persistent collapse?';
const PREDICTION =
  'If the March 11-12 add-ons are mostly dead ends rather than hidden coexistence tradeoffs, the best short stack should stay on top of persistent activity while the failed knobs separate into active-clade-deficit and persistence-failure loss modes.';
const RANKING_ORDER = [
  'birthScheduleMatchedAllSeeds desc',
  'persistentActivityMeanDeltaVsNullMean desc',
  'activeCladeDeltaVsNullMean desc',
  'persistencePenaltyVsRawDeltaMean asc',
  'rawNewCladeActivityMeanDeltaVsNullMean desc'
];

export function runCladeActivityRelabelNullRegressionDiagnosticsStudy(
  input: RunCladeActivityRelabelNullRegressionDiagnosticsStudyInput = {}
): CladeActivityRelabelNullRegressionDiagnosticsStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const scenarioDefinitions = resolveScenarioDefinitions(input.scenarios);
  const scenarioLookup = new Map(scenarioDefinitions.map((definition) => [definition.scenario, definition]));
  const shortStudyInput = buildCladeActivityRelabelNullShortSmokeStudyInput(input.studyInput, generatedAt);
  const baselineSimulationConfig = {
    ...(input.studyInput?.simulation?.config ?? {}),
    ...BEST_SHORT_STACK_SIMULATION_CONFIG
  };
  const resolvedShortStudyConfig = requireShortStudyConfig(shortStudyInput);
  const smokeStudy = runCladeActivityRelabelNullSmokeStudy({
    label: 'Regression diagnostics study',
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    settingName: 'scenario',
    valueConfigName: 'scenarios',
    values: scenarioDefinitions.map((definition) => definition.scenario),
    fixedConfig: BEST_SHORT_STACK_SIMULATION_CONFIG,
    studyInput: input.studyInput,
    buildSettingConfig: (scenario) => {
      const definition = scenarioLookup.get(scenario);
      if (!definition) {
        throw new Error(`Unknown regression diagnostic scenario: ${scenario}`);
      }
      return definition.configOverrides;
    }
  });

  const baselineResult = smokeStudy.results.find((result) => result.scenario === 'bestShortStack');
  if (!baselineResult) {
    throw new Error('Regression diagnostics study requires the bestShortStack baseline scenario');
  }

  const results = rankCladeActivityRelabelNullRegressionDiagnosticsResults(
    smokeStudy.results.map((result) => {
      const definition = scenarioLookup.get(result.scenario);
      if (!definition) {
        throw new Error(`Unknown regression diagnostic scenario in smoke result: ${result.scenario}`);
      }
      return buildRegressionDiagnosticsBaseResult(definition, result.summary, baselineResult.summary);
    }),
    scenarioDefinitions.map((definition) => definition.scenario)
  );

  return {
    generatedAt,
    question: QUESTION,
    prediction: PREDICTION,
    config: {
      steps: resolvedShortStudyConfig.steps,
      windowSize: resolvedShortStudyConfig.windowSize,
      burnIn: resolvedShortStudyConfig.burnIn,
      seeds: resolvedShortStudyConfig.seeds,
      stopWhenExtinct: resolvedShortStudyConfig.stopWhenExtinct,
      minSurvivalTicks: resolvedShortStudyConfig.minSurvivalTicks,
      cladogenesisThresholds: resolvedShortStudyConfig.cladogenesisThresholds,
      baselineSimulationConfig,
      rankingOrder: [...RANKING_ORDER],
      scenarios: scenarioDefinitions.map(({ scenario, label, configOverrides }) => ({
        scenario,
        label,
        configOverrides
      }))
    },
    results
  };
}

export function rankCladeActivityRelabelNullRegressionDiagnosticsResults(
  results: CladeActivityRelabelNullRegressionDiagnosticsBaseResult[],
  scenarioOrder: readonly CladeActivityRelabelNullRegressionDiagnosticsScenario[]
): CladeActivityRelabelNullRegressionDiagnosticsRankedResult[] {
  const orderLookup = new Map(scenarioOrder.map((scenario, index) => [scenario, index]));
  const compareByScenarioOrder = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => (orderLookup.get(left.scenario) ?? Number.MAX_SAFE_INTEGER) - (orderLookup.get(right.scenario) ?? Number.MAX_SAFE_INTEGER);
  const compareByBirthScheduleMatch = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => Number(right.birthScheduleMatchedAllSeeds) - Number(left.birthScheduleMatchedAllSeeds);
  const compareByPersistentActivity = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => compareNumbersDesc(left.persistentActivityMeanDeltaVsNullMean, right.persistentActivityMeanDeltaVsNullMean);
  const compareByActiveClade = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => compareNumbersDesc(sortableNullableMetric(left.activeCladeDeltaVsNullMean), sortableNullableMetric(right.activeCladeDeltaVsNullMean));
  const compareByRawActivity = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => compareNumbersDesc(
    left.rawNewCladeActivityMeanDeltaVsNullMean,
    right.rawNewCladeActivityMeanDeltaVsNullMean
  );
  const compareByPersistencePenalty = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => compareNumbersAsc(left.persistencePenaltyVsRawDeltaMean, right.persistencePenaltyVsRawDeltaMean);
  const overallComparator = (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) =>
    compareByBirthScheduleMatch(left, right) ||
    compareByPersistentActivity(left, right) ||
    compareByActiveClade(left, right) ||
    compareByPersistencePenalty(left, right) ||
    compareByRawActivity(left, right) ||
    compareByScenarioOrder(left, right);
  const persistentActivityRanks = buildRankLookup(results, (left, right) => compareByPersistentActivity(left, right) || compareByScenarioOrder(left, right));
  const activeCladeRanks = buildRankLookup(results, (left, right) => compareByActiveClade(left, right) || compareByScenarioOrder(left, right));
  const rawActivityRanks = buildRankLookup(results, (left, right) => compareByRawActivity(left, right) || compareByScenarioOrder(left, right));
  const persistencePenaltyRanks = buildRankLookup(
    results,
    (left, right) => compareByPersistencePenalty(left, right) || compareByScenarioOrder(left, right)
  );

  return [...results]
    .sort(overallComparator)
    .map((result, index) => ({
      ...result,
      overallRank: index + 1,
      persistentActivityRank: persistentActivityRanks.get(result.scenario) ?? index + 1,
      activeCladeRank: activeCladeRanks.get(result.scenario) ?? index + 1,
      rawActivityRank: rawActivityRanks.get(result.scenario) ?? index + 1,
      persistencePenaltyRank: persistencePenaltyRanks.get(result.scenario) ?? index + 1
    }));
}

function buildRegressionDiagnosticsBaseResult(
  definition: CladeActivityRelabelNullRegressionDiagnosticsScenarioDefinition,
  summary: CladeActivityRelabelNullSmokeSummary,
  baselineSummary: CladeActivityRelabelNullSmokeSummary
): CladeActivityRelabelNullRegressionDiagnosticsBaseResult {
  return {
    scenario: definition.scenario as CladeActivityRelabelNullRegressionDiagnosticsScenario,
    label: definition.label,
    configOverrides: definition.configOverrides,
    birthScheduleMatchedAllSeeds: summary.birthScheduleMatchedAllSeeds,
    persistentWindowFractionDeltaVsNullMean: summary.persistentWindowFractionDeltaVsNullMean,
    persistentActivityMeanDeltaVsNullMean: summary.persistentActivityMeanDeltaVsNullMean,
    activeCladeDeltaVsNullMean: summary.diagnostics.activeCladeDeltaVsNullMean,
    rawNewCladeActivityMeanDeltaVsNullMean: summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean,
    persistencePenaltyVsRawDeltaMean: summary.diagnostics.persistencePenaltyVsRawDeltaMean,
    dominantLossMode: summary.diagnostics.dominantLossMode,
    deltaVsBestShortStack: {
      persistentWindowFractionDeltaVsNullMean:
        summary.persistentWindowFractionDeltaVsNullMean - baselineSummary.persistentWindowFractionDeltaVsNullMean,
      persistentActivityMeanDeltaVsNullMean:
        summary.persistentActivityMeanDeltaVsNullMean - baselineSummary.persistentActivityMeanDeltaVsNullMean,
      activeCladeDeltaVsNullMean: subtractNullableMetric(
        summary.diagnostics.activeCladeDeltaVsNullMean,
        baselineSummary.diagnostics.activeCladeDeltaVsNullMean
      ),
      rawNewCladeActivityMeanDeltaVsNullMean:
        summary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean -
        baselineSummary.diagnostics.rawNewCladeActivityMeanDeltaVsNullMean,
      persistencePenaltyVsRawDeltaMean:
        summary.diagnostics.persistencePenaltyVsRawDeltaMean - baselineSummary.diagnostics.persistencePenaltyVsRawDeltaMean
    }
  };
}

function resolveScenarioDefinitions(
  scenarios: readonly CladeActivityRelabelNullRegressionDiagnosticsScenario[] | undefined
): CladeActivityRelabelNullRegressionDiagnosticsScenarioDefinition[] {
  if (scenarios === undefined) {
    return [...CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS];
  }

  const definitions = scenarios.map((scenario) => {
    const definition = CLADE_ACTIVITY_RELABEL_NULL_REGRESSION_DIAGNOSTIC_SCENARIOS.find(
      (candidate) => candidate.scenario === scenario
    );
    if (!definition) {
      throw new Error(`Unknown regression diagnostic scenario: ${scenario}`);
    }
    return definition;
  });

  if (!definitions.some((definition) => definition.scenario === 'bestShortStack')) {
    throw new Error('Regression diagnostics scenarios must include bestShortStack');
  }

  return definitions;
}

function requireShortStudyConfig(input: RunCladeActivityRelabelNullStudyInput) {
  const { steps, windowSize, burnIn, seeds, stopWhenExtinct, minSurvivalTicks, cladogenesisThresholds } = input;
  if (
    steps === undefined ||
    windowSize === undefined ||
    burnIn === undefined ||
    seeds === undefined ||
    stopWhenExtinct === undefined ||
    minSurvivalTicks === undefined ||
    cladogenesisThresholds === undefined
  ) {
    throw new Error('Regression diagnostics study requires fully resolved short smoke config');
  }

  return {
    steps,
    windowSize,
    burnIn,
    seeds,
    stopWhenExtinct,
    minSurvivalTicks,
    cladogenesisThresholds
  };
}

function buildRankLookup(
  results: CladeActivityRelabelNullRegressionDiagnosticsBaseResult[],
  comparator: (
    left: CladeActivityRelabelNullRegressionDiagnosticsBaseResult,
    right: CladeActivityRelabelNullRegressionDiagnosticsBaseResult
  ) => number
): Map<CladeActivityRelabelNullRegressionDiagnosticsScenario, number> {
  return new Map(
    [...results]
      .sort(comparator)
      .map((result, index) => [result.scenario, index + 1] as const)
  );
}

function compareNumbersDesc(left: number, right: number): number {
  return right - left;
}

function compareNumbersAsc(left: number, right: number): number {
  return left - right;
}

function sortableNullableMetric(value: number | null): number {
  return value ?? Number.NEGATIVE_INFINITY;
}

function subtractNullableMetric(left: number | null, right: number | null): number | null {
  if (left === null || right === null) {
    return null;
  }
  return left - right;
}

export function runCladeActivityRelabelNullRegressionDiagnosticsStudyCli(
  args: string[],
  dependencies: RunGeneratedAtStudyCliDependencies = {}
): void {
  runGeneratedAtStudyCli(
    args,
    ({ generatedAt }) =>
      runCladeActivityRelabelNullRegressionDiagnosticsStudy({
        generatedAt
      }),
    dependencies
  );
}

if (require.main === module) {
  runCladeActivityRelabelNullRegressionDiagnosticsStudyCli(process.argv.slice(2));
}
