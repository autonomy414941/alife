import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE,
  resolveBehavioralPolicyFlags,
  resolveSpendingSecondaryPreference
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { createGenomeV2, setTrait } from './genome-v2';
import {
  GradedReproductionSmokeResult,
  runGradedReproductionPolicySmoke
} from './graded-reproduction-policy-smoke';
import {
  ReproductionPolicyRobustnessStressTestArtifact,
  ReproductionPolicyRobustnessStressTestInput,
  runReproductionPolicyRobustnessStressTest
} from './reproduction-policy-robustness-stress-test';
import {
  SubstrateSpendingPolicySmokeArtifact,
  runSubstrateSpendingPolicySmoke
} from './substrate-spending-policy-smoke';

export const POLICY_GENOME_UNIFICATION_REVALIDATION_ARTIFACT =
  'docs/policy_genome_unification_revalidation_2026-03-25.json';

const GRADED_REPRODUCTION_BASELINE_PATH = 'docs/graded_reproduction_policy_smoke_2026-03-24.txt';
const SUBSTRATE_SPENDING_BASELINE_PATH = 'docs/substrate_spending_policy_smoke_2026-03-24.json';
const REPRODUCTION_ROBUSTNESS_BASELINE_PATH = 'docs/reproduction_policy_robustness_stress_test_2026-03-24.json';
const DEFAULT_REVALIDATION_REPRODUCTION_ROBUSTNESS: ReproductionPolicyRobustnessStressTestInput = {
  runs: 2,
  steps: 80,
  seed: 90210,
  seedStep: 37
};

type ValidationStatus = 'preserved' | 'improved' | 'degraded';

export interface PolicyGenomeUnificationRevalidationInput {
  generatedAt?: string;
  reproductionRobustness?: ReproductionPolicyRobustnessStressTestInput;
}

export interface PolicyGenomeUnificationRevalidationArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  baselines: {
    gradedReproduction: string;
    substrateSpending: string;
    reproductionRobustness: string;
  };
  architectureChecks: {
    reproductionPolicyFlagsRecognizeGenomeTraits: boolean;
    spendingPreferenceResolvesFromGenomeTraits: boolean;
    summary: string;
  };
  validations: {
    gradedReproduction: GradedReproductionValidation;
    substrateSpending: SubstrateSpendingValidation;
    reproductionRobustness: ReproductionRobustnessValidation;
  };
  conclusion: {
    preservedCount: number;
    improvedCount: number;
    degradedCount: number;
    summary: string;
  };
}

export interface PolicyGenomeUnificationRevalidationDependencies {
  readTextFile?: (path: string) => string;
  runGradedReproductionSmoke?: typeof runGradedReproductionPolicySmoke;
  runSubstrateSpendingSmoke?: typeof runSubstrateSpendingPolicySmoke;
  runReproductionRobustness?: typeof runReproductionPolicyRobustnessStressTest;
}

interface GradedReproductionSummary {
  binaryBirths: number;
  maxBirths: number;
  maxBirthsSteepness: number;
  steepnessZeroGatedFraction: number;
  steepnessFiveGatedFraction: number;
}

interface GradedReproductionValidation {
  status: ValidationStatus;
  baseline: {
    rows: GradedReproductionSmokeResult[];
    summary: GradedReproductionSummary;
  };
  current: {
    rows: GradedReproductionSmokeResult[];
    summary: GradedReproductionSummary;
  };
  deltas: {
    totalBirthDeltaAtSteepnessOne: number;
    gatedFractionDeltaAtSteepnessFive: number;
    exactRowMatch: boolean;
  };
  summary: string;
}

interface SpendingSummary {
  primaryBiasedSecondaryRetentionDelta: number;
  secondaryBiasedSecondaryBurnDelta: number;
  primaryBiasedRetainsMoreSecondary: boolean;
  secondaryBiasedBurnsMoreSecondary: boolean;
}

interface SubstrateSpendingValidation {
  status: ValidationStatus;
  baseline: {
    generatedAt: string;
    config: SubstrateSpendingPolicySmokeArtifact['config'];
    arms: SubstrateSpendingPolicySmokeArtifact['arms'];
    summary: SpendingSummary;
  };
  current: {
    generatedAt: string;
    config: SubstrateSpendingPolicySmokeArtifact['config'];
    arms: SubstrateSpendingPolicySmokeArtifact['arms'];
    summary: SpendingSummary;
  };
  deltas: {
    primaryBiasedSecondaryRetentionDelta: number;
    secondaryBiasedSecondaryBurnDelta: number;
    exactArmMatch: boolean;
  };
  summary: string;
}

interface ReproductionRobustnessSummary {
  signal: ReproductionPolicyRobustnessStressTestArtifact['conclusion']['signal'];
  weightedHarvestAdvantage: number;
  weightedReproductionAdvantage: number;
  harvestAdvantagePositiveRunFraction: number;
  reproductionAdvantagePositiveRunFraction: number;
}

interface ReproductionRobustnessValidation {
  status: ValidationStatus;
  comparisonMode: 'exact' | 'reduced';
  baseline: {
    generatedAt: string;
    config: ReproductionPolicyRobustnessStressTestArtifact['config'];
    summary: ReproductionRobustnessSummary;
  };
  current: {
    generatedAt: string;
    config: ReproductionPolicyRobustnessStressTestArtifact['config'];
    summary: ReproductionRobustnessSummary;
  };
  deltas: {
    weightedHarvestAdvantage: number;
    weightedReproductionAdvantage: number;
    exactAggregateMatch: boolean;
  };
  summary: string;
}

export function runPolicyGenomeUnificationRevalidation(
  input: PolicyGenomeUnificationRevalidationInput = {},
  dependencies: PolicyGenomeUnificationRevalidationDependencies = {}
): PolicyGenomeUnificationRevalidationArtifact {
  const readTextFile = dependencies.readTextFile ?? readProjectFile;
  const gradedBaseline = parseGradedReproductionBaseline(readTextFile(GRADED_REPRODUCTION_BASELINE_PATH));
  const spendingBaseline = JSON.parse(
    readTextFile(SUBSTRATE_SPENDING_BASELINE_PATH)
  ) as SubstrateSpendingPolicySmokeArtifact;
  const robustnessBaseline = JSON.parse(
    readTextFile(REPRODUCTION_ROBUSTNESS_BASELINE_PATH)
  ) as ReproductionPolicyRobustnessStressTestArtifact;

  const currentGraded = (dependencies.runGradedReproductionSmoke ?? runGradedReproductionPolicySmoke)();
  const currentSpending = (dependencies.runSubstrateSpendingSmoke ?? runSubstrateSpendingPolicySmoke)({
    generatedAt: input.generatedAt
  });
  const currentRobustness = (dependencies.runReproductionRobustness ?? runReproductionPolicyRobustnessStressTest)({
    ...DEFAULT_REVALIDATION_REPRODUCTION_ROBUSTNESS,
    ...input.reproductionRobustness,
    generatedAt: input.generatedAt
  });

  const gradedReproduction = compareGradedReproduction(gradedBaseline, currentGraded);
  const substrateSpending = compareSubstrateSpending(spendingBaseline, currentSpending);
  const reproductionRobustness = compareReproductionRobustness(robustnessBaseline, currentRobustness);

  const statuses = [
    gradedReproduction.status,
    substrateSpending.status,
    reproductionRobustness.status
  ];
  const preservedCount = statuses.filter((status) => status === 'preserved').length;
  const improvedCount = statuses.filter((status) => status === 'improved').length;
  const degradedCount = statuses.filter((status) => status === 'degraded').length;

  const architectureChecks = buildArchitectureChecks();

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Did policy-genome unification preserve the March 24 bounded behavioral validation surfaces, or did the refactor change their outcomes?',
    prediction:
      'If unification was architecture-only, graded reproduction, substrate spending, and the bounded reproduction-only stress panel should remain qualitatively unchanged under genome-backed policy loci.',
    baselines: {
      gradedReproduction: GRADED_REPRODUCTION_BASELINE_PATH,
      substrateSpending: SUBSTRATE_SPENDING_BASELINE_PATH,
      reproductionRobustness: REPRODUCTION_ROBUSTNESS_BASELINE_PATH
    },
    architectureChecks,
    validations: {
      gradedReproduction,
      substrateSpending,
      reproductionRobustness
    },
    conclusion: {
      preservedCount,
      improvedCount,
      degradedCount,
      summary:
        degradedCount === 0
          ? `All three bounded validations survived policy-genome unification (${preservedCount} preserved, ${improvedCount} improved, ${degradedCount} degraded).`
          : `Policy-genome unification changed ${degradedCount} bounded validation surfaces (${preservedCount} preserved, ${improvedCount} improved, ${degradedCount} degraded).`
    }
  };
}

export function runPolicyGenomeUnificationRevalidationCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runPolicyGenomeUnificationRevalidation({ generatedAt }));
}

export function parseGradedReproductionBaseline(text: string): GradedReproductionSmokeResult[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(
        /^([0-9.]+)\s+\|\s+([0-9.]+)\s+\|\s+([0-9]+)\s+\|\s+([0-9]+)\s+\|\s+([0-9.]+)\s+\|\s+([0-9.]+)$/
      );
      if (!match) {
        return undefined;
      }

      return {
        steepness: Number(match[1]),
        threshold: Number(match[2]),
        finalPopulation: Number(match[3]),
        totalBirths: Number(match[4]),
        reproductionPolicyAgentFraction: Number(match[5]),
        reproductionDecisionGatedFraction: Number(match[6])
      };
    })
    .filter((result): result is GradedReproductionSmokeResult => result !== undefined);
}

function compareGradedReproduction(
  baselineRows: ReadonlyArray<GradedReproductionSmokeResult>,
  currentRows: ReadonlyArray<GradedReproductionSmokeResult>
): GradedReproductionValidation {
  const baselineSummary = summarizeGradedReproduction(baselineRows);
  const currentSummary = summarizeGradedReproduction(currentRows);
  const baselineAtOne = requireRowBySteepness(baselineRows, 1);
  const currentAtOne = requireRowBySteepness(currentRows, 1);
  const baselineAtFive = requireRowBySteepness(baselineRows, 5);
  const currentAtFive = requireRowBySteepness(currentRows, 5);
  const exactRowMatch = compareGradedRowsExactly(baselineRows, currentRows);
  const qualitativePreserved =
    currentSummary.binaryBirths === 0 &&
    currentSummary.maxBirthsSteepness > 0 &&
    currentSummary.steepnessFiveGatedFraction > currentSummary.steepnessZeroGatedFraction;

  let status: ValidationStatus = 'degraded';
  if (exactRowMatch) {
    status = 'preserved';
  } else if (qualitativePreserved) {
    status = currentSummary.maxBirths > baselineSummary.maxBirths ? 'improved' : 'preserved';
  }

  return {
    status,
    baseline: {
      rows: [...baselineRows],
      summary: baselineSummary
    },
    current: {
      rows: [...currentRows],
      summary: currentSummary
    },
    deltas: {
      totalBirthDeltaAtSteepnessOne: currentAtOne.totalBirths - baselineAtOne.totalBirths,
      gatedFractionDeltaAtSteepnessFive:
        currentAtFive.reproductionDecisionGatedFraction - baselineAtFive.reproductionDecisionGatedFraction,
      exactRowMatch
    },
    summary:
      status === 'degraded'
        ? `Graded reproduction changed materially after unification: binary births=${currentSummary.binaryBirths}, max births=${currentSummary.maxBirths} at steepness ${currentSummary.maxBirthsSteepness}.`
        : `Graded reproduction ${status}: binary births stayed at ${currentSummary.binaryBirths}, peak births are ${currentSummary.maxBirths} at steepness ${currentSummary.maxBirthsSteepness}.`
  };
}

function compareSubstrateSpending(
  baselineArtifact: SubstrateSpendingPolicySmokeArtifact,
  currentArtifact: SubstrateSpendingPolicySmokeArtifact
): SubstrateSpendingValidation {
  const baselineSummary = summarizeSpending(baselineArtifact);
  const currentSummary = summarizeSpending(currentArtifact);
  const exactArmMatch = compareSpendingArmsExactly(baselineArtifact, currentArtifact);
  const qualitativePreserved =
    currentSummary.primaryBiasedRetainsMoreSecondary && currentSummary.secondaryBiasedBurnsMoreSecondary;

  let status: ValidationStatus = 'degraded';
  if (exactArmMatch) {
    status = 'preserved';
  } else if (qualitativePreserved) {
    const strongerRetention =
      currentSummary.primaryBiasedSecondaryRetentionDelta > baselineSummary.primaryBiasedSecondaryRetentionDelta;
    const strongerBurn =
      currentSummary.secondaryBiasedSecondaryBurnDelta > baselineSummary.secondaryBiasedSecondaryBurnDelta;
    status = strongerRetention && strongerBurn ? 'improved' : 'preserved';
  }

  return {
    status,
    baseline: {
      generatedAt: baselineArtifact.generatedAt,
      config: baselineArtifact.config,
      arms: baselineArtifact.arms,
      summary: baselineSummary
    },
    current: {
      generatedAt: currentArtifact.generatedAt,
      config: currentArtifact.config,
      arms: currentArtifact.arms,
      summary: currentSummary
    },
    deltas: {
      primaryBiasedSecondaryRetentionDelta:
        currentSummary.primaryBiasedSecondaryRetentionDelta - baselineSummary.primaryBiasedSecondaryRetentionDelta,
      secondaryBiasedSecondaryBurnDelta:
        currentSummary.secondaryBiasedSecondaryBurnDelta - baselineSummary.secondaryBiasedSecondaryBurnDelta,
      exactArmMatch
    },
    summary:
      status === 'degraded'
        ? `Substrate spending degraded: primary retention=${currentSummary.primaryBiasedSecondaryRetentionDelta.toFixed(3)}, secondary burn=${currentSummary.secondaryBiasedSecondaryBurnDelta.toFixed(3)}.`
        : `Substrate spending ${status}: primary-biased retention delta=${currentSummary.primaryBiasedSecondaryRetentionDelta.toFixed(3)}, secondary-biased burn delta=${currentSummary.secondaryBiasedSecondaryBurnDelta.toFixed(3)}.`
  };
}

function compareReproductionRobustness(
  baselineArtifact: ReproductionPolicyRobustnessStressTestArtifact,
  currentArtifact: ReproductionPolicyRobustnessStressTestArtifact
): ReproductionRobustnessValidation {
  const baselineSummary = summarizeReproductionRobustness(baselineArtifact);
  const currentSummary = summarizeReproductionRobustness(currentArtifact);
  const exactAggregateMatch = compareRobustnessExactly(baselineArtifact, currentArtifact);
  const comparisonMode: 'exact' | 'reduced' =
    currentArtifact.config.runs === baselineArtifact.config.runs &&
    currentArtifact.config.steps === baselineArtifact.config.steps
      ? 'exact'
      : 'reduced';

  let status: ValidationStatus = 'degraded';
  if (exactAggregateMatch) {
    status = 'preserved';
  } else if (currentSummary.signal === baselineSummary.signal) {
    status = 'preserved';
  } else if (baselineSummary.signal === 'mixed' && currentSummary.signal === 'robust') {
    status = 'improved';
  }

  return {
    status,
    comparisonMode,
    baseline: {
      generatedAt: baselineArtifact.generatedAt,
      config: baselineArtifact.config,
      summary: baselineSummary
    },
    current: {
      generatedAt: currentArtifact.generatedAt,
      config: currentArtifact.config,
      summary: currentSummary
    },
    deltas: {
      weightedHarvestAdvantage:
        currentSummary.weightedHarvestAdvantage - baselineSummary.weightedHarvestAdvantage,
      weightedReproductionAdvantage:
        currentSummary.weightedReproductionAdvantage - baselineSummary.weightedReproductionAdvantage,
      exactAggregateMatch
    },
    summary:
      status === 'degraded'
        ? `Reproduction-only robustness degraded from ${baselineSummary.signal} to ${currentSummary.signal} on the ${comparisonMode} panel.`
        : `Reproduction-only robustness ${status} on the ${comparisonMode} panel: signal stayed ${currentSummary.signal}, harvest delta=${currentSummary.weightedHarvestAdvantage.toFixed(4)}, reproduction delta=${currentSummary.weightedReproductionAdvantage.toFixed(4)}.`
  };
}

function summarizeGradedReproduction(
  rows: ReadonlyArray<GradedReproductionSmokeResult>
): GradedReproductionSummary {
  const binary = requireRowBySteepness(rows, 0);
  const steepnessFive = requireRowBySteepness(rows, 5);
  const maxBirthRow = rows.reduce((best, row) => (row.totalBirths > best.totalBirths ? row : best), rows[0]);

  return {
    binaryBirths: binary.totalBirths,
    maxBirths: maxBirthRow.totalBirths,
    maxBirthsSteepness: maxBirthRow.steepness,
    steepnessZeroGatedFraction: binary.reproductionDecisionGatedFraction,
    steepnessFiveGatedFraction: steepnessFive.reproductionDecisionGatedFraction
  };
}

function summarizeSpending(artifact: SubstrateSpendingPolicySmokeArtifact): SpendingSummary {
  const control = requireSpendingArm(artifact, 'control');
  const primaryBiased = requireSpendingArm(artifact, 'primary_biased');
  const secondaryBiased = requireSpendingArm(artifact, 'secondary_biased');

  return {
    primaryBiasedSecondaryRetentionDelta: primaryBiased.finalSecondary - control.finalSecondary,
    secondaryBiasedSecondaryBurnDelta:
      secondaryBiased.cumulativeSecondarySpent - control.cumulativeSecondarySpent,
    primaryBiasedRetainsMoreSecondary: artifact.interpretation.primaryBiasedRetainsMoreSecondary,
    secondaryBiasedBurnsMoreSecondary: artifact.interpretation.secondaryBiasedBurnsMoreSecondary
  };
}

function summarizeReproductionRobustness(
  artifact: ReproductionPolicyRobustnessStressTestArtifact
): ReproductionRobustnessSummary {
  return {
    signal: artifact.conclusion.signal,
    weightedHarvestAdvantage: artifact.overall.matchedComparison.weightedHarvestAdvantage,
    weightedReproductionAdvantage: artifact.overall.matchedComparison.weightedReproductionAdvantage,
    harvestAdvantagePositiveRunFraction: artifact.support.harvestAdvantagePositiveRunFraction,
    reproductionAdvantagePositiveRunFraction: artifact.support.reproductionAdvantagePositiveRunFraction
  };
}

function buildArchitectureChecks(): PolicyGenomeUnificationRevalidationArtifact['architectureChecks'] {
  const reproductionGenome = createGenomeV2();
  setTrait(reproductionGenome, INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD, 0.6);
  const spendingGenome = createGenomeV2();
  setTrait(spendingGenome, INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, 1);

  const reproductionPolicyFlagsRecognizeGenomeTraits = resolveBehavioralPolicyFlags({
    genomeV2: reproductionGenome,
    policyState: undefined
  }).hasReproductionPolicy;
  const spendingPreferenceResolvesFromGenomeTraits =
    resolveSpendingSecondaryPreference({ genomeV2: spendingGenome, policyState: undefined }) === 1;

  return {
    reproductionPolicyFlagsRecognizeGenomeTraits,
    spendingPreferenceResolvesFromGenomeTraits,
    summary:
      reproductionPolicyFlagsRecognizeGenomeTraits && spendingPreferenceResolvesFromGenomeTraits
        ? 'Genome-backed policy loci are visible to both policy-flag detection and substrate spending resolution.'
        : 'One or more genome-backed policy compatibility checks failed.'
  };
}

function compareGradedRowsExactly(
  baselineRows: ReadonlyArray<GradedReproductionSmokeResult>,
  currentRows: ReadonlyArray<GradedReproductionSmokeResult>
): boolean {
  if (baselineRows.length !== currentRows.length) {
    return false;
  }

  return baselineRows.every((baselineRow) => {
    const currentRow = currentRows.find((row) => row.steepness === baselineRow.steepness);
    if (!currentRow) {
      return false;
    }

    return (
      currentRow.threshold === baselineRow.threshold &&
      currentRow.finalPopulation === baselineRow.finalPopulation &&
      currentRow.totalBirths === baselineRow.totalBirths &&
      currentRow.reproductionPolicyAgentFraction === baselineRow.reproductionPolicyAgentFraction &&
      currentRow.reproductionDecisionGatedFraction === baselineRow.reproductionDecisionGatedFraction
    );
  });
}

function compareSpendingArmsExactly(
  baselineArtifact: SubstrateSpendingPolicySmokeArtifact,
  currentArtifact: SubstrateSpendingPolicySmokeArtifact
): boolean {
  return JSON.stringify(baselineArtifact.arms) === JSON.stringify(currentArtifact.arms);
}

function compareRobustnessExactly(
  baselineArtifact: ReproductionPolicyRobustnessStressTestArtifact,
  currentArtifact: ReproductionPolicyRobustnessStressTestArtifact
): boolean {
  return (
    currentArtifact.conclusion.signal === baselineArtifact.conclusion.signal &&
    currentArtifact.overall.matchedComparison.weightedHarvestAdvantage ===
      baselineArtifact.overall.matchedComparison.weightedHarvestAdvantage &&
    currentArtifact.overall.matchedComparison.weightedReproductionAdvantage ===
      baselineArtifact.overall.matchedComparison.weightedReproductionAdvantage &&
    currentArtifact.support.harvestAdvantagePositiveRunFraction ===
      baselineArtifact.support.harvestAdvantagePositiveRunFraction &&
    currentArtifact.support.reproductionAdvantagePositiveRunFraction ===
      baselineArtifact.support.reproductionAdvantagePositiveRunFraction
  );
}

function requireRowBySteepness(
  rows: ReadonlyArray<GradedReproductionSmokeResult>,
  steepness: number
): GradedReproductionSmokeResult {
  const row = rows.find((entry) => entry.steepness === steepness);
  if (!row) {
    throw new Error(`Missing graded reproduction row for steepness ${steepness}`);
  }
  return row;
}

function requireSpendingArm(
  artifact: SubstrateSpendingPolicySmokeArtifact,
  label: string
): SubstrateSpendingPolicySmokeArtifact['arms'][number] {
  const arm = artifact.arms.find((entry) => entry.label === label);
  if (!arm) {
    throw new Error(`Missing spending arm ${label}`);
  }
  return arm;
}

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

if (process.argv[1]?.endsWith('policy-genome-unification-revalidation.ts')) {
  runPolicyGenomeUnificationRevalidationCli(process.argv.slice(2));
}
