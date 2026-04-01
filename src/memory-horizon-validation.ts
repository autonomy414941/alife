import { runGeneratedAtStudyCli } from './clade-activity-relabel-null-smoke-study';
import { fromGenome, setTrait, POLICY_TRAITS, DEFAULT_TRAIT_VALUES } from './genome-v2';
import { LifeSimulation } from './simulation';
import { AgentSeed } from './types';
import {
  getHarvestWindow3Mean,
  getHarvestWindow5Mean,
  getHarvestDecayWeighted,
  getTransientStateValue,
  INTERNAL_STATE_LAST_HARVEST
} from './behavioral-control';
import { writeFileSync } from 'fs';

export const MEMORY_HORIZON_VALIDATION_ARTIFACT =
  'docs/memory_horizon_validation_2026-04-01.json';

const DEFAULT_SEED = 9401;
const DEFAULT_STEPS = 50;
const POLICY_MUTATION_PROBABILITY = 0.65;

const BASE_CONFIG = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

interface AgentMemorySnapshot {
  tick: number;
  agentId: number;
  lastHarvest: number;
  window3Mean: number;
  window5Mean: number;
  decayWeighted: number;
}

export interface MemoryHorizonValidationInput {
  generatedAt?: string;
  seed?: number;
  steps?: number;
}

export interface MemoryHorizonValidationOutput {
  generatedAt: string;
  seed: number;
  steps: number;
  summary: {
    totalSnapshots: number;
    agentsWithMemory: number;
    meanWindow3Divergence: number;
    meanWindow5Divergence: number;
    meanDecayDivergence: number;
  };
  snapshots: AgentMemorySnapshot[];
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

    setTrait(genomeV2, 'reproduction_harvest_threshold', 5);
    setTrait(genomeV2, 'movement_min_recent_harvest', 3);

    return {
      x: agent.x,
      y: agent.y,
      energy: agent.energy,
      genome: agent.genome,
      lineage: agent.lineage,
      species: agent.species,
      genomeV2
    };
  });
}

export function runMemoryHorizonValidation(
  input: MemoryHorizonValidationInput = {}
): MemoryHorizonValidationOutput {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const seed = input.seed ?? DEFAULT_SEED;
  const steps = input.steps ?? DEFAULT_STEPS;

  const sim = new LifeSimulation({
    seed,
    config: {
      ...BASE_CONFIG,
      policyMutationProbability: POLICY_MUTATION_PROBABILITY
    },
    initialAgents: buildInitialAgents(seed),
    policyCouplingEnabled: true
  });

  const snapshots: AgentMemorySnapshot[] = [];
  const sampleTicks = [10, 20, 30, 40, 50];

  for (let i = 0; i < steps; i++) {
    sim.step();

    if (sampleTicks.includes(i + 1)) {
      const snapshot = sim.snapshot();
      const sampleSize = Math.min(10, snapshot.agents.length);
      for (let j = 0; j < sampleSize; j++) {
        const agent = snapshot.agents[j];
        if (agent.transientState && agent.transientState.size > 0) {
          snapshots.push({
            tick: i + 1,
            agentId: agent.id,
            lastHarvest: getTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST, 0),
            window3Mean: getHarvestWindow3Mean(agent),
            window5Mean: getHarvestWindow5Mean(agent),
            decayWeighted: getHarvestDecayWeighted(agent)
          });
        }
      }
    }
  }

  const agentsWithMemory = new Set(snapshots.map((s) => s.agentId)).size;

  const window3Divergences = snapshots
    .filter((s) => s.lastHarvest > 0)
    .map((s) => Math.abs(s.window3Mean - s.lastHarvest) / Math.max(1, s.lastHarvest));

  const window5Divergences = snapshots
    .filter((s) => s.lastHarvest > 0)
    .map((s) => Math.abs(s.window5Mean - s.lastHarvest) / Math.max(1, s.lastHarvest));

  const decayDivergences = snapshots
    .filter((s) => s.lastHarvest > 0)
    .map((s) => Math.abs(s.decayWeighted - s.lastHarvest) / Math.max(1, s.lastHarvest));

  const meanWindow3Divergence =
    window3Divergences.length > 0
      ? window3Divergences.reduce((sum, v) => sum + v, 0) / window3Divergences.length
      : 0;

  const meanWindow5Divergence =
    window5Divergences.length > 0
      ? window5Divergences.reduce((sum, v) => sum + v, 0) / window5Divergences.length
      : 0;

  const meanDecayDivergence =
    decayDivergences.length > 0
      ? decayDivergences.reduce((sum, v) => sum + v, 0) / decayDivergences.length
      : 0;

  return {
    generatedAt,
    seed,
    steps,
    summary: {
      totalSnapshots: snapshots.length,
      agentsWithMemory,
      meanWindow3Divergence,
      meanWindow5Divergence,
      meanDecayDivergence
    },
    snapshots
  };
}

if (require.main === module) {
  runGeneratedAtStudyCli(
    process.argv.slice(2),
    (input: { generatedAt?: string }) => {
      const output = runMemoryHorizonValidation(input);
      writeFileSync(
        MEMORY_HORIZON_VALIDATION_ARTIFACT,
        JSON.stringify(output, null, 2),
        'utf-8'
      );
      console.log(`Wrote ${MEMORY_HORIZON_VALIDATION_ARTIFACT}`);
      return output;
    }
  );
}
