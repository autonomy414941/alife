import {
  LineageOccupancyGrid,
  OffspringSettlementContext,
  SettlementAgent,
  SettlementPosition,
  passesCladogenesisEcologyGate,
  passesCladogenesisTraitNoveltyGate,
  shouldFoundClade
} from './reproduction';
import { resolveDisturbanceSettlementOpeningConfig } from './disturbance';
import { Agent, Genome, SimulationConfig } from './types';

type SettlementScoringConfig = Pick<
  SimulationConfig,
  'offspringSettlementEcologyScoring' | 'lineageOffspringSettlementCrowdingPenalty' | 'newCladeSettlementCrowdingGraceTicks'
>;

type CladogenesisConfig = Pick<
  SimulationConfig,
  'cladogenesisThreshold' | 'cladogenesisTraitNoveltyThreshold' | 'cladogenesisEcologyAdvantageThreshold'
>;

type NewCladeGraceConfig = Pick<
  SimulationConfig,
  'newCladeSettlementCrowdingGraceTicks' | 'newCladeEncounterRestraintGraceBoost'
>;

type DisturbanceSettlementOpeningUsageConfig = Pick<
  SimulationConfig,
  'disturbanceSettlementOpeningTicks' | 'disturbanceSettlementOpeningBonus'
> &
  Partial<Pick<SimulationConfig, 'disturbanceSettlementOpeningLineageAbsentOnly'>>;

type OffspringSettlementUsageConfig = SettlementScoringConfig & DisturbanceSettlementOpeningUsageConfig;

type OffspringSettlementLineageOccupancyConfig = Pick<
  SimulationConfig,
  'lineageOffspringSettlementCrowdingPenalty' | 'newCladeSettlementCrowdingGraceTicks'
> &
  DisturbanceSettlementOpeningUsageConfig;

type EncounterLineageTransferConfig = Pick<SimulationConfig, 'lineageEncounterRestraint'> & NewCladeGraceConfig;

type LocalEcologyConfig = Pick<SimulationConfig, 'dispersalPressure' | 'newCladeSettlementCrowdingGraceTicks'>;

type SettlementContextAgent = Pick<Agent, 'energy' | 'lineage' | 'x' | 'y'>;

export interface CladeAgeState {
  firstSeenTick: number;
}

interface ResolveNewCladeSettlementCrowdingReliefOptions {
  config: Pick<SimulationConfig, 'newCladeSettlementCrowdingGraceTicks'>;
  tickCount: number;
  lineage: number;
  cladeHistory: ReadonlyMap<number, CladeAgeState>;
}

interface ResolveNewCladeEncounterRestraintGraceBoostOptions {
  config: NewCladeGraceConfig;
  tickCount: number;
  lineage: number;
  cladeHistory: ReadonlyMap<number, CladeAgeState>;
}

interface ResolveEncounterLineageTransferMultiplierOptions {
  config: EncounterLineageTransferConfig;
  tickCount: number;
  dominantLineage: number;
  targetLineage: number;
  cladeHistory: ReadonlyMap<number, CladeAgeState>;
}

interface ResolveOffspringSettlementContextOptions {
  config: Pick<SimulationConfig, 'lineageOffspringSettlementCrowdingPenalty'>;
  agents: SettlementContextAgent[];
  occupancy?: number[][];
  lineageOccupancy?: LineageOccupancyGrid;
  required?: boolean;
  usesLineageOccupancy: boolean;
  buildOccupancyGrid: (agents: Array<Pick<SettlementContextAgent, 'x' | 'y'>>) => number[][];
  buildLineageOccupancyGrid: (
    agents: Array<Pick<SettlementContextAgent, 'lineage' | 'x' | 'y'>>
  ) => LineageOccupancyGrid;
}

interface ResolveSettlementEcologyScoreOptions {
  config: LocalEcologyConfig;
  tickCount: number;
  cladeHistory: ReadonlyMap<number, CladeAgeState>;
  agent: SettlementAgent;
  x: number;
  y: number;
  occupancy: number[][];
  lineageOccupancy: LineageOccupancyGrid | undefined;
  lineagePenalty: number;
  excludedPosition: SettlementPosition | undefined;
  jitter: number;
  resourceAt: (x: number, y: number) => number;
  habitatMatchEfficiencyAt: (agent: SettlementAgent, x: number, y: number) => number;
  neighborhoodCrowdingAt: (x: number, y: number, occupancy: number[][]) => number;
  sameLineageNeighborhoodCrowdingAt: (
    lineage: number,
    x: number,
    y: number,
    lineageOccupancy: LineageOccupancyGrid,
    excludedPosition: SettlementPosition | undefined
  ) => number;
}

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

interface ShouldFoundNewCladeOptions {
  config: CladogenesisConfig;
  parentLineage: number;
  diverged: boolean;
  childGenome: Genome;
  settlementAgent: SettlementAgent;
  childPos: SettlementPosition;
  settlementContext: OffspringSettlementContext | undefined;
  genomeDistance: (a: Genome, b: Genome) => number;
  getCladeFounderGenome: (lineage: number) => Genome;
  getSpeciesHabitatPreference: (species: number) => number;
  getCladeHabitatPreference: (lineage: number) => number;
  getSpeciesTrophicLevel: (species: number) => number;
  getCladeTrophicLevel: (lineage: number) => number;
  getSpeciesDefenseLevel: (species: number) => number;
  getCladeDefenseLevel: (lineage: number) => number;
  resolveSettlementContext: () => OffspringSettlementContext | undefined;
  localEcologyScore: LocalEcologyScore;
}

export function usesNewCladeSettlementGrace(
  config: Pick<SimulationConfig, 'newCladeSettlementCrowdingGraceTicks'>
): boolean {
  return Math.max(0, config.newCladeSettlementCrowdingGraceTicks) > 0;
}

export function usesOffspringSettlementScoring(config: SettlementScoringConfig): boolean {
  return (
    config.offspringSettlementEcologyScoring ||
    config.lineageOffspringSettlementCrowdingPenalty > 0 ||
    usesNewCladeSettlementGrace(config)
  );
}

export function usesOffspringSettlementContext(config: OffspringSettlementUsageConfig): boolean {
  return usesOffspringSettlementScoring(config) || usesDisturbanceSettlementOpeningLineageAbsence(config);
}

export function usesOffspringSettlementLineageOccupancy(
  config: OffspringSettlementLineageOccupancyConfig
): boolean {
  return (
    Math.max(0, config.lineageOffspringSettlementCrowdingPenalty) > 0 ||
    usesNewCladeSettlementGrace(config) ||
    usesDisturbanceSettlementOpeningLineageAbsence(config)
  );
}

export function usesCladogenesisEcologyGate(
  config: Pick<SimulationConfig, 'cladogenesisEcologyAdvantageThreshold'>
): boolean {
  return (
    Number.isFinite(config.cladogenesisEcologyAdvantageThreshold) &&
    config.cladogenesisEcologyAdvantageThreshold >= 0
  );
}

export function resolveNewCladeSettlementCrowdingRelief({
  config,
  tickCount,
  lineage,
  cladeHistory
}: ResolveNewCladeSettlementCrowdingReliefOptions): number {
  const graceTicks = Math.max(0, config.newCladeSettlementCrowdingGraceTicks);
  if (graceTicks <= 0) {
    return 0;
  }

  const state = cladeHistory.get(lineage);
  if (!state || state.firstSeenTick <= 0) {
    return 0;
  }

  const age = Math.max(0, tickCount - state.firstSeenTick);
  return clamp((graceTicks - age) / graceTicks, 0, 1);
}

export function resolveNewCladeEncounterRestraintGraceBoost({
  config,
  tickCount,
  lineage,
  cladeHistory
}: ResolveNewCladeEncounterRestraintGraceBoostOptions): number {
  const boost = Math.max(0, config.newCladeEncounterRestraintGraceBoost);
  if (boost <= 0) {
    return 0;
  }

  return (
    boost *
    resolveNewCladeSettlementCrowdingRelief({
      config,
      tickCount,
      lineage,
      cladeHistory
    })
  );
}

export function resolveEncounterLineageTransferMultiplier({
  config,
  tickCount,
  dominantLineage,
  targetLineage,
  cladeHistory
}: ResolveEncounterLineageTransferMultiplierOptions): number {
  if (dominantLineage !== targetLineage) {
    return 1;
  }

  const restraint =
    Math.max(0, config.lineageEncounterRestraint) +
    resolveNewCladeEncounterRestraintGraceBoost({
      config,
      tickCount,
      lineage: dominantLineage,
      cladeHistory
    });
  if (restraint === 0) {
    return 1;
  }

  return 1 / (1 + restraint);
}

export function resolveOffspringSettlementContext({
  config,
  agents,
  occupancy,
  lineageOccupancy,
  required = true,
  usesLineageOccupancy,
  buildOccupancyGrid,
  buildLineageOccupancyGrid
}: ResolveOffspringSettlementContextOptions): OffspringSettlementContext | undefined {
  if (!required) {
    return undefined;
  }

  const aliveAgents = agents.filter((agent) => agent.energy > 0);
  return {
    occupancy: occupancy ?? buildOccupancyGrid(aliveAgents),
    lineageOccupancy:
      lineageOccupancy ?? (usesLineageOccupancy ? buildLineageOccupancyGrid(aliveAgents) : undefined),
    lineagePenalty: Math.max(0, config.lineageOffspringSettlementCrowdingPenalty)
  };
}

export function resolveSettlementEcologyScore({
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
  resourceAt,
  habitatMatchEfficiencyAt,
  neighborhoodCrowdingAt,
  sameLineageNeighborhoodCrowdingAt
}: ResolveSettlementEcologyScoreOptions): number {
  const food = resourceAt(x, y) * habitatMatchEfficiencyAt(agent, x, y);
  const crowding = neighborhoodCrowdingAt(x, y, occupancy);
  const establishmentRelief =
    lineageOccupancy === undefined
      ? 0
      : resolveNewCladeSettlementCrowdingRelief({
          config,
          tickCount,
          lineage: agent.lineage,
          cladeHistory
        });
  const lineageCrowding =
    lineagePenalty > 0 && lineageOccupancy
      ? sameLineageNeighborhoodCrowdingAt(agent.lineage, x, y, lineageOccupancy, excludedPosition)
      : 0;
  const effectiveCrowding = Math.max(0, crowding * (1 - establishmentRelief));
  const effectiveLineagePenalty = Math.max(0, lineagePenalty * (1 - establishmentRelief));

  return (
    food -
    config.dispersalPressure * effectiveCrowding -
    effectiveLineagePenalty * lineageCrowding +
    jitter
  );
}

export function shouldFoundNewClade({
  config,
  parentLineage,
  diverged,
  childGenome,
  settlementAgent,
  childPos,
  settlementContext,
  genomeDistance,
  getCladeFounderGenome,
  getSpeciesHabitatPreference,
  getCladeHabitatPreference,
  getSpeciesTrophicLevel,
  getCladeTrophicLevel,
  getSpeciesDefenseLevel,
  getCladeDefenseLevel,
  resolveSettlementContext,
  localEcologyScore
}: ShouldFoundNewCladeOptions): boolean {
  return shouldFoundClade({
    diverged,
    threshold: config.cladogenesisThreshold,
    childGenome,
    founderGenome: getCladeFounderGenome(parentLineage),
    genomeDistance,
    passesTraitNoveltyGate: () =>
      passesCladogenesisTraitNoveltyGate({
        threshold: config.cladogenesisTraitNoveltyThreshold,
        speciesHabitatPreference: getSpeciesHabitatPreference(settlementAgent.species),
        cladeHabitatPreference: getCladeHabitatPreference(parentLineage),
        speciesTrophicLevel: getSpeciesTrophicLevel(settlementAgent.species),
        cladeTrophicLevel: getCladeTrophicLevel(parentLineage),
        speciesDefenseLevel: getSpeciesDefenseLevel(settlementAgent.species),
        cladeDefenseLevel: getCladeDefenseLevel(parentLineage)
      }),
    passesEcologyGate: () =>
      passesCladogenesisEcologyGate({
        threshold: config.cladogenesisEcologyAdvantageThreshold,
        settlementAgent,
        childPos,
        settlementContext,
        resolveSettlementContext,
        localEcologyScore
      })
  });
}

function usesDisturbanceSettlementOpeningLineageAbsence(config: DisturbanceSettlementOpeningUsageConfig): boolean {
  const opening = resolveDisturbanceSettlementOpeningConfig(config);
  return opening.enabled && opening.lineageAbsentOnly;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
