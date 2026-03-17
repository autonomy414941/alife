import { spendAgentEnergy, getAgentEnergyPools } from './agent-energy';
import { disturbanceSettlementOpenUntilTickAt, resolveDisturbanceSettlementOpeningConfig } from './disturbance';
import {
  LineageOccupancyGrid,
  OffspringSettlementContext,
  SettlementAgent,
  SettlementPosition,
  resolveDisturbanceSettlementOpeningBonus
} from './reproduction';
import {
  adaptCladeHabitatPreferenceAt,
  buildOffspringSettlementContextBuilder,
  foundClade as registerFoundedClade,
  initializeDivergentSpecies,
  pickOffspringSettlement,
  resolveCladogenesisDecision
} from './reproduction-coordinator';
import {
  usesCladogenesisEcologyGate,
  usesOffspringSettlementContext,
  usesOffspringSettlementLineageOccupancy
} from './settlement-cladogenesis';
import { secondaryHarvestEfficiency } from './resource-harvest';
import { Agent, Genome, SimulationConfig } from './types';

type SpeciesData = Pick<Agent, 'species' | 'genome' | 'lineage' | 'x' | 'y'>;

type LocalEcologyScore = (
  agent: SettlementAgent,
  x: number,
  y: number,
  occupancy: number[][],
  lineageOccupancy: LineageOccupancyGrid | undefined,
  lineagePenalty: number,
  excludedPosition: SettlementPosition | undefined,
  jitter: number
) => number;

interface RunReproductionPhaseOptions {
  agents: Agent[];
  config: SimulationConfig;
  isAlive: (agentId: number) => boolean;
  randomFloat: () => number;
  buildOccupancyGrid: (agents: Array<Pick<Agent, 'x' | 'y'>>) => number[][];
  buildLineageOccupancyGrid: (agents: Array<Pick<Agent, 'lineage' | 'x' | 'y'>>) => LineageOccupancyGrid;
  adjustLineageOccupancy: (
    occupancy: LineageOccupancyGrid,
    lineage: number,
    x: number,
    y: number,
    delta: number
  ) => void;
  reproduce: (
    parent: Agent,
    occupancy?: number[][],
    lineageOccupancy?: LineageOccupancyGrid
  ) => Agent;
}

interface RunReproductionPhaseResult {
  offspring: Agent[];
  founderOccupancy: number[][] | undefined;
}

interface ReproduceAgentOptions {
  parent: Agent;
  agents: Agent[];
  config: SimulationConfig;
  tickCount: number;
  occupancy?: number[][];
  lineageOccupancy?: LineageOccupancyGrid;
  speciesHabitatPreference: Map<number, number>;
  speciesTrophicLevel: Map<number, number>;
  speciesDefenseLevel: Map<number, number>;
  cladeFounderGenome: Map<number, Genome>;
  cladeHabitatPreference: Map<number, number>;
  allocateAgentId: () => number;
  allocateSpeciesId: () => number;
  allocateLineageId: () => number;
  randomFloat: () => number;
  mutateGenome: (genome: Genome) => Genome;
  buildOccupancyGrid: (agents: Array<Pick<Agent, 'x' | 'y'>>) => number[][];
  buildLineageOccupancyGrid: (agents: Array<Pick<Agent, 'lineage' | 'x' | 'y'>>) => LineageOccupancyGrid;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  pickRandomNeighbor: (neighbors: SettlementPosition[]) => SettlementPosition;
  localEcologyScore: LocalEcologyScore;
  disturbanceSettlementOpenUntilTick: number[][];
  sameLineageNeighborhoodCrowdingAt: (
    lineage: number,
    x: number,
    y: number,
    lineageOccupancy: LineageOccupancyGrid,
    excludedPosition: SettlementPosition | undefined
  ) => number;
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
  getCladeFounderGenome: (lineage: number) => Genome;
  getSpeciesHabitatPreference: (species: number) => number;
  getCladeHabitatPreference: (lineage: number) => number;
  getSpeciesTrophicLevel: (species: number) => number;
  getCladeTrophicLevel: (lineage: number) => number;
  getSpeciesDefenseLevel: (species: number) => number;
  getCladeDefenseLevel: (lineage: number) => number;
}

function canReproduce(agent: Agent, config: SimulationConfig): boolean {
  if (agent.energy < config.reproduceThreshold) {
    return false;
  }

  const minPrimaryFraction = config.reproductionMinPrimaryFraction;
  const minSecondaryFraction = config.reproductionMinSecondaryFraction;

  if (minPrimaryFraction <= 0 && minSecondaryFraction <= 0) {
    return true;
  }

  const pools = getAgentEnergyPools(agent);
  if (pools.total <= 0) {
    return false;
  }

  const primaryFraction = pools.primary / pools.total;
  const secondaryFraction = pools.secondary / pools.total;

  return primaryFraction >= minPrimaryFraction && secondaryFraction >= minSecondaryFraction;
}

export function runReproductionPhase({
  agents,
  config,
  isAlive,
  randomFloat,
  buildOccupancyGrid,
  buildLineageOccupancyGrid,
  adjustLineageOccupancy,
  reproduce
}: RunReproductionPhaseOptions): RunReproductionPhaseResult {
  const useSettlementContext = usesOffspringSettlementContext(config) || usesCladogenesisEcologyGate(config);
  const reproductiveAgents = useSettlementContext ? agents.filter((agent) => agent.energy > 0) : undefined;
  const reproductionOccupancy = reproductiveAgents ? buildOccupancyGrid(reproductiveAgents) : undefined;
  const reproductionLineageOccupancy =
    reproductiveAgents && usesOffspringSettlementLineageOccupancy(config)
      ? buildLineageOccupancyGrid(reproductiveAgents)
      : undefined;

  const offspring: Agent[] = [];
  for (const agent of [...agents]) {
    if (!isAlive(agent.id)) {
      continue;
    }
    if (!canReproduce(agent, config) || randomFloat() >= config.reproduceProbability) {
      continue;
    }

    const child = reproduce(agent, reproductionOccupancy, reproductionLineageOccupancy);
    offspring.push(child);
    if (reproductionOccupancy) {
      reproductionOccupancy[child.y][child.x] += 1;
    }
    if (reproductionLineageOccupancy) {
      adjustLineageOccupancy(reproductionLineageOccupancy, child.lineage, child.x, child.y, 1);
    }
  }

  return {
    offspring,
    founderOccupancy: offspring.length === 0 ? undefined : buildOccupancyGrid([...agents, ...offspring])
  };
}

export function reproduceAgent({
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
  cladeHabitatPreference,
  allocateAgentId,
  allocateSpeciesId,
  allocateLineageId,
  randomFloat,
  mutateGenome,
  buildOccupancyGrid,
  buildLineageOccupancyGrid,
  wrapX,
  wrapY,
  pickRandomNeighbor,
  localEcologyScore,
  disturbanceSettlementOpenUntilTick,
  sameLineageNeighborhoodCrowdingAt,
  effectiveBiomeFertilityAt,
  getCladeFounderGenome,
  getSpeciesHabitatPreference,
  getCladeHabitatPreference,
  getSpeciesTrophicLevel,
  getCladeTrophicLevel,
  getSpeciesDefenseLevel,
  getCladeDefenseLevel
}: ReproduceAgentOptions): Agent {
  const currentStepTick = tickCount + 1;
  const childEnergy = parent.energy * config.offspringEnergyFraction;
  const childPools = spendAgentEnergy(parent, childEnergy);

  const childGenome = mutateGenome(parent.genome);
  const diverged = genomeDistance(parent.genome, childGenome) >= config.speciationThreshold;
  const childSpecies = diverged ? allocateSpeciesId() : parent.species;
  if (diverged) {
    initializeDivergentSpecies({
      childSpecies,
      parentSpecies: parent.species,
      parentGenome: parent.genome,
      childGenome,
      config,
      speciesHabitatPreference,
      speciesTrophicLevel,
      speciesDefenseLevel,
      getSpeciesTrophicLevel,
      getSpeciesDefenseLevel,
      trophicDeltaFromMutation: (parentGenome, nextChildGenome) =>
        trophicDeltaFromMutation(config, parentGenome, nextChildGenome),
      defenseDeltaFromMutation: (parentGenome, nextChildGenome) =>
        defenseDeltaFromMutation(config, parentGenome, nextChildGenome)
    });
  }

  const settlementAgent = {
    ...parent,
    species: childSpecies,
    genome: childGenome
  };
  const buildSettlementContext = buildOffspringSettlementContextBuilder({
    config,
    agents,
    occupancy,
    lineageOccupancy,
    buildOccupancyGrid,
    buildLineageOccupancyGrid
  });
  const settlementContext = buildSettlementContext(usesOffspringSettlementContext(config));
  const childPos = pickOffspringSettlement({
    parent: settlementAgent,
    settlementContext,
    config,
    currentStepTick,
    wrapX,
    wrapY,
    pickRandomNeighbor,
    randomJitter: () => randomFloat() * 0.05,
    localEcologyScore,
    disturbanceSettlementOpeningBonusAt: (x, y, stepTick) =>
      disturbanceSettlementOpeningBonusAt({
        config,
        disturbanceSettlementOpenUntilTick,
        parent: settlementAgent,
        settlementContext,
        x,
        y,
        currentStepTick: stepTick,
        sameLineageNeighborhoodCrowdingAt
      })
  });
  const foundNewClade = resolveCladogenesisDecision({
    config,
    parent,
    diverged,
    childGenome,
    childPos,
    settlementContext,
    buildSettlementContext,
    genomeDistance,
    getCladeFounderGenome,
    getSpeciesHabitatPreference,
    getCladeHabitatPreference,
    getSpeciesTrophicLevel,
    getCladeTrophicLevel,
    getSpeciesDefenseLevel,
    getCladeDefenseLevel,
    localEcologyScore
  });
  const nextLineage = foundNewClade
    ? registerFoundedClade({
        founderGenome: childGenome,
        founderX: childPos.x,
        founderY: childPos.y,
        cladeFounderGenome,
        cladeHabitatPreference,
        nextLineageId: allocateLineageId(),
        effectiveBiomeFertilityAt,
        currentStepTick
      })
    : parent.lineage;
  adaptCladeHabitatPreferenceAt({
    lineage: nextLineage,
    x: childPos.x,
    y: childPos.y,
    config,
    cladeHabitatPreference,
    effectiveBiomeFertilityAt,
    currentStepTick
  });

  return {
    id: allocateAgentId(),
    lineage: nextLineage,
    species: childSpecies,
    x: childPos.x,
    y: childPos.y,
    energy: childEnergy,
    energyPrimary: childPools.primary,
    energySecondary: childPools.secondary,
    age: 0,
    genome: childGenome
  };
}

function trophicDeltaFromMutation(config: SimulationConfig, parent: Genome, child: Genome): number {
  const mutationScale = Math.max(0, config.trophicMutation);
  if (mutationScale === 0) {
    return 0;
  }

  const aggressionShift = child.aggression - parent.aggression;
  const harvestShift = parent.harvest - child.harvest;
  const signal = aggressionShift * 0.7 + harvestShift * 0.3;
  return clamp(signal, -1, 1) * mutationScale;
}

function defenseDeltaFromMutation(config: SimulationConfig, parent: Genome, child: Genome): number {
  const mutationScale = Math.max(0, config.defenseMutation);
  if (mutationScale === 0) {
    return 0;
  }

  const aggressionShift = parent.aggression - child.aggression;
  const metabolismShift = child.metabolism - parent.metabolism;
  const signal = aggressionShift * 0.65 + metabolismShift * 0.35;
  return clamp(signal, -1, 1) * mutationScale;
}

function genomeDistance(a: Genome, b: Genome): number {
  return (
    Math.abs(a.metabolism - b.metabolism) +
    Math.abs(a.harvest - b.harvest) +
    Math.abs(secondaryHarvestEfficiency(a) - secondaryHarvestEfficiency(b)) +
    Math.abs(a.aggression - b.aggression)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function disturbanceSettlementOpeningBonusAt({
  config,
  disturbanceSettlementOpenUntilTick,
  parent,
  settlementContext,
  x,
  y,
  currentStepTick,
  sameLineageNeighborhoodCrowdingAt
}: {
  config: SimulationConfig;
  disturbanceSettlementOpenUntilTick: number[][];
  parent: Pick<Agent, 'lineage' | 'x' | 'y'>;
  settlementContext: OffspringSettlementContext | undefined;
  x: number;
  y: number;
  currentStepTick: number;
  sameLineageNeighborhoodCrowdingAt: (
    lineage: number,
    x: number,
    y: number,
    lineageOccupancy: LineageOccupancyGrid,
    excludedPosition: SettlementPosition | undefined
  ) => number;
}): number {
  const opening = resolveDisturbanceSettlementOpeningConfig(config);
  if (opening.lineageAbsentOnly) {
    const lineageOccupancy = settlementContext?.lineageOccupancy;
    if (!lineageOccupancy) {
      return 0;
    }

    const parentOccupiesCandidate = parent.x === x && parent.y === y;
    const lineageCrowding = sameLineageNeighborhoodCrowdingAt(
      parent.lineage,
      x,
      y,
      lineageOccupancy,
      parentOccupiesCandidate ? undefined : { x: parent.x, y: parent.y }
    );
    if (lineageCrowding > 0) {
      return 0;
    }
  }

  return resolveDisturbanceSettlementOpeningBonus({
    enabled: opening.enabled,
    openUntilTick: disturbanceSettlementOpenUntilTickAt(disturbanceSettlementOpenUntilTick, x, y),
    currentStepTick,
    openingTicks: opening.openingTicks,
    openingBonus: opening.openingBonus
  });
}
