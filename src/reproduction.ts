import { Agent, Genome } from './types';

export type LineageOccupancyGrid = Map<number, number[][]>;

export type SettlementAgent = Pick<Agent, 'genome' | 'lineage' | 'species' | 'x' | 'y'>;

export interface SettlementPosition {
  x: number;
  y: number;
}

export interface OffspringSettlementContext {
  occupancy: number[][];
  lineageOccupancy: LineageOccupancyGrid | undefined;
  lineagePenalty: number;
}

interface PickSettlementSiteOptions {
  parent: SettlementAgent;
  settlementContext: OffspringSettlementContext | undefined;
  useSettlementEcologyScore: boolean;
  useDisturbanceOpeningBonus: boolean;
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

interface DisturbanceSettlementOpeningBonusOptions {
  enabled: boolean;
  openUntilTick: number;
  currentStepTick: number;
  openingTicks: number;
  openingBonus: number;
}

interface CladogenesisTraitNoveltyGateOptions {
  threshold: number;
  speciesHabitatPreference: number;
  cladeHabitatPreference: number;
  speciesTrophicLevel: number;
  cladeTrophicLevel: number;
  speciesDefenseLevel: number;
  cladeDefenseLevel: number;
}

interface CladogenesisEcologyGateOptions {
  threshold: number;
  settlementAgent: SettlementAgent;
  childPos: SettlementPosition;
  settlementContext: OffspringSettlementContext | undefined;
  resolveSettlementContext: () => OffspringSettlementContext | undefined;
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

interface ShouldFoundCladeOptions {
  diverged: boolean;
  threshold: number;
  childGenome: Genome;
  founderGenome: Genome;
  genomeDistance: (a: Genome, b: Genome) => number;
  passesTraitNoveltyGate: () => boolean;
  passesEcologyGate: () => boolean;
}

export function pickSettlementSite({
  parent,
  settlementContext,
  useSettlementEcologyScore,
  useDisturbanceOpeningBonus,
  currentStepTick,
  wrapX,
  wrapY,
  pickRandomNeighbor,
  randomJitter,
  localEcologyScore,
  disturbanceSettlementOpeningBonusAt
}: PickSettlementSiteOptions): SettlementPosition {
  const neighbors = [
    { x: parent.x, y: parent.y },
    { x: wrapX(parent.x + 1), y: parent.y },
    { x: wrapX(parent.x - 1), y: parent.y },
    { x: parent.x, y: wrapY(parent.y + 1) },
    { x: parent.x, y: wrapY(parent.y - 1) }
  ];

  if (!useSettlementEcologyScore && !useDisturbanceOpeningBonus) {
    return pickRandomNeighbor(neighbors);
  }

  let best = neighbors[0];
  let bestScore = -Infinity;
  for (const option of neighbors) {
    const score =
      (useSettlementEcologyScore && settlementContext
        ? localEcologyScore(
            parent,
            option.x,
            option.y,
            settlementContext.occupancy,
            settlementContext.lineageOccupancy,
            settlementContext.lineagePenalty,
            undefined,
            randomJitter()
          )
        : randomJitter()) + disturbanceSettlementOpeningBonusAt(option.x, option.y, currentStepTick);
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }

  return best;
}

export function resolveDisturbanceSettlementOpeningBonus({
  enabled,
  openUntilTick,
  currentStepTick,
  openingTicks,
  openingBonus
}: DisturbanceSettlementOpeningBonusOptions): number {
  if (!enabled || openingTicks <= 0 || openingBonus <= 0 || openUntilTick < currentStepTick) {
    return 0;
  }

  const freshnessFraction = Math.min(1, Math.max(0, (openUntilTick - currentStepTick + 1) / openingTicks));
  return openingBonus * freshnessFraction;
}

export function passesCladogenesisTraitNoveltyGate({
  threshold,
  speciesHabitatPreference,
  cladeHabitatPreference,
  speciesTrophicLevel,
  cladeTrophicLevel,
  speciesDefenseLevel,
  cladeDefenseLevel
}: CladogenesisTraitNoveltyGateOptions): boolean {
  if (!Number.isFinite(threshold) || threshold < 0) {
    return true;
  }

  const habitatDifference = Math.abs(speciesHabitatPreference - cladeHabitatPreference) / 1.9;
  const trophicDifference = Math.abs(speciesTrophicLevel - cladeTrophicLevel);
  const defenseDifference = Math.abs(speciesDefenseLevel - cladeDefenseLevel);
  const compositeDifference = (habitatDifference + trophicDifference + defenseDifference) / 3;

  return compositeDifference >= threshold;
}

export function passesCladogenesisEcologyGate({
  threshold,
  settlementAgent,
  childPos,
  settlementContext,
  resolveSettlementContext,
  localEcologyScore
}: CladogenesisEcologyGateOptions): boolean {
  if (!Number.isFinite(threshold) || threshold < 0) {
    return true;
  }

  const effectiveSettlementContext = settlementContext ?? resolveSettlementContext();
  if (!effectiveSettlementContext) {
    return true;
  }

  const parentScore = localEcologyScore(
    settlementAgent,
    settlementAgent.x,
    settlementAgent.y,
    effectiveSettlementContext.occupancy,
    effectiveSettlementContext.lineageOccupancy,
    effectiveSettlementContext.lineagePenalty,
    undefined,
    0
  );
  const childScore = localEcologyScore(
    settlementAgent,
    childPos.x,
    childPos.y,
    effectiveSettlementContext.occupancy,
    effectiveSettlementContext.lineageOccupancy,
    effectiveSettlementContext.lineagePenalty,
    undefined,
    0
  );

  return childScore - parentScore >= threshold;
}

export function shouldFoundClade({
  diverged,
  threshold,
  childGenome,
  founderGenome,
  genomeDistance,
  passesTraitNoveltyGate,
  passesEcologyGate
}: ShouldFoundCladeOptions): boolean {
  if (!diverged || !Number.isFinite(threshold) || threshold < 0) {
    return false;
  }

  if (genomeDistance(founderGenome, childGenome) < threshold) {
    return false;
  }

  if (!passesTraitNoveltyGate()) {
    return false;
  }

  return passesEcologyGate();
}
