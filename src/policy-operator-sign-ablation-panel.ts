import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import {
  LifeSimulation,
  resolvePolicyCoupling,
  resolveSimulationConfig
} from './simulation';
import {
  AgentSeed,
  GenomeV2DistanceWeights,
  PhenotypeDiversityMetrics,
  PolicyCouplingConfig,
  SimulationConfig
} from './types';

export const POLICY_OPERATOR_SIGN_ABLATION_PANEL_ARTIFACT =
  'docs/policy_operator_sign_ablation_panel_2026-04-01.json';

const DEFAULT_SEEDS = [9301, 9302];
const DEFAULT_BURN_IN_STEPS = 60;
const DEFAULT_BRANCH_STEPS = 60;
const DEFAULT_WINDOW_SIZE = 20;
const POLICY_MUTATION_PROBABILITY = 0.65;

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export type PolicyOperatorSignAblationArmId =
  | 'none'
  | 'harvest_only'
  | 'spending_only'
  | 'reproduction_only'
  | 'harvest_spending'
  | 'harvest_reproduction'
  | 'spending_reproduction'
  | 'all';

type PolicyOperatorKey = keyof PolicyCouplingConfig;

interface PolicyOperatorDelta {
  finalPopulation: number;
  activeSpecies: number;
  activeClades: number;
  effectiveRichness: number;
  occupiedNiches: number;
  policySensitiveEffectiveRichness: number;
  policySensitiveOccupiedNiches: number;
  speciationRate: number;
  extinctionRate: number;
  netDiversificationRate: number;
  harvestDecisionGuidedFraction: number;
  reproductionDecisionGatedFraction: number;
}

interface SharedBaselineSummary {
  seed: number;
  tick: number;
  population: number;
  activeSpecies: number;
  activeClades: number;
  meanEnergy: number;
  anyPolicyAgentFraction: number;
}

export interface PolicyOperatorSignAblationInput {
  generatedAt?: string;
  seeds?: number[];
  burnInSteps?: number;
  branchSteps?: number;
  windowSize?: number;
}

export interface PolicyOperatorSignAblationRunResult {
  seed: number;
  finalPopulation: number;
  activeSpecies: number;
  activeClades: number;
  effectiveRichness: number;
  occupiedNiches: number;
  phenotypeDiversity: PhenotypeDiversityMetrics;
  policySensitivePhenotypeDiversity: PhenotypeDiversityMetrics;
  speciationRate: number;
  extinctionRate: number;
  netDiversificationRate: number;
  harvestDecisionGuidedFraction: number;
  reproductionDecisionGatedFraction: number;
}

export interface PolicyOperatorSignAblationArmResult {
  label: PolicyOperatorSignAblationArmId;
  policyCoupling: PolicyCouplingConfig;
  runs: PolicyOperatorSignAblationRunResult[];
  aggregate: {
    meanFinalPopulation: number;
    meanActiveSpecies: number;
    meanActiveClades: number;
    meanEffectiveRichness: number;
    meanOccupiedNiches: number;
    meanPolicySensitivePhenotypeDiversity: PhenotypeDiversityMetrics;
    meanSpeciationRate: number;
    meanExtinctionRate: number;
    meanNetDiversificationRate: number;
    meanHarvestDecisionGuidedFraction: number;
    meanReproductionDecisionGatedFraction: number;
  };
  deltaVsNone: PolicyOperatorDelta;
}

export interface PolicyOperatorMarginalContextResult {
  without: PolicyOperatorSignAblationArmId;
  with: PolicyOperatorSignAblationArmId;
  delta: PolicyOperatorDelta;
}

export interface PolicyOperatorMarginalAttribution {
  operator: PolicyOperatorKey;
  sign: 'beneficial' | 'neutral' | 'harmful';
  meanMarginalDelta: PolicyOperatorDelta;
  contexts: PolicyOperatorMarginalContextResult[];
  summary: string;
}

export interface PolicyOperatorSignAblationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: {
    seeds: number[];
    burnInSteps: number;
    branchSteps: number;
    windowSize: number;
    stopWhenExtinct: boolean;
    policyMutationProbability: number;
    distanceWeights?: GenomeV2DistanceWeights;
    baseConfig: Partial<SimulationConfig>;
  };
  sharedBaselines: SharedBaselineSummary[];
  arms: PolicyOperatorSignAblationArmResult[];
  operatorAttribution: PolicyOperatorMarginalAttribution[];
  conclusion: {
    mostHelpfulOperator: PolicyOperatorKey;
    mostHarmfulOperator: PolicyOperatorKey;
    summary: string;
  };
}

const ARM_ORDER: readonly PolicyOperatorSignAblationArmId[] = [
  'none',
  'harvest_only',
  'spending_only',
  'reproduction_only',
  'harvest_spending',
  'harvest_reproduction',
  'spending_reproduction',
  'all'
];

const ARM_COUPLING: Record<PolicyOperatorSignAblationArmId, PolicyCouplingConfig> = {
  none: resolvePolicyCoupling(false),
  harvest_only: resolvePolicyCoupling(false, { harvestGuidance: true }),
  spending_only: resolvePolicyCoupling(false, { reserveSpending: true }),
  reproduction_only: resolvePolicyCoupling(false, { reproductionGating: true }),
  harvest_spending: resolvePolicyCoupling(false, { harvestGuidance: true, reserveSpending: true }),
  harvest_reproduction: resolvePolicyCoupling(false, { harvestGuidance: true, reproductionGating: true }),
  spending_reproduction: resolvePolicyCoupling(false, { reserveSpending: true, reproductionGating: true }),
  all: resolvePolicyCoupling(true)
};

const OPERATOR_CONTEXTS: Record<PolicyOperatorKey, Array<[PolicyOperatorSignAblationArmId, PolicyOperatorSignAblationArmId]>> = {
  harvestGuidance: [
    ['none', 'harvest_only'],
    ['spending_only', 'harvest_spending'],
    ['reproduction_only', 'harvest_reproduction'],
    ['spending_reproduction', 'all']
  ],
  reserveSpending: [
    ['none', 'spending_only'],
    ['harvest_only', 'harvest_spending'],
    ['reproduction_only', 'spending_reproduction'],
    ['harvest_reproduction', 'all']
  ],
  reproductionGating: [
    ['none', 'reproduction_only'],
    ['harvest_only', 'harvest_reproduction'],
    ['spending_only', 'spending_reproduction'],
    ['harvest_spending', 'all']
  ]
};

export function runPolicyOperatorSignAblationPanel(
  input: PolicyOperatorSignAblationInput = {}
): PolicyOperatorSignAblationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const burnInSteps = input.burnInSteps ?? DEFAULT_BURN_IN_STEPS;
  const branchSteps = input.branchSteps ?? DEFAULT_BRANCH_STEPS;
  const windowSize = input.windowSize ?? DEFAULT_WINDOW_SIZE;
  const resolvedBaseConfig = resolveSimulationConfig(BASE_CONFIG);

  if (branchSteps <= 0) {
    throw new Error('Policy operator sign ablation panel requires branchSteps > 0');
  }

  const sharedBaselines: SharedBaselineSummary[] = [];
  const runsByArm = new Map<PolicyOperatorSignAblationArmId, PolicyOperatorSignAblationRunResult[]>(
    ARM_ORDER.map((label) => [label, []])
  );

  for (const seed of seeds) {
    const seedRuns = runSeedPanel(seed, burnInSteps, branchSteps, windowSize);
    sharedBaselines.push(seedRuns.sharedBaseline);

    for (const arm of ARM_ORDER) {
      runsByArm.get(arm)?.push(seedRuns.runs[arm]);
    }
  }

  const baselineArmAggregate = aggregateRuns(runsByArm.get('none') ?? []);
  const arms = ARM_ORDER.map((label) => {
    const runs = runsByArm.get(label) ?? [];
    const aggregate = aggregateRuns(runs);
    return {
      label,
      policyCoupling: ARM_COUPLING[label],
      runs,
      aggregate,
      deltaVsNone: buildDeltaFromAggregate(aggregate, baselineArmAggregate)
    };
  });

  const armsById = new Map(arms.map((arm) => [arm.label, arm]));
  const operatorAttribution = (Object.keys(OPERATOR_CONTEXTS) as PolicyOperatorKey[]).map((operator) =>
    buildOperatorAttribution(operator, armsById)
  );

  const helpful = [...operatorAttribution].sort(
    (left, right) => right.meanMarginalDelta.netDiversificationRate - left.meanMarginalDelta.netDiversificationRate
  )[0];
  const harmful = [...operatorAttribution].sort(
    (left, right) => left.meanMarginalDelta.netDiversificationRate - right.meanMarginalDelta.netDiversificationRate
  )[0];

  if (!helpful || !harmful) {
    throw new Error('Policy operator sign ablation panel produced no attribution results');
  }

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Which direct policy-payoff operator drives the matched-control loss once harvest guidance, reserve spending, and reproduction gating are isolated under shared replay states?',
    prediction:
      'If one operator is responsible for most of the March 31 detriment, its marginal delta should stay negative across multiple combination contexts while at least one other operator remains near-neutral or positive.',
    methodology:
      `For each seed, create a genomeV2-backed initial population with neutral policy loci, run a ${burnInSteps}-step burn-in with policy mutation enabled ` +
      'and all direct payoff couplings disabled, capture the replay state, then fork eight matched branches covering every combination of harvest guidance, reserve spending, and reproduction gating for ' +
      `${branchSteps} steps. Compare final phenotype diversity, policy-sensitive phenotype diversity, and rolling ${windowSize}-step diversification rates against the fully decoupled branch.`,
    config: {
      seeds: [...seeds],
      burnInSteps,
      branchSteps,
      windowSize,
      stopWhenExtinct: false,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      distanceWeights: resolvedBaseConfig.genomeV2DistanceWeights,
      baseConfig: BASE_CONFIG
    },
    sharedBaselines,
    arms,
    operatorAttribution,
    conclusion: {
      mostHelpfulOperator: helpful.operator,
      mostHarmfulOperator: harmful.operator,
      summary:
        `${labelOperator(harmful.operator)} was the most harmful tested operator on average: net diversification ${formatSigned(harmful.meanMarginalDelta.netDiversificationRate)}, ` +
        `effective richness ${formatSigned(harmful.meanMarginalDelta.effectiveRichness)}, occupied niches ${formatSigned(harmful.meanMarginalDelta.occupiedNiches)}. ` +
        `${labelOperator(helpful.operator)} was the least harmful or most helpful: net diversification ${formatSigned(helpful.meanMarginalDelta.netDiversificationRate)}, ` +
        `effective richness ${formatSigned(helpful.meanMarginalDelta.effectiveRichness)}, occupied niches ${formatSigned(helpful.meanMarginalDelta.occupiedNiches)}.`
    }
  };
}

function runSeedPanel(
  seed: number,
  burnInSteps: number,
  branchSteps: number,
  windowSize: number
): {
  sharedBaseline: SharedBaselineSummary;
  runs: Record<PolicyOperatorSignAblationArmId, PolicyOperatorSignAblationRunResult>;
} {
  const baseline = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    },
    initialAgents: buildInitialAgents(seed),
    policyCouplingEnabled: false
  });

  const baselineSeries = burnInSteps > 0 ? baseline.run(burnInSteps) : [];
  const baselineSummary = baselineSeries.at(-1);
  const baselineSnapshot = baseline.snapshot();
  const replayState = baseline.captureReplayState();

  const sharedBaseline: SharedBaselineSummary = {
    seed,
    tick: baselineSnapshot.tick,
    population: baselineSnapshot.population,
    activeSpecies: baselineSnapshot.activeSpecies,
    activeClades: baselineSnapshot.activeClades,
    meanEnergy: baselineSnapshot.meanEnergy,
    anyPolicyAgentFraction: baselineSummary?.policyObservability?.activation.anyPolicyAgentFraction ?? 0
  };

  const runs = {} as Record<PolicyOperatorSignAblationArmId, PolicyOperatorSignAblationRunResult>;
  for (const label of ARM_ORDER) {
    const simulation = LifeSimulation.fromReplayState(replayState, {
      policyCoupling: ARM_COUPLING[label]
    });
    const series = simulation.runWithAnalytics(branchSteps, windowSize, false);
    const finalSummary = series.summaries.at(-1);
    const finalAnalytics = series.analytics.at(-1);
    const snapshot = simulation.snapshot();

    if (!finalSummary || !finalAnalytics) {
      throw new Error(`Policy operator sign ablation panel produced no branch results for seed ${seed}, arm ${label}`);
    }

    const phenotypeDiversity = finalSummary.phenotypeDiversity ?? emptyPhenotypeDiversityMetrics();
    const policySensitivePhenotypeDiversity =
      finalSummary.policySensitivePhenotypeDiversity ?? emptyPhenotypeDiversityMetrics();

    runs[label] = {
      seed,
      finalPopulation: snapshot.population,
      activeSpecies: snapshot.activeSpecies,
      activeClades: snapshot.activeClades,
      effectiveRichness: phenotypeDiversity.effectiveRichness,
      occupiedNiches: phenotypeDiversity.occupiedNiches,
      phenotypeDiversity,
      policySensitivePhenotypeDiversity,
      speciationRate: finalAnalytics.species.speciationRate,
      extinctionRate: finalAnalytics.species.extinctionRate,
      netDiversificationRate: finalAnalytics.species.netDiversificationRate,
      harvestDecisionGuidedFraction: finalSummary.policyObservability?.activation.harvestDecisionGuidedFraction ?? 0,
      reproductionDecisionGatedFraction:
        finalSummary.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0
    };
  }

  return {
    sharedBaseline,
    runs
  };
}

function buildInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: BASE_CONFIG
  });

  return seeder.snapshot().agents.map((agent) => {
    const genomeV2 = fromGenome(agent.genome);
    for (const key of POLICY_TRAITS) {
      setTrait(genomeV2, key, DEFAULT_TRAIT_VALUES[key] ?? 0);
    }

    return {
      x: agent.x,
      y: agent.y,
      energy: agent.energy,
      energyPrimary: agent.energyPrimary,
      energySecondary: agent.energySecondary,
      age: agent.age,
      lineage: agent.lineage,
      species: agent.species,
      genome: { ...agent.genome },
      genomeV2
    };
  });
}

function aggregateRuns(
  runs: PolicyOperatorSignAblationRunResult[]
): PolicyOperatorSignAblationArmResult['aggregate'] {
  return {
    meanFinalPopulation: meanOf(runs, (run) => run.finalPopulation),
    meanActiveSpecies: meanOf(runs, (run) => run.activeSpecies),
    meanActiveClades: meanOf(runs, (run) => run.activeClades),
    meanEffectiveRichness: meanOf(runs, (run) => run.effectiveRichness),
    meanOccupiedNiches: meanOf(runs, (run) => run.occupiedNiches),
    meanPolicySensitivePhenotypeDiversity: meanDiversityOf(runs, (run) => run.policySensitivePhenotypeDiversity),
    meanSpeciationRate: meanOf(runs, (run) => run.speciationRate),
    meanExtinctionRate: meanOf(runs, (run) => run.extinctionRate),
    meanNetDiversificationRate: meanOf(runs, (run) => run.netDiversificationRate),
    meanHarvestDecisionGuidedFraction: meanOf(runs, (run) => run.harvestDecisionGuidedFraction),
    meanReproductionDecisionGatedFraction: meanOf(runs, (run) => run.reproductionDecisionGatedFraction)
  };
}

function buildDeltaFromAggregate(
  aggregate: PolicyOperatorSignAblationArmResult['aggregate'],
  baseline: PolicyOperatorSignAblationArmResult['aggregate']
): PolicyOperatorDelta {
  return {
    finalPopulation: aggregate.meanFinalPopulation - baseline.meanFinalPopulation,
    activeSpecies: aggregate.meanActiveSpecies - baseline.meanActiveSpecies,
    activeClades: aggregate.meanActiveClades - baseline.meanActiveClades,
    effectiveRichness: aggregate.meanEffectiveRichness - baseline.meanEffectiveRichness,
    occupiedNiches: aggregate.meanOccupiedNiches - baseline.meanOccupiedNiches,
    policySensitiveEffectiveRichness:
      aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness -
      baseline.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
    policySensitiveOccupiedNiches:
      aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches -
      baseline.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
    speciationRate: aggregate.meanSpeciationRate - baseline.meanSpeciationRate,
    extinctionRate: aggregate.meanExtinctionRate - baseline.meanExtinctionRate,
    netDiversificationRate: aggregate.meanNetDiversificationRate - baseline.meanNetDiversificationRate,
    harvestDecisionGuidedFraction:
      aggregate.meanHarvestDecisionGuidedFraction - baseline.meanHarvestDecisionGuidedFraction,
    reproductionDecisionGatedFraction:
      aggregate.meanReproductionDecisionGatedFraction - baseline.meanReproductionDecisionGatedFraction
  };
}

function buildOperatorAttribution(
  operator: PolicyOperatorKey,
  armsById: Map<PolicyOperatorSignAblationArmId, PolicyOperatorSignAblationArmResult>
): PolicyOperatorMarginalAttribution {
  const contexts = OPERATOR_CONTEXTS[operator].map(([withoutId, withId]) => {
    const withoutArm = armsById.get(withoutId);
    const withArm = armsById.get(withId);
    if (!withoutArm || !withArm) {
      throw new Error(`Missing ablation arm for ${operator}: ${withoutId} -> ${withId}`);
    }

    return {
      without: withoutId,
      with: withId,
      delta: buildDeltaFromAggregate(withArm.aggregate, withoutArm.aggregate)
    };
  });

  const meanMarginalDelta = meanDelta(contexts.map((context) => context.delta));
  const sign = classifyMarginalSign(meanMarginalDelta);

  return {
    operator,
    sign,
    meanMarginalDelta,
    contexts,
    summary:
      `${labelOperator(operator)} marginal delta: effective richness ${formatSigned(meanMarginalDelta.effectiveRichness)}, ` +
      `occupied niches ${formatSigned(meanMarginalDelta.occupiedNiches)}, net diversification ${formatSigned(meanMarginalDelta.netDiversificationRate)}, ` +
      `harvest guidance activation ${formatSigned(meanMarginalDelta.harvestDecisionGuidedFraction)}, reproduction gating activation ${formatSigned(meanMarginalDelta.reproductionDecisionGatedFraction)}.`
  };
}

function classifyMarginalSign(delta: PolicyOperatorDelta): PolicyOperatorMarginalAttribution['sign'] {
  const positive =
    Number(delta.effectiveRichness > 0.05) +
    Number(delta.occupiedNiches > 0.05) +
    Number(delta.netDiversificationRate > 0.005);
  const negative =
    Number(delta.effectiveRichness < -0.05) +
    Number(delta.occupiedNiches < -0.05) +
    Number(delta.netDiversificationRate < -0.005);

  if (positive >= 2) {
    return 'beneficial';
  }
  if (negative >= 2) {
    return 'harmful';
  }
  return 'neutral';
}

function meanDelta(deltas: PolicyOperatorDelta[]): PolicyOperatorDelta {
  return {
    finalPopulation: meanOf(deltas, (delta) => delta.finalPopulation),
    activeSpecies: meanOf(deltas, (delta) => delta.activeSpecies),
    activeClades: meanOf(deltas, (delta) => delta.activeClades),
    effectiveRichness: meanOf(deltas, (delta) => delta.effectiveRichness),
    occupiedNiches: meanOf(deltas, (delta) => delta.occupiedNiches),
    policySensitiveEffectiveRichness: meanOf(deltas, (delta) => delta.policySensitiveEffectiveRichness),
    policySensitiveOccupiedNiches: meanOf(deltas, (delta) => delta.policySensitiveOccupiedNiches),
    speciationRate: meanOf(deltas, (delta) => delta.speciationRate),
    extinctionRate: meanOf(deltas, (delta) => delta.extinctionRate),
    netDiversificationRate: meanOf(deltas, (delta) => delta.netDiversificationRate),
    harvestDecisionGuidedFraction: meanOf(deltas, (delta) => delta.harvestDecisionGuidedFraction),
    reproductionDecisionGatedFraction: meanOf(deltas, (delta) => delta.reproductionDecisionGatedFraction)
  };
}

function meanDiversityOf<T>(
  values: T[],
  pick: (value: T) => PhenotypeDiversityMetrics
): PhenotypeDiversityMetrics {
  return {
    effectiveRichness: meanOf(values, (value) => pick(value).effectiveRichness),
    meanPairwiseDistance: meanOf(values, (value) => pick(value).meanPairwiseDistance),
    occupiedNiches: meanOf(values, (value) => pick(value).occupiedNiches),
    speciesPerOccupiedNiche: meanOf(values, (value) => pick(value).speciesPerOccupiedNiche)
  };
}

function meanOf<T>(values: T[], pick: (value: T) => number): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + pick(value), 0) / values.length;
}

function emptyPhenotypeDiversityMetrics(): PhenotypeDiversityMetrics {
  return {
    effectiveRichness: 0,
    meanPairwiseDistance: 0,
    occupiedNiches: 0,
    speciesPerOccupiedNiche: 0
  };
}

function labelOperator(operator: PolicyOperatorKey): string {
  switch (operator) {
    case 'harvestGuidance':
      return 'Harvest guidance';
    case 'reserveSpending':
      return 'Reserve spending';
    case 'reproductionGating':
      return 'Reproduction gating';
  }
}

function formatSigned(value: number): string {
  const rounded = value.toFixed(4);
  return value > 0 ? `+${rounded}` : rounded;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runPolicyOperatorSignAblationPanel({ generatedAt })
  );
}
