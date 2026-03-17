import { RunCladeActivityRelabelNullStudyInput, runCladeActivityRelabelNullStudy } from './activity';
import { buildCladeActivityRelabelNullBestShortStackStudyInput } from './clade-activity-relabel-null-best-short-stack-study';
import {
  FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
  FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
  FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS
} from './clade-activity-relabel-null-founder-grace-ecology-gate-smoke-study';
import { HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD } from './clade-activity-relabel-null-founder-grace-ecology-gate-horizon-study';
import { emitStudyJsonOutput, parseGeneratedAtCli } from './clade-activity-relabel-null-smoke-study';
import { dominantEncounterOperator, nonTransitiveEncounterOperator } from './encounter';
import {
  CladeActivityRelabelNullDiagnosticSnapshot,
  CladeActivityRelabelNullStudyExport,
  SimulationConfig
} from './types';

export const ENCOUNTER_TOPOLOGY_COMPOSITION_COST_FACTORIAL_HORIZON_ARTIFACT =
  'docs/clade_activity_relabel_null_encounter_topology_composition_cost_factorial_horizon_2026-03-17.json';

export const COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION = 0.3;
export const COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION = 0.3;

export type FactorialConditionKey =
  | 'dominantAgnostic'
  | 'dominantDependent'
  | 'nonTransitiveAgnostic'
  | 'nonTransitiveDependent';

export type EncounterTopologyLabel = 'dominant' | 'nonTransitive';
export type CompositionCostLabel = 'agnostic' | 'dependent';

export interface FactorialConditionSummary {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  birthScheduleMatchedAllSeeds: boolean;
  persistentWindowFractionDeltaVsNullMean: number;
  persistentActivityMeanDeltaVsNullMean: number;
  persistentAbundanceWeightedActivityMeanDeltaVsNullMean: number;
  activeCladeDeltaVsNullMean: number;
  activeCladeAreaUnderCurveDeltaVsNullMean: number;
  innovationMedianLifespanDeltaVsNullMean: number;
  regimeSwitchCountDeltaVsNullMean: number;
  diagnostics: CladeActivityRelabelNullDiagnosticSnapshot;
}

export interface FactorialConditionResult {
  key: FactorialConditionKey;
  label: string;
  encounterTopology: EncounterTopologyLabel;
  compositionCosts: CompositionCostLabel;
  reproductionMinPrimaryFraction: number;
  reproductionMinSecondaryFraction: number;
  studyInput: RunCladeActivityRelabelNullStudyInput;
  summaries: FactorialConditionSummary[];
  study: CladeActivityRelabelNullStudyExport;
}

export interface FactorialComparison {
  cladogenesisThreshold: number;
  minSurvivalTicks: number;
  dominantAgnostic: FactorialConditionSummary;
  dominantDependent: FactorialConditionSummary;
  nonTransitiveAgnostic: FactorialConditionSummary;
  nonTransitiveDependent: FactorialConditionSummary;
  activeCladeDeltaVsNullInteraction: number;
  activeCladeDeltaVsNullCombinedImprovementVsBaseline: number;
  activeCladeDeltaVsNullCombinedImprovementVsBestSingleton: number;
  persistentAbundanceWeightedActivityMeanDeltaVsNullInteraction: number;
  persistentAbundanceWeightedActivityMeanDeltaVsNullCombinedImprovementVsBaseline: number;
  persistentAbundanceWeightedActivityMeanDeltaVsNullCombinedImprovementVsBestSingleton: number;
  activeCladeAreaUnderCurveDeltaVsNullInteraction: number;
  activeCladeAreaUnderCurveDeltaVsNullCombinedImprovementVsBaseline: number;
  activeCladeAreaUnderCurveDeltaVsNullCombinedImprovementVsBestSingleton: number;
  innovationMedianLifespanDeltaVsNullInteraction: number;
  regimeSwitchCountDeltaVsNullInteraction: number;
}

export interface EncounterTopologyCompositionCostFactorialStudyExport {
  generatedAt: string;
  question: string;
  hypothesis: string;
  config: {
    steps: number;
    windowSize: number;
    burnIn: number;
    seeds: number[];
    stopWhenExtinct: boolean;
    minSurvivalTicks: number[];
    cladogenesisThresholds: number[];
    cladeHabitatCoupling: number;
    adaptiveCladeHabitatMemoryRate: number;
    newCladeSettlementCrowdingGraceTicks: number;
    cladogenesisEcologyAdvantageThreshold: number;
    simulationConfig: Partial<SimulationConfig>;
    compositionDependentReproductionThresholds: {
      minPrimaryFraction: number;
      minSecondaryFraction: number;
    };
  };
  conditions: FactorialConditionResult[];
  comparisons: FactorialComparison[];
}

export interface RunEncounterTopologyCompositionCostFactorialStudyInput {
  generatedAt?: string;
  studyInput?: RunCladeActivityRelabelNullStudyInput;
}

interface FactorialConditionDefinition {
  key: FactorialConditionKey;
  label: string;
  encounterTopology: EncounterTopologyLabel;
  compositionCosts: CompositionCostLabel;
  reproductionMinPrimaryFraction: number;
  reproductionMinSecondaryFraction: number;
}

const DEFAULT_HORIZON_STUDY_INPUT: RunCladeActivityRelabelNullStudyInput =
  buildCladeActivityRelabelNullBestShortStackStudyInput({
    steps: 4000,
    windowSize: 100,
    burnIn: 200,
    seeds: [20260307],
    minSurvivalTicks: [50, 100],
    cladogenesisThresholds: [1.0, 1.2],
    stopWhenExtinct: false,
    simulation: {
      config: {
        width: 20,
        height: 20,
        maxResource: 100,
        maxResource2: 25,
        resourceRegen: 1,
        resource2Regen: 0.25,
        metabolismCostBase: 0.5,
        moveCost: 0.1,
        harvestCap: 10,
        reproduceThreshold: 50,
        reproduceProbability: 0.8,
        offspringEnergyFraction: 0.5,
        mutationAmount: 0.1,
        speciationThreshold: 0.3,
        maxAge: 1000,
        cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
        adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
        newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
        cladogenesisEcologyAdvantageThreshold: HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
        lineageHarvestCrowdingPenalty: 1,
        lineageDispersalCrowdingPenalty: 1,
        lineageEncounterRestraint: 1,
        offspringSettlementEcologyScoring: true
      },
      initialAgents: [
        {
          x: 10,
          y: 10,
          energy: 100,
          genome: { metabolism: 1, harvest: 1, aggression: 0.5, harvestEfficiency2: 1 }
        }
      ]
    }
  });

const FACTORIAL_CONDITIONS: readonly FactorialConditionDefinition[] = [
  {
    key: 'dominantAgnostic',
    label: 'dominant + composition-agnostic',
    encounterTopology: 'dominant',
    compositionCosts: 'agnostic',
    reproductionMinPrimaryFraction: 0,
    reproductionMinSecondaryFraction: 0
  },
  {
    key: 'dominantDependent',
    label: 'dominant + composition-dependent',
    encounterTopology: 'dominant',
    compositionCosts: 'dependent',
    reproductionMinPrimaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION,
    reproductionMinSecondaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION
  },
  {
    key: 'nonTransitiveAgnostic',
    label: 'non-transitive + composition-agnostic',
    encounterTopology: 'nonTransitive',
    compositionCosts: 'agnostic',
    reproductionMinPrimaryFraction: 0,
    reproductionMinSecondaryFraction: 0
  },
  {
    key: 'nonTransitiveDependent',
    label: 'non-transitive + composition-dependent',
    encounterTopology: 'nonTransitive',
    compositionCosts: 'dependent',
    reproductionMinPrimaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION,
    reproductionMinSecondaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION
  }
] as const;

export function runEncounterTopologyCompositionCostFactorialStudy(
  input: RunEncounterTopologyCompositionCostFactorialStudyInput = {}
): EncounterTopologyCompositionCostFactorialStudyExport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const baseStudyInput = buildCladeActivityRelabelNullBestShortStackStudyInput(input.studyInput, generatedAt);

  const conditions = FACTORIAL_CONDITIONS.map((condition) =>
    runFactorialConditionStudy(condition, baseStudyInput)
  );
  const comparisons = buildFactorialComparisons(conditions);

  return {
    generatedAt,
    question:
      'Does combining non-transitive encounters with composition-dependent reproduction improve coexistence metrics beyond either mechanism alone on the canonical dual-resource founder-grace horizon?',
    hypothesis:
      'The non-transitive + composition-dependent condition should outperform both single-mechanism conditions on active-clade deltas, abundance-weighted persistence, and clade-trajectory metrics versus the matched null.',
    config: {
      steps: baseStudyInput.steps ?? DEFAULT_HORIZON_STUDY_INPUT.steps ?? 4000,
      windowSize: baseStudyInput.windowSize ?? DEFAULT_HORIZON_STUDY_INPUT.windowSize ?? 100,
      burnIn: baseStudyInput.burnIn ?? DEFAULT_HORIZON_STUDY_INPUT.burnIn ?? 200,
      seeds: baseStudyInput.seeds ?? DEFAULT_HORIZON_STUDY_INPUT.seeds ?? [],
      stopWhenExtinct: baseStudyInput.stopWhenExtinct ?? DEFAULT_HORIZON_STUDY_INPUT.stopWhenExtinct ?? false,
      minSurvivalTicks:
        baseStudyInput.minSurvivalTicks ?? DEFAULT_HORIZON_STUDY_INPUT.minSurvivalTicks ?? [],
      cladogenesisThresholds:
        baseStudyInput.cladogenesisThresholds ?? DEFAULT_HORIZON_STUDY_INPUT.cladogenesisThresholds ?? [],
      cladeHabitatCoupling: FOUNDER_GRACE_ECOLOGY_GATE_CLADE_HABITAT_COUPLING,
      adaptiveCladeHabitatMemoryRate: FOUNDER_GRACE_ECOLOGY_GATE_ADAPTIVE_CLADE_HABITAT_MEMORY_RATE,
      newCladeSettlementCrowdingGraceTicks: FOUNDER_GRACE_ECOLOGY_GATE_SETTLEMENT_GRACE_TICKS,
      cladogenesisEcologyAdvantageThreshold: HORIZON_BASELINE_CLADEGENESIS_ECOLOGY_ADVANTAGE_THRESHOLD,
      simulationConfig: baseStudyInput.simulation?.config ?? {},
      compositionDependentReproductionThresholds: {
        minPrimaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION,
        minSecondaryFraction: COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION
      }
    },
    conditions,
    comparisons
  };
}

function runFactorialConditionStudy(
  condition: FactorialConditionDefinition,
  baseStudyInput: RunCladeActivityRelabelNullStudyInput
): FactorialConditionResult {
  const studyInput = buildConditionStudyInput(baseStudyInput, condition);
  const study = runCladeActivityRelabelNullStudy(studyInput);

  return {
    ...condition,
    studyInput,
    summaries: summarizeConditionStudy(study),
    study
  };
}

function buildConditionStudyInput(
  baseStudyInput: RunCladeActivityRelabelNullStudyInput,
  condition: FactorialConditionDefinition
): RunCladeActivityRelabelNullStudyInput {
  return {
    ...baseStudyInput,
    simulation: {
      ...baseStudyInput.simulation,
      encounterOperator:
        condition.encounterTopology === 'dominant'
          ? dominantEncounterOperator
          : nonTransitiveEncounterOperator,
      config: {
        ...(baseStudyInput.simulation?.config ?? {}),
        reproductionMinPrimaryFraction: condition.reproductionMinPrimaryFraction,
        reproductionMinSecondaryFraction: condition.reproductionMinSecondaryFraction
      }
    }
  };
}

function summarizeConditionStudy(study: CladeActivityRelabelNullStudyExport): FactorialConditionSummary[] {
  return study.thresholdResults.flatMap((thresholdResult) =>
    thresholdResult.aggregates.map((aggregate) => {
      const activeCladeAreaUnderCurveDeltaVsNullMean = mean(
        thresholdResult.seedResults.map(
          (seedResult) =>
            seedResult.actualRawSummary.activeCladeAreaUnderCurve -
            seedResult.matchedNullRawSummary.activeCladeAreaUnderCurve
        )
      );
      const innovationMedianLifespanDeltaVsNullMean = mean(
        thresholdResult.seedResults.map(
          (seedResult) =>
            seedResult.actualRawSummary.innovationMedianLifespan -
            seedResult.matchedNullRawSummary.innovationMedianLifespan
        )
      );
      const regimeSwitchCountDeltaVsNullMean = mean(
        thresholdResult.seedResults.map(
          (seedResult) =>
            seedResult.actualRawSummary.regimeSwitchCount -
            seedResult.matchedNullRawSummary.regimeSwitchCount
        )
      );

      return {
        cladogenesisThreshold: thresholdResult.cladogenesisThreshold,
        minSurvivalTicks: aggregate.minSurvivalTicks,
        birthScheduleMatchedAllSeeds: thresholdResult.seedResults.every((seedResult) => seedResult.birthScheduleMatched),
        persistentWindowFractionDeltaVsNullMean: aggregate.persistentWindowFractionDeltaVsNull.mean,
        persistentActivityMeanDeltaVsNullMean: aggregate.persistentActivityMeanDeltaVsNull.mean,
        persistentAbundanceWeightedActivityMeanDeltaVsNullMean:
          aggregate.persistentAbundanceWeightedActivityMeanDeltaVsNull.mean,
        activeCladeDeltaVsNullMean: aggregate.diagnostics.activeCladeDeltaVsNull.mean,
        activeCladeAreaUnderCurveDeltaVsNullMean,
        innovationMedianLifespanDeltaVsNullMean,
        regimeSwitchCountDeltaVsNullMean,
        diagnostics: {
          finalPopulationMean: aggregate.diagnostics.finalPopulation.mean,
          actualActiveCladesMean: aggregate.diagnostics.actualActiveClades.mean,
          matchedNullActiveCladesMean: aggregate.diagnostics.matchedNullActiveClades.mean,
          activeCladeDeltaVsNullMean: aggregate.diagnostics.activeCladeDeltaVsNull.mean,
          rawNewCladeActivityMeanDeltaVsNullMean:
            aggregate.diagnostics.rawNewCladeActivityMeanDeltaVsNull.mean,
          persistencePenaltyVsRawDeltaMean: aggregate.diagnostics.persistencePenaltyVsRawDelta.mean,
          dominantLossMode: aggregate.diagnostics.dominantLossMode
        }
      };
    })
  );
}

function buildFactorialComparisons(conditions: FactorialConditionResult[]): FactorialComparison[] {
  const conditionLookup = new Map(conditions.map((condition) => [condition.key, condition] as const));
  const dominantAgnostic = requireCondition(conditionLookup, 'dominantAgnostic');
  const dominantDependent = requireCondition(conditionLookup, 'dominantDependent');
  const nonTransitiveAgnostic = requireCondition(conditionLookup, 'nonTransitiveAgnostic');
  const nonTransitiveDependent = requireCondition(conditionLookup, 'nonTransitiveDependent');

  return dominantAgnostic.summaries.map((baselineSummary) => {
    const dominantDependentSummary = requireConditionSummary(dominantDependent, baselineSummary);
    const nonTransitiveAgnosticSummary = requireConditionSummary(nonTransitiveAgnostic, baselineSummary);
    const nonTransitiveDependentSummary = requireConditionSummary(nonTransitiveDependent, baselineSummary);

    return {
      cladogenesisThreshold: baselineSummary.cladogenesisThreshold,
      minSurvivalTicks: baselineSummary.minSurvivalTicks,
      dominantAgnostic: baselineSummary,
      dominantDependent: dominantDependentSummary,
      nonTransitiveAgnostic: nonTransitiveAgnosticSummary,
      nonTransitiveDependent: nonTransitiveDependentSummary,
      activeCladeDeltaVsNullInteraction: computeInteraction(
        baselineSummary.activeCladeDeltaVsNullMean,
        dominantDependentSummary.activeCladeDeltaVsNullMean,
        nonTransitiveAgnosticSummary.activeCladeDeltaVsNullMean,
        nonTransitiveDependentSummary.activeCladeDeltaVsNullMean
      ),
      activeCladeDeltaVsNullCombinedImprovementVsBaseline:
        nonTransitiveDependentSummary.activeCladeDeltaVsNullMean -
        baselineSummary.activeCladeDeltaVsNullMean,
      activeCladeDeltaVsNullCombinedImprovementVsBestSingleton:
        nonTransitiveDependentSummary.activeCladeDeltaVsNullMean -
        Math.max(
          dominantDependentSummary.activeCladeDeltaVsNullMean,
          nonTransitiveAgnosticSummary.activeCladeDeltaVsNullMean
        ),
      persistentAbundanceWeightedActivityMeanDeltaVsNullInteraction: computeInteraction(
        baselineSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean,
        dominantDependentSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean,
        nonTransitiveAgnosticSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean,
        nonTransitiveDependentSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean
      ),
      persistentAbundanceWeightedActivityMeanDeltaVsNullCombinedImprovementVsBaseline:
        nonTransitiveDependentSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean -
        baselineSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean,
      persistentAbundanceWeightedActivityMeanDeltaVsNullCombinedImprovementVsBestSingleton:
        nonTransitiveDependentSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean -
        Math.max(
          dominantDependentSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean,
          nonTransitiveAgnosticSummary.persistentAbundanceWeightedActivityMeanDeltaVsNullMean
        ),
      activeCladeAreaUnderCurveDeltaVsNullInteraction: computeInteraction(
        baselineSummary.activeCladeAreaUnderCurveDeltaVsNullMean,
        dominantDependentSummary.activeCladeAreaUnderCurveDeltaVsNullMean,
        nonTransitiveAgnosticSummary.activeCladeAreaUnderCurveDeltaVsNullMean,
        nonTransitiveDependentSummary.activeCladeAreaUnderCurveDeltaVsNullMean
      ),
      activeCladeAreaUnderCurveDeltaVsNullCombinedImprovementVsBaseline:
        nonTransitiveDependentSummary.activeCladeAreaUnderCurveDeltaVsNullMean -
        baselineSummary.activeCladeAreaUnderCurveDeltaVsNullMean,
      activeCladeAreaUnderCurveDeltaVsNullCombinedImprovementVsBestSingleton:
        nonTransitiveDependentSummary.activeCladeAreaUnderCurveDeltaVsNullMean -
        Math.max(
          dominantDependentSummary.activeCladeAreaUnderCurveDeltaVsNullMean,
          nonTransitiveAgnosticSummary.activeCladeAreaUnderCurveDeltaVsNullMean
        ),
      innovationMedianLifespanDeltaVsNullInteraction: computeInteraction(
        baselineSummary.innovationMedianLifespanDeltaVsNullMean,
        dominantDependentSummary.innovationMedianLifespanDeltaVsNullMean,
        nonTransitiveAgnosticSummary.innovationMedianLifespanDeltaVsNullMean,
        nonTransitiveDependentSummary.innovationMedianLifespanDeltaVsNullMean
      ),
      regimeSwitchCountDeltaVsNullInteraction: computeInteraction(
        baselineSummary.regimeSwitchCountDeltaVsNullMean,
        dominantDependentSummary.regimeSwitchCountDeltaVsNullMean,
        nonTransitiveAgnosticSummary.regimeSwitchCountDeltaVsNullMean,
        nonTransitiveDependentSummary.regimeSwitchCountDeltaVsNullMean
      )
    };
  });
}

function requireCondition(
  lookup: Map<FactorialConditionKey, FactorialConditionResult>,
  key: FactorialConditionKey
): FactorialConditionResult {
  const condition = lookup.get(key);
  if (!condition) {
    throw new Error(`Missing factorial condition ${key}`);
  }
  return condition;
}

function requireConditionSummary(
  condition: FactorialConditionResult,
  reference: Pick<FactorialConditionSummary, 'cladogenesisThreshold' | 'minSurvivalTicks'>
): FactorialConditionSummary {
  const summary = condition.summaries.find(
    (candidate) =>
      candidate.cladogenesisThreshold === reference.cladogenesisThreshold &&
      candidate.minSurvivalTicks === reference.minSurvivalTicks
  );

  if (!summary) {
    throw new Error(
      `Condition ${condition.key} is missing threshold ${reference.cladogenesisThreshold} and minSurvivalTicks=${reference.minSurvivalTicks}`
    );
  }

  return summary;
}

function computeInteraction(
  baseline: number,
  compositionOnly: number,
  topologyOnly: number,
  combined: number
): number {
  return combined - compositionOnly - topologyOnly + baseline;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function emitEncounterTopologyCompositionCostFactorialStudy(
  artifact: string,
  study?: EncounterTopologyCompositionCostFactorialStudyExport
): void {
  emitStudyJsonOutput(study ?? runEncounterTopologyCompositionCostFactorialStudy(), { output: artifact });
}

if (require.main === module) {
  const options = parseGeneratedAtCli(process.argv.slice(2));
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  console.log('Running encounter topology x composition-cost factorial horizon study...');
  console.log(`  Generated at: ${generatedAt}`);
  console.log(`  Steps: ${DEFAULT_HORIZON_STUDY_INPUT.steps}`);
  console.log(`  Seeds: ${DEFAULT_HORIZON_STUDY_INPUT.seeds}`);
  console.log(
    `  Composition thresholds: primary=${COMPOSITION_DEPENDENT_REPRODUCTION_MIN_PRIMARY_FRACTION}, secondary=${COMPOSITION_DEPENDENT_REPRODUCTION_MIN_SECONDARY_FRACTION}`
  );

  const study = runEncounterTopologyCompositionCostFactorialStudy({
    generatedAt
  });
  const outputPath = options.output ?? ENCOUNTER_TOPOLOGY_COMPOSITION_COST_FACTORIAL_HORIZON_ARTIFACT;
  emitEncounterTopologyCompositionCostFactorialStudy(outputPath, study);

  console.log(`\nStudy complete. Artifact written to ${outputPath}`);
  console.log('\nSummary:');
  for (const comparison of study.comparisons) {
    console.log(
      `  Threshold ${comparison.cladogenesisThreshold}, survival ${comparison.minSurvivalTicks}: combined active-clade improvement vs best singleton ${comparison.activeCladeDeltaVsNullCombinedImprovementVsBestSingleton.toFixed(2)}`
    );
    console.log(
      `    combined persistence improvement vs best singleton ${comparison.persistentAbundanceWeightedActivityMeanDeltaVsNullCombinedImprovementVsBestSingleton.toFixed(2)}`
    );
    console.log(
      `    active-clade interaction ${comparison.activeCladeDeltaVsNullInteraction.toFixed(2)}, AUC interaction ${comparison.activeCladeAreaUnderCurveDeltaVsNullInteraction.toFixed(2)}`
    );
  }
}
