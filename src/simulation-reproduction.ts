import { spendAgentEnergy, getAgentEnergyPools } from './agent-energy';
import {
  getPolicyStateValue,
  isNearPolicyThreshold,
  getTransientStateValue,
  inheritBehavioralState,
  computeGradedReproductionProbability,
  INTERNAL_STATE_LAST_HARVEST,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD,
  INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS,
  DEFAULT_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS
} from './behavioral-control';
import { disturbanceSettlementOpenUntilTickAt, resolveDisturbanceSettlementOpeningConfig } from './disturbance';
import { mutateGenomeV2WithConfig } from './genome-v2-adapter';
import { getTrait, genomeV2Distance, toGenome } from './genome-v2';
import { realizePhenotype } from './phenotype';
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
import { neighborhoodCrowding } from './settlement-spatial';
import { secondaryHarvestEfficiency } from './resource-harvest';
import { Agent, DescentEdge, Genome, GenomeV2, PhenotypeDeltaEntry, SimulationConfig } from './types';

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
  ) => ReproductionOutcome;
  recordDescent?: (edge: DescentEdge) => void;
  policyCouplingEnabled?: boolean;
}

interface RunReproductionPhaseResult {
  offspring: Agent[];
  founderOccupancy: number[][] | undefined;
  birthsByParentId: Map<number, number>;
  policyGatedAgentIds: Set<number>;
  decisionStats: ReproductionDecisionStats;
}

interface ReproductionDecisionStats {
  evaluated: number;
  policyGated: number;
  harvestThresholdPolicyActive: number;
  suppressedByHarvestThreshold: number;
  harvestThresholdNearThreshold: number;
}

interface ReproductionObservability {
  tick: number;
  parentId: number;
  parentLineage: number;
  parentSpecies: number;
  parentX: number;
  parentY: number;
  phenotypeDelta: PhenotypeDeltaEntry[];
  reproduction: DescentEdge['reproduction'];
  settlement: DescentEdge['settlement'];
}

export interface ReproductionOutcome {
  offspring: Agent;
  observability: ReproductionObservability;
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
  neighborhoodCrowdingAt: (x: number, y: number, occupancy: number[][]) => number;
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
  config: SimulationConfig,
  randomFloat: () => number,
  policyCouplingEnabled = true
): {
  canReproduce: boolean;
  policyGated: boolean;
  harvestThresholdPolicyActive: boolean;
  harvestThresholdNearThreshold: boolean;
  gradedProbability: number;
} {
  if (agent.energy < config.reproduceThreshold) {
    return {
      canReproduce: false,
      policyGated: false,
      harvestThresholdPolicyActive: false,
      harvestThresholdNearThreshold: false,
      gradedProbability: 0
    };
  }

  const reproductionHarvestThreshold = getPolicyStateValue(
    agent,
    INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD
  );
  const reproductionHarvestThresholdSteepness = getPolicyStateValue(
    agent,
    INTERNAL_STATE_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS,
    DEFAULT_REPRODUCTION_HARVEST_THRESHOLD_STEEPNESS
  );
  const recentHarvest = getTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST);
  const harvestThresholdPolicyActive = reproductionHarvestThreshold > 0;
  const harvestThresholdNearThreshold = isNearPolicyThreshold(recentHarvest, reproductionHarvestThreshold);

  const gradedProbability = computeGradedReproductionProbability(
    recentHarvest,
    reproductionHarvestThreshold,
    reproductionHarvestThresholdSteepness,
    policyCouplingEnabled
  );

  if (harvestThresholdPolicyActive && randomFloat() >= gradedProbability) {
    return {
      canReproduce: false,
      policyGated: true,
      harvestThresholdPolicyActive,
      harvestThresholdNearThreshold,
      gradedProbability
    };
  }

  const minPrimaryFraction = config.reproductionMinPrimaryFraction;
  const minSecondaryFraction = config.reproductionMinSecondaryFraction;

  if (minPrimaryFraction <= 0 && minSecondaryFraction <= 0) {
    return {
      canReproduce: true,
      policyGated: false,
      harvestThresholdPolicyActive,
      harvestThresholdNearThreshold,
      gradedProbability
    };
  }

  const pools = getAgentEnergyPools(agent);
  if (pools.total <= 0) {
    return {
      canReproduce: false,
      policyGated: false,
      harvestThresholdPolicyActive,
      harvestThresholdNearThreshold,
      gradedProbability
    };
  }

  const primaryFraction = pools.primary / pools.total;
  const secondaryFraction = pools.secondary / pools.total;

  return {
    canReproduce: primaryFraction >= minPrimaryFraction && secondaryFraction >= minSecondaryFraction,
    policyGated: false,
    harvestThresholdPolicyActive,
    harvestThresholdNearThreshold,
    gradedProbability
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
  reproduce,
  recordDescent,
  policyCouplingEnabled = true
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
  const policyGatedAgentIds = new Set<number>();
  const decisionStats: ReproductionDecisionStats = {
    evaluated: 0,
    policyGated: 0,
    harvestThresholdPolicyActive: 0,
    suppressedByHarvestThreshold: 0,
    harvestThresholdNearThreshold: 0
  };
  for (const agent of [...agents]) {
    if (!isAlive(agent.id)) {
      continue;
    }
    const reproductionDecision = evaluateReproductionEligibility(agent, config, randomFloat, policyCouplingEnabled);
    decisionStats.evaluated += 1;
    decisionStats.policyGated += Number(reproductionDecision.policyGated);
    decisionStats.harvestThresholdPolicyActive += Number(reproductionDecision.harvestThresholdPolicyActive);
    decisionStats.suppressedByHarvestThreshold += Number(reproductionDecision.policyGated);
    decisionStats.harvestThresholdNearThreshold += Number(reproductionDecision.harvestThresholdNearThreshold);
    if (reproductionDecision.policyGated) {
      policyGatedAgentIds.add(agent.id);
    }
    if (!reproductionDecision.canReproduce || randomFloat() >= config.reproduceProbability) {
      continue;
    }

    const reproductionOutcome = reproduce(agent, reproductionOccupancy, reproductionLineageOccupancy);
    const child = reproductionOutcome.offspring;
    offspring.push(child);
    birthsByParentId.set(agent.id, (birthsByParentId.get(agent.id) ?? 0) + 1);
    recordDescent?.({
      tick: reproductionOutcome.observability.tick,
      parentId: reproductionOutcome.observability.parentId,
      parentLineage: reproductionOutcome.observability.parentLineage,
      parentSpecies: reproductionOutcome.observability.parentSpecies,
      parentX: reproductionOutcome.observability.parentX,
      parentY: reproductionOutcome.observability.parentY,
      offspringId: child.id,
      offspringLineage: child.lineage,
      offspringSpecies: child.species,
      phenotypeDelta: reproductionOutcome.observability.phenotypeDelta,
      reproduction: {
        ...reproductionOutcome.observability.reproduction,
        policyGated: reproductionDecision.policyGated
      },
      settlement: reproductionOutcome.observability.settlement,
      offspringProduced: 0,
      offspringDeathTick: null,
      offspringAgeAtDeath: null
    });
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
    policyGatedAgentIds,
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
  neighborhoodCrowdingAt,
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
}: ReproduceAgentOptions): ReproductionOutcome {
  const currentStepTick = tickCount + 1;
  const childEnergy = parent.energy * config.offspringEnergyFraction;
  const childPools = spendAgentEnergy(parent, childEnergy);

  const childGenomeV2 = parent.genomeV2
    ? mutateGenomeV2WithConfig(parent.genomeV2, config, randomFloat)
    : undefined;
  const childGenome = childGenomeV2 ? toGenome(childGenomeV2) : mutateGenome(parent.genome);
  const diverged =
    genomeDistance(parent.genomeV2 ?? parent.genome, childGenomeV2 ?? childGenome, config) >=
    config.speciationThreshold;
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
  const childBehavioralState = inheritBehavioralState(parent, policyMutationOptions);
  const offspring: Agent = {
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
    policyState: childBehavioralState.policyState,
    transientState: childBehavioralState.transientState
  };
  const settlementOccupancy = settlementContext?.occupancy ?? occupancy ?? buildOccupancyGrid(agents);
  const settlementLineageOccupancy =
    settlementContext?.lineageOccupancy ??
    lineageOccupancy ??
    (usesOffspringSettlementLineageOccupancy(config) ? buildLineageOccupancyGrid(agents) : undefined);
  const localFertility = effectiveBiomeFertilityAt(childPos.x, childPos.y, currentStepTick);
  const localCrowding = neighborhoodCrowdingAt(childPos.x, childPos.y, settlementOccupancy);
  const sameLineageCrowding = settlementLineageOccupancy
    ? sameLineageNeighborhoodCrowdingAt(
        parent.lineage,
        childPos.x,
        childPos.y,
        settlementLineageOccupancy,
        childPos.x === parent.x && childPos.y === parent.y ? undefined : { x: parent.x, y: parent.y }
      )
    : 0;

  return {
    offspring,
    observability: {
      tick: currentStepTick,
      parentId: parent.id,
      parentLineage: parent.lineage,
      parentSpecies: parent.species,
      parentX: parent.x,
      parentY: parent.y,
      phenotypeDelta: buildPhenotypeDelta(parent, offspring),
      reproduction: {
        localFertility,
        localCrowding,
        policyGated: false,
        speciationOccurred: diverged,
        foundedNewClade: foundNewClade,
        parentEnergy: parent.energy,
        offspringEnergy: childEnergy
      },
      settlement: {
        x: childPos.x,
        y: childPos.y,
        localFertility,
        localCrowding,
        sameLineageCrowding,
        settled: true,
        movedFromParentCell: childPos.x !== parent.x || childPos.y !== parent.y
      }
    }
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

function genomeDistance(
  a: Genome | GenomeV2,
  b: Genome | GenomeV2,
  config?: Pick<SimulationConfig, 'genomeV2DistanceWeights'>
): number {
  if (isGenomeV2(a) && isGenomeV2(b)) {
    return genomeV2Distance(a, b, config?.genomeV2DistanceWeights);
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

function buildPhenotypeDelta(
  parent: Pick<Agent, 'genomeV2' | 'policyState'>,
  offspring: Pick<Agent, 'genomeV2' | 'policyState'>
): PhenotypeDeltaEntry[] {
  const parentPhenotype = realizePhenotype(parent);
  const offspringPhenotype = realizePhenotype(offspring);
  const traits = new Set([...Object.keys(parentPhenotype), ...Object.keys(offspringPhenotype)]);
  const delta: PhenotypeDeltaEntry[] = [];

  for (const trait of traits) {
    const parentValue = parentPhenotype[trait as keyof typeof parentPhenotype] ?? null;
    const offspringValue = offspringPhenotype[trait as keyof typeof offspringPhenotype] ?? null;
    if (parentValue === offspringValue) {
      continue;
    }

    delta.push({
      trait,
      parentValue,
      offspringValue,
      delta: (offspringValue ?? 0) - (parentValue ?? 0)
    });
  }

  return delta;
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
