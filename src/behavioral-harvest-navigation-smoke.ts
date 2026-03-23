import {
  INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE,
  resolveBehavioralPolicyFlags
} from './behavioral-control';
import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { LifeSimulation } from './simulation';
import { Agent, AgentSeed, SimulationConfig, StepSummary } from './types';

export const BEHAVIORAL_HARVEST_NAVIGATION_SMOKE_ARTIFACT =
  'docs/behavioral_harvest_navigation_smoke_2026-03-23.json';

export interface BehavioralHarvestNavigationSmokeInput {
  generatedAt?: string;
  seed?: number;
  steps?: number;
}

export interface BehavioralHarvestNavigationSmokeArtifact {
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
    policyCarrierCount: number;
    controlCount: number;
    policyCarrierSecondaryRichFraction: number;
    controlSecondaryRichFraction: number;
    controlPrimaryRichFraction: number;
  };
  interpretation: {
    activated: boolean;
    summary: string;
  };
}

const INITIAL_AGENTS = 16;
const POLICY_SHARE = 0.5;
const POLICY_SECONDARY_PREFERENCE = 1;
const DEFAULT_STEPS = 1;
const DEFAULT_SEED = 460522;

const SMOKE_SIMULATION_CONFIG: Partial<SimulationConfig> = {
  width: 3,
  height: 1,
  initialAgents: INITIAL_AGENTS,
  initialEnergy: 10,
  maxResource: 12,
  maxResource2: 12,
  resourceRegen: 0,
  resource2Regen: 0,
  habitatPreferenceStrength: 0,
  dispersalPressure: 0,
  metabolismCostBase: 0,
  moveCost: 0,
  harvestCap: 0,
  reproduceProbability: 0,
  maxAge: 100
};

export function runBehavioralHarvestNavigationSmoke(
  input: BehavioralHarvestNavigationSmokeInput = {}
): BehavioralHarvestNavigationSmokeArtifact {
  const steps = input.steps ?? DEFAULT_STEPS;
  const seed = input.seed ?? DEFAULT_SEED;
  const simulation = new LifeSimulation({
    seed,
    config: SMOKE_SIMULATION_CONFIG,
    initialAgents: buildInitialAgents()
  });

  simulation.setResource(0, 0, 12);
  simulation.setResource(1, 0, 0);
  simulation.setResource(2, 0, 0);
  simulation.setResource2(0, 0, 0);
  simulation.setResource2(1, 0, 0);
  simulation.setResource2(2, 0, 12);

  const summaries = simulation.run(steps);
  const finalSummary = summaries[summaries.length - 1];
  if (!finalSummary) {
    throw new Error('Behavioral harvest navigation smoke produced no step summaries');
  }

  const finalSnapshot = simulation.snapshot();
  const policyCarriers = finalSnapshot.agents.filter((agent) => resolveBehavioralPolicyFlags(agent).hasHarvestPolicy);
  const controls = finalSnapshot.agents.filter((agent) => !resolveBehavioralPolicyFlags(agent).hasAnyPolicy);

  const policyCarrierSecondaryRichFraction = fractionAtX(policyCarriers, 2);
  const controlSecondaryRichFraction = fractionAtX(controls, 2);
  const controlPrimaryRichFraction = fractionAtX(controls, 0);
  const interpretation = interpretSmoke({
    policyCarrierSecondaryRichFraction,
    controlSecondaryRichFraction,
    controlPrimaryRichFraction
  });

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    question:
      'Does harvest preference change live movement targets once navigation scoring sees the policy-selected diet mix?',
    prediction:
      'If navigation is aligned with harvest preference, secondary-preferring carriers should move into the secondary-rich cell while controls keep favoring the primary-rich cell.',
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
      policyCarrierCount: policyCarriers.length,
      controlCount: controls.length,
      policyCarrierSecondaryRichFraction,
      controlSecondaryRichFraction,
      controlPrimaryRichFraction
    },
    interpretation
  };
}

export function runBehavioralHarvestNavigationSmokeCli(args: string[]): void {
  runGeneratedAtStudyCli(args, ({ generatedAt }) => runBehavioralHarvestNavigationSmoke({ generatedAt }));
}

function buildInitialAgents(): AgentSeed[] {
  const seeds: AgentSeed[] = [];
  const policyCount = Math.round(INITIAL_AGENTS * POLICY_SHARE);

  for (let index = 0; index < INITIAL_AGENTS; index += 1) {
    seeds.push({
      x: 1,
      y: 0,
      energy: 10,
      genome: { metabolism: 1, harvest: 2, aggression: 0.5, harvestEfficiency2: 1 },
      policyState:
        index < policyCount
          ? new Map([[INTERNAL_STATE_HARVEST_SECONDARY_PREFERENCE, POLICY_SECONDARY_PREFERENCE]])
          : undefined
    });
  }

  return seeds;
}

function fractionAtX(agents: ReadonlyArray<Pick<Agent, 'x'>>, x: number): number {
  if (agents.length === 0) {
    return 0;
  }

  let total = 0;
  for (const agent of agents) {
    total += Number(agent.x === x);
  }
  return total / agents.length;
}

function interpretSmoke(input: {
  policyCarrierSecondaryRichFraction: number;
  controlSecondaryRichFraction: number;
  controlPrimaryRichFraction: number;
}): BehavioralHarvestNavigationSmokeArtifact['interpretation'] {
  const activated =
    input.policyCarrierSecondaryRichFraction > 0.8 &&
    input.controlPrimaryRichFraction > 0.8 &&
    input.policyCarrierSecondaryRichFraction > input.controlSecondaryRichFraction;

  return {
    activated,
    summary:
      `Policy carriers reached the secondary-rich cell at ${(input.policyCarrierSecondaryRichFraction * 100).toFixed(1)}%, ` +
      `while controls reached the primary-rich cell at ${(input.controlPrimaryRichFraction * 100).toFixed(1)}%.`
  };
}

if (process.argv[1]?.endsWith('behavioral-harvest-navigation-smoke.ts')) {
  runBehavioralHarvestNavigationSmokeCli(process.argv.slice(2));
}
