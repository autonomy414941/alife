import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import {
  analyzePolicyFitnessRecords,
  PolicyFitnessAggregateComparison,
  PolicyFitnessCohortMetrics,
  PolicyFitnessRecord,
  summarizePolicyFitnessCohort
} from './policy-fitness';
import {
  classifyPolicySignature,
  POLICY_SIGNATURE_OPEN_THRESHOLD,
  POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD,
  POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD,
  POLICY_SIGNATURE_STRICT_THRESHOLD,
  PolicySignature
} from './policy-signature';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export const POLICY_SIGNATURE_MATCHED_CONTROL_VALIDATION_ARTIFACT =
  'docs/policy_signature_matched_control_validation_2026-04-01.json';

const DEFAULT_SEEDS = [9201, 9202];
const DEFAULT_STEPS = 120;
const POLICY_MUTATION_PROBABILITY = 0.65;
const STABLE_POSITIVE_RUN_FRACTION_THRESHOLD = 0.75;

const BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

interface SignatureArmRecords {
  coupled: PolicyFitnessRecord[];
  decoupled: PolicyFitnessRecord[];
}

interface SignatureRunResult {
  seed: number;
  coupledExposures: number;
  decoupledExposures: number;
  coupledMetrics: PolicyFitnessCohortMetrics;
  decoupledMetrics: PolicyFitnessCohortMetrics;
  matchedComparison: PolicyFitnessAggregateComparison;
}

export interface PolicySignatureMatchedControlValidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
}

export interface PolicySignatureMatchedControlSignatureSummary {
  signature: PolicySignature;
  runs: SignatureRunResult[];
  overall: {
    coupledExposures: number;
    decoupledExposures: number;
    coupledMetrics: PolicyFitnessCohortMetrics;
    decoupledMetrics: PolicyFitnessCohortMetrics;
    matchedComparison: PolicyFitnessAggregateComparison;
  };
  support: {
    harvestPositiveRunFraction: number;
    survivalPositiveRunFraction: number;
    reproductionPositiveRunFraction: number;
  };
  interpretation: {
    outcome: 'stable_positive' | 'mixed' | 'detrimental';
    summary: string;
  };
}

export interface PolicySignatureMatchedControlValidationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    policyMutationProbability: number;
    signatureThresholds: {
      gateOpenMax: number;
      gateStrictMinExclusive: number;
      primaryBiasMaxExclusive: number;
      secondaryBiasMinExclusive: number;
    };
    baseConfig: Partial<SimulationConfig>;
  };
  signatures: PolicySignatureMatchedControlSignatureSummary[];
  interpretation: {
    stablePositiveSignatures: string[];
    topHarvestSignature: string | null;
    topSurvivalSignature: string | null;
    topReproductionSignature: string | null;
    summary: string;
  };
}

export function runPolicySignatureMatchedControlValidation(
  input: PolicySignatureMatchedControlValidationInput = {}
): PolicySignatureMatchedControlValidationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const signaturesByKey = new Map<string, { signature: PolicySignature; records: SignatureArmRecords }>();
  const runBySignature = new Map<string, SignatureRunResult[]>();

  for (const seed of seeds) {
    const coupledRecords = runSimulation(seed, steps, true);
    const decoupledRecords = runSimulation(seed, steps, false);
    const runRecordsBySignature = new Map<string, SignatureArmRecords>();

    for (const record of coupledRecords) {
      const signature = classifyPolicySignature(record);
      const globalEntry = ensureGlobalSignature(signaturesByKey, signature);
      globalEntry.records.coupled.push(record);
      const runEntry = ensureRunSignature(runRecordsBySignature, signature.key);
      runEntry.coupled.push(record);
    }

    for (const record of decoupledRecords) {
      const signature = classifyPolicySignature(record);
      const globalEntry = ensureGlobalSignature(signaturesByKey, signature);
      globalEntry.records.decoupled.push(record);
      const runEntry = ensureRunSignature(runRecordsBySignature, signature.key);
      runEntry.decoupled.push(record);
    }

    for (const [signatureKey, runRecords] of runRecordsBySignature.entries()) {
      const runResult = buildRunResult(seed, runRecords.coupled, runRecords.decoupled);
      const existing = runBySignature.get(signatureKey);
      if (existing) {
        existing.push(runResult);
      } else {
        runBySignature.set(signatureKey, [runResult]);
      }
    }
  }

  const signatures = Array.from(signaturesByKey.values())
    .map(({ signature, records }) => buildSignatureSummary(signature, records, runBySignature.get(signature.key) ?? []))
    .sort((left, right) => {
      const leftSupport = left.overall.matchedComparison.policyPositiveExposures + left.overall.matchedComparison.policyNegativeExposures;
      const rightSupport =
        right.overall.matchedComparison.policyPositiveExposures + right.overall.matchedComparison.policyNegativeExposures;
      if (leftSupport !== rightSupport) {
        return rightSupport - leftSupport;
      }
      return right.overall.matchedComparison.weightedReproductionAdvantage -
        left.overall.matchedComparison.weightedReproductionAdvantage;
    });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Under the March 31 shared-locus matched control, does any bounded policy signature outperform the same signature when policy-payoff coupling is disabled?',
    prediction:
      'If the aggregate matched-control failure hides a small adaptive niche, at least one signature should retain positive matched harvest, survival, and reproduction deltas against its decoupled counterpart across the shared seeds.',
    methodology:
      `Run ${steps}-step matched-control panels for ${seeds.length} shared seeds with policyMutationProbability=${POLICY_MUTATION_PROBABILITY}. ` +
      'Both arms start from the same genomeV2-backed population with neutral policy loci present. ' +
      'For each per-step policy-fitness record, bucket the policy state into a bounded signature taxonomy: ' +
      'reproduction gate strength (open/guarded/strict), movement gate strength (open/guarded/strict), and resource bias (primary/balanced/secondary). ' +
      'Within each signature, compare policy-coupled versus policy-decoupled records inside matched fertility, crowding, age, and disturbance bins.',
    config: {
      seeds: [...seeds],
      steps,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      signatureThresholds: {
        gateOpenMax: POLICY_SIGNATURE_OPEN_THRESHOLD,
        gateStrictMinExclusive: POLICY_SIGNATURE_STRICT_THRESHOLD,
        primaryBiasMaxExclusive: POLICY_SIGNATURE_PRIMARY_BIAS_THRESHOLD,
        secondaryBiasMinExclusive: POLICY_SIGNATURE_SECONDARY_BIAS_THRESHOLD
      },
      baseConfig: BASE_CONFIG
    },
    signatures,
    interpretation: buildInterpretation(signatures)
  };
}

function runSimulation(seed: number, steps: number, policyCouplingEnabled: boolean): PolicyFitnessRecord[] {
  const simulation = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    },
    initialAgents: buildInitialAgents(seed),
    policyCouplingEnabled
  });

  return simulation.runWithPolicyFitness(steps, false).records;
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

function ensureGlobalSignature(
  entries: Map<string, { signature: PolicySignature; records: SignatureArmRecords }>,
  signature: PolicySignature
): { signature: PolicySignature; records: SignatureArmRecords } {
  const existing = entries.get(signature.key);
  if (existing) {
    return existing;
  }

  const created = {
    signature,
    records: { coupled: [], decoupled: [] }
  };
  entries.set(signature.key, created);
  return created;
}

function ensureRunSignature(
  entries: Map<string, SignatureArmRecords>,
  signatureKey: string
): SignatureArmRecords {
  const existing = entries.get(signatureKey);
  if (existing) {
    return existing;
  }

  const created = { coupled: [], decoupled: [] };
  entries.set(signatureKey, created);
  return created;
}

function buildRunResult(seed: number, coupled: PolicyFitnessRecord[], decoupled: PolicyFitnessRecord[]): SignatureRunResult {
  return {
    seed,
    coupledExposures: coupled.length,
    decoupledExposures: decoupled.length,
    coupledMetrics: summarizePolicyFitnessCohort(coupled),
    decoupledMetrics: summarizePolicyFitnessCohort(decoupled),
    matchedComparison: compareArms(coupled, decoupled)
  };
}

function buildSignatureSummary(
  signature: PolicySignature,
  records: SignatureArmRecords,
  runs: SignatureRunResult[]
): PolicySignatureMatchedControlSignatureSummary {
  const overallMatchedComparison = compareArms(records.coupled, records.decoupled);
  const support = {
    harvestPositiveRunFraction: positiveRunFraction(runs, 'weightedHarvestAdvantage'),
    survivalPositiveRunFraction: positiveRunFraction(runs, 'weightedSurvivalAdvantage'),
    reproductionPositiveRunFraction: positiveRunFraction(runs, 'weightedReproductionAdvantage')
  };

  return {
    signature,
    runs: [...runs].sort((left, right) => left.seed - right.seed),
    overall: {
      coupledExposures: records.coupled.length,
      decoupledExposures: records.decoupled.length,
      coupledMetrics: summarizePolicyFitnessCohort(records.coupled),
      decoupledMetrics: summarizePolicyFitnessCohort(records.decoupled),
      matchedComparison: overallMatchedComparison
    },
    support,
    interpretation: interpretSignature(signature, overallMatchedComparison, support)
  };
}

function compareArms(
  coupledRecords: ReadonlyArray<PolicyFitnessRecord>,
  decoupledRecords: ReadonlyArray<PolicyFitnessRecord>
): PolicyFitnessAggregateComparison {
  const relabeledRecords: PolicyFitnessRecord[] = [];

  for (const record of coupledRecords) {
    relabeledRecords.push({
      ...record,
      hasAnyPolicy: true
    });
  }
  for (const record of decoupledRecords) {
    relabeledRecords.push({
      ...record,
      hasAnyPolicy: false
    });
  }

  return analyzePolicyFitnessRecords(relabeledRecords).aggregate;
}

function interpretSignature(
  signature: PolicySignature,
  aggregate: PolicyFitnessAggregateComparison,
  support: PolicySignatureMatchedControlSignatureSummary['support']
): PolicySignatureMatchedControlSignatureSummary['interpretation'] {
  const stablePositive =
    aggregate.weightedHarvestAdvantage > 0 &&
    aggregate.weightedSurvivalAdvantage > 0 &&
    aggregate.weightedReproductionAdvantage > 0 &&
    support.harvestPositiveRunFraction >= STABLE_POSITIVE_RUN_FRACTION_THRESHOLD &&
    support.survivalPositiveRunFraction >= STABLE_POSITIVE_RUN_FRACTION_THRESHOLD &&
    support.reproductionPositiveRunFraction >= STABLE_POSITIVE_RUN_FRACTION_THRESHOLD;
  const detrimental =
    aggregate.weightedHarvestAdvantage <= 0 &&
    aggregate.weightedSurvivalAdvantage <= 0 &&
    aggregate.weightedReproductionAdvantage <= 0;

  return {
    outcome: stablePositive ? 'stable_positive' : detrimental ? 'detrimental' : 'mixed',
    summary:
      `${signature.key}: matched bins ${aggregate.matchedBins}, ` +
      `harvest ${formatSigned(aggregate.weightedHarvestAdvantage)}, ` +
      `survival ${formatSigned(aggregate.weightedSurvivalAdvantage)}, ` +
      `reproduction ${formatSigned(aggregate.weightedReproductionAdvantage)}. ` +
      `Positive-run fractions: harvest ${(support.harvestPositiveRunFraction * 100).toFixed(0)}%, ` +
      `survival ${(support.survivalPositiveRunFraction * 100).toFixed(0)}%, ` +
      `reproduction ${(support.reproductionPositiveRunFraction * 100).toFixed(0)}%.`
  };
}

function buildInterpretation(
  signatures: ReadonlyArray<PolicySignatureMatchedControlSignatureSummary>
): PolicySignatureMatchedControlValidationArtifact['interpretation'] {
  const stablePositiveSignatures = signatures
    .filter((signature) => signature.interpretation.outcome === 'stable_positive')
    .map((signature) => signature.signature.key);
  const topHarvestSignature = topSignature(signatures, 'weightedHarvestAdvantage');
  const topSurvivalSignature = topSignature(signatures, 'weightedSurvivalAdvantage');
  const topReproductionSignature = topSignature(signatures, 'weightedReproductionAdvantage');

  return {
    stablePositiveSignatures,
    topHarvestSignature,
    topSurvivalSignature,
    topReproductionSignature,
    summary:
      stablePositiveSignatures.length > 0
        ? `Stable positive signatures observed: ${stablePositiveSignatures.join(', ')}.`
        : 'No signature cleared the stable-positive bar across matched harvest, survival, and reproduction deltas. ' +
          `Best aggregate signatures were harvest=${topHarvestSignature ?? 'n/a'}, ` +
          `survival=${topSurvivalSignature ?? 'n/a'}, reproduction=${topReproductionSignature ?? 'n/a'}.`
  };
}

function topSignature(
  signatures: ReadonlyArray<PolicySignatureMatchedControlSignatureSummary>,
  key:
    | 'weightedHarvestAdvantage'
    | 'weightedSurvivalAdvantage'
    | 'weightedReproductionAdvantage'
): string | null {
  const best = signatures.reduce<PolicySignatureMatchedControlSignatureSummary | null>((currentBest, signature) => {
    if (currentBest === null) {
      return signature;
    }

    return signature.overall.matchedComparison[key] > currentBest.overall.matchedComparison[key]
      ? signature
      : currentBest;
  }, null);

  return best?.signature.key ?? null;
}

function positiveRunFraction(
  runs: ReadonlyArray<SignatureRunResult>,
  key:
    | 'weightedHarvestAdvantage'
    | 'weightedSurvivalAdvantage'
    | 'weightedReproductionAdvantage'
): number {
  if (runs.length === 0) {
    return 0;
  }

  let positiveRuns = 0;
  for (const run of runs) {
    if (run.matchedComparison[key] > 0) {
      positiveRuns += 1;
    }
  }
  return positiveRuns / runs.length;
}

function formatSigned(value: number): string {
  const rounded = value.toFixed(4);
  return value > 0 ? `+${rounded}` : rounded;
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runPolicySignatureMatchedControlValidation({ generatedAt })
  );
}
