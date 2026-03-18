import {
  LineageOccupancyGrid,
  OffspringSettlementContext,
  SettlementAgent,
  SettlementPosition,
  pickSettlementSite
} from './reproduction';
import {
  shouldFoundNewClade,
  usesCladogenesisEcologyGate,
  usesOffspringSettlementContext,
  usesOffspringSettlementLineageOccupancy,
  usesOffspringSettlementScoring,
  resolveOffspringSettlementContext
} from './settlement-cladogenesis';
import { resolveMutatedSpeciesHabitatPreference, setFoundCladeHabitatPreference, adaptCladeHabitatPreference } from './clade-habitat';
import { resolveDisturbanceSettlementOpeningConfig } from './disturbance';
import { Agent, Genome, GenomeV2, SimulationConfig } from './types';

type SpeciesData = Pick<Agent, 'species' | 'genome' | 'genomeV2' | 'lineage' | 'x' | 'y'>;

interface InitializeDivergentSpeciesOptions {
  childSpecies: number;
  parentSpecies: number;
  parentGenome: Genome | GenomeV2;
  childGenome: Genome | GenomeV2;
  config: SimulationConfig;
  speciesHabitatPreference: Map<number, number>;
  speciesTrophicLevel: Map<number, number>;
  speciesDefenseLevel: Map<number, number>;
  getSpeciesTrophicLevel: (species: number) => number;
  getSpeciesDefenseLevel: (species: number) => number;
  trophicDeltaFromMutation: (parentGenome: Genome | GenomeV2, childGenome: Genome | GenomeV2) => number;
  defenseDeltaFromMutation: (parentGenome: Genome | GenomeV2, childGenome: Genome | GenomeV2) => number;
}

interface OffspringSettlementContextBuilderOptions {
  config: SimulationConfig;
  agents: Agent[];
  occupancy?: number[][];
  lineageOccupancy?: LineageOccupancyGrid;
  buildOccupancyGrid: (agents: Array<Pick<Agent, 'x' | 'y'>>) => number[][];
  buildLineageOccupancyGrid: (agents: Array<Pick<Agent, 'lineage' | 'x' | 'y'>>) => LineageOccupancyGrid;
}

interface ResolveCladogenesisDecisionOptions {
  config: SimulationConfig;
  parent: SpeciesData;
  diverged: boolean;
  childGenome: Genome;
  childGenomeV2?: GenomeV2;
  childPos: SettlementPosition;
  settlementContext: OffspringSettlementContext | undefined;
  buildSettlementContext: (required?: boolean) => OffspringSettlementContext | undefined;
  genomeDistance: (a: Genome | GenomeV2, b: Genome | GenomeV2) => number;
  getCladeFounderGenome: (lineage: number, preferGenomeV2?: boolean) => Genome | GenomeV2;
  getSpeciesHabitatPreference: (species: number) => number;
  getCladeHabitatPreference: (lineage: number) => number;
  getSpeciesTrophicLevel: (species: number) => number;
  getCladeTrophicLevel: (lineage: number) => number;
  getSpeciesDefenseLevel: (species: number) => number;
  getCladeDefenseLevel: (lineage: number) => number;
  localEcologyScore: (
    agent: SettlementAgent,
    x: number,
    y: number,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined,
    lineagePenalty: number,
    excludedPosition: SettlementPosition | undefined,
    jitter: number
  ) => number;
}

interface PickOffspringSettlementOptions {
  parent: SettlementAgent;
  settlementContext: OffspringSettlementContext | undefined;
  config: SimulationConfig;
  currentStepTick: number;
  wrapX: (x: number) => number;
  wrapY: (y: number) => number;
  pickRandomNeighbor: (neighbors: SettlementPosition[]) => SettlementPosition;
  randomJitter: () => number;
  localEcologyScore: (
    agent: SettlementAgent,
    x: number,
    y: number,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined,
    lineagePenalty: number,
    excludedPosition: SettlementPosition | undefined,
    jitter: number
  ) => number;
  disturbanceSettlementOpeningBonusAt: (x: number, y: number, currentStepTick: number) => number;
}

interface FoundCladeOptions {
  founderGenome: Genome;
  founderGenomeV2?: GenomeV2;
  founderX: number;
  founderY: number;
  cladeFounderGenome: Map<number, Genome>;
  cladeFounderGenomeV2?: Map<number, GenomeV2>;
  cladeHabitatPreference: Map<number, number>;
  nextLineageId: number;
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
  currentStepTick: number;
}

interface AdaptCladeHabitatPreferenceOptions {
  lineage: number;
  x: number;
  y: number;
  config: SimulationConfig;
  cladeHabitatPreference: Map<number, number>;
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
  currentStepTick: number;
}

export function initializeDivergentSpecies({
  childSpecies,
  parentSpecies,
  parentGenome,
  childGenome,
  config,
  speciesHabitatPreference,
  speciesTrophicLevel,
  speciesDefenseLevel,
  getSpeciesTrophicLevel,
  getSpeciesDefenseLevel,
  trophicDeltaFromMutation,
  defenseDeltaFromMutation
}: InitializeDivergentSpeciesOptions): void {
  speciesHabitatPreference.set(
    childSpecies,
    resolveMutatedSpeciesHabitatPreference({
      parentSpecies,
      parentGenome,
      childGenome,
      speciesHabitatPreference,
      config
    })
  );
  const parentTrophic = getSpeciesTrophicLevel(parentSpecies);
  const trophicDelta = trophicDeltaFromMutation(parentGenome, childGenome);
  speciesTrophicLevel.set(childSpecies, clamp(parentTrophic + trophicDelta, 0, 1));
  const parentDefense = getSpeciesDefenseLevel(parentSpecies);
  const defenseDelta = defenseDeltaFromMutation(parentGenome, childGenome);
  speciesDefenseLevel.set(childSpecies, clamp(parentDefense + defenseDelta, 0, 1));
}

export function buildOffspringSettlementContextBuilder({
  config,
  agents,
  occupancy,
  lineageOccupancy,
  buildOccupancyGrid,
  buildLineageOccupancyGrid
}: OffspringSettlementContextBuilderOptions): (required?: boolean) => OffspringSettlementContext | undefined {
  const useSettlementLineageOccupancy = usesOffspringSettlementLineageOccupancy(config);
  return (required = true) =>
    resolveOffspringSettlementContext({
      config,
      agents,
      occupancy,
      lineageOccupancy,
      required,
      usesLineageOccupancy: useSettlementLineageOccupancy,
      buildOccupancyGrid,
      buildLineageOccupancyGrid
    });
}

export function resolveCladogenesisDecision({
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
}: ResolveCladogenesisDecisionOptions): boolean {
  const cladogenesisContext = settlementContext ?? buildSettlementContext(usesCladogenesisEcologyGate(config));
  const settlementAgent: SettlementAgent = {
    genome: childGenome,
    genomeV2: childGenomeV2,
    lineage: parent.lineage,
    species: parent.species,
    x: parent.x,
    y: parent.y
  };
  return shouldFoundNewClade({
    config,
    parentLineage: parent.lineage,
    diverged,
    childGenome: childGenomeV2 ?? childGenome,
    settlementAgent,
    childPos,
    settlementContext: cladogenesisContext,
    genomeDistance,
    getCladeFounderGenome,
    getSpeciesHabitatPreference,
    getCladeHabitatPreference,
    getSpeciesTrophicLevel,
    getCladeTrophicLevel,
    getSpeciesDefenseLevel,
    getCladeDefenseLevel,
    resolveSettlementContext: () => buildSettlementContext(),
    localEcologyScore
  });
}

export function pickOffspringSettlement({
  parent,
  settlementContext,
  config,
  currentStepTick,
  wrapX,
  wrapY,
  pickRandomNeighbor,
  randomJitter,
  localEcologyScore,
  disturbanceSettlementOpeningBonusAt
}: PickOffspringSettlementOptions): SettlementPosition {
  return pickSettlementSite({
    parent,
    settlementContext,
    useSettlementEcologyScore: usesOffspringSettlementScoring(config),
    useDisturbanceOpeningBonus: resolveDisturbanceSettlementOpeningConfig(config).enabled,
    currentStepTick,
    wrapX,
    wrapY,
    pickRandomNeighbor,
    randomJitter,
    localEcologyScore,
    disturbanceSettlementOpeningBonusAt
  });
}

export function foundClade({
  founderGenome,
  founderGenomeV2,
  founderX,
  founderY,
  cladeFounderGenome,
  cladeFounderGenomeV2,
  cladeHabitatPreference,
  nextLineageId,
  effectiveBiomeFertilityAt,
  currentStepTick
}: FoundCladeOptions): number {
  const lineage = nextLineageId;
  cladeFounderGenome.set(lineage, {
    metabolism: founderGenome.metabolism,
    harvest: founderGenome.harvest,
    aggression: founderGenome.aggression,
    harvestEfficiency2: founderGenome.harvestEfficiency2
  });
  if (founderGenomeV2 !== undefined) {
    cladeFounderGenomeV2?.set(lineage, {
      traits: new Map(founderGenomeV2.traits)
    });
  }
  setFoundCladeHabitatPreference({
    cladeHabitatPreference,
    lineage,
    fertility: effectiveBiomeFertilityAt(founderX, founderY, currentStepTick),
    genomeV2: founderGenomeV2
  });
  return lineage;
}

export function adaptCladeHabitatPreferenceAt({
  lineage,
  x,
  y,
  config,
  cladeHabitatPreference,
  effectiveBiomeFertilityAt,
  currentStepTick
}: AdaptCladeHabitatPreferenceOptions): void {
  adaptCladeHabitatPreference({
    cladeHabitatPreference,
    lineage,
    fertility: effectiveBiomeFertilityAt(x, y, currentStepTick),
    config
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
