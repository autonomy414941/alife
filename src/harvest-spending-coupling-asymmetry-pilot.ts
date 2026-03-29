import { addAgentEnergy, getAgentEnergyPools, spendAgentEnergy } from './agent-energy';
import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  resolveHarvestSecondaryPreference
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { fromGenome, setTrait } from './genome-v2';
import { resolveDualResourceHarvest } from './resource-harvest';
import { Agent } from './types';

export const HARVEST_SPENDING_COUPLING_ASYMMETRY_PILOT_ARTIFACT =
  'docs/harvest_spending_coupling_asymmetry_pilot_2026-03-29.json';

export interface HarvestSpendingCouplingAsymmetryPilotInput {
  generatedAt?: string;
  steps?: number;
}

interface ResourcePulse {
  primary: number;
  secondary: number;
}

interface HarvestSpendingTrajectoryPoint {
  step: number;
  resourcePulse: ResourcePulse;
  primaryHarvest: number;
  secondaryHarvest: number;
  primarySpent: number;
  secondarySpent: number;
  endPrimary: number;
  endSecondary: number;
  endSecondaryShare: number;
}

interface HarvestSpendingCouplingArmResult {
  label: string;
  harvestSecondaryPreference?: number;
  cumulativePrimaryHarvest: number;
  cumulativeSecondaryHarvest: number;
  cumulativePrimarySpent: number;
  cumulativeSecondarySpent: number;
  finalPrimary: number;
  finalSecondary: number;
  finalSecondaryShare: number;
  trajectory: HarvestSpendingTrajectoryPoint[];
}

export interface HarvestSpendingCouplingAsymmetryPilotArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    initialPools: {
      primary: number;
      secondary: number;
    };
    baseCapacity: number;
    spendPerStep: number;
    resourceSchedule: ResourcePulse[];
  };
  arms: HarvestSpendingCouplingArmResult[];
  interpretation: {
    primarySpecialistRetainsLessSecondaryThanControl: boolean;
    secondarySpecialistRetainsMoreSecondaryThanControl: boolean;
    specialistSecondaryShareGap: number;
    summary: string;
  };
}

const DEFAULT_STEPS = 8;
const INITIAL_POOLS = {
  primary: 6,
  secondary: 6
};
const BASE_CAPACITY = 2.5;
const SPEND_PER_STEP = 2.2;
const RESOURCE_SCHEDULE: ResourcePulse[] = [
  { primary: 4.5, secondary: 1.2 },
  { primary: 1.3, secondary: 4.4 },
  { primary: 4.1, secondary: 1.5 },
  { primary: 1.1, secondary: 4.7 }
];
const BASE_GENOME = {
  metabolism: 0.6,
  harvest: 1,
  aggression: 0.4,
  harvestEfficiency2: 1
};

export function runHarvestSpendingCouplingAsymmetryPilot(
  input: HarvestSpendingCouplingAsymmetryPilotInput = {}
): HarvestSpendingCouplingAsymmetryPilotArtifact {
  const steps = input.steps ?? DEFAULT_STEPS;
  const arms = [
    runArm('control', undefined, steps),
    runArm('primary_specialist', 0, steps),
    runArm('secondary_specialist', 1, steps)
  ];

  const control = findArm(arms, 'control');
  const primarySpecialist = findArm(arms, 'primary_specialist');
  const secondarySpecialist = findArm(arms, 'secondary_specialist');
  const specialistSecondaryShareGap =
    secondarySpecialist.finalSecondaryShare - primarySpecialist.finalSecondaryShare;

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'When harvest preference also shapes reserve spending, do matched agents in an asymmetric two-layer schedule separate into different primary-versus-secondary energy trajectories?',
    prediction:
      'Primary specialists should burn more secondary reserve than controls, while secondary specialists should retain more secondary reserve, because the shared harvest policy now also steers burn allocation.',
    config: {
      steps,
      initialPools: { ...INITIAL_POOLS },
      baseCapacity: BASE_CAPACITY,
      spendPerStep: SPEND_PER_STEP,
      resourceSchedule: RESOURCE_SCHEDULE.map((pulse) => ({ ...pulse }))
    },
    arms,
    interpretation: {
      primarySpecialistRetainsLessSecondaryThanControl:
        primarySpecialist.finalSecondary < control.finalSecondary,
      secondarySpecialistRetainsMoreSecondaryThanControl:
        secondarySpecialist.finalSecondary > control.finalSecondary,
      specialistSecondaryShareGap,
      summary:
        `Primary specialists changed final secondary reserve share by ${formatSigned(primarySpecialist.finalSecondaryShare - control.finalSecondaryShare)} ` +
        `vs control, while secondary specialists changed final secondary reserve share by ` +
        `${formatSigned(secondarySpecialist.finalSecondaryShare - control.finalSecondaryShare)}.`
    }
  };
}

export function runHarvestSpendingCouplingAsymmetryPilotCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) =>
    runHarvestSpendingCouplingAsymmetryPilot({ generatedAt })
  );
}

function runArm(
  label: string,
  harvestSecondaryPreference: number | undefined,
  steps: number
): HarvestSpendingCouplingArmResult {
  const agent = createAgent(harvestSecondaryPreference);
  const trajectory: HarvestSpendingTrajectoryPoint[] = [];
  let cumulativePrimaryHarvest = 0;
  let cumulativeSecondaryHarvest = 0;
  let cumulativePrimarySpent = 0;
  let cumulativeSecondarySpent = 0;

  for (let step = 0; step < steps; step += 1) {
    const resourcePulse = RESOURCE_SCHEDULE[step % RESOURCE_SCHEDULE.length];
    const harvestPreference = resolveHarvestSecondaryPreference(agent, resourcePulse.primary);
    const harvest = resolveDualResourceHarvest({
      primaryAvailable: resourcePulse.primary,
      secondaryAvailable: resourcePulse.secondary,
      genome: agent.genome,
      baseCapacity: BASE_CAPACITY,
      secondaryPreferenceShare: harvestPreference
    });
    addAgentEnergy(agent, {
      primary: harvest.primaryHarvest,
      secondary: harvest.secondaryHarvest
    });
    const spent = spendAgentEnergy(agent, SPEND_PER_STEP);
    const pools = getAgentEnergyPools(agent);
    const endSecondaryShare = pools.total > 0 ? pools.secondary / pools.total : 0;

    cumulativePrimaryHarvest += harvest.primaryHarvest;
    cumulativeSecondaryHarvest += harvest.secondaryHarvest;
    cumulativePrimarySpent += spent.primary;
    cumulativeSecondarySpent += spent.secondary;
    trajectory.push({
      step: step + 1,
      resourcePulse: { ...resourcePulse },
      primaryHarvest: harvest.primaryHarvest,
      secondaryHarvest: harvest.secondaryHarvest,
      primarySpent: spent.primary,
      secondarySpent: spent.secondary,
      endPrimary: pools.primary,
      endSecondary: pools.secondary,
      endSecondaryShare
    });
  }

  const finalPools = getAgentEnergyPools(agent);
  const finalSecondaryShare = finalPools.total > 0 ? finalPools.secondary / finalPools.total : 0;

  return {
    label,
    harvestSecondaryPreference,
    cumulativePrimaryHarvest,
    cumulativeSecondaryHarvest,
    cumulativePrimarySpent,
    cumulativeSecondarySpent,
    finalPrimary: finalPools.primary,
    finalSecondary: finalPools.secondary,
    finalSecondaryShare,
    trajectory
  };
}

function createAgent(harvestSecondaryPreference?: number): Agent {
  const genome = { ...BASE_GENOME };
  const genomeV2 =
    harvestSecondaryPreference === undefined
      ? undefined
      : (() => {
          const value = fromGenome(genome);
          setTrait(value, INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, harvestSecondaryPreference);
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
  arms: ReadonlyArray<HarvestSpendingCouplingArmResult>,
  label: string
): HarvestSpendingCouplingArmResult {
  const arm = arms.find((entry) => entry.label === label);
  if (!arm) {
    throw new Error(`Missing harvest-spending coupling arm: ${label}`);
  }
  return arm;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

if (process.argv[1]?.endsWith('harvest-spending-coupling-asymmetry-pilot.ts')) {
  runHarvestSpendingCouplingAsymmetryPilotCli(process.argv.slice(2));
}
