import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, POLICY_TRAITS, setTrait } from './genome-v2';
import { createGenomeV2InitialAgents } from './genome-v2-adapter';
import { resolveSimulationConfig, LifeSimulation } from './simulation';
import { AgentSeed, GenomeV2DistanceWeights, PhenotypeDiversityMetrics, SimulationConfig } from './types';

export const POST_COUPLING_MATCHED_CONTROL_VALIDATION_ARTIFACT =
  'docs/post_coupling_matched_control_validation_2026-03-31.json';

const DEFAULT_SEEDS = [9201, 9202];
const DEFAULT_STEPS = 120;
const DEFAULT_WINDOW_SIZE = 30;

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export interface PostCouplingMatchedControlValidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
  windowSize?: number;
}

export interface PostCouplingMatchedControlRunResult {
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
}

export interface PostCouplingMatchedControlArmResult {
  label: 'policy_coupled' | 'policy_decoupled';
  policyMutationProbability: number;
  policyCouplingEnabled: boolean;
  runs: PostCouplingMatchedControlRunResult[];
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
  };
}

export interface PostCouplingMatchedControlValidationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  comparisonToMarch30: string;
  config: {
    seeds: number[];
    steps: number;
    windowSize: number;
    stopWhenExtinct: boolean;
    distanceWeights?: GenomeV2DistanceWeights;
    baseConfig: Partial<SimulationConfig>;
  };
  policyCoupled: PostCouplingMatchedControlArmResult;
  policyDecoupled: PostCouplingMatchedControlArmResult;
  delta: {
    activeSpecies: number;
    activeClades: number;
    effectiveRichness: number;
    occupiedNiches: number;
    policySensitiveEffectiveRichness: number;
    policySensitiveMeanPairwiseDistance: number;
    policySensitiveOccupiedNiches: number;
    policySensitiveSpeciesPerOccupiedNiche: number;
    speciationRate: number;
    extinctionRate: number;
    netDiversificationRate: number;
  };
  percentDelta: {
    effectiveRichness: number | null;
    occupiedNiches: number | null;
    policySensitiveEffectiveRichness: number | null;
    policySensitiveOccupiedNiches: number | null;
    speciationRate: number | null;
    netDiversificationRate: number | null;
  };
  conclusion: {
    outcome: 'survives' | 'mixed' | 'refuted';
    summary: string;
    comparisonToMarch30Delta: {
      effectiveRichnessDeltaChange: number;
      policySensitiveEffectiveRichnessDeltaChange: number;
      speciationRateDeltaChange: number;
      netDiversificationRateDeltaChange: number;
    };
  };
}

export function runPostCouplingMatchedControlValidation(
  input: PostCouplingMatchedControlValidationInput = {}
): PostCouplingMatchedControlValidationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const windowSize = input.windowSize ?? DEFAULT_WINDOW_SIZE;
  const resolvedBaseConfig = resolveSimulationConfig(BASE_CONFIG);
  const policyCoupled = runArm({
    label: 'policy_coupled',
    seeds,
    steps,
    windowSize,
    policyMutationProbability: 0.65,
    policyCouplingEnabled: true
  });
  const policyDecoupled = runArm({
    label: 'policy_decoupled',
    seeds,
    steps,
    windowSize,
    policyMutationProbability: 0.65,
    policyCouplingEnabled: false
  });

  const delta = {
    activeSpecies: policyCoupled.aggregate.meanActiveSpecies - policyDecoupled.aggregate.meanActiveSpecies,
    activeClades: policyCoupled.aggregate.meanActiveClades - policyDecoupled.aggregate.meanActiveClades,
    effectiveRichness: policyCoupled.aggregate.meanEffectiveRichness - policyDecoupled.aggregate.meanEffectiveRichness,
    occupiedNiches: policyCoupled.aggregate.meanOccupiedNiches - policyDecoupled.aggregate.meanOccupiedNiches,
    policySensitiveEffectiveRichness:
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness -
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
    policySensitiveMeanPairwiseDistance:
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.meanPairwiseDistance -
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.meanPairwiseDistance,
    policySensitiveOccupiedNiches:
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches -
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
    policySensitiveSpeciesPerOccupiedNiche:
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.speciesPerOccupiedNiche -
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.speciesPerOccupiedNiche,
    speciationRate: policyCoupled.aggregate.meanSpeciationRate - policyDecoupled.aggregate.meanSpeciationRate,
    extinctionRate: policyCoupled.aggregate.meanExtinctionRate - policyDecoupled.aggregate.meanExtinctionRate,
    netDiversificationRate:
      policyCoupled.aggregate.meanNetDiversificationRate - policyDecoupled.aggregate.meanNetDiversificationRate
  };
  const percentDelta = {
    effectiveRichness: relativeDelta(
      policyCoupled.aggregate.meanEffectiveRichness,
      policyDecoupled.aggregate.meanEffectiveRichness
    ),
    occupiedNiches: relativeDelta(
      policyCoupled.aggregate.meanOccupiedNiches,
      policyDecoupled.aggregate.meanOccupiedNiches
    ),
    policySensitiveEffectiveRichness: relativeDelta(
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness
    ),
    policySensitiveOccupiedNiches: relativeDelta(
      policyCoupled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
      policyDecoupled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches
    ),
    speciationRate: relativeDelta(policyCoupled.aggregate.meanSpeciationRate, policyDecoupled.aggregate.meanSpeciationRate),
    netDiversificationRate: relativeDelta(
      policyCoupled.aggregate.meanNetDiversificationRate,
      policyDecoupled.aggregate.meanNetDiversificationRate
    )
  };

  const march30EffectiveRichnessDelta = 2.9732;
  const march30PolicySensitiveEffectiveRichnessDelta = 198.5194;
  const march30SpeciationRateDelta = 21.3167;
  const march30NetDiversificationRateDelta = 13.55;

  const comparisonToMarch30Delta = {
    effectiveRichnessDeltaChange: delta.effectiveRichness - march30EffectiveRichnessDelta,
    policySensitiveEffectiveRichnessDeltaChange: delta.policySensitiveEffectiveRichness - march30PolicySensitiveEffectiveRichnessDelta,
    speciationRateDeltaChange: delta.speciationRate - march30SpeciationRateDelta,
    netDiversificationRateDeltaChange: delta.netDiversificationRate - march30NetDiversificationRateDelta
  };

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Under a matched control where both arms have identical policy loci that can mutate, does enabling policy-payoff coupling still produce the diversification gains reported on March 30?',
    prediction:
      'If the March 30 effect is genuine ecology-mediated adaptive diversification rather than a "more mutating coordinates" artifact, the policy-coupled arm should retain a measurable advantage even when the control has the same policy loci.',
    methodology:
      `Run matched ${steps}-step panels with ${seeds.length} shared seeds. Both arms start from the same ` +
      'genomeV2-backed initial population with neutral policy loci present and identical policyMutationProbability=0.65. ' +
      'The policy-coupled arm allows policy parameters to affect harvest intake, reserve spending, and reproduction gating. ' +
      'The policy-decoupled arm carries the same mutating policy loci but bypasses their effects on payoffs by freezing policy coupling during execution. ' +
      'Both arms use asymmetric secondary-resource forcing and the default genomeV2 moderate-downweight distance regime. ' +
      `Report final phenotype diversity, policy-sensitive phenotype-diversity summary, and rolling ${windowSize}-step diversification rates.`,
    comparisonToMarch30:
      'The March 30 artifact compared policyMutationProbability=0.65 against 0, confounding policy execution with access to extra mutating loci. ' +
      'This matched control keeps policy mutation enabled in both arms and isolates whether policies genuinely affect demographic outcomes.',
    config: {
      seeds: [...seeds],
      steps,
      windowSize,
      stopWhenExtinct: false,
      distanceWeights: resolvedBaseConfig.genomeV2DistanceWeights,
      baseConfig: BASE_CONFIG
    },
    policyCoupled,
    policyDecoupled,
    delta,
    percentDelta,
    conclusion: buildConclusion(delta, percentDelta, comparisonToMarch30Delta)
  };
}

function runArm(input: {
  label: 'policy_coupled' | 'policy_decoupled';
  seeds: number[];
  steps: number;
  windowSize: number;
  policyMutationProbability: number;
  policyCouplingEnabled: boolean;
}): PostCouplingMatchedControlArmResult {
  const runs = input.seeds.map((seed) =>
    runSimulation(seed, input.steps, input.windowSize, input.policyMutationProbability, input.policyCouplingEnabled)
  );

  return {
    label: input.label,
    policyMutationProbability: input.policyMutationProbability,
    policyCouplingEnabled: input.policyCouplingEnabled,
    runs,
    aggregate: {
      meanFinalPopulation: meanOf(runs, (run) => run.finalPopulation),
      meanActiveSpecies: meanOf(runs, (run) => run.activeSpecies),
      meanActiveClades: meanOf(runs, (run) => run.activeClades),
      meanEffectiveRichness: meanOf(runs, (run) => run.effectiveRichness),
      meanOccupiedNiches: meanOf(runs, (run) => run.occupiedNiches),
      meanPolicySensitivePhenotypeDiversity: meanDiversityOf(runs, (run) => run.policySensitivePhenotypeDiversity),
      meanSpeciationRate: meanOf(runs, (run) => run.speciationRate),
      meanExtinctionRate: meanOf(runs, (run) => run.extinctionRate),
      meanNetDiversificationRate: meanOf(runs, (run) => run.netDiversificationRate)
    }
  };
}

function runSimulation(
  seed: number,
  steps: number,
  windowSize: number,
  policyMutationProbability: number,
  policyCouplingEnabled: boolean
): PostCouplingMatchedControlRunResult {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability
    },
    initialAgents: buildInitialAgents(seed),
    policyCouplingEnabled
  });
  const series = simulation.runWithAnalytics(steps, windowSize, false);
  const finalSummary = series.summaries[series.summaries.length - 1];
  const finalAnalytics = series.analytics[series.analytics.length - 1];
  const snapshot = simulation.snapshot();

  if (!finalSummary || !finalAnalytics) {
    throw new Error(`Post-coupling matched control validation produced no results for seed ${seed}`);
  }

  const phenotypeDiversity = finalSummary.phenotypeDiversity ?? emptyPhenotypeDiversityMetrics();
  const policySensitivePhenotypeDiversity =
    finalSummary.policySensitivePhenotypeDiversity ?? emptyPhenotypeDiversityMetrics();

  return {
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
    netDiversificationRate: finalAnalytics.species.netDiversificationRate
  };
}

function buildInitialAgents(seed: number): AgentSeed[] {
  const seeds = createGenomeV2InitialAgents({
    seed,
    config: BASE_CONFIG
  });

  return seeds.map((agentSeed) => {
    for (const key of POLICY_TRAITS) {
      setTrait(agentSeed.genomeV2!, key, DEFAULT_TRAIT_VALUES[key] ?? 0);
    }
    return agentSeed;
  });
}

function relativeDelta(value: number, baseline: number): number | null {
  if (baseline === 0) {
    return value === 0 ? 0 : null;
  }
  return ((value - baseline) / Math.abs(baseline)) * 100;
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

function emptyPhenotypeDiversityMetrics(): PhenotypeDiversityMetrics {
  return {
    effectiveRichness: 0,
    meanPairwiseDistance: 0,
    occupiedNiches: 0,
    speciesPerOccupiedNiche: 0
  };
}

function buildConclusion(
  delta: PostCouplingMatchedControlValidationArtifact['delta'],
  percentDelta: PostCouplingMatchedControlValidationArtifact['percentDelta'],
  comparisonToMarch30Delta: PostCouplingMatchedControlValidationArtifact['conclusion']['comparisonToMarch30Delta']
): PostCouplingMatchedControlValidationArtifact['conclusion'] {
  const positiveSignals = [
    delta.effectiveRichness > 0,
    delta.policySensitiveEffectiveRichness > 0,
    delta.policySensitiveOccupiedNiches > 0,
    delta.speciationRate > 0,
    delta.netDiversificationRate > 0
  ].filter(Boolean).length;
  const negativeSignals = [
    delta.effectiveRichness < 0,
    delta.policySensitiveEffectiveRichness < 0,
    delta.policySensitiveOccupiedNiches < 0,
    delta.speciationRate < 0,
    delta.netDiversificationRate < 0
  ].filter(Boolean).length;
  const outcome =
    positiveSignals >= 3 && delta.effectiveRichness > 0
      ? 'survives'
      : negativeSignals >= 3 || delta.effectiveRichness < 0
        ? 'refuted'
        : 'mixed';

  return {
    outcome,
    summary:
      `Matched control (both arms with policyMutationProbability=0.65): ` +
      `Effective richness ${formatSigned(delta.effectiveRichness)} ` +
      `(${formatPercent(percentDelta.effectiveRichness)}), policy-sensitive richness ` +
      `${formatSigned(delta.policySensitiveEffectiveRichness)} (${formatPercent(percentDelta.policySensitiveEffectiveRichness)}), ` +
      `policy-sensitive occupied niches ` +
      `${formatSigned(delta.policySensitiveOccupiedNiches)} (${formatPercent(percentDelta.policySensitiveOccupiedNiches)}), ` +
      `speciation rate ${formatSigned(delta.speciationRate)} (${formatPercent(percentDelta.speciationRate)}), ` +
      `net diversification ${formatSigned(delta.netDiversificationRate)} (${formatPercent(percentDelta.netDiversificationRate)}). ` +
      `Versus March 30 unmatched control: effective richness delta ${formatSigned(comparisonToMarch30Delta.effectiveRichnessDeltaChange)}, ` +
      `policy-sensitive richness delta ${formatSigned(comparisonToMarch30Delta.policySensitiveEffectiveRichnessDeltaChange)}, ` +
      `speciation rate delta ${formatSigned(comparisonToMarch30Delta.speciationRateDeltaChange)}, ` +
      `net diversification delta ${formatSigned(comparisonToMarch30Delta.netDiversificationRateDeltaChange)}.`,
    comparisonToMarch30Delta
  };
}

function meanOf<T>(values: T[], pick: (value: T) => number): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + pick(value), 0) / values.length;
}

function formatSigned(value: number): string {
  const rounded = value.toFixed(4);
  return value > 0 ? `+${rounded}` : rounded;
}

function formatPercent(value: number | null): string {
  if (value === null) {
    return 'n/a';
  }
  const rounded = value.toFixed(1);
  return value > 0 ? `+${rounded}%` : `${rounded}%`;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runPostCouplingMatchedControlValidation({ generatedAt })
  );
}
