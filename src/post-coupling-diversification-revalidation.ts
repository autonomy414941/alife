import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import { resolveSimulationConfig, LifeSimulation } from './simulation';
import { AgentSeed, GenomeV2DistanceWeights, PhenotypeDiversityMetrics, SimulationConfig } from './types';

export const POST_COUPLING_DIVERSIFICATION_REVALIDATION_ARTIFACT =
  'docs/post_coupling_diversification_revalidation_2026-03-30.json';

const DEFAULT_SEEDS = [9101, 9102, 9103, 9104];
const DEFAULT_STEPS = 200;
const DEFAULT_WINDOW_SIZE = 40;

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export interface PostCouplingDiversificationRevalidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
  windowSize?: number;
}

export interface PostCouplingDiversificationRunResult {
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

export interface PostCouplingDiversificationArmResult {
  label: 'policy_enabled' | 'policy_neutral';
  policyMutationProbability: number;
  runs: PostCouplingDiversificationRunResult[];
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

export interface PostCouplingDiversificationRevalidationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    windowSize: number;
    stopWhenExtinct: boolean;
    distanceWeights?: GenomeV2DistanceWeights;
    baseConfig: Partial<SimulationConfig>;
  };
  policyEnabled: PostCouplingDiversificationArmResult;
  policyNeutral: PostCouplingDiversificationArmResult;
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
    outcome: 'improves' | 'mixed' | 'degrades';
    summary: string;
  };
}

export function runPostCouplingDiversificationRevalidation(
  input: PostCouplingDiversificationRevalidationInput = {}
): PostCouplingDiversificationRevalidationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const windowSize = input.windowSize ?? DEFAULT_WINDOW_SIZE;
  const resolvedBaseConfig = resolveSimulationConfig(BASE_CONFIG);
  const policyEnabled = runArm({
    label: 'policy_enabled',
    seeds,
    steps,
    windowSize,
    policyMutationProbability: 0.65
  });
  const policyNeutral = runArm({
    label: 'policy_neutral',
    seeds,
    steps,
    windowSize,
    policyMutationProbability: 0
  });

  const delta = {
    activeSpecies: policyEnabled.aggregate.meanActiveSpecies - policyNeutral.aggregate.meanActiveSpecies,
    activeClades: policyEnabled.aggregate.meanActiveClades - policyNeutral.aggregate.meanActiveClades,
    effectiveRichness: policyEnabled.aggregate.meanEffectiveRichness - policyNeutral.aggregate.meanEffectiveRichness,
    occupiedNiches: policyEnabled.aggregate.meanOccupiedNiches - policyNeutral.aggregate.meanOccupiedNiches,
    policySensitiveEffectiveRichness:
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness -
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
    policySensitiveMeanPairwiseDistance:
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.meanPairwiseDistance -
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.meanPairwiseDistance,
    policySensitiveOccupiedNiches:
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches -
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
    policySensitiveSpeciesPerOccupiedNiche:
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.speciesPerOccupiedNiche -
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.speciesPerOccupiedNiche,
    speciationRate: policyEnabled.aggregate.meanSpeciationRate - policyNeutral.aggregate.meanSpeciationRate,
    extinctionRate: policyEnabled.aggregate.meanExtinctionRate - policyNeutral.aggregate.meanExtinctionRate,
    netDiversificationRate:
      policyEnabled.aggregate.meanNetDiversificationRate - policyNeutral.aggregate.meanNetDiversificationRate
  };
  const percentDelta = {
    effectiveRichness: relativeDelta(
      policyEnabled.aggregate.meanEffectiveRichness,
      policyNeutral.aggregate.meanEffectiveRichness
    ),
    occupiedNiches: relativeDelta(
      policyEnabled.aggregate.meanOccupiedNiches,
      policyNeutral.aggregate.meanOccupiedNiches
    ),
    policySensitiveEffectiveRichness: relativeDelta(
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness
    ),
    policySensitiveOccupiedNiches: relativeDelta(
      policyEnabled.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
      policyNeutral.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches
    ),
    speciationRate: relativeDelta(policyEnabled.aggregate.meanSpeciationRate, policyNeutral.aggregate.meanSpeciationRate),
    netDiversificationRate: relativeDelta(
      policyEnabled.aggregate.meanNetDiversificationRate,
      policyNeutral.aggregate.meanNetDiversificationRate
    )
  };

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Do the March 29 harvest-payoff and harvest-spending couplings improve bounded diversification outcomes relative to a policy-neutral control under the adopted moderate-downweight distance regime?',
    prediction:
      'If the new couplings matter demographically, the policy-enabled arm should recover at least some of the March 28 speciation loss while also increasing policy-sensitive niche occupancy.',
    methodology:
      `Run matched ${steps}-step panels with ${seeds.length} shared seeds. Each arm starts from the same ` +
      'genomeV2-backed initial population with neutral policy loci present. The policy-enabled arm allows ' +
      'policy locus mutation (policyMutationProbability=0.65) while the control disables policy mutation. ' +
      'Both arms use the current code path, asymmetric secondary-resource forcing, and the default genomeV2 ' +
      `moderate-downweight distance regime. Report final phenotype diversity, a policy-sensitive phenotype-diversity summary, and rolling ${windowSize}-step diversification rates.`,
    config: {
      seeds: [...seeds],
      steps,
      windowSize,
      stopWhenExtinct: false,
      distanceWeights: resolvedBaseConfig.genomeV2DistanceWeights,
      baseConfig: BASE_CONFIG
    },
    policyEnabled,
    policyNeutral,
    delta,
    percentDelta,
    conclusion: buildConclusion(delta, percentDelta)
  };
}

function runArm(input: {
  label: 'policy_enabled' | 'policy_neutral';
  seeds: number[];
  steps: number;
  windowSize: number;
  policyMutationProbability: number;
}): PostCouplingDiversificationArmResult {
  const runs = input.seeds.map((seed) =>
    runSimulation(seed, input.steps, input.windowSize, input.policyMutationProbability)
  );

  return {
    label: input.label,
    policyMutationProbability: input.policyMutationProbability,
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
  policyMutationProbability: number
): PostCouplingDiversificationRunResult {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability
    },
    initialAgents: buildInitialAgents(seed)
  });
  const series = simulation.runWithAnalytics(steps, windowSize, false);
  const finalSummary = series.summaries[series.summaries.length - 1];
  const finalAnalytics = series.analytics[series.analytics.length - 1];
  const snapshot = simulation.snapshot();

  if (!finalSummary || !finalAnalytics) {
    throw new Error(`Post-coupling diversification revalidation produced no results for seed ${seed}`);
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
  delta: PostCouplingDiversificationRevalidationArtifact['delta'],
  percentDelta: PostCouplingDiversificationRevalidationArtifact['percentDelta']
): PostCouplingDiversificationRevalidationArtifact['conclusion'] {
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
    positiveSignals > 0 && negativeSignals === 0
      ? 'improves'
      : negativeSignals > 0 && positiveSignals === 0
        ? 'degrades'
        : 'mixed';

  return {
    outcome,
    summary:
      `Effective richness ${formatSigned(delta.effectiveRichness)} ` +
      `(${formatPercent(percentDelta.effectiveRichness)}), policy-sensitive richness ` +
      `${formatSigned(delta.policySensitiveEffectiveRichness)} (${formatPercent(percentDelta.policySensitiveEffectiveRichness)}), ` +
      `policy-sensitive occupied niches ` +
      `${formatSigned(delta.policySensitiveOccupiedNiches)} (${formatPercent(percentDelta.policySensitiveOccupiedNiches)}), ` +
      `speciation rate ${formatSigned(delta.speciationRate)} (${formatPercent(percentDelta.speciationRate)}), ` +
      `net diversification ${formatSigned(delta.netDiversificationRate)} (${formatPercent(percentDelta.netDiversificationRate)}).`
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
    runPostCouplingDiversificationRevalidation({ generatedAt })
  );
}
