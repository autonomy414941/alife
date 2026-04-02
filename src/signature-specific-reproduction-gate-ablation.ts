import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import {
  classifyPolicySignatureFromValues,
  PolicyGateStrength,
  POLICY_SIGNATURE_OPEN_THRESHOLD,
  POLICY_SIGNATURE_STRICT_THRESHOLD
} from './policy-signature';
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

export const SIGNATURE_SPECIFIC_REPRODUCTION_GATE_ABLATION_ARTIFACT =
  'docs/signature_specific_reproduction_gate_ablation_2026-04-02.json';

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

interface SharedBaselineSummary {
  seed: number;
  tick: number;
  population: number;
  activeSpecies: number;
  activeClades: number;
  meanEnergy: number;
  anyPolicyAgentFraction: number;
  reproductionGateDistribution: {
    open: number;
    guarded: number;
    strict: number;
  };
}

interface ReproductionGateDelta {
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
}

export interface SignatureSpecificReproductionGateAblationInput {
  generatedAt?: string;
  seeds?: number[];
  burnInSteps?: number;
  branchSteps?: number;
  windowSize?: number;
}

export interface SignatureSpecificReproductionGateRunResult {
  seed: number;
  reproductionGateClass: PolicyGateStrength;
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
  reproductionDecisionGatedFraction: number;
}

export interface SignatureSpecificReproductionGateArmResult {
  reproductionGateClass: PolicyGateStrength;
  reproductionGatingEnabled: boolean;
  runs: SignatureSpecificReproductionGateRunResult[];
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
    meanReproductionDecisionGatedFraction: number;
  };
}

export interface SignatureSpecificReproductionGateAblationArtifact {
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
    reproductionGateThresholds: {
      openMax: number;
      strictMinExclusive: number;
    };
  };
  sharedBaselines: SharedBaselineSummary[];
  arms: SignatureSpecificReproductionGateArmResult[];
  deltas: Array<{
    reproductionGateClass: PolicyGateStrength;
    deltaVsDisabled: ReproductionGateDelta;
    interpretation: string;
  }>;
  conclusion: {
    mostHarmfulClass: PolicyGateStrength | null;
    leastHarmfulClass: PolicyGateStrength | null;
    summary: string;
  };
}

export function runSignatureSpecificReproductionGateAblation(
  input: SignatureSpecificReproductionGateAblationInput = {}
): SignatureSpecificReproductionGateAblationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const burnInSteps = input.burnInSteps ?? DEFAULT_BURN_IN_STEPS;
  const branchSteps = input.branchSteps ?? DEFAULT_BRANCH_STEPS;
  const windowSize = input.windowSize ?? DEFAULT_WINDOW_SIZE;

  const sharedBaselines: SharedBaselineSummary[] = [];
  const armsByClass = new Map<PolicyGateStrength, Map<boolean, SignatureSpecificReproductionGateRunResult[]>>();

  for (const gateClass of ['open', 'guarded', 'strict'] as PolicyGateStrength[]) {
    armsByClass.set(gateClass, new Map([
      [false, []],
      [true, []]
    ]));
  }

  for (const seed of seeds) {
    const burnInSimulation = new LifeSimulation({
      seed,
      config: {
        ...BASE_CONFIG,
        policyMutationProbability: POLICY_MUTATION_PROBABILITY
      },
      initialAgents: buildInitialAgents(seed),
      policyCouplingEnabled: false
    });

    const baselineSeries = burnInSteps > 0 ? burnInSimulation.run(burnInSteps) : [];
    const baselineSummary = baselineSeries.at(-1);
    const baselineSnapshot = burnInSimulation.snapshot();

    const gateDistribution = classifyReproductionGateDistribution(baselineSnapshot.agents);

    sharedBaselines.push({
      seed,
      tick: baselineSnapshot.tick,
      population: baselineSnapshot.population,
      activeSpecies: baselineSnapshot.activeSpecies,
      activeClades: baselineSnapshot.activeClades,
      meanEnergy: baselineSnapshot.meanEnergy,
      anyPolicyAgentFraction: baselineSummary?.policyObservability?.activation.anyPolicyAgentFraction ?? 0,
      reproductionGateDistribution: gateDistribution
    });

    const replayState = burnInSimulation.captureReplayState();

    for (const gateClass of ['open', 'guarded', 'strict'] as PolicyGateStrength[]) {
      for (const reproductionGatingEnabled of [false, true]) {
        const branchSim = LifeSimulation.fromReplayState(replayState, {
          policyCoupling: resolvePolicyCoupling(false, {
            harvestGuidance: false,
            reserveSpending: false,
            reproductionGating: reproductionGatingEnabled
          })
        });

        const series = branchSim.runWithAnalytics(branchSteps, windowSize, false);
        const finalSummary = series.summaries.at(-1);
        const finalAnalytics = series.analytics.at(-1);
        const finalSnapshot = branchSim.snapshot();

        if (!finalSummary || !finalAnalytics) {
          throw new Error(`Signature-specific reproduction gate ablation produced no branch results for seed ${seed}, gate ${gateClass}, enabled ${reproductionGatingEnabled}`);
        }

        const phenotypeDiversity = finalSummary.phenotypeDiversity ?? emptyPhenotypeDiversityMetrics();
        const policySensitiveDiversity = finalSummary.policySensitivePhenotypeDiversity ?? emptyPhenotypeDiversityMetrics();

        const gateClassAgents = finalSnapshot.agents.filter((a) => {
          const agentGateClass = classifyAgentReproductionGate(a);
          return agentGateClass === gateClass;
        });

        const gateClassPopulation = gateClassAgents.length;

        const runResult: SignatureSpecificReproductionGateRunResult = {
          seed,
          reproductionGateClass: gateClass,
          finalPopulation: gateClassPopulation,
          activeSpecies: finalSnapshot.activeSpecies,
          activeClades: finalSnapshot.activeClades,
          effectiveRichness: phenotypeDiversity.effectiveRichness,
          occupiedNiches: phenotypeDiversity.occupiedNiches,
          phenotypeDiversity,
          policySensitivePhenotypeDiversity: policySensitiveDiversity,
          speciationRate: finalAnalytics.species.speciationRate,
          extinctionRate: finalAnalytics.species.extinctionRate,
          netDiversificationRate: finalAnalytics.species.netDiversificationRate,
          reproductionDecisionGatedFraction: finalSummary.policyObservability?.activation.reproductionDecisionGatedFraction ?? 0
        };

        armsByClass.get(gateClass)!.get(reproductionGatingEnabled)!.push(runResult);
      }
    }
  }

  const arms: SignatureSpecificReproductionGateArmResult[] = [];
  for (const gateClass of ['open', 'guarded', 'strict'] as PolicyGateStrength[]) {
    for (const enabled of [false, true]) {
      const runs = armsByClass.get(gateClass)!.get(enabled)!;
      arms.push({
        reproductionGateClass: gateClass,
        reproductionGatingEnabled: enabled,
        runs,
        aggregate: computeAggregate(runs)
      });
    }
  }

  const deltas = computeDeltas(arms);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Is the harm from reproduction gating uniform across policy signatures with different reproduction threshold regimes, or is it concentrated in specific gate strength classes (open/guarded/strict)?',
    prediction:
      'If reproduction gating harm is non-uniform, at least one gate strength class should show materially larger negative deltas on diversification metrics than the other classes.',
    methodology:
      `For each seed, run a ${burnInSteps}-step burn-in with policy mutation enabled and all direct payoff couplings disabled, ` +
      `capture the replay state, then fork ${6} matched branches (3 reproduction gate classes × 2 gating states). ` +
      `Each branch runs ${branchSteps} steps with reproduction gating either enabled or disabled. ` +
      `Agents are classified by their reproduction gate strength (open ≤ ${POLICY_SIGNATURE_OPEN_THRESHOLD}, guarded ≤ ${POLICY_SIGNATURE_STRICT_THRESHOLD}, strict > ${POLICY_SIGNATURE_STRICT_THRESHOLD}). ` +
      `Compare final population, diversification metrics, and policy-sensitive diversity for each gate class under matched controls.`,
    config: {
      seeds: [...seeds],
      burnInSteps,
      branchSteps,
      windowSize,
      stopWhenExtinct: false,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      baseConfig: BASE_CONFIG,
      reproductionGateThresholds: {
        openMax: POLICY_SIGNATURE_OPEN_THRESHOLD,
        strictMinExclusive: POLICY_SIGNATURE_STRICT_THRESHOLD
      }
    },
    sharedBaselines,
    arms,
    deltas,
    conclusion: buildConclusion(deltas)
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

function emptyPhenotypeDiversityMetrics(): PhenotypeDiversityMetrics {
  return {
    effectiveRichness: 0,
    meanPairwiseDistance: 0,
    occupiedNiches: 0,
    speciesPerOccupiedNiche: 0
  };
}

function classifyReproductionGateDistribution(agents: any[]): { open: number; guarded: number; strict: number } {
  const distribution = { open: 0, guarded: 0, strict: 0 };
  for (const agent of agents) {
    const gateClass = classifyAgentReproductionGate(agent);
    distribution[gateClass]++;
  }
  return distribution;
}

function classifyAgentReproductionGate(agent: any): PolicyGateStrength {
  const policyValues = agent.genomeV2?.categories?.policyLoci;
  if (!policyValues) {
    return 'open';
  }
  const signature = classifyPolicySignatureFromValues(policyValues);
  return signature.reproductionGate;
}

function computeAggregate(runs: SignatureSpecificReproductionGateRunResult[]): SignatureSpecificReproductionGateArmResult['aggregate'] {
  if (runs.length === 0) {
    return {
      meanFinalPopulation: 0,
      meanActiveSpecies: 0,
      meanActiveClades: 0,
      meanEffectiveRichness: 0,
      meanOccupiedNiches: 0,
      meanPolicySensitivePhenotypeDiversity: {
        effectiveRichness: 0,
        meanPairwiseDistance: 0,
        occupiedNiches: 0,
        speciesPerOccupiedNiche: 0
      },
      meanSpeciationRate: 0,
      meanExtinctionRate: 0,
      meanNetDiversificationRate: 0,
      meanReproductionDecisionGatedFraction: 0
    };
  }

  return {
    meanFinalPopulation: runs.reduce((sum, r) => sum + r.finalPopulation, 0) / runs.length,
    meanActiveSpecies: runs.reduce((sum, r) => sum + r.activeSpecies, 0) / runs.length,
    meanActiveClades: runs.reduce((sum, r) => sum + r.activeClades, 0) / runs.length,
    meanEffectiveRichness: runs.reduce((sum, r) => sum + r.effectiveRichness, 0) / runs.length,
    meanOccupiedNiches: runs.reduce((sum, r) => sum + r.occupiedNiches, 0) / runs.length,
    meanPolicySensitivePhenotypeDiversity: {
      effectiveRichness: runs.reduce((sum, r) => sum + r.policySensitivePhenotypeDiversity.effectiveRichness, 0) / runs.length,
      meanPairwiseDistance: runs.reduce((sum, r) => sum + r.policySensitivePhenotypeDiversity.meanPairwiseDistance, 0) / runs.length,
      occupiedNiches: runs.reduce((sum, r) => sum + r.policySensitivePhenotypeDiversity.occupiedNiches, 0) / runs.length,
      speciesPerOccupiedNiche: runs.reduce((sum, r) => sum + r.policySensitivePhenotypeDiversity.speciesPerOccupiedNiche, 0) / runs.length
    },
    meanSpeciationRate: runs.reduce((sum, r) => sum + r.speciationRate, 0) / runs.length,
    meanExtinctionRate: runs.reduce((sum, r) => sum + r.extinctionRate, 0) / runs.length,
    meanNetDiversificationRate: runs.reduce((sum, r) => sum + r.netDiversificationRate, 0) / runs.length,
    meanReproductionDecisionGatedFraction: runs.reduce((sum, r) => sum + r.reproductionDecisionGatedFraction, 0) / runs.length
  };
}

function computeDeltas(arms: SignatureSpecificReproductionGateArmResult[]): Array<{
  reproductionGateClass: PolicyGateStrength;
  deltaVsDisabled: ReproductionGateDelta;
  interpretation: string;
}> {
  const deltas: Array<{
    reproductionGateClass: PolicyGateStrength;
    deltaVsDisabled: ReproductionGateDelta;
    interpretation: string;
  }> = [];

  for (const gateClass of ['open', 'guarded', 'strict'] as PolicyGateStrength[]) {
    const disabledArm = arms.find((a) => a.reproductionGateClass === gateClass && !a.reproductionGatingEnabled);
    const enabledArm = arms.find((a) => a.reproductionGateClass === gateClass && a.reproductionGatingEnabled);

    if (!disabledArm || !enabledArm) {
      continue;
    }

    const delta: ReproductionGateDelta = {
      finalPopulation: enabledArm.aggregate.meanFinalPopulation - disabledArm.aggregate.meanFinalPopulation,
      activeSpecies: enabledArm.aggregate.meanActiveSpecies - disabledArm.aggregate.meanActiveSpecies,
      activeClades: enabledArm.aggregate.meanActiveClades - disabledArm.aggregate.meanActiveClades,
      effectiveRichness: enabledArm.aggregate.meanEffectiveRichness - disabledArm.aggregate.meanEffectiveRichness,
      occupiedNiches: enabledArm.aggregate.meanOccupiedNiches - disabledArm.aggregate.meanOccupiedNiches,
      policySensitiveEffectiveRichness: enabledArm.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness -
        disabledArm.aggregate.meanPolicySensitivePhenotypeDiversity.effectiveRichness,
      policySensitiveOccupiedNiches: enabledArm.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches -
        disabledArm.aggregate.meanPolicySensitivePhenotypeDiversity.occupiedNiches,
      speciationRate: enabledArm.aggregate.meanSpeciationRate - disabledArm.aggregate.meanSpeciationRate,
      extinctionRate: enabledArm.aggregate.meanExtinctionRate - disabledArm.aggregate.meanExtinctionRate,
      netDiversificationRate: enabledArm.aggregate.meanNetDiversificationRate - disabledArm.aggregate.meanNetDiversificationRate
    };

    const interpretation = interpretDelta(gateClass, delta);
    deltas.push({ reproductionGateClass: gateClass, deltaVsDisabled: delta, interpretation });
  }

  return deltas;
}

function interpretDelta(gateClass: PolicyGateStrength, delta: ReproductionGateDelta): string {
  const netDivSign = delta.netDiversificationRate >= 0 ? 'positive' : 'negative';
  const effectiveRichnessSign = delta.effectiveRichness >= 0 ? 'positive' : 'negative';
  const occupiedNichesSign = delta.occupiedNiches >= 0 ? 'positive' : 'negative';

  return `${gateClass} reproduction gate: net diversification ${netDivSign} (${delta.netDiversificationRate.toFixed(2)}), ` +
    `effective richness ${effectiveRichnessSign} (${delta.effectiveRichness.toFixed(2)}), ` +
    `occupied niches ${occupiedNichesSign} (${delta.occupiedNiches.toFixed(2)})`;
}

function buildConclusion(deltas: Array<{
  reproductionGateClass: PolicyGateStrength;
  deltaVsDisabled: ReproductionGateDelta;
  interpretation: string;
}>): {
  mostHarmfulClass: PolicyGateStrength | null;
  leastHarmfulClass: PolicyGateStrength | null;
  summary: string;
} {
  if (deltas.length === 0) {
    return {
      mostHarmfulClass: null,
      leastHarmfulClass: null,
      summary: 'No data available.'
    };
  }

  deltas.sort((a, b) => a.deltaVsDisabled.netDiversificationRate - b.deltaVsDisabled.netDiversificationRate);

  const mostHarmfulClass = deltas[0].reproductionGateClass;
  const leastHarmfulClass = deltas[deltas.length - 1].reproductionGateClass;

  const mostHarmfulDelta = deltas[0].deltaVsDisabled.netDiversificationRate;
  const leastHarmfulDelta = deltas[deltas.length - 1].deltaVsDisabled.netDiversificationRate;

  const harmIsUniform = Math.abs(mostHarmfulDelta - leastHarmfulDelta) < 0.5;

  if (harmIsUniform) {
    return {
      mostHarmfulClass,
      leastHarmfulClass,
      summary: `Reproduction gating harm is approximately uniform across gate strength classes. All classes show similar net diversification deltas (range: ${mostHarmfulDelta.toFixed(2)} to ${leastHarmfulDelta.toFixed(2)}).`
    };
  }

  return {
    mostHarmfulClass,
    leastHarmfulClass,
    summary: `Reproduction gating harm is concentrated in the ${mostHarmfulClass} gate class (net diversification ${mostHarmfulDelta.toFixed(2)}), while ${leastHarmfulClass} shows materially less harm (${leastHarmfulDelta.toFixed(2)}).`
  };
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runSignatureSpecificReproductionGateAblation({ generatedAt })
  );
}
