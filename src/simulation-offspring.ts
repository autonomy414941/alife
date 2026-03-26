import {
  resolveHarvestSecondaryPreference
} from './behavioral-control';
import {
  getCladeHabitatPreference as lookupCladeHabitatPreference,
  getSpeciesHabitatPreference as lookupSpeciesHabitatPreference,
  habitatMatchEfficiency as calculateHabitatMatchEfficiency
} from './clade-habitat';
import { cloneGenomeV2, fromGenome } from './genome-v2';
import {
  DEFAULT_DEFENSE_LEVEL,
  DEFAULT_TROPHIC_LEVEL,
  defenseLevelTraitWithFallback,
  trophicLevelTraitWithFallback
} from './interaction-traits';
import { LineageOccupancyGrid, SettlementAgent, SettlementPosition } from './reproduction';
import { reproduceAgent } from './simulation-reproduction';
import { resolveSettlementEcologyScore } from './settlement-cladogenesis';
import {
  buildLineageOccupancyGrid,
  buildOccupancyGrid,
  neighborhoodCrowding,
  sameLineageNeighborhoodCrowdingAt
} from './settlement-spatial';
import { combinedResourceAvailability, secondaryHarvestEfficiency } from './resource-harvest';
import { Agent, Genome, GenomeV2, SimulationConfig } from './types';

interface ReproduceInSimulationOptions {
  parent: Agent;
  agents: Agent[];
  config: SimulationConfig;
  tickCount: number;
  width: number;
  height: number;
  dispersalRadius: number;
  occupancy?: number[][];
  lineageOccupancy?: LineageOccupancyGrid;
  speciesHabitatPreference: Map<number, number>;
  speciesTrophicLevel: Map<number, number>;
  speciesDefenseLevel: Map<number, number>;
  cladeFounderGenome: Map<number, Genome>;
  cladeFounderGenomeV2: Map<number, GenomeV2>;
  cladeHabitatPreference: Map<number, number>;
  cladeHistory: ReadonlyMap<number, { firstSeenTick: number }>;
  resources: number[][];
  resources2: number[][];
  disturbanceSettlementOpenUntilTick: number[][];
  minGenome: Genome;
  maxGenome: Genome;
  allocateAgentId: () => number;
  allocateSpeciesId: () => number;
  allocateLineageId: () => number;
  randomFloat: () => number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  cellIndex: (x: number, y: number) => number;
  pickRandomNeighbor: (neighbors: SettlementPosition[]) => SettlementPosition;
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
}

export function reproduceInSimulation({
  parent,
  agents,
  config,
  tickCount,
  width,
  height,
  dispersalRadius,
  occupancy,
  lineageOccupancy,
  speciesHabitatPreference,
  speciesTrophicLevel,
  speciesDefenseLevel,
  cladeFounderGenome,
  cladeFounderGenomeV2,
  cladeHabitatPreference,
  cladeHistory,
  resources,
  resources2,
  disturbanceSettlementOpenUntilTick,
  minGenome,
  maxGenome,
  allocateAgentId,
  allocateSpeciesId,
  allocateLineageId,
  randomFloat,
  wrapX,
  wrapY,
  cellIndex,
  pickRandomNeighbor,
  effectiveBiomeFertilityAt
}: ReproduceInSimulationOptions): Agent {
  return reproduceAgent({
    parent,
    agents,
    config,
    tickCount,
    occupancy,
    lineageOccupancy,
    speciesHabitatPreference,
    speciesTrophicLevel,
    speciesDefenseLevel,
    cladeFounderGenome,
    cladeFounderGenomeV2,
    cladeHabitatPreference,
    allocateAgentId,
    allocateSpeciesId,
    allocateLineageId,
    randomFloat,
    mutateGenome: (genome) => mutateGenome(genome, config, minGenome, maxGenome, randomFloat),
    buildOccupancyGrid: (nextAgents) => buildOccupancyGrid(width, height, nextAgents),
    buildLineageOccupancyGrid: (nextAgents) => buildLineageOccupancyGrid(width, height, nextAgents),
    wrapX,
    wrapY,
    pickRandomNeighbor,
    localEcologyScore: (agent, x, y, nextOccupancy, nextLineageOccupancy, lineagePenalty, excludedPosition, jitter) =>
      resolveSimulationLocalEcologyScore({
        config,
        tickCount,
        dispersalRadius,
        width,
        cladeHistory,
        resources,
        resources2,
        speciesHabitatPreference,
        cladeHabitatPreference,
        agent,
        x,
        y,
        occupancy: nextOccupancy,
        lineageOccupancy: nextLineageOccupancy,
        lineagePenalty,
        excludedPosition,
        jitter,
        effectiveBiomeFertilityAt,
        wrapX,
        wrapY,
        cellIndex
      }),
    disturbanceSettlementOpenUntilTick,
    sameLineageNeighborhoodCrowdingAt: (lineage, x, y, nextLineageOccupancy, excludedPosition) =>
      sameLineageNeighborhoodCrowdingAt({
        width,
        lineage,
        x,
        y,
        lineageOccupancy: nextLineageOccupancy,
        dispersalRadius,
        cellIndex,
        wrapX,
        wrapY,
        excludedPosition
      }),
    effectiveBiomeFertilityAt,
    getCladeFounderGenome: (lineage, preferGenomeV2 = false) =>
      getCladeFounderGenome(lineage, preferGenomeV2, cladeFounderGenome, cladeFounderGenomeV2, agents, minGenome),
    getSpeciesHabitatPreference: (species) => lookupSpeciesHabitatPreference(speciesHabitatPreference, species),
    getCladeHabitatPreference: (lineage) => lookupCladeHabitatPreference(cladeHabitatPreference, lineage),
    getSpeciesTrophicLevel: (species) =>
      getSpeciesMetric(speciesTrophicLevel, species, DEFAULT_TROPHIC_LEVEL),
    getCladeTrophicLevel: (lineage) => {
      const founderGenomeV2 =
        cladeFounderGenomeV2.get(lineage) ?? agents.find((agent) => agent.lineage === lineage)?.genomeV2;
      const directLevel = trophicLevelTraitWithFallback(founderGenomeV2);
      if (directLevel !== undefined) {
        return directLevel;
      }
      return genomeTrophicSignal(
        getCladeFounderGenome(lineage, false, cladeFounderGenome, cladeFounderGenomeV2, agents, minGenome) as Genome,
        minGenome,
        maxGenome
      );
    },
    getSpeciesDefenseLevel: (species) =>
      getSpeciesMetric(speciesDefenseLevel, species, DEFAULT_DEFENSE_LEVEL),
    getCladeDefenseLevel: (lineage) => {
      const founderGenomeV2 =
        cladeFounderGenomeV2.get(lineage) ?? agents.find((agent) => agent.lineage === lineage)?.genomeV2;
      const directLevel = defenseLevelTraitWithFallback(founderGenomeV2);
      if (directLevel !== undefined) {
        return directLevel;
      }
      return genomeDefenseSignal(
        getCladeFounderGenome(lineage, false, cladeFounderGenome, cladeFounderGenomeV2, agents, minGenome) as Genome,
        minGenome,
        maxGenome
      );
    }
  });
}

export function resolveSimulationLocalEcologyScore({
  config,
  tickCount,
  dispersalRadius,
  width,
  cladeHistory,
  resources,
  resources2,
  speciesHabitatPreference,
  cladeHabitatPreference,
  agent,
  x,
  y,
  occupancy,
  lineageOccupancy,
  lineagePenalty,
  excludedPosition,
  jitter,
  effectiveBiomeFertilityAt,
  wrapX,
  wrapY,
  cellIndex
}: {
  config: SimulationConfig;
  tickCount: number;
  dispersalRadius: number;
  width: number;
  cladeHistory: ReadonlyMap<number, { firstSeenTick: number }>;
  resources: number[][];
  resources2: number[][];
  speciesHabitatPreference: Map<number, number>;
  cladeHabitatPreference: Map<number, number>;
  agent: SettlementAgent;
  x: number;
  y: number;
  occupancy: number[][];
  lineageOccupancy: LineageOccupancyGrid | undefined;
  lineagePenalty: number;
  excludedPosition: SettlementPosition | undefined;
  jitter: number;
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  cellIndex: (x: number, y: number) => number;
}): number {
  return resolveSettlementEcologyScore({
    config,
    tickCount,
    cladeHistory,
    agent,
    x,
    y,
    occupancy,
    lineageOccupancy,
    lineagePenalty,
    excludedPosition,
    jitter,
    resourceAt: (cellX, cellY) => {
      const primaryAvailable = resources[wrapY(cellY)][wrapX(cellX)];
      return combinedResourceAvailability(
        primaryAvailable,
        resources2[wrapY(cellY)][wrapX(cellX)],
        agent.genome,
        resolveHarvestSecondaryPreference(agent, primaryAvailable)
      );
    },
    habitatMatchEfficiencyAt: (nextAgent, cellX, cellY) =>
      calculateHabitatMatchEfficiency({
        agent: nextAgent,
        fertility: effectiveBiomeFertilityAt(wrapX(cellX), wrapY(cellY), tickCount + 1),
        speciesHabitatPreference,
        cladeHabitatPreference,
        config
      }),
    neighborhoodCrowdingAt: (cellX, cellY, nextOccupancy) =>
      neighborhoodCrowding({
        x: cellX,
        y: cellY,
        occupancy: nextOccupancy,
        dispersalRadius,
        wrapX,
        wrapY
      }),
    sameLineageNeighborhoodCrowdingAt: (lineage, cellX, cellY, nextLineageOccupancy, nextExcludedPosition) =>
      sameLineageNeighborhoodCrowdingAt({
        width,
        lineage,
        x: cellX,
        y: cellY,
        lineageOccupancy: nextLineageOccupancy,
        dispersalRadius,
        cellIndex,
        wrapX,
        wrapY,
        excludedPosition: nextExcludedPosition
      })
  });
}

function getCladeFounderGenome(
  lineage: number,
  preferGenomeV2: boolean,
  cladeFounderGenome: Map<number, Genome>,
  cladeFounderGenomeV2: Map<number, GenomeV2>,
  agents: Agent[],
  minGenome: Genome
): Genome | GenomeV2 {
  if (preferGenomeV2) {
    const existingV2 = cladeFounderGenomeV2.get(lineage);
    if (existingV2 !== undefined) {
      return existingV2;
    }
  }

  const existing = cladeFounderGenome.get(lineage);
  if (existing !== undefined) {
    if (preferGenomeV2) {
      const converted = fromGenome(existing);
      cladeFounderGenomeV2.set(lineage, converted);
      return converted;
    }
    return existing;
  }

  const founder = agents.find((agent) => agent.lineage === lineage);
  if (preferGenomeV2 && founder?.genomeV2) {
    const genomeV2 = cloneGenomeV2(founder.genomeV2);
    cladeFounderGenomeV2.set(lineage, genomeV2);
    return genomeV2;
  }

  const genome = copyGenome(founder?.genome ?? minGenome);
  cladeFounderGenome.set(lineage, genome);
  if (preferGenomeV2) {
    const converted = fromGenome(genome);
    cladeFounderGenomeV2.set(lineage, converted);
    return converted;
  }
  return genome;
}

function getSpeciesMetric(metric: Map<number, number>, id: number, defaultValue: number): number {
  const existing = metric.get(id);
  if (existing !== undefined) {
    return existing;
  }
  metric.set(id, defaultValue);
  return defaultValue;
}

function mutateGenome(
  genome: Genome,
  config: SimulationConfig,
  minGenome: Genome,
  maxGenome: Genome,
  randomFloat: () => number
): Genome {
  const mutated: Genome = {
    metabolism: mutateTrait(genome.metabolism, minGenome.metabolism, maxGenome.metabolism, config, randomFloat),
    harvest: mutateTrait(genome.harvest, minGenome.harvest, maxGenome.harvest, config, randomFloat),
    aggression: mutateTrait(genome.aggression, minGenome.aggression, maxGenome.aggression, config, randomFloat)
  };
  if (usesSecondResourceLayer(config) || genome.harvestEfficiency2 !== undefined) {
    mutated.harvestEfficiency2 = mutateTrait(
      secondaryHarvestEfficiency(genome),
      minGenome.harvestEfficiency2 ?? 0,
      maxGenome.harvestEfficiency2 ?? maxGenome.harvest,
      config,
      randomFloat
    );
  }
  return mutated;
}

function mutateTrait(
  value: number,
  min: number,
  max: number,
  config: SimulationConfig,
  randomFloat: () => number
): number {
  const delta = (randomFloat() + randomFloat() - 1) * config.mutationAmount;
  return clamp(value + delta, min, max);
}

function genomeTrophicSignal(genome: Genome, minGenome: Genome, maxGenome: Genome): number {
  const harvestNormalized = normalizeTrait(genome.harvest, minGenome.harvest, maxGenome.harvest);
  return clamp(genome.aggression * 0.7 + (1 - harvestNormalized) * 0.3, 0, 1);
}

function genomeDefenseSignal(genome: Genome, minGenome: Genome, maxGenome: Genome): number {
  const metabolismNormalized = normalizeTrait(genome.metabolism, minGenome.metabolism, maxGenome.metabolism);
  return clamp((1 - genome.aggression) * 0.65 + metabolismNormalized * 0.35, 0, 1);
}

function normalizeTrait(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function copyGenome(genome: Genome): Genome {
  const copy: Genome = {
    metabolism: genome.metabolism,
    harvest: genome.harvest,
    aggression: genome.aggression
  };
  if (genome.harvestEfficiency2 !== undefined) {
    copy.harvestEfficiency2 = genome.harvestEfficiency2;
  }
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function usesSecondResourceLayer(config: SimulationConfig): boolean {
  return config.maxResource2 > 0 && config.resource2Regen > 0;
}
