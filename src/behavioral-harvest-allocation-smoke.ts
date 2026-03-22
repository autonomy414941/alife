import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  resolveBehavioralPolicyFlags
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { Rng } from './rng';
import { LifeSimulation } from './simulation';
import { Agent, AgentSeed, SimulationConfig, StepSummary } from './types';

export const BEHAVIORAL_HARVEST_ALLOCATION_SMOKE_ARTIFACT =
  'docs/behavioral_harvest_allocation_smoke_2026-03-22.json';

export interface BehavioralHarvestAllocationSmokeInput {
  generatedAt?: string;
  steps?: number;
  seed?: number;
}

export interface BehavioralHarvestAllocationSmokeArtifact {
  generatedAt: string;
  question: string;
  prediction: string;
  config: {
    steps: number;
    seed: number;
    initialAgents: number;
    policyShare: number;
    policySecondaryPreference: number;
    simulation: Partial<SimulationConfig>;
  };
  run: {
    stepsExecuted: number;
    finalSummary: StepSummary;
    meanHarvestPolicyAgentFraction: number;
    meanHarvestDecisionGuidedFraction: number;
    finalPolicyCarrierPopulation: number;
    finalControlPopulation: number;
    finalPolicyCarrierMeanEnergy: number;
    finalControlMeanEnergy: number;
    finalPolicyCarrierSecondaryEnergyShare: number;
    finalControlSecondaryEnergyShare: number;
  };
  interpretation: {
    activated: boolean;
    summary: string;
  };
}

const INITIAL_AGENTS = 24;
const POLICY_SHARE = 0.5;
const DEFAULT_STEPS = 40;
const DEFAULT_SEED = 460321;
const POLICY_SECONDARY_PREFERENCE = 0.85;

const SMOKE_SIMULATION_CONFIG: Partial<SimulationConfig> = {
  width: 12,
  height: 12,
  initialAgents: INITIAL_AGENTS,
  initialEnergy: 12,
  maxResource: 8,
  maxResource2: 8,
  resourceRegen: 0.7,
  resource2Regen: 0.7,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  harvestCap: 2.5,
  reproduceThreshold: 24,
  reproduceProbability: 0,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  policyMutationProbability: 0,
  policyMutationMagnitude: 0,
  biomeBands: 4,
  biomeContrast: 0.45,
  maxAge: 120
};

export function runBehavioralHarvestAllocationSmoke(
  input: BehavioralHarvestAllocationSmokeInput = {}
): BehavioralHarvestAllocationSmokeArtifact {
  const steps = input.steps ?? DEFAULT_STEPS;
  const seed = input.seed ?? DEFAULT_SEED;
  const simulation = new LifeSimulation({
    seed,
    config: SMOKE_SIMULATION_CONFIG,
    initialAgents: buildInitialAgents(seed)
  });
  const summaries = simulation.run(steps);
  const finalSummary = summaries[summaries.length - 1];

  if (!finalSummary) {
    throw new Error('Behavioral harvest allocation smoke produced no step summaries');
  }

  const finalSnapshot = simulation.snapshot();
  const policyCarriers = finalSnapshot.agents.filter((agent) => resolveBehavioralPolicyFlags(agent).hasHarvestPolicy);
  const controls = finalSnapshot.agents.filter((agent) => !resolveBehavioralPolicyFlags(agent).hasAnyPolicy);

  const meanHarvestPolicyAgentFraction = arithmeticMean(
    summaries.map((summary) => summary.policyObservability?.activation.harvestPolicyAgentFraction ?? 0)
  );
  const meanHarvestDecisionGuidedFraction = arithmeticMean(
    summaries.map((summary) => summary.policyObservability?.activation.harvestDecisionGuidedFraction ?? 0)
  );

  const interpretation = interpretSmoke({
    meanHarvestDecisionGuidedFraction,
    policyCarrierSecondaryEnergyShare: meanSecondaryEnergyShare(policyCarriers),
    controlSecondaryEnergyShare: meanSecondaryEnergyShare(controls)
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does a heritable harvest-allocation preference actually redirect live harvest effort across resource layers in the running simulation?',
    prediction:
      'If harvest preference is a real control surface, policy carriers should show non-zero harvest-guided decisions and end with a different secondary-energy mix than otherwise similar control agents.',
    config: {
      steps,
      seed,
      initialAgents: INITIAL_AGENTS,
      policyShare: POLICY_SHARE,
      policySecondaryPreference: POLICY_SECONDARY_PREFERENCE,
      simulation: { ...SMOKE_SIMULATION_CONFIG }
    },
    run: {
      stepsExecuted: summaries.length,
      finalSummary,
      meanHarvestPolicyAgentFraction,
      meanHarvestDecisionGuidedFraction,
      finalPolicyCarrierPopulation: policyCarriers.length,
      finalControlPopulation: controls.length,
      finalPolicyCarrierMeanEnergy: meanEnergy(policyCarriers),
      finalControlMeanEnergy: meanEnergy(controls),
      finalPolicyCarrierSecondaryEnergyShare: meanSecondaryEnergyShare(policyCarriers),
      finalControlSecondaryEnergyShare: meanSecondaryEnergyShare(controls)
    },
    interpretation
  };
}

export function runBehavioralHarvestAllocationSmokeCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runBehavioralHarvestAllocationSmoke({ generatedAt }));
}

function buildInitialAgents(seed: number): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: SMOKE_SIMULATION_CONFIG
  });
  const snapshot = seeder.snapshot();
  const agents: AgentSeed[] = snapshot.agents.map((agent) => ({
    x: agent.x,
    y: agent.y,
    energy: agent.energy,
    energyPrimary: agent.energyPrimary,
    energySecondary: agent.energySecondary,
    age: agent.age,
    lineage: agent.lineage,
    species: agent.species,
    genome: { ...agent.genome },
    genomeV2: agent.genomeV2,
    policyState: undefined,
    transientState: undefined
  }));
  const policyCount = Math.round(agents.length * POLICY_SHARE);
  const rng = new Rng(seed + 90_001);
  const shuffledIndices = rng.shuffle(Array.from({ length: agents.length }, (_, index) => index));

  for (const index of shuffledIndices.slice(0, policyCount)) {
    agents[index].policyState = new Map([
      [INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, POLICY_SECONDARY_PREFERENCE]
    ]);
  }

  return agents;
}

function interpretSmoke(input: {
  meanHarvestDecisionGuidedFraction: number;
  policyCarrierSecondaryEnergyShare: number;
  controlSecondaryEnergyShare: number;
}): BehavioralHarvestAllocationSmokeArtifact['interpretation'] {
  const secondaryEnergyShareDelta =
    input.policyCarrierSecondaryEnergyShare - input.controlSecondaryEnergyShare;
  const activated = input.meanHarvestDecisionGuidedFraction > 0.05 && Math.abs(secondaryEnergyShareDelta) > 0.05;

  return {
    activated,
    summary: `Harvest guidance averaged ${input.meanHarvestDecisionGuidedFraction.toFixed(3)} per decision, with policy carriers ending ${formatSigned(secondaryEnergyShareDelta)} higher secondary-energy share than controls.`
  };
}

function meanEnergy(agents: ReadonlyArray<Pick<Agent, 'energy'>>): number {
  if (agents.length === 0) {
    return 0;
  }

  let total = 0;
  for (const agent of agents) {
    total += agent.energy;
  }
  return total / agents.length;
}

function meanSecondaryEnergyShare(
  agents: ReadonlyArray<Pick<Agent, 'energy' | 'energyPrimary' | 'energySecondary'>>
): number {
  if (agents.length === 0) {
    return 0;
  }

  let total = 0;
  for (const agent of agents) {
    const totalEnergy = Math.max(0, agent.energyPrimary ?? agent.energy);
    const secondaryEnergy = Math.max(0, agent.energySecondary ?? 0);
    const combined = totalEnergy + secondaryEnergy;
    total += combined > 0 ? secondaryEnergy / combined : 0;
  }
  return total / agents.length;
}

function arithmeticMean(values: ReadonlyArray<number>): number {
  if (values.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

function formatSigned(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

if (process.argv[1]?.endsWith('behavioral-harvest-allocation-smoke.ts')) {
  runBehavioralHarvestAllocationSmokeCli(process.argv.slice(2));
}
