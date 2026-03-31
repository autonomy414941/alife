import {
  collectFounderContextSamples,
  exportTaxonHistory,
  FounderContextSamples,
  seedTaxonHistory,
  TaxonHistoryState,
  updateTaxonHistory
} from './simulation-history';
import {
  Agent,
  DescentEdge,
  DurationStats,
  EvolutionHistorySnapshot,
  SpeciesTurnoverAnalytics,
  TaxonTurnoverAnalytics,
  TurnoverWindow
} from './types';

type FounderContextAgent = Pick<Agent, 'lineage' | 'species' | 'x' | 'y'>;
type DeadHistoryAgent = FounderContextAgent & Pick<Agent, 'id' | 'age'>;
type LiveHistoryAgent = FounderContextAgent & Pick<Agent, 'id'>;

interface HistorySamplingContext {
  tick: number;
  occupancy: number[][];
  effectiveBiomeFertilityAt: (x: number, y: number, tick: number) => number;
  neighborhoodCrowdingAt: (x: number, y: number, occupancy: number[][]) => number;
}

interface HistoryStepInput extends Partial<HistorySamplingContext> {
  tick: number;
  agents: ReadonlyArray<LiveHistoryAgent>;
  offspring: ReadonlyArray<LiveHistoryAgent>;
  deadAgents: ReadonlyArray<DeadHistoryAgent>;
  birthsByParentId?: ReadonlyMap<number, number>;
  descentEdges?: ReadonlyArray<DescentEdge>;
  founderOccupancy?: number[][];
}

const MAX_DESCENT_EDGES = 2048;

export interface SimulationEvolutionHistoryState {
  cladeHistory: TaxonHistoryState[];
  speciesHistory: TaxonHistoryState[];
  descentEdges: DescentEdge[];
  extinctClades: number;
  extinctSpecies: number;
}

export class SimulationEvolutionHistory {
  private readonly cladeHistory = new Map<number, TaxonHistoryState>();

  private readonly speciesHistory = new Map<number, TaxonHistoryState>();

  private readonly descentEdges: DescentEdge[] = [];

  private readonly descentEdgeByOffspringId = new Map<number, DescentEdge>();

  private extinctClades = 0;

  private extinctSpecies = 0;

  initialize(agents: ReadonlyArray<FounderContextAgent>, context: HistorySamplingContext): void {
    seedHistoryForTaxon(this.cladeHistory, agents, (agent) => agent.lineage, context);
    seedHistoryForTaxon(this.speciesHistory, agents, (agent) => agent.species, context);
  }

  recordStep(input: HistoryStepInput): { cladeExtinctionDelta: number; speciesExtinctionDelta: number } {
    this.recordDescentEdges(input.descentEdges ?? []);
    this.recordDescendantBirths(input.birthsByParentId);
    this.recordDescendantDeaths(input.deadAgents, input.tick);

    const cladeExtinctionDelta = updateTaxonHistory(
      this.cladeHistory,
      input.tick,
      countTaxa(input.agents, (agent) => agent.lineage),
      countTaxa(input.offspring, (agent) => agent.lineage),
      countTaxa(input.deadAgents, (agent) => agent.lineage),
      collectSamplesForTaxon(
        input.offspring,
        (agent) => agent.lineage,
        input.tick,
        input.founderOccupancy,
        input.effectiveBiomeFertilityAt,
        input.neighborhoodCrowdingAt
      )
    );
    const speciesExtinctionDelta = updateTaxonHistory(
      this.speciesHistory,
      input.tick,
      countTaxa(input.agents, (agent) => agent.species),
      countTaxa(input.offspring, (agent) => agent.species),
      countTaxa(input.deadAgents, (agent) => agent.species),
      collectSamplesForTaxon(
        input.offspring,
        (agent) => agent.species,
        input.tick,
        input.founderOccupancy,
        input.effectiveBiomeFertilityAt,
        input.neighborhoodCrowdingAt
      )
    );

    this.extinctClades += cladeExtinctionDelta;
    this.extinctSpecies += speciesExtinctionDelta;

    return { cladeExtinctionDelta, speciesExtinctionDelta };
  }

  snapshot(): EvolutionHistorySnapshot {
    return {
      clades: exportTaxonHistory(this.cladeHistory),
      species: exportTaxonHistory(this.speciesHistory),
      extinctClades: this.extinctClades,
      extinctSpecies: this.extinctSpecies,
      descentEdges: this.descentEdges.map((edge) => ({
        ...edge,
        phenotypeDelta: edge.phenotypeDelta.map((entry) => ({ ...entry })),
        reproduction: { ...edge.reproduction },
        settlement: { ...edge.settlement }
      }))
    };
  }

  buildSpeciesTurnover(window: TurnoverWindow, currentTick: number): SpeciesTurnoverAnalytics {
    const turnover = buildTurnoverAnalytics(this.speciesHistory, window, currentTick);
    return {
      speciationsInWindow: turnover.originationsInWindow,
      extinctionsInWindow: turnover.extinctionsInWindow,
      speciationRate: turnover.originationRate,
      extinctionRate: turnover.extinctionRate,
      turnoverRate: turnover.turnoverRate,
      netDiversificationRate: turnover.netDiversificationRate,
      extinctLifespan: turnover.extinctLifespan,
      activeAge: turnover.activeAge
    };
  }

  buildCladeTurnover(window: TurnoverWindow, currentTick: number): TaxonTurnoverAnalytics {
    return buildTurnoverAnalytics(this.cladeHistory, window, currentTick);
  }

  getCladeHistory(): Map<number, TaxonHistoryState> {
    return this.cladeHistory;
  }

  getSpeciesHistory(): Map<number, TaxonHistoryState> {
    return this.speciesHistory;
  }

  getExtinctClades(): number {
    return this.extinctClades;
  }

  getExtinctSpecies(): number {
    return this.extinctSpecies;
  }

  snapshotState(): SimulationEvolutionHistoryState {
    return {
      cladeHistory: cloneTaxonHistoryStateEntries(this.cladeHistory),
      speciesHistory: cloneTaxonHistoryStateEntries(this.speciesHistory),
      descentEdges: this.descentEdges.map((edge) => cloneDescentEdge(edge)),
      extinctClades: this.extinctClades,
      extinctSpecies: this.extinctSpecies
    };
  }

  restoreState(state: SimulationEvolutionHistoryState): void {
    this.cladeHistory.clear();
    for (const entry of state.cladeHistory) {
      this.cladeHistory.set(entry.id, cloneTaxonHistoryState(entry));
    }

    this.speciesHistory.clear();
    for (const entry of state.speciesHistory) {
      this.speciesHistory.set(entry.id, cloneTaxonHistoryState(entry));
    }

    this.descentEdges.length = 0;
    this.descentEdgeByOffspringId.clear();
    for (const edge of state.descentEdges) {
      const copy = cloneDescentEdge(edge);
      this.descentEdges.push(copy);
      this.descentEdgeByOffspringId.set(copy.offspringId, copy);
    }

    this.extinctClades = state.extinctClades;
    this.extinctSpecies = state.extinctSpecies;
  }

  private recordDescentEdges(edges: ReadonlyArray<DescentEdge>): void {
    for (const edge of edges) {
      const copy: DescentEdge = {
        ...edge,
        phenotypeDelta: edge.phenotypeDelta.map((entry) => ({ ...entry })),
        reproduction: { ...edge.reproduction },
        settlement: { ...edge.settlement }
      };
      this.descentEdges.push(copy);
      this.descentEdgeByOffspringId.set(copy.offspringId, copy);
      while (this.descentEdges.length > MAX_DESCENT_EDGES) {
        const removed = this.descentEdges.shift();
        if (removed) {
          this.descentEdgeByOffspringId.delete(removed.offspringId);
        }
      }
    }
  }

  private recordDescendantBirths(birthsByParentId: ReadonlyMap<number, number> | undefined): void {
    if (!birthsByParentId) {
      return;
    }

    for (const [parentId, births] of birthsByParentId) {
      if (births <= 0) {
        continue;
      }
      const edge = this.descentEdgeByOffspringId.get(parentId);
      if (edge) {
        edge.offspringProduced += births;
      }
    }
  }

  private recordDescendantDeaths(deadAgents: ReadonlyArray<DeadHistoryAgent>, tick: number): void {
    for (const agent of deadAgents) {
      const edge = this.descentEdgeByOffspringId.get(agent.id);
      if (!edge || edge.offspringDeathTick !== null) {
        continue;
      }
      edge.offspringDeathTick = tick;
      edge.offspringAgeAtDeath = agent.age;
    }
  }
}

function seedHistoryForTaxon(
  history: Map<number, TaxonHistoryState>,
  agents: ReadonlyArray<FounderContextAgent>,
  idOf: (agent: FounderContextAgent) => number,
  context: HistorySamplingContext
): void {
  seedTaxonHistory(
    history,
    collectFounderContextSamples(
      agents,
      idOf,
      context.tick,
      context.occupancy,
      context.effectiveBiomeFertilityAt,
      context.neighborhoodCrowdingAt
    ),
    context.tick
  );
}

function collectSamplesForTaxon(
  agents: ReadonlyArray<FounderContextAgent>,
  idOf: (agent: FounderContextAgent) => number,
  tick: number,
  occupancy: number[][] | undefined,
  effectiveBiomeFertilityAt:
    | ((x: number, y: number, tick: number) => number)
    | undefined,
  neighborhoodCrowdingAt:
    | ((x: number, y: number, occupancy: number[][]) => number)
    | undefined
): Map<number, FounderContextSamples> {
  if (
    occupancy === undefined ||
    effectiveBiomeFertilityAt === undefined ||
    neighborhoodCrowdingAt === undefined ||
    agents.length === 0
  ) {
    return new Map<number, FounderContextSamples>();
  }

  return collectFounderContextSamples(
    agents,
    idOf,
    tick,
    occupancy,
    effectiveBiomeFertilityAt,
    neighborhoodCrowdingAt
  );
}

function countTaxa(
  agents: ReadonlyArray<FounderContextAgent>,
  idOf: (agent: FounderContextAgent) => number
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const agent of agents) {
    const id = idOf(agent);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function cloneTaxonHistoryStateEntries(history: Map<number, TaxonHistoryState>): TaxonHistoryState[] {
  return [...history.values()]
    .sort((left, right) => left.id - right.id)
    .map((entry) => cloneTaxonHistoryState(entry));
}

function cloneTaxonHistoryState(entry: TaxonHistoryState): TaxonHistoryState {
  return {
    ...entry,
    timeline: entry.timeline.map((point) => ({ ...point }))
  };
}

function cloneDescentEdge(edge: DescentEdge): DescentEdge {
  return {
    ...edge,
    phenotypeDelta: edge.phenotypeDelta.map((entry) => ({ ...entry })),
    reproduction: { ...edge.reproduction },
    settlement: { ...edge.settlement }
  };
}

function buildTurnoverAnalytics(
  history: Map<number, TaxonHistoryState>,
  window: TurnoverWindow,
  currentTick: number
): TaxonTurnoverAnalytics {
  const originationsInWindow = countOriginationsInWindow(history, window);
  const extinctionsInWindow = countExtinctionsInWindow(history, window);
  const denominator = window.size;
  return {
    originationsInWindow,
    extinctionsInWindow,
    originationRate: denominator === 0 ? 0 : originationsInWindow / denominator,
    extinctionRate: denominator === 0 ? 0 : extinctionsInWindow / denominator,
    turnoverRate: denominator === 0 ? 0 : (originationsInWindow + extinctionsInWindow) / denominator,
    netDiversificationRate: denominator === 0 ? 0 : (originationsInWindow - extinctionsInWindow) / denominator,
    extinctLifespan: summarizeDurations(extinctDurations(history)),
    activeAge: summarizeDurations(activeDurations(history, currentTick))
  };
}

export function countOriginationsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
  let count = 0;
  for (const state of history.values()) {
    if (state.firstSeenTick > 0 && state.firstSeenTick >= window.startTick && state.firstSeenTick <= window.endTick) {
      count += 1;
    }
  }
  return count;
}

export function countExtinctionsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
  let count = 0;
  for (const state of history.values()) {
    if (state.extinctTick !== null && state.extinctTick >= window.startTick && state.extinctTick <= window.endTick) {
      count += 1;
    }
  }
  return count;
}

function extinctDurations(history: Map<number, TaxonHistoryState>): number[] {
  const values: number[] = [];
  for (const state of history.values()) {
    if (state.extinctTick !== null) {
      values.push(state.extinctTick - state.firstSeenTick);
    }
  }
  return values;
}

function activeDurations(history: Map<number, TaxonHistoryState>, currentTick: number): number[] {
  const values: number[] = [];
  for (const state of history.values()) {
    if (state.extinctTick === null) {
      values.push(currentTick - state.firstSeenTick);
    }
  }
  return values;
}

function summarizeDurations(values: number[]): DurationStats {
  if (values.length === 0) {
    return { count: 0, mean: 0, max: 0 };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    mean: total / values.length,
    max: Math.max(...values)
  };
}
