import { addAgentEnergy, getAgentEnergyPools, spendAgentEnergy } from './agent-energy';
import { INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE } from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { fromGenome, setTrait } from './genome-v2';
import { Agent } from './types';

export const SUBSTRATE_SPENDING_POLICY_SMOKE_ARTIFACT =
  'docs/substrate_spending_policy_smoke_2026-03-24.json';

export interface SubstrateSpendingPolicySmokeInput {
  generatedAt?: string;
  steps?: number;
}

interface SpendingPolicyArmResult {
  label: string;
  spendingSecondaryPreference?: number;
  cumulativePrimarySpent: number;
  cumulativeSecondarySpent: number;
  finalPrimary: number;
  finalSecondary: number;
  finalSecondaryShare: number;
}

export interface SubstrateSpendingPolicySmokeArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    initialPools: {
      primary: number;
      secondary: number;
    };
    intakePerStep: {
      primary: number;
      secondary: number;
    };
    spendPerStep: number;
  };
  arms: SpendingPolicyArmResult[];
  interpretation: {
    primaryBiasedRetainsMoreSecondary: boolean;
    secondaryBiasedBurnsMoreSecondary: boolean;
    summary: string;
  };
}

const DEFAULT_STEPS = 6;
const INITIAL_POOLS = {
  primary: 6,
  secondary: 6
};
const INTAKE_PER_STEP = {
  primary: 1,
  secondary: 2
};
const SPEND_PER_STEP = 2.5;

export function runSubstrateSpendingPolicySmoke(
  input: SubstrateSpendingPolicySmokeInput = {}
): SubstrateSpendingPolicySmokeArtifact {
  const steps = input.steps ?? DEFAULT_STEPS;
  const arms: SpendingPolicyArmResult[] = [
    runArm('control', undefined, steps),
    runArm('primary_biased', 0, steps),
    runArm('secondary_biased', 1, steps)
  ];

  const control = findArm(arms, 'control');
  const primaryBiased = findArm(arms, 'primary_biased');
  const secondaryBiased = findArm(arms, 'secondary_biased');

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does a heritable substrate spending preference create different reserve retention under identical mixed-resource intake?',
    prediction:
      'If the policy is active, primary-biased spenders should retain more secondary reserve, while secondary-biased spenders should burn more secondary reserve, than identical controls.',
    config: {
      steps,
      initialPools: { ...INITIAL_POOLS },
      intakePerStep: { ...INTAKE_PER_STEP },
      spendPerStep: SPEND_PER_STEP
    },
    arms,
    interpretation: {
      primaryBiasedRetainsMoreSecondary: primaryBiased.finalSecondary > control.finalSecondary,
      secondaryBiasedBurnsMoreSecondary: secondaryBiased.cumulativeSecondarySpent > control.cumulativeSecondarySpent,
      summary:
        `Primary-biased spending ended with secondary reserve ${formatSigned(primaryBiased.finalSecondary - control.finalSecondary)} ` +
        `vs control, while secondary-biased spending changed cumulative secondary burn by ` +
        `${formatSigned(secondaryBiased.cumulativeSecondarySpent - control.cumulativeSecondarySpent)}.`
    }
  };
}

export function runSubstrateSpendingPolicySmokeCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runSubstrateSpendingPolicySmoke({ generatedAt }));
}

function runArm(
  label: string,
  spendingSecondaryPreference: number | undefined,
  steps: number
): SpendingPolicyArmResult {
  const agent = createAgent(spendingSecondaryPreference);
  let cumulativePrimarySpent = 0;
  let cumulativeSecondarySpent = 0;

  for (let step = 0; step < steps; step += 1) {
    addAgentEnergy(agent, INTAKE_PER_STEP);
    const spent = spendAgentEnergy(agent, SPEND_PER_STEP);
    cumulativePrimarySpent += spent.primary;
    cumulativeSecondarySpent += spent.secondary;
  }

  const finalPools = getAgentEnergyPools(agent);
  const finalSecondaryShare = finalPools.total > 0 ? finalPools.secondary / finalPools.total : 0;

  return {
    label,
    spendingSecondaryPreference,
    cumulativePrimarySpent,
    cumulativeSecondarySpent,
    finalPrimary: finalPools.primary,
    finalSecondary: finalPools.secondary,
    finalSecondaryShare
  };
}

function createAgent(spendingSecondaryPreference?: number): Agent {
  const genome = { metabolism: 0.5, harvest: 0.5, aggression: 0.5 };
  const genomeV2 =
    spendingSecondaryPreference === undefined
      ? undefined
      : (() => {
          const value = fromGenome(genome);
          setTrait(value, INTERNAL_STATE_SPENDING_SECONDARY_PREFERENCE, spendingSecondaryPreference);
          return value;
        })();

  return {
    id: 1,
    lineage: 1,
    species: 1,
    x: 0,
    y: 0,
    energy: INITIAL_POOLS.primary + INITIAL_POOLS.secondary,
    energyPrimary: INITIAL_POOLS.primary,
    energySecondary: INITIAL_POOLS.secondary,
    age: 0,
    genome,
    genomeV2
  };
}

function findArm(
  arms: ReadonlyArray<SpendingPolicyArmResult>,
  label: string
): SpendingPolicyArmResult {
  const arm = arms.find((entry) => entry.label === label);
  if (!arm) {
    throw new Error(`Missing spending-policy smoke arm: ${label}`);
  }
  return arm;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

if (process.argv[1]?.endsWith('substrate-spending-policy-smoke.ts')) {
  runSubstrateSpendingPolicySmokeCli(process.argv.slice(2));
}
