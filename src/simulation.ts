import { Rng } from './rng';
import {
  Agent,
  AgentSeed,
  DurationStats,
  EvolutionAnalyticsSnapshot,
  EvolutionHistorySnapshot,
  Genome,
  LocalityRadiusAnalytics,
  LocalityRadiusTurnoverAnalytics,
  LocalityStateAnalytics,
  LocalityTurnoverAnalytics,
  SimulationConfig,
  SimulationRunSeries,
  SimulationSnapshot,
  SpeciesTurnoverAnalytics,
  StepSummary,
  TaxonTurnoverAnalytics,
  TaxonHistory,
  TaxonTimelinePoint,
  TurnoverWindow
} from './types';

const DEFAULT_CONFIG: SimulationConfig = {
  width: 20,
  height: 20,
  maxResource: 8,
  resourceRegen: 0.6,
  biomeBands: 4,
  biomeContrast: 0.45,
  decompositionBase: 0.6,
  decompositionEnergyFraction: 0.25,
  initialAgents: 24,
  initialEnergy: 12,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  dispersalPressure: 0.8,
  dispersalRadius: 1,
  localityRadius: 2,
  habitatPreferenceStrength: 1.4,
  habitatPreferenceMutation: 0.2,
  specializationMetabolicCost: 0.08,
  harvestCap: 2.5,
  reproduceThreshold: 20,
  reproduceProbability: 0.35,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  speciationThreshold: 0.25,
  maxAge: 120
};

const MIN_GENOME: Genome = {
  metabolism: 0.3,
  harvest: 0.4,
  aggression: 0
};

const MAX_GENOME: Genome = {
  metabolism: 2.2,
  harvest: 2.8,
  aggression: 1
};

export interface LifeSimulationOptions {
  seed?: number;
  config?: Partial<SimulationConfig>;
  initialAgents?: AgentSeed[];
}

interface TaxonHistoryState {
  id: number;
  firstSeenTick: number;
  extinctTick: number | null;
  totalBirths: number;
  totalDeaths: number;
  peakPopulation: number;
  lastPopulation: number;
  timeline: TaxonTimelinePoint[];
}

interface LocalityFrame {
  dominantSpeciesByCell: number[];
  dominanceSharesByOccupiedCell: number[];
  speciesRichnessByOccupiedCell: number[];
  neighborhoodDominantSpeciesByCell: number[];
  neighborhoodDominanceSharesByOccupiedCell: number[];
  neighborhoodSpeciesRichnessByOccupiedCell: number[];
  neighborhoodCenterDominantAlignmentByOccupiedCell: number[];
  occupiedCells: number;
}

export class LifeSimulation {
  private readonly rng: Rng;

  private readonly config: SimulationConfig;

  private readonly biomeFertility: number[][];

  private resources: number[][];

  private agents: Agent[];

  private tickCount = 0;

  private nextAgentId = 1;

  private nextSpeciesId = 1;

  private readonly cladeHistory = new Map<number, TaxonHistoryState>();

  private readonly speciesHistory = new Map<number, TaxonHistoryState>();

  private readonly speciesHabitatPreference = new Map<number, number>();

  private readonly localityFrames: LocalityFrame[] = [];

  private extinctClades = 0;

  private extinctSpecies = 0;

  constructor(options: LifeSimulationOptions = {}) {
    this.config = { ...DEFAULT_CONFIG, ...(options.config ?? {}) };
    this.rng = new Rng(options.seed ?? 1);
    this.biomeFertility = this.buildBiomeFertility();
    this.resources = this.buildInitialResources();
    this.agents = options.initialAgents
      ? options.initialAgents.map((seed, index) => this.createAgentFromSeed(seed, index + 1, index + 1))
      : this.spawnInitialPopulation();
    if (this.agents.length > 0) {
      this.nextAgentId = Math.max(...this.agents.map((agent) => agent.id)) + 1;
      this.nextSpeciesId = Math.max(...this.agents.map((agent) => agent.species)) + 1;
    }
    this.initializeSpeciesHabitatPreferences();
    this.initializeEvolutionHistory();
    this.recordLocalityFrame(0);
  }

  step(): StepSummary {
    const beforeCount = this.agents.length;

    this.regenerateResources();

    const occupancy = this.buildOccupancyGrid();
    const turnOrder = this.rng.shuffle([...this.agents]);
    for (const agent of turnOrder) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      this.processAgentTurn(agent, occupancy);
    }

    this.resolveEncounters();

    const offspring: Agent[] = [];
    for (const agent of [...this.agents]) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      if (agent.energy >= this.config.reproduceThreshold && this.rng.float() < this.config.reproduceProbability) {
        const child = this.reproduce(agent);
        offspring.push(child);
      }
    }
    const births = offspring.length;
    this.agents.push(...offspring);

    const survivors: Agent[] = [];
    const deadAgents: Agent[] = [];
    for (const agent of this.agents) {
      if (agent.energy > 0 && agent.age <= this.config.maxAge) {
        survivors.push(agent);
      } else {
        deadAgents.push(agent);
      }
    }
    this.recycleDeadAgents(deadAgents);
    this.agents = survivors;

    const afterCount = this.agents.length;
    const meanEnergy = this.meanEnergy();
    const meanGenome = this.meanGenome();
    const diversity = this.diversityMetrics();
    this.tickCount += 1;
    const cladeExtinctionDelta = this.updateTaxonHistory(
      this.cladeHistory,
      this.tickCount,
      this.countBy(this.agents, (agent) => agent.lineage),
      this.countBy(offspring, (agent) => agent.lineage),
      this.countBy(deadAgents, (agent) => agent.lineage)
    );
    const speciesExtinctionDelta = this.updateTaxonHistory(
      this.speciesHistory,
      this.tickCount,
      this.countBy(this.agents, (agent) => agent.species),
      this.countBy(offspring, (agent) => agent.species),
      this.countBy(deadAgents, (agent) => agent.species)
    );
    this.extinctClades += cladeExtinctionDelta;
    this.extinctSpecies += speciesExtinctionDelta;
    this.recordLocalityFrame(this.tickCount);

    return {
      tick: this.tickCount,
      population: afterCount,
      births,
      deaths: beforeCount + births - afterCount,
      meanEnergy,
      meanGenome,
      activeClades: diversity.activeClades,
      activeSpecies: diversity.activeSpecies,
      dominantSpeciesShare: diversity.dominantSpeciesShare,
      selectionDifferential: this.selectionDifferential(meanGenome),
      cladeExtinctions: Math.max(0, cladeExtinctionDelta),
      speciesExtinctions: Math.max(0, speciesExtinctionDelta),
      cumulativeExtinctClades: this.extinctClades,
      cumulativeExtinctSpecies: this.extinctSpecies
    };
  }

  run(steps: number): StepSummary[] {
    const summaries: StepSummary[] = [];
    for (let i = 0; i < steps; i += 1) {
      summaries.push(this.step());
    }
    return summaries;
  }

  runWithAnalytics(steps: number, windowSize = 25, stopWhenExtinct = false): SimulationRunSeries {
    const summaries: StepSummary[] = [];
    const analytics: EvolutionAnalyticsSnapshot[] = [];
    for (let i = 0; i < steps; i += 1) {
      const summary = this.step();
      summaries.push(summary);
      analytics.push(this.analytics(windowSize));
      if (stopWhenExtinct && summary.population === 0) {
        break;
      }
    }
    return { summaries, analytics };
  }

  snapshot(): SimulationSnapshot {
    const diversity = this.diversityMetrics();
    return {
      tick: this.tickCount,
      population: this.agents.length,
      meanEnergy: this.meanEnergy(),
      activeClades: diversity.activeClades,
      activeSpecies: diversity.activeSpecies,
      dominantSpeciesShare: diversity.dominantSpeciesShare,
      extinctClades: this.extinctClades,
      extinctSpecies: this.extinctSpecies,
      agents: this.agents.map((agent) => ({
        ...agent,
        genome: { ...agent.genome }
      }))
    };
  }

  history(): EvolutionHistorySnapshot {
    return {
      clades: this.exportTaxonHistory(this.cladeHistory),
      species: this.exportTaxonHistory(this.speciesHistory),
      extinctClades: this.extinctClades,
      extinctSpecies: this.extinctSpecies
    };
  }

  analytics(windowSize = 25): EvolutionAnalyticsSnapshot {
    const window = this.buildTurnoverWindow(windowSize);
    return {
      tick: this.tickCount,
      window,
      species: this.buildSpeciesTurnover(window),
      clades: this.buildTaxonTurnover(this.cladeHistory, window),
      locality: this.buildLocalityState(),
      localityTurnover: this.buildLocalityTurnover(window),
      localityRadius: this.buildLocalityRadiusState(),
      localityRadiusTurnover: this.buildLocalityRadiusTurnover(window)
    };
  }

  setResource(x: number, y: number, value: number): void {
    this.resources[this.wrapY(y)][this.wrapX(x)] = clamp(value, 0, this.config.maxResource);
  }

  getResource(x: number, y: number): number {
    return this.resources[this.wrapY(y)][this.wrapX(x)];
  }

  getBiomeFertility(x: number, y: number): number {
    return this.biomeFertility[this.wrapY(y)][this.wrapX(x)];
  }

  private latestLocalityFrame(): LocalityFrame {
    const frame = this.localityFrames[this.tickCount];
    if (!frame) {
      throw new Error(`Missing locality frame for tick ${this.tickCount}`);
    }
    return frame;
  }

  private buildLocalityState(): LocalityStateAnalytics {
    const frame = this.latestLocalityFrame();
    const totalCells = this.config.width * this.config.height;
    return {
      occupiedCells: frame.occupiedCells,
      occupiedCellFraction: totalCells === 0 ? 0 : frame.occupiedCells / totalCells,
      meanDominantSpeciesShare: this.mean(frame.dominanceSharesByOccupiedCell),
      dominantSpeciesShareStdDev: this.standardDeviation(frame.dominanceSharesByOccupiedCell),
      meanSpeciesRichness: this.mean(frame.speciesRichnessByOccupiedCell)
    };
  }

  private buildLocalityTurnover(window: TurnoverWindow): LocalityTurnoverAnalytics {
    const totalCells = this.config.width * this.config.height;
    const startTick = Math.max(1, window.startTick);
    const changedFractions: number[] = [];
    const perCellChanges = Array.from({ length: totalCells }, () => 0);

    let transitions = 0;
    for (let tick = startTick; tick <= window.endTick; tick += 1) {
      const previous = this.localityFrames[tick - 1];
      const current = this.localityFrames[tick];
      if (!previous || !current) {
        continue;
      }
      transitions += 1;
      let changedCells = 0;
      for (let i = 0; i < totalCells; i += 1) {
        if (previous.dominantSpeciesByCell[i] !== current.dominantSpeciesByCell[i]) {
          changedCells += 1;
          perCellChanges[i] += 1;
        }
      }
      changedFractions.push(totalCells === 0 ? 0 : changedCells / totalCells);
    }

    if (transitions === 0) {
      return {
        transitions: 0,
        changedDominantCellFractionMean: 0,
        changedDominantCellFractionStdDev: 0,
        perCellDominantTurnoverMean: 0,
        perCellDominantTurnoverStdDev: 0,
        perCellDominantTurnoverMax: 0
      };
    }

    const perCellRates = perCellChanges.map((count) => count / transitions);
    return {
      transitions,
      changedDominantCellFractionMean: this.mean(changedFractions),
      changedDominantCellFractionStdDev: this.standardDeviation(changedFractions),
      perCellDominantTurnoverMean: this.mean(perCellRates),
      perCellDominantTurnoverStdDev: this.standardDeviation(perCellRates),
      perCellDominantTurnoverMax: Math.max(...perCellRates)
    };
  }

  private buildLocalityRadiusState(): LocalityRadiusAnalytics {
    const frame = this.latestLocalityFrame();
    const radius = this.normalizedLocalityRadius();
    return {
      radius,
      meanDominantSpeciesShare: this.mean(frame.neighborhoodDominanceSharesByOccupiedCell),
      dominantSpeciesShareStdDev: this.standardDeviation(frame.neighborhoodDominanceSharesByOccupiedCell),
      meanSpeciesRichness: this.mean(frame.neighborhoodSpeciesRichnessByOccupiedCell),
      centerDominantAlignment: this.mean(frame.neighborhoodCenterDominantAlignmentByOccupiedCell)
    };
  }

  private buildLocalityRadiusTurnover(window: TurnoverWindow): LocalityRadiusTurnoverAnalytics {
    const radius = this.normalizedLocalityRadius();
    const totalCells = this.config.width * this.config.height;
    const startTick = Math.max(1, window.startTick);
    const changedFractions: number[] = [];
    const perCellChanges = Array.from({ length: totalCells }, () => 0);

    let transitions = 0;
    for (let tick = startTick; tick <= window.endTick; tick += 1) {
      const previous = this.localityFrames[tick - 1];
      const current = this.localityFrames[tick];
      if (!previous || !current) {
        continue;
      }
      transitions += 1;
      let changedCells = 0;
      for (let i = 0; i < totalCells; i += 1) {
        if (previous.neighborhoodDominantSpeciesByCell[i] !== current.neighborhoodDominantSpeciesByCell[i]) {
          changedCells += 1;
          perCellChanges[i] += 1;
        }
      }
      changedFractions.push(totalCells === 0 ? 0 : changedCells / totalCells);
    }

    if (transitions === 0) {
      return {
        radius,
        transitions: 0,
        changedDominantCellFractionMean: 0,
        changedDominantCellFractionStdDev: 0,
        perCellDominantTurnoverMean: 0,
        perCellDominantTurnoverStdDev: 0,
        perCellDominantTurnoverMax: 0
      };
    }

    const perCellRates = perCellChanges.map((count) => count / transitions);
    return {
      radius,
      transitions,
      changedDominantCellFractionMean: this.mean(changedFractions),
      changedDominantCellFractionStdDev: this.standardDeviation(changedFractions),
      perCellDominantTurnoverMean: this.mean(perCellRates),
      perCellDominantTurnoverStdDev: this.standardDeviation(perCellRates),
      perCellDominantTurnoverMax: Math.max(...perCellRates)
    };
  }

  private recordLocalityFrame(tick: number): void {
    const width = this.config.width;
    const totalCells = width * this.config.height;
    const speciesCountsByCell = Array.from({ length: totalCells }, () => new Map<number, number>());

    for (const agent of this.agents) {
      const cellIndex = agent.y * width + agent.x;
      const counts = speciesCountsByCell[cellIndex];
      counts.set(agent.species, (counts.get(agent.species) ?? 0) + 1);
    }

    const dominantSpeciesByCell = Array.from({ length: totalCells }, () => 0);
    const dominanceSharesByOccupiedCell: number[] = [];
    const speciesRichnessByOccupiedCell: number[] = [];
    const neighborhoodDominantSpeciesByCell = Array.from({ length: totalCells }, () => 0);
    const neighborhoodDominanceSharesByOccupiedCell: number[] = [];
    const neighborhoodSpeciesRichnessByOccupiedCell: number[] = [];
    const neighborhoodCenterDominantAlignmentByOccupiedCell: number[] = [];
    let occupiedCells = 0;

    for (let i = 0; i < totalCells; i += 1) {
      const counts = speciesCountsByCell[i];
      if (counts.size === 0) {
        continue;
      }

      occupiedCells += 1;
      const cellStats = this.describeSpeciesCounts(counts);
      const dominantSpecies = cellStats.dominantSpecies;
      dominantSpeciesByCell[i] = dominantSpecies;
      dominanceSharesByOccupiedCell.push(cellStats.totalPopulation === 0 ? 0 : cellStats.dominantCount / cellStats.totalPopulation);
      speciesRichnessByOccupiedCell.push(counts.size);
    }

    const radius = this.normalizedLocalityRadius();
    for (let i = 0; i < totalCells; i += 1) {
      const centerX = i % width;
      const centerY = Math.floor(i / width);
      const neighborhoodCounts = this.collectNeighborhoodSpeciesCounts(
        centerX,
        centerY,
        radius,
        speciesCountsByCell
      );
      const neighborhoodStats = this.describeSpeciesCounts(neighborhoodCounts);
      neighborhoodDominantSpeciesByCell[i] = neighborhoodStats.dominantSpecies;

      if (speciesCountsByCell[i].size === 0) {
        continue;
      }

      neighborhoodDominanceSharesByOccupiedCell.push(
        neighborhoodStats.totalPopulation === 0 ? 0 : neighborhoodStats.dominantCount / neighborhoodStats.totalPopulation
      );
      neighborhoodSpeciesRichnessByOccupiedCell.push(neighborhoodCounts.size);
      const centerDominant = dominantSpeciesByCell[i];
      neighborhoodCenterDominantAlignmentByOccupiedCell.push(
        centerDominant !== 0 && centerDominant === neighborhoodStats.dominantSpecies ? 1 : 0
      );
    }

    this.localityFrames[tick] = {
      dominantSpeciesByCell,
      dominanceSharesByOccupiedCell,
      speciesRichnessByOccupiedCell,
      neighborhoodDominantSpeciesByCell,
      neighborhoodDominanceSharesByOccupiedCell,
      neighborhoodSpeciesRichnessByOccupiedCell,
      neighborhoodCenterDominantAlignmentByOccupiedCell,
      occupiedCells
    };
  }

  private normalizedLocalityRadius(): number {
    return Math.max(0, Math.floor(this.config.localityRadius));
  }

  private describeSpeciesCounts(counts: Map<number, number>): {
    dominantSpecies: number;
    dominantCount: number;
    totalPopulation: number;
  } {
    let dominantSpecies = 0;
    let dominantCount = 0;
    let totalPopulation = 0;
    for (const [species, count] of counts) {
      totalPopulation += count;
      if (count > dominantCount || (count === dominantCount && (dominantSpecies === 0 || species < dominantSpecies))) {
        dominantSpecies = species;
        dominantCount = count;
      }
    }
    return { dominantSpecies, dominantCount, totalPopulation };
  }

  private collectNeighborhoodSpeciesCounts(
    centerX: number,
    centerY: number,
    radius: number,
    speciesCountsByCell: Map<number, number>[]
  ): Map<number, number> {
    const width = this.config.width;
    const counts = new Map<number, number>();
    const visited = new Set<number>();

    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > radius) {
          continue;
        }
        const x = this.wrapX(centerX + dx);
        const y = this.wrapY(centerY + dy);
        const index = y * width + x;
        if (visited.has(index)) {
          continue;
        }
        visited.add(index);
        for (const [species, count] of speciesCountsByCell[index]) {
          counts.set(species, (counts.get(species) ?? 0) + count);
        }
      }
    }

    return counts;
  }

  private buildSpeciesTurnover(window: TurnoverWindow): SpeciesTurnoverAnalytics {
    const speciationsInWindow = this.countOriginationsInWindow(this.speciesHistory, window);
    const extinctionsInWindow = this.countExtinctionsInWindow(this.speciesHistory, window);
    const denominator = window.size;
    return {
      speciationsInWindow,
      extinctionsInWindow,
      speciationRate: denominator === 0 ? 0 : speciationsInWindow / denominator,
      extinctionRate: denominator === 0 ? 0 : extinctionsInWindow / denominator,
      turnoverRate: denominator === 0 ? 0 : (speciationsInWindow + extinctionsInWindow) / denominator,
      netDiversificationRate: denominator === 0 ? 0 : (speciationsInWindow - extinctionsInWindow) / denominator,
      extinctLifespan: this.summarizeDurations(this.extinctDurations(this.speciesHistory)),
      activeAge: this.summarizeDurations(this.activeDurations(this.speciesHistory))
    };
  }

  private buildTaxonTurnover(
    history: Map<number, TaxonHistoryState>,
    window: TurnoverWindow
  ): TaxonTurnoverAnalytics {
    const originationsInWindow = this.countOriginationsInWindow(history, window);
    const extinctionsInWindow = this.countExtinctionsInWindow(history, window);
    const denominator = window.size;
    return {
      originationsInWindow,
      extinctionsInWindow,
      originationRate: denominator === 0 ? 0 : originationsInWindow / denominator,
      extinctionRate: denominator === 0 ? 0 : extinctionsInWindow / denominator,
      turnoverRate: denominator === 0 ? 0 : (originationsInWindow + extinctionsInWindow) / denominator,
      netDiversificationRate: denominator === 0 ? 0 : (originationsInWindow - extinctionsInWindow) / denominator,
      extinctLifespan: this.summarizeDurations(this.extinctDurations(history)),
      activeAge: this.summarizeDurations(this.activeDurations(history))
    };
  }

  private buildTurnoverWindow(windowSize: number): TurnoverWindow {
    if (this.tickCount === 0) {
      return { startTick: 0, endTick: 0, size: 0 };
    }
    const normalized = Math.max(1, Math.floor(windowSize));
    const size = Math.min(normalized, this.tickCount);
    return {
      startTick: this.tickCount - size + 1,
      endTick: this.tickCount,
      size
    };
  }

  private countOriginationsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    let count = 0;
    for (const state of history.values()) {
      if (state.firstSeenTick > 0 && state.firstSeenTick >= window.startTick && state.firstSeenTick <= window.endTick) {
        count += 1;
      }
    }
    return count;
  }

  private countExtinctionsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    let count = 0;
    for (const state of history.values()) {
      if (state.extinctTick !== null && state.extinctTick >= window.startTick && state.extinctTick <= window.endTick) {
        count += 1;
      }
    }
    return count;
  }

  private extinctDurations(history: Map<number, TaxonHistoryState>): number[] {
    const values: number[] = [];
    for (const state of history.values()) {
      if (state.extinctTick !== null) {
        values.push(state.extinctTick - state.firstSeenTick);
      }
    }
    return values;
  }

  private activeDurations(history: Map<number, TaxonHistoryState>): number[] {
    const values: number[] = [];
    for (const state of history.values()) {
      if (state.extinctTick === null) {
        values.push(this.tickCount - state.firstSeenTick);
      }
    }
    return values;
  }

  private summarizeDurations(values: number[]): DurationStats {
    if (values.length === 0) {
      return { count: 0, mean: 0, max: 0 };
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    const max = Math.max(...values);
    return {
      count: values.length,
      mean: total / values.length,
      max
    };
  }

  private initializeEvolutionHistory(): void {
    this.seedTaxonHistory(this.cladeHistory, this.countBy(this.agents, (agent) => agent.lineage));
    this.seedTaxonHistory(this.speciesHistory, this.countBy(this.agents, (agent) => agent.species));
  }

  private initializeSpeciesHabitatPreferences(): void {
    const sums = new Map<number, { total: number; count: number }>();
    for (const agent of this.agents) {
      const fertility = this.biomeFertility[agent.y][agent.x];
      const current = sums.get(agent.species) ?? { total: 0, count: 0 };
      current.total += fertility;
      current.count += 1;
      sums.set(agent.species, current);
    }
    for (const [species, { total, count }] of sums) {
      const preference = count === 0 ? 1 : total / count;
      this.speciesHabitatPreference.set(species, clamp(preference, 0.1, 2));
    }
  }

  private seedTaxonHistory(
    history: Map<number, TaxonHistoryState>,
    counts: Map<number, number>
  ): void {
    for (const [id, population] of counts) {
      history.set(id, {
        id,
        firstSeenTick: 0,
        extinctTick: null,
        totalBirths: population,
        totalDeaths: 0,
        peakPopulation: population,
        lastPopulation: population,
        timeline: [{ tick: 0, population, births: population, deaths: 0 }]
      });
    }
  }

  private updateTaxonHistory(
    history: Map<number, TaxonHistoryState>,
    tick: number,
    populationCounts: Map<number, number>,
    birthsCounts: Map<number, number>,
    deathsCounts: Map<number, number>
  ): number {
    const idsToRecord = new Set<number>();
    for (const id of populationCounts.keys()) {
      idsToRecord.add(id);
    }
    for (const id of birthsCounts.keys()) {
      idsToRecord.add(id);
    }
    for (const id of deathsCounts.keys()) {
      idsToRecord.add(id);
    }
    for (const [id, state] of history) {
      if (state.extinctTick === null || state.lastPopulation > 0) {
        idsToRecord.add(id);
      }
    }

    let extinctionDelta = 0;

    for (const id of idsToRecord) {
      const population = populationCounts.get(id) ?? 0;
      const births = birthsCounts.get(id) ?? 0;
      const deaths = deathsCounts.get(id) ?? 0;

      let state = history.get(id);
      if (!state) {
        state = {
          id,
          firstSeenTick: tick,
          extinctTick: null,
          totalBirths: 0,
          totalDeaths: 0,
          peakPopulation: 0,
          lastPopulation: 0,
          timeline: []
        };
        history.set(id, state);
      }

      const hadPopulationBeforeStep = state.lastPopulation > 0 || births > 0;
      const wasExtinct = state.extinctTick !== null;

      state.totalBirths += births;
      state.totalDeaths += deaths;
      state.peakPopulation = Math.max(state.peakPopulation, population);

      if (wasExtinct && population > 0) {
        state.extinctTick = null;
        extinctionDelta -= 1;
      }

      if (state.extinctTick === null && hadPopulationBeforeStep && population === 0) {
        state.extinctTick = tick;
        extinctionDelta += 1;
      }

      state.timeline.push({ tick, population, births, deaths });
      state.lastPopulation = population;
    }

    return extinctionDelta;
  }

  private exportTaxonHistory(history: Map<number, TaxonHistoryState>): TaxonHistory[] {
    return [...history.values()]
      .sort((a, b) => a.id - b.id)
      .map((entry) => ({
        id: entry.id,
        firstSeenTick: entry.firstSeenTick,
        extinctTick: entry.extinctTick,
        totalBirths: entry.totalBirths,
        totalDeaths: entry.totalDeaths,
        peakPopulation: entry.peakPopulation,
        timeline: entry.timeline.map((point) => ({ ...point }))
      }));
  }

  private buildInitialResources(): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => this.rng.float() * this.config.maxResource)
    );
  }

  private buildOccupancyGrid(): number[][] {
    const occupancy = Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => 0)
    );
    for (const agent of this.agents) {
      occupancy[agent.y][agent.x] += 1;
    }
    return occupancy;
  }

  private buildBiomeFertility(): number[][] {
    const width = this.config.width;
    const height = this.config.height;
    const contrast = clamp(this.config.biomeContrast, 0, 0.95);
    const bands = Math.max(1, Math.floor(this.config.biomeBands));

    if (width < 2 || height < 2 || contrast === 0) {
      return Array.from({ length: height }, () => Array.from({ length: width }, () => 1));
    }

    return Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        const band = Math.floor((y / height) * bands);
        const latPhase = (band + 0.5) / bands;
        const lonPhase = (x + 0.5) / width;
        const latWave = Math.sin(latPhase * Math.PI * 2);
        const lonWave = Math.cos(lonPhase * Math.PI * 2);
        const patchWave = Math.sin((latPhase + lonPhase) * Math.PI * 2);
        const mixed = latWave * 0.55 + lonWave * 0.3 + patchWave * 0.15;
        return clamp(1 + mixed * contrast, 0.1, 2);
      })
    );
  }

  private spawnInitialPopulation(): Agent[] {
    const agents: Agent[] = [];
    for (let i = 0; i < this.config.initialAgents; i += 1) {
      const genome = {
        metabolism: this.randomTrait(MIN_GENOME.metabolism, MAX_GENOME.metabolism),
        harvest: this.randomTrait(MIN_GENOME.harvest, MAX_GENOME.harvest),
        aggression: this.randomTrait(MIN_GENOME.aggression, MAX_GENOME.aggression)
      };
      const id = this.nextAgentId++;
      const lineage = id;
      agents.push({
        id,
        lineage,
        species: this.nextSpeciesId++,
        x: this.rng.int(this.config.width),
        y: this.rng.int(this.config.height),
        energy: this.config.initialEnergy * (0.8 + this.rng.float() * 0.4),
        age: 0,
        genome
      });
    }
    return agents;
  }

  private createAgentFromSeed(seed: AgentSeed, fallbackLineage: number, fallbackSpecies: number): Agent {
    const agent: Agent = {
      id: this.nextAgentId++,
      lineage: seed.lineage ?? fallbackLineage,
      species: seed.species ?? fallbackSpecies,
      x: this.wrapX(seed.x),
      y: this.wrapY(seed.y),
      energy: seed.energy,
      age: seed.age ?? 0,
      genome: {
        metabolism: clamp(seed.genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism),
        harvest: clamp(seed.genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest),
        aggression: clamp(seed.genome.aggression, MIN_GENOME.aggression, MAX_GENOME.aggression)
      }
    };
    return agent;
  }

  private processAgentTurn(agent: Agent, occupancy: number[][]): void {
    agent.age += 1;
    agent.energy -= this.config.metabolismCostBase * agent.genome.metabolism;
    agent.energy -= this.specializationMetabolicPenalty(agent);
    if (agent.energy <= 0 || agent.age > this.config.maxAge) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      return;
    }

    const previousX = agent.x;
    const previousY = agent.y;
    const destination = this.pickDestination(agent, occupancy);
    const moved = destination.x !== agent.x || destination.y !== agent.y;
    agent.x = destination.x;
    agent.y = destination.y;

    if (moved) {
      occupancy[previousY][previousX] = Math.max(0, occupancy[previousY][previousX] - 1);
      occupancy[agent.y][agent.x] += 1;
      agent.energy -= this.config.moveCost * agent.genome.metabolism;
    }
    if (agent.energy <= 0) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      return;
    }

    const available = this.resources[agent.y][agent.x];
    const habitatEfficiency = this.habitatMatchEfficiency(agent.species, agent.x, agent.y);
    const harvestAmount = Math.min(
      available,
      this.config.harvestCap * agent.genome.harvest * habitatEfficiency
    );
    this.resources[agent.y][agent.x] -= harvestAmount;
    agent.energy += harvestAmount;
  }

  private pickDestination(agent: Agent, occupancy: number[][]): { x: number; y: number } {
    const options = [
      { x: agent.x, y: agent.y },
      { x: this.wrapX(agent.x + 1), y: agent.y },
      { x: this.wrapX(agent.x - 1), y: agent.y },
      { x: agent.x, y: this.wrapY(agent.y + 1) },
      { x: agent.x, y: this.wrapY(agent.y - 1) }
    ];

    let best = options[0];
    let bestScore = -Infinity;

    for (const option of options) {
      const food = this.resources[option.y][option.x] * this.habitatMatchEfficiency(agent.species, option.x, option.y);
      const crowding = this.neighborhoodCrowding(option.x, option.y, occupancy);
      const score = food - this.config.dispersalPressure * crowding + this.rng.float() * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }

    return best;
  }

  private neighborhoodCrowding(x: number, y: number, occupancy: number[][]): number {
    const radius = Math.max(0, Math.floor(this.config.dispersalRadius));
    if (radius === 0) {
      return occupancy[this.wrapY(y)][this.wrapX(x)];
    }

    let weightedCount = 0;
    let totalWeight = 0;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance > radius) {
          continue;
        }
        const weight = 1 / (distance + 1);
        const nx = this.wrapX(x + dx);
        const ny = this.wrapY(y + dy);
        weightedCount += occupancy[ny][nx] * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 0;
    }
    return weightedCount / totalWeight;
  }

  private resolveEncounters(): void {
    const byCell = new Map<string, Agent[]>();

    for (const agent of this.agents) {
      if (agent.energy <= 0) {
        continue;
      }
      const key = `${agent.x},${agent.y}`;
      if (!byCell.has(key)) {
        byCell.set(key, []);
      }
      byCell.get(key)!.push(agent);
    }

    for (const agentsInCell of byCell.values()) {
      if (agentsInCell.length < 2) {
        continue;
      }

      agentsInCell.sort((a, b) => b.genome.aggression - a.genome.aggression || b.energy - a.energy);
      const dominant = agentsInCell[0];

      for (const target of agentsInCell.slice(1)) {
        const pressure = Math.max(0, dominant.genome.aggression - target.genome.aggression + 0.1);
        const stolen = Math.min(target.energy, target.energy * pressure * 0.25);
        if (stolen <= 0) {
          continue;
        }
        target.energy -= stolen;
        dominant.energy += stolen;
      }
    }
  }

  private reproduce(parent: Agent): Agent {
    const childEnergy = parent.energy * this.config.offspringEnergyFraction;
    parent.energy -= childEnergy;
    const childGenome = this.mutateGenome(parent.genome);
    const diverged =
      genomeDistance(parent.genome, childGenome) >= this.config.speciationThreshold;
    const childSpecies = diverged ? this.nextSpeciesId++ : parent.species;
    if (diverged) {
      const parentPreference = this.getSpeciesHabitatPreference(parent.species);
      const delta = this.habitatPreferenceDeltaFromMutation(parent.genome, childGenome);
      this.speciesHabitatPreference.set(childSpecies, clamp(parentPreference + delta, 0.1, 2));
    }

    const neighbors = [
      { x: parent.x, y: parent.y },
      { x: this.wrapX(parent.x + 1), y: parent.y },
      { x: this.wrapX(parent.x - 1), y: parent.y },
      { x: parent.x, y: this.wrapY(parent.y + 1) },
      { x: parent.x, y: this.wrapY(parent.y - 1) }
    ];
    const childPos = this.rng.pick(neighbors);

    return {
      id: this.nextAgentId++,
      lineage: parent.lineage,
      species: childSpecies,
      x: childPos.x,
      y: childPos.y,
      energy: childEnergy,
      age: 0,
      genome: childGenome
    };
  }

  private mutateGenome(genome: Genome): Genome {
    return {
      metabolism: this.mutateTrait(genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism),
      harvest: this.mutateTrait(genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest),
      aggression: this.mutateTrait(genome.aggression, MIN_GENOME.aggression, MAX_GENOME.aggression)
    };
  }

  private mutateTrait(value: number, min: number, max: number): number {
    const delta = (this.rng.float() + this.rng.float() - 1) * this.config.mutationAmount;
    return clamp(value + delta, min, max);
  }

  private randomTrait(min: number, max: number): number {
    return min + this.rng.float() * (max - min);
  }

  private habitatMatchEfficiency(species: number, x: number, y: number): number {
    const strength = Math.max(0, this.config.habitatPreferenceStrength);
    if (strength === 0) {
      return 1;
    }
    const preference = this.getSpeciesHabitatPreference(species);
    const fertility = this.biomeFertility[y][x];
    const mismatch = fertility - preference;
    return Math.max(0.05, Math.exp(-strength * mismatch * mismatch));
  }

  private getSpeciesHabitatPreference(species: number): number {
    const existing = this.speciesHabitatPreference.get(species);
    if (existing !== undefined) {
      return existing;
    }
    this.speciesHabitatPreference.set(species, 1);
    return 1;
  }

  private habitatPreferenceDeltaFromMutation(parent: Genome, child: Genome): number {
    const mutationScale = Math.max(0, this.config.habitatPreferenceMutation);
    if (mutationScale === 0) {
      return 0;
    }
    const harvestShift = child.harvest - parent.harvest;
    const metabolismShift = parent.metabolism - child.metabolism;
    const signal = harvestShift * 0.65 + metabolismShift * 0.35;
    return clamp(signal, -1, 1) * mutationScale;
  }

  private specializationMetabolicPenalty(agent: Agent): number {
    const scale = Math.max(0, this.config.specializationMetabolicCost);
    if (scale === 0) {
      return 0;
    }
    return scale * this.specializationLoad(agent.species) * agent.genome.metabolism;
  }

  private specializationLoad(species: number): number {
    return Math.min(1, Math.abs(this.getSpeciesHabitatPreference(species) - 1));
  }

  private regenerateResources(): void {
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        const fertility = this.biomeFertility[y][x];
        this.resources[y][x] = clamp(
          this.resources[y][x] + this.config.resourceRegen * fertility,
          0,
          this.config.maxResource
        );
      }
    }
  }

  private recycleDeadAgents(deadAgents: Agent[]): void {
    for (const agent of deadAgents) {
      const fertility = this.biomeFertility[agent.y][agent.x];
      const recycled =
        (this.config.decompositionBase +
          Math.max(0, agent.energy) * this.config.decompositionEnergyFraction) *
        fertility;
      if (recycled <= 0) {
        continue;
      }
      this.resources[agent.y][agent.x] = clamp(
        this.resources[agent.y][agent.x] + recycled,
        0,
        this.config.maxResource
      );
    }
  }

  private countBy(agents: Agent[], selector: (agent: Agent) => number): Map<number, number> {
    const counts = new Map<number, number>();
    for (const agent of agents) {
      const key = selector(agent);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  private mean(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const mean = this.mean(values);
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private meanEnergy(): number {
    if (this.agents.length === 0) {
      return 0;
    }
    const total = this.agents.reduce((sum, agent) => sum + agent.energy, 0);
    return total / this.agents.length;
  }

  private meanGenome(): Genome {
    if (this.agents.length === 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const totals = this.agents.reduce(
      (acc, agent) => {
        acc.metabolism += agent.genome.metabolism;
        acc.harvest += agent.genome.harvest;
        acc.aggression += agent.genome.aggression;
        return acc;
      },
      { metabolism: 0, harvest: 0, aggression: 0 }
    );

    return {
      metabolism: totals.metabolism / this.agents.length,
      harvest: totals.harvest / this.agents.length,
      aggression: totals.aggression / this.agents.length
    };
  }

  private diversityMetrics(): { activeClades: number; activeSpecies: number; dominantSpeciesShare: number } {
    if (this.agents.length === 0) {
      return { activeClades: 0, activeSpecies: 0, dominantSpeciesShare: 0 };
    }

    const clades = new Set<number>();
    const speciesCounts = new Map<number, number>();
    for (const agent of this.agents) {
      clades.add(agent.lineage);
      speciesCounts.set(agent.species, (speciesCounts.get(agent.species) ?? 0) + 1);
    }

    const dominantCount = Math.max(...speciesCounts.values());
    return {
      activeClades: clades.size,
      activeSpecies: speciesCounts.size,
      dominantSpeciesShare: dominantCount / this.agents.length
    };
  }

  private selectionDifferential(meanGenome: Genome): Genome {
    if (this.agents.length === 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const totalEnergy = this.agents.reduce((sum, agent) => sum + agent.energy, 0);
    if (totalEnergy <= 0) {
      return { metabolism: 0, harvest: 0, aggression: 0 };
    }

    const weightedTotals = this.agents.reduce(
      (acc, agent) => {
        acc.metabolism += agent.genome.metabolism * agent.energy;
        acc.harvest += agent.genome.harvest * agent.energy;
        acc.aggression += agent.genome.aggression * agent.energy;
        return acc;
      },
      { metabolism: 0, harvest: 0, aggression: 0 }
    );

    return {
      metabolism: weightedTotals.metabolism / totalEnergy - meanGenome.metabolism,
      harvest: weightedTotals.harvest / totalEnergy - meanGenome.harvest,
      aggression: weightedTotals.aggression / totalEnergy - meanGenome.aggression
    };
  }

  private isAlive(agentId: number): boolean {
    return this.agents.some((agent) => agent.id === agentId && agent.energy > 0);
  }

  private wrapX(x: number): number {
    const width = this.config.width;
    return ((x % width) + width) % width;
  }

  private wrapY(y: number): number {
    const height = this.config.height;
    return ((y % height) + height) % height;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function genomeDistance(a: Genome, b: Genome): number {
  return (
    Math.abs(a.metabolism - b.metabolism) +
    Math.abs(a.harvest - b.harvest) +
    Math.abs(a.aggression - b.aggression)
  );
}
