import { DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY, RunCladeActivityRelabelNullStudyInput } from './activity';

type RelabelNullSimulation = NonNullable<RunCladeActivityRelabelNullStudyInput['simulation']>;
type RelabelNullSimulationConfig = NonNullable<RelabelNullSimulation['config']>;

export const BEST_SHORT_STACK_SIMULATION_CONFIG: RelabelNullSimulationConfig = {
  lineageHarvestCrowdingPenalty: 1,
  lineageDispersalCrowdingPenalty: 1,
  lineageEncounterRestraint: 1,
  lineageOffspringSettlementCrowdingPenalty: 0,
  offspringSettlementEcologyScoring: true,
  decompositionSpilloverFraction: 0
};

export const DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT: RunCladeActivityRelabelNullStudyInput = {
  ...DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY,
  steps: 1000,
  minSurvivalTicks: [50],
  cladogenesisThresholds: [1]
};

export const DEFAULT_BEST_SHORT_STACK_STUDY_INPUT: RunCladeActivityRelabelNullStudyInput = {
  ...DEFAULT_CLADE_ACTIVITY_RELABEL_NULL_STUDY,
  simulation: {
    config: buildBestShortStackSimulationConfig()
  }
};

export function buildBestShortStackSimulationConfig(
  overrides: RelabelNullSimulationConfig = {}
): RelabelNullSimulationConfig {
  return {
    ...BEST_SHORT_STACK_SIMULATION_CONFIG,
    ...overrides
  };
}

export function buildCladeActivityRelabelNullBestShortStackStudyInput(
  overrides: RunCladeActivityRelabelNullStudyInput = {},
  generatedAt?: string
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullStudyInput(DEFAULT_BEST_SHORT_STACK_STUDY_INPUT, overrides, generatedAt);
}

export function buildCladeActivityRelabelNullShortSmokeStudyInput(
  overrides: RunCladeActivityRelabelNullStudyInput = {},
  generatedAt?: string
): RunCladeActivityRelabelNullStudyInput {
  return buildCladeActivityRelabelNullStudyInput(DEFAULT_RELABEL_NULL_SMOKE_STUDY_INPUT, overrides, generatedAt);
}

function buildCladeActivityRelabelNullStudyInput(
  defaults: RunCladeActivityRelabelNullStudyInput,
  overrides: RunCladeActivityRelabelNullStudyInput = {},
  generatedAt?: string
): RunCladeActivityRelabelNullStudyInput {
  return {
    steps: overrides.steps ?? defaults.steps,
    windowSize: overrides.windowSize ?? defaults.windowSize,
    burnIn: overrides.burnIn ?? defaults.burnIn,
    seeds: overrides.seeds ?? defaults.seeds,
    stopWhenExtinct: overrides.stopWhenExtinct ?? defaults.stopWhenExtinct,
    minSurvivalTicks: overrides.minSurvivalTicks ?? defaults.minSurvivalTicks,
    cladogenesisThresholds: overrides.cladogenesisThresholds ?? defaults.cladogenesisThresholds,
    matchedNullFounderContext:
      overrides.matchedNullFounderContext ?? defaults.matchedNullFounderContext,
    simulation: mergeSimulationOptions(defaults.simulation, overrides.simulation),
    generatedAt: generatedAt ?? overrides.generatedAt
  };
}

function mergeSimulationOptions(
  defaults?: RelabelNullSimulation,
  overrides?: RelabelNullSimulation
): RelabelNullSimulation | undefined {
  if (defaults === undefined && overrides === undefined) {
    return undefined;
  }

  const config = mergeSimulationConfig(defaults?.config, overrides?.config);

  return {
    ...defaults,
    ...overrides,
    ...(config === undefined ? {} : { config })
  };
}

function mergeSimulationConfig(
  defaults?: RelabelNullSimulationConfig,
  overrides?: RelabelNullSimulationConfig
): RelabelNullSimulationConfig | undefined {
  if (defaults === undefined && overrides === undefined) {
    return undefined;
  }

  return {
    ...(defaults ?? {}),
    ...(overrides ?? {})
  };
}
