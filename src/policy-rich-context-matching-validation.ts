import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { compareExposureArmsAtHorizon, HorizonArmComparison } from './policy-horizon-matching';
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

export const POLICY_RICH_CONTEXT_MATCHING_VALIDATION_ARTIFACT =
  'docs/policy_rich_context_matching_validation_2026-04-03.json';

const DELAYED_HORIZONS = DEFAULT_MULTI_HORIZON_HORIZONS.filter((horizon) => horizon >= 20);
const DEFAULT_TARGET_SIGNATURE_COUNT = 4;
const DEFAULT_SEEDS = DEFAULT_MULTI_HORIZON_SEEDS;
const DEFAULT_STEPS = DEFAULT_MULTI_HORIZON_STEPS;
const POLICY_MUTATION_PROBABILITY = DEFAULT_MULTI_HORIZON_POLICY_MUTATION_PROBABILITY;
const BASE_CONFIG: Partial<SimulationConfig> = DEFAULT_MULTI_HORIZON_BASE_CONFIG;

export interface PolicyRichContextMatchingValidationInput {
  generatedAt?: string;
  seeds?: number[];
  steps?: number;
  targetSignatureCount?: number;
}

interface SignatureExposureData {
  signature: PolicySignature;
  coupled: ExposureWithHorizons[];
  decoupled: ExposureWithHorizons[];
}

interface HorizonComparisonSummary {
  horizon: number;
  coarse: HorizonArmComparison;
  richObservation: HorizonArmComparison;
  survivalDeltaShift: number;
  outcome: 'remains_positive' | 'weakens_but_positive' | 'disappears_or_reverses';
}

interface SelectedSignatureSummary {
  signature: PolicySignature;
  selectedByMaxDelayedSurvival: number;
  totalCoupledExposures: number;
  totalDecoupledExposures: number;
  delayedHorizons: HorizonComparisonSummary[];
}

export interface PolicyRichContextMatchingValidationArtifact {
  generatedAt: string;
  question: string;
  methodology: string;
  config: {
    seeds: number[];
    steps: number;
    delayedHorizons: number[];
    targetSignatureCount: number;
    policyMutationProbability: number;
    baseConfig: Partial<SimulationConfig>;
  };
  selectedSignatures: SelectedSignatureSummary[];
  interpretation: {
    remainsPositiveCount: number;
    weakensButPositiveCount: number;
    disappearsOrReversesCount: number;
    summary: string;
  };
}

export function runPolicyRichContextMatchingValidation(
  input: PolicyRichContextMatchingValidationInput = {}
): PolicyRichContextMatchingValidationArtifact {
  const seeds = input.seeds ?? DEFAULT_SEEDS;
  const steps = input.steps ?? DEFAULT_STEPS;
  const targetSignatureCount = input.targetSignatureCount ?? DEFAULT_TARGET_SIGNATURE_COUNT;
  const signatureData = collectSignatureExposureData(seeds, steps);

  const selectedSignatures = Array.from(signatureData.values())
    .map((data) => buildSelectedSignatureSummary(data))
    .filter((summary) => summary.selectedByMaxDelayedSurvival > 0)
    .sort((left, right) => right.selectedByMaxDelayedSurvival - left.selectedByMaxDelayedSurvival)
    .slice(0, targetSignatureCount);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Do the strongest delayed-survival policy signatures from the April 2 matched-control panel remain positive once context matching uses richer local observations instead of only coarse fertility, crowding, age, and disturbance bins?',
    methodology:
      `Run ${steps}-step shared-seed matched-control panels for ${seeds.length} seeds with policyMutationProbability=${POLICY_MUTATION_PROBABILITY}. ` +
      'Both arms start from the same genomeV2-backed population with neutral policy loci present. ' +
      'Rank signatures by their strongest coarse-bin delayed-survival advantage at +20 or +50 ticks, then re-score those signatures under a richer observation-aware match key built from local fertility, local crowding, age, disturbance recency, disturbance count, resource mix, and same-lineage share.',
    config: {
      seeds: [...seeds],
      steps,
      delayedHorizons: [...DELAYED_HORIZONS],
      targetSignatureCount,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY,
      baseConfig: BASE_CONFIG
    },
    selectedSignatures,
    interpretation: buildInterpretation(selectedSignatures)
  };
}

function collectSignatureExposureData(seeds: number[], steps: number): Map<string, SignatureExposureData> {
  const signatureData = new Map<string, SignatureExposureData>();

  for (const seed of seeds) {
    const coupledExposures = runSimulationWithHorizons({
      seed,
      steps,
      horizons: DEFAULT_MULTI_HORIZON_HORIZONS,
      policyCouplingEnabled: true,
      baseConfig: BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    });
    const decoupledExposures = runSimulationWithHorizons({
      seed,
      steps,
      horizons: DEFAULT_MULTI_HORIZON_HORIZONS,
      policyCouplingEnabled: false,
      baseConfig: BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    });

    for (const exposure of coupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      const entry = ensureSignatureEntry(signatureData, signature);
      entry.coupled.push(exposure);
    }

    for (const exposure of decoupledExposures) {
      const signature = classifyPolicySignature(exposure.record);
      const entry = ensureSignatureEntry(signatureData, signature);
      entry.decoupled.push(exposure);
    }
  }

  return signatureData;
}

function ensureSignatureEntry(
  entries: Map<string, SignatureExposureData>,
  signature: PolicySignature
): SignatureExposureData {
  const existing = entries.get(signature.key);
  if (existing) {
    return existing;
  }

  const created: SignatureExposureData = {
    signature,
    coupled: [],
    decoupled: []
  };
  entries.set(signature.key, created);
  return created;
}

function buildSelectedSignatureSummary(data: SignatureExposureData): SelectedSignatureSummary {
  const delayedHorizons = DELAYED_HORIZONS.map((horizon) => {
    const coarse = compareExposureArmsAtHorizon(data.coupled, data.decoupled, horizon, 'coarse_bins');
    const richObservation = compareExposureArmsAtHorizon(data.coupled, data.decoupled, horizon, 'rich_observation');
    return {
      horizon,
      coarse,
      richObservation,
      survivalDeltaShift: richObservation.weightedSurvivalAdvantage - coarse.weightedSurvivalAdvantage,
      outcome: classifyOutcome(coarse.weightedSurvivalAdvantage, richObservation.weightedSurvivalAdvantage)
    };
  });

  return {
    signature: data.signature,
    selectedByMaxDelayedSurvival: Math.max(
      ...delayedHorizons.map((summary) => summary.coarse.weightedSurvivalAdvantage)
    ),
    totalCoupledExposures: data.coupled.length,
    totalDecoupledExposures: data.decoupled.length,
    delayedHorizons
  };
}

function classifyOutcome(
  coarseSurvivalAdvantage: number,
  richSurvivalAdvantage: number
): HorizonComparisonSummary['outcome'] {
  if (richSurvivalAdvantage <= 0) {
    return 'disappears_or_reverses';
  }

  if (richSurvivalAdvantage >= coarseSurvivalAdvantage * 0.5) {
    return 'remains_positive';
  }

  return 'weakens_but_positive';
}

function buildInterpretation(
  selectedSignatures: SelectedSignatureSummary[]
): PolicyRichContextMatchingValidationArtifact['interpretation'] {
  let remainsPositiveCount = 0;
  let weakensButPositiveCount = 0;
  let disappearsOrReversesCount = 0;

  for (const signature of selectedSignatures) {
    for (const horizon of signature.delayedHorizons) {
      if (horizon.outcome === 'remains_positive') {
        remainsPositiveCount += 1;
      } else if (horizon.outcome === 'weakens_but_positive') {
        weakensButPositiveCount += 1;
      } else {
        disappearsOrReversesCount += 1;
      }
    }
  }

  const summary =
    selectedSignatures.length === 0
      ? 'No delayed-survival-positive signatures were available for richer-matching validation.'
      : `${remainsPositiveCount} delayed horizon results remain positive under richer observation matching, ${weakensButPositiveCount} stay positive but weaken, and ${disappearsOrReversesCount} disappear or reverse.`;

  return {
    remainsPositiveCount,
    weakensButPositiveCount,
    disappearsOrReversesCount,
    summary
  };
}

if (require.main === module) {
  runGeneratedAtStudyCli(process.argv.slice(2), ({ generatedAt }) =>
    runPolicyRichContextMatchingValidation({ generatedAt })
  );
}
