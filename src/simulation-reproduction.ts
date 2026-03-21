import { spendAgentEnergy, getAgentEnergyPools } from './agent-energy';
import {
  getInternalStateValue,
  inheritInternalState,
  INTERNAL_STATE_LAST_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
} from './behavioral-control';
import { disturbanceSettlementOpenUntilTickAt, resolveDisturbanceSettlementOpeningConfig } from './disturbance';
import { mutateGenomeV2WithConfig } from './genome-v2-adapter';
import { getTrait, genomeV2Distance, toGenome } from './genome-v2';
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
import { Agent, Genome, GenomeV2, SimulationConfig } from './types';

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
  birthsByParentId: Map<number, number>;
  decisionStats: ReproductionDecisionStats;
}

interface ReproductionDecisionStats {
  evaluated: number;
  policyGated: number;
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
  cladeFounderGenomeV2: Map<number, GenomeV2>;
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
  getCladeFounderGenome: (lineage: number, preferGenomeV2?: boolean) => Genome | GenomeV2;
  getSpeciesHabitatPreference: (species: number) => number;
  getCladeHabitatPreference: (lineage: number) => number;
  getSpeciesTrophicLevel: (species: number) => number;
  getCladeTrophicLevel: (lineage: number) => number;
  getSpeciesDefenseLevel: (species: number) => number;
  getCladeDefenseLevel: (lineage: number) => number;
}

function evaluateReproductionEligibility(
  agent: Agent,
  config: SimulationConfig
): { canReproduce: boolean; policyGated: boolean } {
  if (agent.energy < config.reproduceThreshold) {
    return { canReproduce: false, policyGated: false };
  }

  const reproductionHarvestThreshold = getInternalStateValue(
    agent,
    INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
  );
  if (
    reproductionHarvestThreshold > 0 &&
    getInternalStateValue(agent, INTERNAL_STATE_LAST_HARVEST) < reproductionHarvestThreshold
  ) {
    return { canReproduce: false, policyGated: true };
  }

  const minPrimaryFraction = config.reproductionMinPrimaryFraction;
  const minSecondaryFraction = config.reproductionMinSecondaryFraction;

  if (minPrimaryFraction <= 0 && minSecondaryFraction <= 0) {
    return { canReproduce: true, policyGated: false };
  }

  const pools = getAgentEnergyPools(agent);
  if (pools.total <= 0) {
    return { canReproduce: false, policyGated: false };
  }

  const primaryFraction = pools.primary / pools.total;
  const secondaryFraction = pools.secondary / pools.total;

  return {
    canReproduce: primaryFraction >= minPrimaryFraction && secondaryFraction >= minSecondaryFraction,
    policyGated: false
  };
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
  const birthsByParentId = new Map<number, number>();
  const decisionStats: ReproductionDecisionStats = {
    evaluated: 0,
    policyGated: 0
  };
  for (const agent of [...agents]) {
    if (!isAlive(agent.id)) {
      continue;
    }
    const reproductionDecision = evaluateReproductionEligibility(agent, config);
    decisionStats.evaluated += 1;
    decisionStats.policyGated += Number(reproductionDecision.policyGated);
    if (!reproductionDecision.canReproduce || randomFloat() >= config.reproduceProbability) {
      continue;
    }

    const child = reproduce(agent, reproductionOccupancy, reproductionLineageOccupancy);
    offspring.push(child);
    birthsByParentId.set(agent.id, (birthsByParentId.get(agent.id) ?? 0) + 1);
    if (reproductionOccupancy) {
      reproductionOccupancy[child.y][child.x] += 1;
    }
    if (reproductionLineageOccupancy) {
      adjustLineageOccupancy(reproductionLineageOccupancy, child.lineage, child.x, child.y, 1);
    }
  }

  return {
    offspring,
    founderOccupancy: offspring.length === 0 ? undefined : buildOccupancyGrid([...agents, ...offspring]),
    birthsByParentId,
    decisionStats
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
  cladeFounderGenomeV2,
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

  const childGenomeV2 = parent.genomeV2
    ? mutateGenomeV2WithConfig(parent.genomeV2, config, randomFloat)
    : undefined;
  const childGenome = childGenomeV2 ? toGenome(childGenomeV2) : mutateGenome(parent.genome);
  const diverged =
    genomeDistance(parent.genomeV2 ?? parent.genome, childGenomeV2 ?? childGenome) >= config.speciationThreshold;
  const childSpecies = diverged ? allocateSpeciesId() : parent.species;
  if (diverged) {
    initializeDivergentSpecies({
      childSpecies,
      parentSpecies: parent.species,
      parentGenome: parent.genomeV2 ?? parent.genome,
      childGenome: childGenomeV2 ?? childGenome,
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
    genome: childGenome,
    genomeV2: childGenomeV2
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
    childGenomeV2,
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
        cladeFounderGenomeV2,
        cladeHabitatPreference,
        founderGenomeV2: childGenomeV2,
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

  const policyMutationOptions =
    config.policyMutationProbability > 0
      ? {
          mutationProbability: config.policyMutationProbability,
          mutationMagnitude: config.policyMutationMagnitude,
          randomFloat
        }
      : undefined;

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
    genome: childGenome,
    genomeV2: childGenomeV2,
    internalState: inheritInternalState(parent, policyMutationOptions)
  };
}

function trophicDeltaFromMutation(config: SimulationConfig, parent: Genome | GenomeV2, child: Genome | GenomeV2): number {
  const mutationScale = Math.max(0, config.trophicMutation);
  if (mutationScale === 0) {
    return 0;
  }

  const parentLegacy = toLegacyGenome(parent);
  const childLegacy = toLegacyGenome(child);
  const aggressionShift = childLegacy.aggression - parentLegacy.aggression;
  const harvestShift = parentLegacy.harvest - childLegacy.harvest;
  const signal = aggressionShift * 0.7 + harvestShift * 0.3;
  return clamp(signal, -1, 1) * mutationScale;
}

function defenseDeltaFromMutation(config: SimulationConfig, parent: Genome | GenomeV2, child: Genome | GenomeV2): number {
  const mutationScale = Math.max(0, config.defenseMutation);
  if (mutationScale === 0) {
    return 0;
  }

  const parentLegacy = toLegacyGenome(parent);
  const childLegacy = toLegacyGenome(child);
  const aggressionShift = parentLegacy.aggression - childLegacy.aggression;
  const metabolismShift = childLegacy.metabolism - parentLegacy.metabolism;
  const signal = aggressionShift * 0.65 + metabolismShift * 0.35;
  return clamp(signal, -1, 1) * mutationScale;
}

function genomeDistance(a: Genome | GenomeV2, b: Genome | GenomeV2): number {
  if (isGenomeV2(a) && isGenomeV2(b)) {
    return genomeV2Distance(a, b);
  }

  const left = toLegacyGenome(a);
  const right = toLegacyGenome(b);
  return (
    Math.abs(left.metabolism - right.metabolism) +
    Math.abs(left.harvest - right.harvest) +
    Math.abs(secondaryHarvestEfficiency(left) - secondaryHarvestEfficiency(right)) +
    Math.abs(left.aggression - right.aggression)
  );
}

function toLegacyGenome(genome: Genome | GenomeV2): Genome {
  if (!isGenomeV2(genome)) {
    return genome;
  }
  return {
    metabolism: getTrait(genome, 'metabolism'),
    harvest: getTrait(genome, 'harvest'),
    aggression: getTrait(genome, 'aggression'),
    harvestEfficiency2: genome.traits.has('harvestEfficiency2') ? getTrait(genome, 'harvestEfficiency2') : undefined
  };
}

function isGenomeV2(genome: Genome | GenomeV2): genome is GenomeV2 {
  return 'traits' in genome;
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
