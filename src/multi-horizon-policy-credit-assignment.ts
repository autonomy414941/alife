import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { compareExposureArmsAtHorizon } from './policy-horizon-matching';
import {
  DEFAULT_MULTI_HORIZON_BASE_CONFIG,
  DEFAULT_MULTI_HORIZON_HORIZONS,
  DEFAULT_MULTI_HORIZON_POLICY_MUTATION_PROBABILITY,
  DEFAULT_MULTI_HORIZON_SEEDS,
  DEFAULT_MULTI_HORIZON_STEPS,
  ExposureWithHorizons,
  runSimulationWithHorizons
} from './policy-horizon-shared';
import { classifyPolicySignature, PolicySignature } from './policy-signature';
import { SimulationConfig } from './types';

export const MULTI_HORIZON_POLICY_CREDIT_ASSIGNMENT_ARTIFACT =
  'docs/multi_horizon_policy_credit_assignment_2026-04-02.json';

const DEFAULT_SEEDS = DEFAULT_MULTI_HORIZON_SEEDS;
const DEFAULT_STEPS = DEFAULT_MULTI_HORIZON_STEPS;
const POLICY_MUTATION_PROBABILITY = DEFAULT_MULTI_HORIZON_POLICY_MUTATION_PROBABILITY;
const HORIZONS = DEFAULT_MULTI_HORIZON_HORIZONS;

const BASE_CONFIG: Partial<SimulationConfig> = DEFAULT_MULTI_HORIZON_BASE_CONFIG;

interface SignatureHorizonSummary {
  signature: PolicySignature;
  runs: {
    seed: number;
    coupledExposures: number;
    decoupledExposures: number;
    horizons: Record<number, {
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }>;
  }[];
  overall: {
    matchedBins: number;
    horizons: Record<number, {
      policyPositiveExposures: number;
      policyNegativeExposures: number;
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }>;
  };
}

export interface MultiHorizonPolicyCreditAssignmentArtifact {
  generatedAt: string;
  question: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    horizons: number[];
    policyMutationProbability: number;
    baseConfig: Partial<SimulationConfig>;
  };
  signatures: SignatureHorizonSummary[];
  interpretation: {
    summary: string;
    positiveHorizonEffects: Array<{
      signature: string;
      horizon: number;
      metric: string;
      advantage: number;
    }>;
  };
}

export function runMultiHorizonPolicyCreditAssignment(input: {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
} = {}): MultiHorizonPolicyCreditAssignmentArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const signatureData = new Map<
    string,
    {
      signature: PolicySignature;
      runs: Array<{
        seed: number;
        coupled: ExposureWithHorizons[];
        decoupled: ExposureWithHorizons[];
      }>;
    }
  >();

  for (const seed of seeds) {
    const coupledExposures = runSimulationWithHorizons({
      seed,
      steps,
      horizons: HORIZONS,
      policyCouplingEnabled: true,
      baseConfig: BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    });
    const decoupledExposures = runSimulationWithHorizons({
      seed,
      steps,
      horizons: HORIZONS,
      policyCouplingEnabled: false,
      baseConfig: BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    });

    const runSignatureData = new Map<
      string,
      {
        coupled: ExposureWithHorizons[];
        decoupled: ExposureWithHorizons[];
      }
    >();

    for (const exposure of coupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      if (!runSignatureData.has(signature.key)) {
        runSignatureData.set(signature.key, { coupled: [], decoupled: [] });
        if (!signatureData.has(signature.key)) {
          signatureData.set(signature.key, { signature, runs: [] });
        }
      }
      runSignatureData.get(signature.key)!.coupled.push(exposure);
    }

    for (const exposure of decoupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      if (!runSignatureData.has(signature.key)) {
        runSignatureData.set(signature.key, { coupled: [], decoupled: [] });
        if (!signatureData.has(signature.key)) {
          signatureData.set(signature.key, { signature, runs: [] });
        }
      }
      runSignatureData.get(signature.key)!.decoupled.push(exposure);
    }

    for (const [signatureKey, runData] of runSignatureData.entries()) {
      signatureData.get(signatureKey)!.runs.push({
        seed,
        coupled: runData.coupled,
        decoupled: runData.decoupled
      });
    }
  }

  const signatures = Array.from(signatureData.values())
    .map((data) => buildSignatureHorizonSummary(data))
    .sort((left, right) => {
      const leftExposures =
        left.overall.horizons[1].policyPositiveExposures + left.overall.horizons[1].policyNegativeExposures;
      const rightExposures =
        right.overall.horizons[1].policyPositiveExposures + right.overall.horizons[1].policyNegativeExposures;
      return rightExposures - leftExposures;
    });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does multi-horizon credit assignment (+5, +20, +50 tick survival and reproduction windows) reveal positive policy effects that remain invisible under one-tick scoring?',
    methodology:
      `Run ${steps}-step matched-control panels for ${seeds.length} shared seeds with policyMutationProbability=${POLICY_MUTATION_PROBABILITY}. ` +
      'Both arms start from the same genomeV2-backed population with neutral policy loci present. ' +
      `For each agent exposure at tick T, track survival and reproduction at horizons ${HORIZONS.join(', ')} ticks forward. ` +
      'Within matched fertility, crowding, age, and disturbance bins, compare policy-coupled versus policy-decoupled exposures across all horizons.',
    config: {
      seeds: [...seeds],
      steps,
      horizons: [...HORIZONS],
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      baseConfig: BASE_CONFIG
    },
    signatures,
    interpretation: buildInterpretation(signatures)
  };
}

function buildSignatureHorizonSummary(data: {
  signature: PolicySignature;
  runs: Array<{
    seed: number;
    coupled: ExposureWithHorizons[];
    decoupled: ExposureWithHorizons[];
  }>;
}): SignatureHorizonSummary {
  const runs = data.runs.map((run) => {
    const horizonMetrics: Record<number, {
      weightedHarvestAdvantage: number;
      weightedSurvivalAdvantage: number;
      weightedReproductionAdvantage: number;
    }> = {};

    for (const horizon of HORIZONS) {
      const comparison = compareExposureArmsAtHorizon(run.coupled, run.decoupled, horizon, 'coarse_bins');
      horizonMetrics[horizon] = {
        weightedHarvestAdvantage: comparison.weightedHarvestAdvantage,
        weightedSurvivalAdvantage: comparison.weightedSurvivalAdvantage,
        weightedReproductionAdvantage: comparison.weightedReproductionAdvantage
      };
    }

    return {
      seed: run.seed,
      coupledExposures: run.coupled.length,
      decoupledExposures: run.decoupled.length,
      horizons: horizonMetrics
    };
  });

  const allCoupled = data.runs.flatMap((run) => run.coupled);
  const allDecoupled = data.runs.flatMap((run) => run.decoupled);

  const overallHorizons: Record<number, {
    policyPositiveExposures: number;
    policyNegativeExposures: number;
    weightedHarvestAdvantage: number;
    weightedSurvivalAdvantage: number;
    weightedReproductionAdvantage: number;
  }> = {};

  const matchedBins = compareExposureArmsAtHorizon(allCoupled, allDecoupled, 1, 'coarse_bins').matchedContexts;

  for (const horizon of HORIZONS) {
    const comparison = compareExposureArmsAtHorizon(allCoupled, allDecoupled, horizon, 'coarse_bins');
    overallHorizons[horizon] = {
      policyPositiveExposures: allCoupled.length,
      policyNegativeExposures: allDecoupled.length,
      weightedHarvestAdvantage: comparison.weightedHarvestAdvantage,
      weightedSurvivalAdvantage: comparison.weightedSurvivalAdvantage,
      weightedReproductionAdvantage: comparison.weightedReproductionAdvantage
    };
  }

  return {
    signature: data.signature,
    runs,
    overall: {
      matchedBins,
      horizons: overallHorizons
    }
  };
}

function buildInterpretation(
  signatures: SignatureHorizonSummary[]
): MultiHorizonPolicyCreditAssignmentArtifact['interpretation'] {
  const positiveHorizonEffects: Array<{
    signature: string;
    horizon: number;
    metric: string;
    advantage: number;
  }> = [];

  for (const signature of signatures) {
    for (const horizon of HORIZONS) {
      const metrics = signature.overall.horizons[horizon];
      if (metrics.weightedSurvivalAdvantage > 0) {
        positiveHorizonEffects.push({
          signature: signature.signature.key,
          horizon,
          metric: 'survival',
          advantage: metrics.weightedSurvivalAdvantage
        });
      }
      if (metrics.weightedReproductionAdvantage > 0) {
        positiveHorizonEffects.push({
          signature: signature.signature.key,
          horizon,
          metric: 'reproduction',
          advantage: metrics.weightedReproductionAdvantage
        });
      }
    }
  }

  positiveHorizonEffects.sort((left, right) => right.advantage - left.advantage);

  const summary =
    positiveHorizonEffects.length > 0
      ? `Found ${positiveHorizonEffects.length} positive multi-horizon effects. Top: ${positiveHorizonEffects[0].signature} at horizon=${positiveHorizonEffects[0].horizon} (${positiveHorizonEffects[0].metric}=${positiveHorizonEffects[0].advantage.toFixed(4)}).`
      : 'No positive multi-horizon effects detected. Policy-bearing cohorts show no survival or reproduction advantages at any horizon.';

  return {
    summary,
    positiveHorizonEffects: positiveHorizonEffects.slice(0, 10)
  };
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runMultiHorizonPolicyCreditAssignment({ generatedAt })
  );
}
