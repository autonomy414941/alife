import { DEFAULT_TRAIT_VALUES, fromGenome, POLICY_TRAITS, setTrait } from './genome-v2';
import { PolicyFitnessRecord } from './policy-fitness';
import { LifeSimulation } from './simulation';
import { AgentSeed, SimulationConfig } from './types';

export interface HorizonOutcome {
  survived: boolean;
  reproduced: boolean;
}

export interface ExposureWithHorizons {
  record: PolicyFitnessRecord;
  horizons: Map<number, HorizonOutcome>;
}

export const DEFAULT_MULTI_HORIZON_SEEDS = [9201, 9202];
export const DEFAULT_MULTI_HORIZON_STEPS = 120;
export const DEFAULT_MULTI_HORIZON_POLICY_MUTATION_PROBABILITY = 0.65;
export const DEFAULT_MULTI_HORIZON_HORIZONS = [1, 5, 20, 50] as const;

export const DEFAULT_MULTI_HORIZON_BASE_CONFIG: Partial<SimulationConfig> = {
  maxResource2: 8,
  resource2Regen: 0.7,
  resource2SeasonalRegenAmplitude: 0.75,
  resource2SeasonalFertilityContrastAmplitude: 1,
  resource2SeasonalPhaseOffset: 0.5,
  resource2BiomeShiftX: 2,
  resource2BiomeShiftY: 1
};

export function runSimulationWithHorizons(input: {
  seed: number;
  steps: number;
  horizons?: ReadonlyArray<number>;
  policyCouplingEnabled: boolean;
  baseConfig?: Partial<SimulationConfig>;
  policyMutationProbability?: number;
}): ExposureWithHorizons[] {
  const horizons = input.horizons ?? DEFAULT_MULTI_HORIZON_HORIZONS;
  const baseConfig = input.baseConfig ?? DEFAULT_MULTI_HORIZON_BASE_CONFIG;
  const policyMutationProbability =
    input.policyMutationProbability ?? DEFAULT_MULTI_HORIZON_POLICY_MUTATION_PROBABILITY;

  const simulation = new LifeSimulation({
    seed: input.seed,
    config: {
      ...baseConfig,
      policyMutationProbability
    },
    initialAgents: buildNeutralPolicyInitialAgents(input.seed, baseConfig),
    policyCouplingEnabled: input.policyCouplingEnabled
  });

  const recordsByTick: PolicyFitnessRecord[][] = [];
  const agentIdsByTick: Map<number, PolicyFitnessRecord>[] = [];

  for (let tick = 0; tick < input.steps; tick += 1) {
    simulation.step();
    const records = simulation.policyFitnessRecords();
    recordsByTick.push(records);
    const agentMap = new Map<number, PolicyFitnessRecord>();
    for (const record of records) {
      agentMap.set(record.agentId, record);
    }
    agentIdsByTick.push(agentMap);
  }

  const exposures: ExposureWithHorizons[] = [];

  for (let tick = 0; tick < recordsByTick.length; tick += 1) {
    for (const record of recordsByTick[tick]) {
      const outcomes = new Map<number, HorizonOutcome>();

      for (const horizon of horizons) {
        const futureTick = tick + horizon;
        if (futureTick >= agentIdsByTick.length) {
          outcomes.set(horizon, { survived: false, reproduced: false });
          continue;
        }

        const futureRecord = agentIdsByTick[futureTick].get(record.agentId);
        outcomes.set(horizon, {
          survived: futureRecord !== undefined,
          reproduced: futureRecord !== undefined && futureRecord.offspringProduced > 0
        });
      }

      exposures.push({
        record,
        horizons: outcomes
      });
    }
  }

  return exposures;
}

export function buildNeutralPolicyInitialAgents(
  seed: number,
  baseConfig: Partial<SimulationConfig> = DEFAULT_MULTI_HORIZON_BASE_CONFIG
): AgentSeed[] {
  const seeder = new LifeSimulation({
    seed,
    config: baseConfig
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
