import {
  adaptCladeHabitatPreference as updateCladeHabitatPreference,
  getCladeHabitatPreference as lookupCladeHabitatPreference,
  getSpeciesHabitatPreference as lookupSpeciesHabitatPreference,
  habitatMatchEfficiency as calculateHabitatMatchEfficiency,
  initializeCladeHabitatPreferences as seedInitialCladeHabitatPreferences,
  initializeSpeciesHabitatPreferences as seedInitialSpeciesHabitatPreferences,
  resolveMutatedSpeciesHabitatPreference,
  setFoundCladeHabitatPreference
} from './clade-habitat';
import {
  DisturbanceEventState,
  buildDisturbanceCellSets,
  countDisturbanceEventsInWindow,
  createDisturbanceEvent,
  disturbanceSettlementOpenUntilTickAt,
  latestDisturbanceEvent,
  markDisturbanceSettlementOpenings,
  resolveDisturbanceFootprintConfig,
  resolveDisturbanceSchedule,
  resolveDisturbanceSettlementOpeningConfig,
  shouldApplyDisturbance,
  updateDisturbanceEventState
} from './disturbance';
import {
  LineageOccupancyGrid,
  OffspringSettlementContext,
  SettlementAgent,
  SettlementPosition,
  pickSettlementSite,
  resolveDisturbanceSettlementOpeningBonus
} from './reproduction';
import { Rng } from './rng';
import {
  countExtinctionsInWindow,
  countOriginationsInWindow,
  SimulationEvolutionHistory
} from './simulation-evolution-history';
import { TaxonHistoryState } from './simulation-history';
import {
  resolveEncounterLineageTransferMultiplier,
  resolveOffspringSettlementContext,
  resolveSettlementEcologyScore,
  shouldFoundNewClade,
  usesCladogenesisEcologyGate,
  usesOffspringSettlementContext,
  usesOffspringSettlementLineageOccupancy,
  usesOffspringSettlementScoring
} from './settlement-cladogenesis';
import {
  Agent,
  AgentSeed,
  DisturbanceAnalytics,
  EvolutionAnalyticsSnapshot,
  ForcingAnalytics,
  EvolutionHistorySnapshot,
  Genome,
  ResilienceAnalytics,
  LocalityRadiusAnalytics,
  LocalityRadiusTurnoverAnalytics,
  LocalityStateAnalytics,
  LocalityTurnoverAnalytics,
  SimulationConfig,
  SimulationRunSeries,
  SimulationSnapshot,
  StrategyAnalytics,
  StrategyAxisAnalytics,
  StepSummary,
  TurnoverWindow
} from './types';

const DEFAULT_CONFIG: SimulationConfig = {
  width: 20,
  height: 20,
  maxResource: 8,
  resourceRegen: 0.6,
  seasonalCycleLength: 120,
  seasonalRegenAmplitude: 0,
  seasonalFertilityContrastAmplitude: 0,
  disturbanceInterval: 0,
  disturbancePhaseOffset: 0,
  disturbanceEnergyLoss: 0,
  disturbanceResourceLoss: 0,
  disturbanceRadius: -1,
  disturbanceRefugiaFraction: 0,
  biomeBands: 4,
  biomeContrast: 0.45,
  decompositionBase: 0.6,
  decompositionEnergyFraction: 0.25,
  decompositionSpilloverFraction: 0,
  initialAgents: 24,
  initialEnergy: 12,
  metabolismCostBase: 0.25,
  moveCost: 0.15,
  dispersalPressure: 0.8,
  dispersalRadius: 1,
  localityRadius: 2,
  habitatPreferenceStrength: 1.4,
  habitatPreferenceMutation: 0.2,
  cladeHabitatCoupling: 0,
  adaptiveCladeHabitatMemoryRate: 0,
  cladeInteractionCoupling: 0,
  specializationMetabolicCost: 0.08,
  predationPressure: 0.35,
  trophicForagingPenalty: 0.35,
  trophicMutation: 0.18,
  defenseMitigation: 0.45,
  defenseForagingPenalty: 0.2,
  defenseMutation: 0.16,
  lineageEncounterRestraint: 0,
  lineageDispersalCrowdingPenalty: 0,
  lineageHarvestCrowdingPenalty: 0,
  lineageOffspringSettlementCrowdingPenalty: 0,
  newCladeSettlementCrowdingGraceTicks: 0,
  newCladeEncounterRestraintGraceBoost: 0,
  offspringSettlementEcologyScoring: false,
  disturbanceSettlementOpeningTicks: 0,
  disturbanceSettlementOpeningBonus: 0,
  disturbanceSettlementOpeningLineageAbsentOnly: false,
  cladogenesisTraitNoveltyThreshold: -1,
  cladogenesisEcologyAdvantageThreshold: -1,
  harvestCap: 2.5,
  reproduceThreshold: 20,
  reproduceProbability: 0.35,
  offspringEnergyFraction: 0.45,
  mutationAmount: 0.2,
  speciationThreshold: 0.25,
  cladogenesisThreshold: -1,
  maxAge: 120
};

export function resolveSimulationConfig(config: Partial<SimulationConfig> = {}): SimulationConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

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

  private nextLineageId = 1;

  private readonly evolutionHistory = new SimulationEvolutionHistory();

  private readonly cladeFounderGenome = new Map<number, Genome>();

  private readonly cladeHabitatPreference = new Map<number, number>();

  private readonly speciesHabitatPreference = new Map<number, number>();

  private readonly speciesTrophicLevel = new Map<number, number>();

  private readonly speciesDefenseLevel = new Map<number, number>();

  private readonly localityFrames: LocalityFrame[] = [];

  private readonly disturbanceEvents: DisturbanceEventState[] = [];

  private readonly disturbanceSettlementOpenUntilTick: number[][];

  constructor(options: LifeSimulationOptions = {}) {
    this.config = resolveSimulationConfig(options.config);
    this.rng = new Rng(options.seed ?? 1);
    this.biomeFertility = this.buildBiomeFertility();
    this.resources = this.buildInitialResources();
    this.disturbanceSettlementOpenUntilTick = this.buildZeroGrid();
    this.agents = options.initialAgents
      ? options.initialAgents.map((seed, index) => this.createAgentFromSeed(seed, index + 1, index + 1))
      : this.spawnInitialPopulation();
    if (this.agents.length > 0) {
      this.nextAgentId = Math.max(...this.agents.map((agent) => agent.id)) + 1;
      this.nextSpeciesId = Math.max(...this.agents.map((agent) => agent.species)) + 1;
      this.nextLineageId = Math.max(...this.agents.map((agent) => agent.lineage)) + 1;
    }
    this.initializeCladeFounderGenomes();
    this.initializeSpeciesHabitatPreferences();
    this.initializeCladeHabitatPreferences();
    this.initializeSpeciesTrophicLevels();
    this.initializeSpeciesDefenseLevels();
    this.initializeEvolutionHistory();
    this.recordLocalityFrame(0);
  }

  step(): StepSummary {
    const beforeCount = this.agents.length;

    this.regenerateResources();
    this.applyDisturbanceIfScheduled(this.tickCount + 1);

    const occupancy = this.buildOccupancyGrid();
    const lineageOccupancy = this.usesAdultLineageOccupancy() ? this.buildLineageOccupancyGrid() : undefined;
    const turnOrder = this.rng.shuffle([...this.agents]);
    for (const agent of turnOrder) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      this.processAgentTurn(agent, occupancy, lineageOccupancy);
    }

    this.resolveEncounters();

    const useOffspringSettlementContext =
      usesOffspringSettlementContext(this.config) || usesCladogenesisEcologyGate(this.config);
    const reproductiveAgents = useOffspringSettlementContext
      ? this.agents.filter((agent) => agent.energy > 0)
      : undefined;
    const reproductionOccupancy = reproductiveAgents ? this.buildOccupancyGrid(reproductiveAgents) : undefined;
    const reproductionLineageOccupancy =
      reproductiveAgents && usesOffspringSettlementLineageOccupancy(this.config)
        ? this.buildLineageOccupancyGrid(reproductiveAgents)
        : undefined;
    const offspring: Agent[] = [];
    for (const agent of [...this.agents]) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      if (agent.energy >= this.config.reproduceThreshold && this.rng.float() < this.config.reproduceProbability) {
        const child = this.reproduce(agent, reproductionOccupancy, reproductionLineageOccupancy);
        offspring.push(child);
        if (reproductionOccupancy) {
          reproductionOccupancy[child.y][child.x] += 1;
        }
        if (reproductionLineageOccupancy) {
          this.adjustLineageOccupancy(reproductionLineageOccupancy, child.lineage, child.x, child.y, 1);
        }
      }
    }
    const births = offspring.length;
    this.agents.push(...offspring);
    const nextTick = this.tickCount + 1;
    const founderOccupancy = births === 0 ? undefined : this.buildOccupancyGrid(this.agents);

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
    this.tickCount = nextTick;
    const { cladeExtinctionDelta, speciesExtinctionDelta } = this.evolutionHistory.recordStep({
      tick: this.tickCount,
      agents: this.agents,
      offspring,
      deadAgents,
      founderOccupancy,
      effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick),
      neighborhoodCrowdingAt: (x, y, occupancy) => this.neighborhoodCrowding(x, y, occupancy)
    });
    this.recordLocalityFrame(this.tickCount);
    updateDisturbanceEventState(this.disturbanceEvents, this.tickCount, afterCount, diversity.activeSpecies);

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
      cumulativeExtinctClades: this.evolutionHistory.getExtinctClades(),
      cumulativeExtinctSpecies: this.evolutionHistory.getExtinctSpecies()
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
      extinctClades: this.evolutionHistory.getExtinctClades(),
      extinctSpecies: this.evolutionHistory.getExtinctSpecies(),
      agents: this.agents.map((agent) => ({
        ...agent,
        genome: { ...agent.genome }
      }))
    };
  }

  history(): EvolutionHistorySnapshot {
    return this.evolutionHistory.snapshot();
  }

  analytics(windowSize = 25): EvolutionAnalyticsSnapshot {
    const window = this.buildTurnoverWindow(windowSize);
    return {
      tick: this.tickCount,
      window,
      species: this.evolutionHistory.buildSpeciesTurnover(window, this.tickCount),
      clades: this.evolutionHistory.buildCladeTurnover(window, this.tickCount),
      strategy: this.buildStrategyAnalytics(),
      forcing: this.buildForcingAnalytics(),
      disturbance: this.buildDisturbanceAnalytics(window),
      resilience: this.buildResilienceAnalytics(),
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

  private buildForcingAnalytics(): ForcingAnalytics {
    return {
      cycleLength: this.normalizedSeasonalCycleLength(),
      phase: this.seasonalPhaseForTick(this.tickCount),
      wave: this.seasonalWaveForTick(this.tickCount),
      regenMultiplier: this.seasonalRegenMultiplierForTick(this.tickCount),
      fertilityContrastMultiplier: this.seasonalFertilityContrastMultiplierForTick(this.tickCount)
    };
  }

  private buildDisturbanceAnalytics(window: TurnoverWindow): DisturbanceAnalytics {
    const latestEvent = latestDisturbanceEvent(this.disturbanceEvents);
    const schedule = resolveDisturbanceSchedule(this.config);
    const footprint = resolveDisturbanceFootprintConfig(this.config);
    const lastEventPopulationShock =
      latestEvent === null || latestEvent.populationBefore <= 0
        ? 0
        : clamp(
            (latestEvent.populationBefore - latestEvent.populationAfterShock) / latestEvent.populationBefore,
            0,
            1
          );
    const lastEventResourceShock =
      latestEvent === null || latestEvent.totalResourcesBefore <= 0
        ? 0
        : clamp(
            (latestEvent.totalResourcesBefore - latestEvent.totalResourcesAfterShock) / latestEvent.totalResourcesBefore,
            0,
            1
          );
    const lastEventAffectedCellFraction =
      latestEvent === null || latestEvent.totalCells <= 0
        ? 0
        : clamp(latestEvent.affectedCells / latestEvent.totalCells, 0, 1);
    const lastEventRefugiaCellFraction =
      latestEvent === null || latestEvent.targetedCells <= 0
        ? 0
        : clamp((latestEvent.targetedCells - latestEvent.affectedCells) / latestEvent.targetedCells, 0, 1);

    return {
      interval: schedule.interval,
      phaseOffset: schedule.phaseOffset,
      energyLoss: clamp(this.config.disturbanceEnergyLoss, 0, 1),
      resourceLoss: clamp(this.config.disturbanceResourceLoss, 0, 1),
      radius: footprint.radius,
      refugiaFraction: footprint.refugiaFraction,
      eventsInWindow: countDisturbanceEventsInWindow(this.disturbanceEvents, window),
      lastEventTick: latestEvent?.tick ?? 0,
      lastEventPopulationShock,
      lastEventResourceShock,
      lastEventAffectedCellFraction,
      lastEventRefugiaCellFraction
    };
  }

  private buildResilienceAnalytics(): ResilienceAnalytics {
    const latestEvent = latestDisturbanceEvent(this.disturbanceEvents);
    const currentPopulation = this.agents.length;
    const memoryEvents = this.disturbanceEvents.filter((event) => event.populationBefore > 0);
    const memoryPhaseStats = this.summarizeCircularPhase(
      memoryEvents.map((event) => this.seasonalPhaseForTick(event.tick))
    );
    let memoryRecoveredEvents = 0;
    let memoryRecoveryLagTicksTotal = 0;
    let memoryRelapseEvents = 0;
    let memoryStabilityIndexTotal = 0;
    for (const event of memoryEvents) {
      const recovery = this.buildRecoveryStateForEvent(event, currentPopulation);
      const recoveryLagTicks = this.recoveryLagTicksForEvent(event);
      if (recoveryLagTicks >= 0) {
        memoryRecoveredEvents += 1;
        memoryRecoveryLagTicksTotal += recoveryLagTicks;
      }
      if (recovery.recoveryRelapses > 0) {
        memoryRelapseEvents += 1;
      }
      memoryStabilityIndexTotal += this.computeResilienceStabilityIndex(
        recovery.recoveryProgress,
        recovery.sustainedRecoveryTicks,
        recovery.recoveryRelapses
      );
    }
    const memoryEventCount = memoryEvents.length;
    const memoryRecoveredEventFraction = memoryEventCount === 0 ? 0 : memoryRecoveredEvents / memoryEventCount;
    const memoryRelapseEventFraction = memoryEventCount === 0 ? 0 : memoryRelapseEvents / memoryEventCount;
    const memoryStabilityIndexMean = memoryEventCount === 0 ? 0 : memoryStabilityIndexTotal / memoryEventCount;
    const memoryRecoveryLagTicksMean =
      memoryRecoveredEvents === 0 ? 0 : memoryRecoveryLagTicksTotal / memoryRecoveredEvents;

    if (latestEvent === null) {
      return {
        recoveryTicks: 0,
        recoveryProgress: 0,
        recoveryRelapses: 0,
        sustainedRecoveryTicks: 0,
        populationTroughDepth: 0,
        populationTroughTicks: 0,
        delayedPopulationShockDepth: 0,
        preDisturbanceTurnoverRate: 0,
        postDisturbanceTurnoverRate: 0,
        turnoverSpike: 0,
        extinctionBurstDepth: 0,
        memoryEventCount: 0,
        memoryRecoveredEventFraction: 0,
        memoryRelapseEventFraction: 0,
        memoryStabilityIndexMean: 0,
        latestEventSeasonalPhase: 0,
        latestEventRecoveryLagTicks: 0,
        memoryRecoveryLagTicksMean: 0,
        memoryEventPhaseMean: 0,
        memoryEventPhaseConcentration: 0
      };
    }

    const latestRecovery = this.buildRecoveryStateForEvent(latestEvent, currentPopulation);
    const latestEventRecoveryLagTicks = this.recoveryLagTicksForEvent(latestEvent);
    const immediatePopulationShock =
      latestEvent.populationBefore <= 0
        ? 0
        : clamp(
            (latestEvent.populationBefore - latestEvent.populationAfterShock) / latestEvent.populationBefore,
            0,
            1
          );
    const populationTroughDepth =
      latestEvent.populationBefore <= 0
        ? 0
        : clamp(
            (latestEvent.populationBefore - latestEvent.minPopulationSinceEvent) / latestEvent.populationBefore,
            0,
            1
          );
    const populationTroughTicks =
      latestEvent.populationBefore <= 0
        ? 0
        : Math.max(0, latestEvent.minPopulationTickSinceEvent - latestEvent.tick);
    const delayedPopulationShockDepth = Math.max(0, populationTroughDepth - immediatePopulationShock);

    const postRates = this.buildSpeciesTurnoverRatesBetween(latestEvent.tick, this.tickCount);
    const preEndTick = latestEvent.tick - 1;
    const preStartTick = Math.max(1, preEndTick - postRates.size + 1);
    const preRates =
      preEndTick < preStartTick
        ? { size: 0, turnoverRate: 0 }
        : this.buildSpeciesTurnoverRatesBetween(preStartTick, preEndTick);
    const preDisturbanceTurnoverRate = preRates.turnoverRate;
    const postDisturbanceTurnoverRate = postRates.turnoverRate;
    const turnoverSpike =
      preDisturbanceTurnoverRate <= 0
        ? postDisturbanceTurnoverRate
        : postDisturbanceTurnoverRate / preDisturbanceTurnoverRate;
    const extinctionBurstDepth = Math.max(
      0,
      latestEvent.activeSpeciesBefore - latestEvent.minActiveSpeciesSinceEvent
    );

    return {
      recoveryTicks: latestRecovery.recoveryTicks,
      recoveryProgress: latestRecovery.recoveryProgress,
      recoveryRelapses: latestRecovery.recoveryRelapses,
      sustainedRecoveryTicks: latestRecovery.sustainedRecoveryTicks,
      populationTroughDepth,
      populationTroughTicks,
      delayedPopulationShockDepth,
      preDisturbanceTurnoverRate,
      postDisturbanceTurnoverRate,
      turnoverSpike,
      extinctionBurstDepth,
      memoryEventCount,
      memoryRecoveredEventFraction,
      memoryRelapseEventFraction,
      memoryStabilityIndexMean,
      latestEventSeasonalPhase: this.seasonalPhaseForTick(latestEvent.tick),
      latestEventRecoveryLagTicks,
      memoryRecoveryLagTicksMean,
      memoryEventPhaseMean: memoryPhaseStats.mean,
      memoryEventPhaseConcentration: memoryPhaseStats.concentration
    };
  }

  private recoveryLagTicksForEvent(event: DisturbanceEventState): number {
    if (event.recoveryTick === null) {
      return -1;
    }
    return Math.max(0, event.recoveryTick - event.tick);
  }

  private buildRecoveryStateForEvent(
    event: DisturbanceEventState,
    currentPopulation: number
  ): {
    recoveryTicks: number;
    recoveryProgress: number;
    recoveryRelapses: number;
    sustainedRecoveryTicks: number;
  } {
    if (event.populationBefore <= 0) {
      return {
        recoveryTicks: 0,
        recoveryProgress: 1,
        recoveryRelapses: 0,
        sustainedRecoveryTicks: 0
      };
    }
    return {
      recoveryTicks: event.recoveryTick === null ? -1 : event.recoveryTick - event.tick,
      recoveryProgress: clamp(currentPopulation / event.populationBefore, 0, 1),
      recoveryRelapses: event.recoveryRelapses,
      sustainedRecoveryTicks: event.recoveryTick === null ? 0 : Math.max(0, this.tickCount - event.recoveryTick)
    };
  }

  private summarizeCircularPhase(phases: number[]): { mean: number; concentration: number } {
    if (phases.length === 0) {
      return { mean: 0, concentration: 0 };
    }

    let sinTotal = 0;
    let cosTotal = 0;
    for (const phase of phases) {
      const angle = phase * Math.PI * 2;
      sinTotal += Math.sin(angle);
      cosTotal += Math.cos(angle);
    }

    const meanSin = sinTotal / phases.length;
    const meanCos = cosTotal / phases.length;
    const concentration = clamp(Math.sqrt(meanSin ** 2 + meanCos ** 2), 0, 1);
    if (concentration === 0) {
      return { mean: 0, concentration: 0 };
    }

    let mean = Math.atan2(meanSin, meanCos) / (Math.PI * 2);
    if (mean < 0) {
      mean += 1;
    }
    return { mean, concentration };
  }

  private computeResilienceStabilityIndex(
    recoveryProgress: number,
    sustainedRecoveryTicks: number,
    recoveryRelapses: number
  ): number {
    const progress = clamp(recoveryProgress, 0, 1);
    const sustained = Math.max(0, sustainedRecoveryTicks);
    const relapses = Math.max(0, recoveryRelapses);
    return (progress * (sustained + 1)) / (sustained + relapses + 1);
  }

  private buildSpeciesTurnoverRatesBetween(startTick: number, endTick: number): {
    size: number;
    turnoverRate: number;
  } {
    const start = Math.max(1, startTick);
    const end = Math.max(0, endTick);
    if (end < start) {
      return { size: 0, turnoverRate: 0 };
    }
    const window = {
      startTick: start,
      endTick: end,
      size: end - start + 1
    };
    const speciations = this.countOriginationsInWindow(this.speciesHistory, window);
    const extinctions = this.countExtinctionsInWindow(this.speciesHistory, window);
    return {
      size: window.size,
      turnoverRate: window.size === 0 ? 0 : (speciations + extinctions) / window.size
    };
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

  private buildStrategyAnalytics(): StrategyAnalytics {
    const speciesCounts = this.countBy(this.agents, (agent) => agent.species);
    const habitatValues: number[] = [];
    const trophicValues: number[] = [];
    const defenseValues: number[] = [];
    let habitatWeightedTotal = 0;
    let trophicWeightedTotal = 0;
    let defenseWeightedTotal = 0;
    let totalPopulation = 0;

    for (const [species, population] of speciesCounts) {
      const habitat = this.getSpeciesHabitatPreference(species);
      const trophic = this.getSpeciesTrophicLevel(species);
      const defense = this.getSpeciesDefenseLevel(species);
      habitatValues.push(habitat);
      trophicValues.push(trophic);
      defenseValues.push(defense);
      habitatWeightedTotal += habitat * population;
      trophicWeightedTotal += trophic * population;
      defenseWeightedTotal += defense * population;
      totalPopulation += population;
    }

    return {
      activeSpecies: speciesCounts.size,
      habitatPreference: this.summarizeStrategyAxis(habitatValues, habitatWeightedTotal, totalPopulation),
      trophicLevel: this.summarizeStrategyAxis(trophicValues, trophicWeightedTotal, totalPopulation),
      defenseLevel: this.summarizeStrategyAxis(defenseValues, defenseWeightedTotal, totalPopulation)
    };
  }

  private summarizeStrategyAxis(
    values: number[],
    weightedTotal: number,
    totalWeight: number
  ): StrategyAxisAnalytics {
    if (values.length === 0) {
      return {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        weightedMean: 0
      };
    }

    return {
      mean: this.mean(values),
      stdDev: this.standardDeviation(values),
      min: Math.min(...values),
      max: Math.max(...values),
      weightedMean: totalWeight === 0 ? 0 : weightedTotal / totalWeight
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

  private get cladeHistory(): Map<number, TaxonHistoryState> {
    return this.evolutionHistory.getCladeHistory();
  }

  private get speciesHistory(): Map<number, TaxonHistoryState> {
    return this.evolutionHistory.getSpeciesHistory();
  }

  private countOriginationsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    return countOriginationsInWindow(history, window);
  }

  private countExtinctionsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    return countExtinctionsInWindow(history, window);
  }

  private initializeEvolutionHistory(): void {
    const initialOccupancy = this.buildOccupancyGrid(this.agents);
    this.evolutionHistory.initialize(this.agents, {
      tick: 0,
      occupancy: initialOccupancy,
      effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick),
      neighborhoodCrowdingAt: (x, y, occupancy) => this.neighborhoodCrowding(x, y, occupancy)
    });
  }

  private initializeCladeFounderGenomes(): void {
    for (const agent of this.agents) {
      if (this.cladeFounderGenome.has(agent.lineage)) {
        continue;
      }
      this.cladeFounderGenome.set(agent.lineage, copyGenome(agent.genome));
    }
  }

  private initializeSpeciesHabitatPreferences(): void {
    seedInitialSpeciesHabitatPreferences(
      this.agents,
      this.speciesHabitatPreference,
      (agent) => this.effectiveBiomeFertilityAt(agent.x, agent.y, 0)
    );
  }

  private initializeCladeHabitatPreferences(): void {
    seedInitialCladeHabitatPreferences(
      this.agents,
      this.cladeHabitatPreference,
      (agent) => this.effectiveBiomeFertilityAt(agent.x, agent.y, 0)
    );
  }

  private initializeSpeciesTrophicLevels(): void {
    const sums = new Map<number, { total: number; count: number }>();
    for (const agent of this.agents) {
      const signal = this.genomeTrophicSignal(agent.genome);
      const current = sums.get(agent.species) ?? { total: 0, count: 0 };
      current.total += signal;
      current.count += 1;
      sums.set(agent.species, current);
    }
    for (const [species, { total, count }] of sums) {
      const level = count === 0 ? 0 : total / count;
      this.speciesTrophicLevel.set(species, clamp(level, 0, 1));
    }
  }

  private initializeSpeciesDefenseLevels(): void {
    const sums = new Map<number, { total: number; count: number }>();
    for (const agent of this.agents) {
      const signal = this.genomeDefenseSignal(agent.genome);
      const current = sums.get(agent.species) ?? { total: 0, count: 0 };
      current.total += signal;
      current.count += 1;
      sums.set(agent.species, current);
    }
    for (const [species, { total, count }] of sums) {
      const level = count === 0 ? 0 : total / count;
      this.speciesDefenseLevel.set(species, clamp(level, 0, 1));
    }
  }

  private genomeTrophicSignal(genome: Genome): number {
    const harvestNormalized = normalizeTrait(genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest);
    return clamp(genome.aggression * 0.7 + (1 - harvestNormalized) * 0.3, 0, 1);
  }

  private genomeDefenseSignal(genome: Genome): number {
    const metabolismNormalized = normalizeTrait(genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism);
    return clamp((1 - genome.aggression) * 0.65 + metabolismNormalized * 0.35, 0, 1);
  }

  private buildInitialResources(): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => this.rng.float() * this.config.maxResource)
    );
  }

  private buildZeroGrid(): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => 0)
    );
  }

  private buildOccupancyGrid(agents: ReadonlyArray<Pick<Agent, 'x' | 'y'>> = this.agents): number[][] {
    const occupancy = Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => 0)
    );
    for (const agent of agents) {
      occupancy[agent.y][agent.x] += 1;
    }
    return occupancy;
  }

  private buildLineageOccupancyGrid(
    agents: ReadonlyArray<Pick<Agent, 'lineage' | 'x' | 'y'>> = this.agents
  ): LineageOccupancyGrid {
    const grids: LineageOccupancyGrid = new Map();
    for (const agent of agents) {
      let grid = grids.get(agent.lineage);
      if (!grid) {
        grid = Array.from({ length: this.config.height }, () => Array.from({ length: this.config.width }, () => 0));
        grids.set(agent.lineage, grid);
      }
      grid[agent.y][agent.x] += 1;
    }
    return grids;
  }

  private adjustLineageOccupancy(
    lineageOccupancy: LineageOccupancyGrid,
    lineage: number,
    x: number,
    y: number,
    delta: number
  ): void {
    let grid = lineageOccupancy.get(lineage);
    if (!grid) {
      if (delta <= 0) {
        return;
      }
      grid = Array.from({ length: this.config.height }, () => Array.from({ length: this.config.width }, () => 0));
      lineageOccupancy.set(lineage, grid);
    }

    grid[y][x] = Math.max(0, grid[y][x] + delta);
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

  private processAgentTurn(
    agent: Agent,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined
  ): void {
    agent.age += 1;
    agent.energy -= this.config.metabolismCostBase * agent.genome.metabolism;
    agent.energy -= this.specializationMetabolicPenalty(agent);
    if (agent.energy <= 0 || agent.age > this.config.maxAge) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      if (lineageOccupancy) {
        this.adjustLineageOccupancy(lineageOccupancy, agent.lineage, agent.x, agent.y, -1);
      }
      return;
    }

    const previousX = agent.x;
    const previousY = agent.y;
    const destination = this.pickDestination(agent, occupancy, lineageOccupancy);
    const moved = destination.x !== agent.x || destination.y !== agent.y;
    agent.x = destination.x;
    agent.y = destination.y;

    if (moved) {
      occupancy[previousY][previousX] = Math.max(0, occupancy[previousY][previousX] - 1);
      occupancy[agent.y][agent.x] += 1;
      if (lineageOccupancy) {
        this.adjustLineageOccupancy(lineageOccupancy, agent.lineage, previousX, previousY, -1);
        this.adjustLineageOccupancy(lineageOccupancy, agent.lineage, agent.x, agent.y, 1);
      }
      agent.energy -= this.config.moveCost * agent.genome.metabolism;
    }
    if (agent.energy <= 0) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      if (lineageOccupancy) {
        this.adjustLineageOccupancy(lineageOccupancy, agent.lineage, agent.x, agent.y, -1);
      }
      return;
    }

    const available = this.resources[agent.y][agent.x];
    const habitatEfficiency = this.habitatMatchEfficiency(agent, agent.x, agent.y);
    const trophicEfficiency = this.trophicForagingEfficiency(agent.species, agent.lineage);
    const defenseEfficiency = this.defenseForagingEfficiency(agent.species, agent.lineage);
    const lineageCrowdingEfficiency = lineageOccupancy
      ? this.lineageHarvestCrowdingEfficiency(agent, lineageOccupancy)
      : 1;
    const harvestAmount = Math.min(
      available,
      this.config.harvestCap *
        agent.genome.harvest *
        habitatEfficiency *
        trophicEfficiency *
        defenseEfficiency *
        lineageCrowdingEfficiency
    );
    this.resources[agent.y][agent.x] -= harvestAmount;
    agent.energy += harvestAmount;
  }

  private pickDestination(
    agent: Agent,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined
  ): { x: number; y: number } {
    const options = [
      { x: agent.x, y: agent.y },
      { x: this.wrapX(agent.x + 1), y: agent.y },
      { x: this.wrapX(agent.x - 1), y: agent.y },
      { x: agent.x, y: this.wrapY(agent.y + 1) },
      { x: agent.x, y: this.wrapY(agent.y - 1) }
    ];

    let best = options[0];
    let bestScore = -Infinity;
    const lineagePenalty = Math.max(0, this.config.lineageDispersalCrowdingPenalty);

    for (const option of options) {
      const score = this.localEcologyScore(
        agent,
        option.x,
        option.y,
        occupancy,
        lineageOccupancy,
        lineagePenalty,
        { x: agent.x, y: agent.y },
        this.rng.float() * 0.05
      );
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }

    return best;
  }

  private neighborhoodCrowding(x: number, y: number, occupancy: number[][]): number {
    const radius = this.normalizedDispersalRadius();
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

  private lineageHarvestCrowdingEfficiency(
    agent: Pick<Agent, 'lineage' | 'x' | 'y'>,
    lineageOccupancy: LineageOccupancyGrid
  ): number {
    const penalty = Math.max(0, this.config.lineageHarvestCrowdingPenalty);
    if (penalty === 0) {
      return 1;
    }

    const crowding = this.sameLineageNeighborhoodCrowding(agent, lineageOccupancy);
    if (crowding <= 0) {
      return 1;
    }

    return Math.max(0.05, 1 / (1 + penalty * crowding));
  }

  private sameLineageNeighborhoodCrowding(
    agent: Pick<Agent, 'lineage' | 'x' | 'y'>,
    lineageOccupancy: LineageOccupancyGrid
  ): number {
    return this.sameLineageNeighborhoodCrowdingAt(agent.lineage, agent.x, agent.y, lineageOccupancy, {
      x: agent.x,
      y: agent.y
    });
  }

  private sameLineageNeighborhoodCrowdingAt(
    lineage: number,
    x: number,
    y: number,
    lineageOccupancy: LineageOccupancyGrid,
    excludedPosition?: { x: number; y: number }
  ): number {
    return this.sameLineageNeighborhoodStatsAt(lineage, x, y, lineageOccupancy, excludedPosition).weightedCount;
  }

  private sameLineageNeighborhoodStatsAt(
    lineage: number,
    x: number,
    y: number,
    lineageOccupancy: LineageOccupancyGrid,
    excludedPosition?: { x: number; y: number }
  ): { weightedCount: number; totalWeight: number } {
    const grid = lineageOccupancy.get(lineage);
    if (!grid) {
      return { weightedCount: 0, totalWeight: 0 };
    }

    const width = this.config.width;
    const excludedIndex =
      excludedPosition === undefined
        ? -1
        : this.cellIndex(excludedPosition.x, excludedPosition.y);

    let weightedCount = 0;
    let totalWeight = 0;
    for (const [index, distance] of this.neighborhoodCellDistances(x, y)) {
      const cellX = index % width;
      const cellY = Math.floor(index / width);
      const rawCount = grid[cellY][cellX];
      const count = index === excludedIndex ? Math.max(0, rawCount - 1) : rawCount;
      if (count <= 0) {
        totalWeight += 1 / (distance + 1);
        continue;
      }
      const weight = 1 / (distance + 1);
      weightedCount += count * weight;
      totalWeight += weight;
    }

    return { weightedCount, totalWeight };
  }

  private neighborhoodCellDistances(x: number, y: number): Map<number, number> {
    const radius = this.normalizedDispersalRadius();
    const cellDistances = new Map<number, number>();
    const centerX = this.wrapX(x);
    const centerY = this.wrapY(y);

    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance > radius) {
          continue;
        }

        const index = this.cellIndex(centerX + dx, centerY + dy);
        const current = cellDistances.get(index);
        if (current === undefined || distance < current) {
          cellDistances.set(index, distance);
        }
      }
    }

    return cellDistances;
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
        const trophicGap =
          this.blendedTrophicLevel(dominant.species, dominant.lineage) -
          this.blendedTrophicLevel(target.species, target.lineage);
        const predationMultiplier = 1 + Math.max(0, this.config.predationPressure) * Math.max(0, trophicGap);
        const mitigation = clamp(this.config.defenseMitigation, 0, 0.95);
        const defenseMultiplier = Math.max(
          0.05,
          1 - mitigation * this.blendedDefenseLevel(target.species, target.lineage)
        );
        const lineageMultiplier = this.encounterLineageTransferMultiplier(dominant, target);
        const stolen = Math.min(
          target.energy,
          target.energy * pressure * 0.25 * predationMultiplier * defenseMultiplier * lineageMultiplier
        );
        if (stolen <= 0) {
          continue;
        }
        target.energy -= stolen;
        dominant.energy += stolen;
      }
    }
  }

  private reproduce(
    parent: Agent,
    occupancy?: number[][],
    lineageOccupancy?: LineageOccupancyGrid
  ): Agent {
    const childEnergy = parent.energy * this.config.offspringEnergyFraction;
    parent.energy -= childEnergy;
    const childGenome = this.mutateGenome(parent.genome);
    const diverged = genomeDistance(parent.genome, childGenome) >= this.config.speciationThreshold;
    const childSpecies = diverged ? this.nextSpeciesId++ : parent.species;
    if (diverged) {
      this.speciesHabitatPreference.set(
        childSpecies,
        resolveMutatedSpeciesHabitatPreference({
          parentSpecies: parent.species,
          parentGenome: parent.genome,
          childGenome,
          speciesHabitatPreference: this.speciesHabitatPreference,
          config: this.config
        })
      );
      const parentTrophic = this.getSpeciesTrophicLevel(parent.species);
      const trophicDelta = this.trophicDeltaFromMutation(parent.genome, childGenome);
      this.speciesTrophicLevel.set(childSpecies, clamp(parentTrophic + trophicDelta, 0, 1));
      const parentDefense = this.getSpeciesDefenseLevel(parent.species);
      const defenseDelta = this.defenseDeltaFromMutation(parent.genome, childGenome);
      this.speciesDefenseLevel.set(childSpecies, clamp(parentDefense + defenseDelta, 0, 1));
    }
    const settlementAgent = {
      ...parent,
      species: childSpecies,
      genome: childGenome
    };
    const useSettlementLineageOccupancy = usesOffspringSettlementLineageOccupancy(this.config);
    const buildSettlementContext = (required = true) =>
      resolveOffspringSettlementContext({
        config: this.config,
        agents: this.agents,
        occupancy,
        lineageOccupancy,
        required,
        usesLineageOccupancy: useSettlementLineageOccupancy,
        buildOccupancyGrid: (agents) => this.buildOccupancyGrid(agents),
        buildLineageOccupancyGrid: (agents) => this.buildLineageOccupancyGrid(agents)
      });
    const settlementContext = buildSettlementContext(usesOffspringSettlementContext(this.config));
    const childPos = this.pickOffspringSettlement(settlementAgent, settlementContext);
    const cladogenesisContext = settlementContext ?? buildSettlementContext(usesCladogenesisEcologyGate(this.config));
    const foundNewClade = shouldFoundNewClade({
      config: this.config,
      parentLineage: parent.lineage,
      diverged,
      childGenome,
      settlementAgent,
      childPos,
      settlementContext: cladogenesisContext,
      genomeDistance,
      getCladeFounderGenome: (lineage) => this.getCladeFounderGenome(lineage),
      getSpeciesHabitatPreference: (species) => this.getSpeciesHabitatPreference(species),
      getCladeHabitatPreference: (lineage) => this.getCladeHabitatPreference(lineage),
      getSpeciesTrophicLevel: (species) => this.getSpeciesTrophicLevel(species),
      getCladeTrophicLevel: (lineage) => this.getCladeTrophicLevel(lineage),
      getSpeciesDefenseLevel: (species) => this.getSpeciesDefenseLevel(species),
      getCladeDefenseLevel: (lineage) => this.getCladeDefenseLevel(lineage),
      resolveSettlementContext: () => buildSettlementContext(),
      localEcologyScore: (
        agent,
        x,
        y,
        nextOccupancy,
        nextLineageOccupancy,
        lineagePenalty,
        excludedPosition,
        jitter
      ) =>
        this.localEcologyScore(
          agent,
          x,
          y,
          nextOccupancy,
          nextLineageOccupancy,
          lineagePenalty,
          excludedPosition,
          jitter
        )
    });
    const nextLineage = foundNewClade ? this.foundClade(childGenome, childPos.x, childPos.y) : parent.lineage;
    this.adaptCladeHabitatPreference(nextLineage, childPos.x, childPos.y);

    return {
      id: this.nextAgentId++,
      lineage: nextLineage,
      species: childSpecies,
      x: childPos.x,
      y: childPos.y,
      energy: childEnergy,
      age: 0,
      genome: childGenome
    };
  }

  private pickOffspringSettlement(
    parent: SettlementAgent,
    settlementContext?: OffspringSettlementContext
  ): SettlementPosition {
    return pickSettlementSite({
      parent,
      settlementContext,
      useSettlementEcologyScore: usesOffspringSettlementScoring(this.config),
      useDisturbanceOpeningBonus: resolveDisturbanceSettlementOpeningConfig(this.config).enabled,
      currentStepTick: this.tickCount + 1,
      wrapX: (x) => this.wrapX(x),
      wrapY: (y) => this.wrapY(y),
      pickRandomNeighbor: (neighbors) => this.rng.pick(neighbors),
      randomJitter: () => this.rng.float() * 0.05,
      localEcologyScore: (
        agent,
        x,
        y,
        occupancy,
        lineageOccupancy,
        lineagePenalty,
        excludedPosition,
        jitter
      ) =>
        this.localEcologyScore(
          agent,
          x,
          y,
          occupancy,
          lineageOccupancy,
          lineagePenalty,
          excludedPosition,
          jitter
        ),
      disturbanceSettlementOpeningBonusAt: (x, y, currentStepTick) =>
        this.disturbanceSettlementOpeningBonusAt(parent, settlementContext, x, y, currentStepTick)
    });
  }

  private localEcologyScore(
    agent: SettlementAgent,
    x: number,
    y: number,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined,
    lineagePenalty: number,
    excludedPosition: { x: number; y: number } | undefined,
    jitter: number
  ): number {
    return resolveSettlementEcologyScore({
      config: this.config,
      tickCount: this.tickCount,
      cladeHistory: this.cladeHistory,
      agent,
      x,
      y,
      occupancy,
      lineageOccupancy,
      lineagePenalty,
      excludedPosition,
      jitter,
      resourceAt: (cellX, cellY) => this.resources[this.wrapY(cellY)][this.wrapX(cellX)],
      habitatMatchEfficiencyAt: (nextAgent, cellX, cellY) =>
        this.habitatMatchEfficiency(nextAgent, this.wrapX(cellX), this.wrapY(cellY)),
      neighborhoodCrowdingAt: (cellX, cellY, nextOccupancy) => this.neighborhoodCrowding(cellX, cellY, nextOccupancy),
      sameLineageNeighborhoodCrowdingAt: (lineage, cellX, cellY, nextLineageOccupancy, nextExcludedPosition) =>
        this.sameLineageNeighborhoodCrowdingAt(lineage, cellX, cellY, nextLineageOccupancy, nextExcludedPosition)
    });
  }

  private encounterLineageTransferMultiplier(
    dominant: Pick<Agent, 'lineage'>,
    target: Pick<Agent, 'lineage'>
  ): number {
    return resolveEncounterLineageTransferMultiplier({
      config: this.config,
      tickCount: this.tickCount,
      dominantLineage: dominant.lineage,
      targetLineage: target.lineage,
      cladeHistory: this.cladeHistory
    });
  }

  private usesAdultLineageOccupancy(): boolean {
    return this.config.lineageDispersalCrowdingPenalty > 0 || this.config.lineageHarvestCrowdingPenalty > 0;
  }

  private foundClade(founderGenome: Genome, founderX: number, founderY: number): number {
    const lineage = this.nextLineageId++;
    this.cladeFounderGenome.set(lineage, copyGenome(founderGenome));
    setFoundCladeHabitatPreference({
      cladeHabitatPreference: this.cladeHabitatPreference,
      lineage,
      fertility: this.effectiveBiomeFertilityAt(founderX, founderY, this.tickCount + 1)
    });
    return lineage;
  }

  private adaptCladeHabitatPreference(lineage: number, x: number, y: number): void {
    updateCladeHabitatPreference({
      cladeHabitatPreference: this.cladeHabitatPreference,
      lineage,
      fertility: this.effectiveBiomeFertilityAt(x, y, this.tickCount + 1),
      config: this.config
    });
  }

  private getCladeFounderGenome(lineage: number): Genome {
    const existing = this.cladeFounderGenome.get(lineage);
    if (existing !== undefined) {
      return existing;
    }

    const founder = this.agents.find((agent) => agent.lineage === lineage)?.genome ?? MIN_GENOME;
    const genome = copyGenome(founder);
    this.cladeFounderGenome.set(lineage, genome);
    return genome;
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

  private habitatMatchEfficiency(agent: Pick<Agent, 'species' | 'lineage'>, x: number, y: number): number {
    return calculateHabitatMatchEfficiency({
      agent,
      fertility: this.effectiveBiomeFertilityAt(x, y, this.tickCount + 1),
      speciesHabitatPreference: this.speciesHabitatPreference,
      cladeHabitatPreference: this.cladeHabitatPreference,
      config: this.config
    });
  }

  private getSpeciesHabitatPreference(species: number): number {
    return lookupSpeciesHabitatPreference(this.speciesHabitatPreference, species);
  }

  private getCladeHabitatPreference(lineage: number): number {
    return lookupCladeHabitatPreference(this.cladeHabitatPreference, lineage);
  }

  private trophicForagingEfficiency(species: number, lineage: number): number {
    const penalty = clamp(this.config.trophicForagingPenalty, 0, 0.95);
    return Math.max(0.05, 1 - penalty * this.blendedTrophicLevel(species, lineage));
  }

  private defenseForagingEfficiency(species: number, lineage: number): number {
    const penalty = clamp(this.config.defenseForagingPenalty, 0, 0.95);
    return Math.max(0.05, 1 - penalty * this.blendedDefenseLevel(species, lineage));
  }

  private blendedTrophicLevel(species: number, lineage: number): number {
    const speciesLevel = this.getSpeciesTrophicLevel(species);
    const coupling = clamp(this.config.cladeInteractionCoupling, 0, 1);
    if (coupling === 0) {
      return speciesLevel;
    }
    const cladeLevel = this.getCladeTrophicLevel(lineage);
    return clamp(speciesLevel * (1 - coupling) + cladeLevel * coupling, 0, 1);
  }

  private blendedDefenseLevel(species: number, lineage: number): number {
    const speciesLevel = this.getSpeciesDefenseLevel(species);
    const coupling = clamp(this.config.cladeInteractionCoupling, 0, 1);
    if (coupling === 0) {
      return speciesLevel;
    }
    const cladeLevel = this.getCladeDefenseLevel(lineage);
    return clamp(speciesLevel * (1 - coupling) + cladeLevel * coupling, 0, 1);
  }

  private getCladeTrophicLevel(lineage: number): number {
    return this.genomeTrophicSignal(this.getCladeFounderGenome(lineage));
  }

  private getCladeDefenseLevel(lineage: number): number {
    return this.genomeDefenseSignal(this.getCladeFounderGenome(lineage));
  }

  private getSpeciesTrophicLevel(species: number): number {
    const existing = this.speciesTrophicLevel.get(species);
    if (existing !== undefined) {
      return existing;
    }
    this.speciesTrophicLevel.set(species, 0);
    return 0;
  }

  private getSpeciesDefenseLevel(species: number): number {
    const existing = this.speciesDefenseLevel.get(species);
    if (existing !== undefined) {
      return existing;
    }
    this.speciesDefenseLevel.set(species, 0);
    return 0;
  }

  private trophicDeltaFromMutation(parent: Genome, child: Genome): number {
    const mutationScale = Math.max(0, this.config.trophicMutation);
    if (mutationScale === 0) {
      return 0;
    }
    const aggressionShift = child.aggression - parent.aggression;
    const harvestShift = parent.harvest - child.harvest;
    const signal = aggressionShift * 0.7 + harvestShift * 0.3;
    return clamp(signal, -1, 1) * mutationScale;
  }

  private defenseDeltaFromMutation(parent: Genome, child: Genome): number {
    const mutationScale = Math.max(0, this.config.defenseMutation);
    if (mutationScale === 0) {
      return 0;
    }
    const aggressionShift = parent.aggression - child.aggression;
    const metabolismShift = child.metabolism - parent.metabolism;
    const signal = aggressionShift * 0.65 + metabolismShift * 0.35;
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

  private normalizedDispersalRadius(): number {
    return Math.max(0, Math.floor(this.config.dispersalRadius));
  }

  private regenerateResources(): void {
    const stepTick = this.tickCount + 1;
    const regenMultiplier = this.seasonalRegenMultiplierForTick(stepTick);
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        const fertility = this.effectiveBiomeFertilityAt(x, y, stepTick);
        this.resources[y][x] = clamp(
          this.resources[y][x] + this.config.resourceRegen * regenMultiplier * fertility,
          0,
          this.config.maxResource
        );
      }
    }
  }

  private applyDisturbanceIfScheduled(stepTick: number): void {
    if (!shouldApplyDisturbance(resolveDisturbanceSchedule(this.config), stepTick)) {
      return;
    }

    const energyLoss = clamp(this.config.disturbanceEnergyLoss, 0, 1);
    const resourceLoss = clamp(this.config.disturbanceResourceLoss, 0, 1);
    if (energyLoss <= 0 && resourceLoss <= 0) {
      return;
    }
    const { targetedCellIndices, affectedCellIndices } = buildDisturbanceCellSets({
      width: this.config.width,
      height: this.config.height,
      footprint: resolveDisturbanceFootprintConfig(this.config),
      pickRandomX: (width) => this.rng.int(width),
      pickRandomY: (height) => this.rng.int(height),
      shuffle: (values) => this.rng.shuffle(values)
    });
    if (affectedCellIndices.size === 0) {
      return;
    }
    this.markDisturbanceSettlementOpenings(affectedCellIndices, stepTick);

    const populationBefore = this.agents.filter((agent) => agent.energy > 0).length;
    const activeSpeciesBefore = this.activeSpeciesCountFromLivingAgents();
    const totalResourcesBefore = this.totalResources();

    if (resourceLoss > 0) {
      const resourceMultiplier = 1 - resourceLoss;
      for (const index of affectedCellIndices) {
        const x = index % this.config.width;
        const y = Math.floor(index / this.config.width);
        this.resources[y][x] = clamp(this.resources[y][x] * resourceMultiplier, 0, this.config.maxResource);
      }
    }

    if (energyLoss > 0) {
      const energyMultiplier = 1 - energyLoss;
      for (const agent of this.agents) {
        const cellIndex = agent.y * this.config.width + agent.x;
        if (!affectedCellIndices.has(cellIndex)) {
          continue;
        }
        agent.energy *= energyMultiplier;
      }
    }

    const populationAfterShock = this.agents.filter((agent) => agent.energy > 0).length;
    const activeSpeciesAfterShock = this.activeSpeciesCountFromLivingAgents();
    const totalResourcesAfterShock = this.totalResources();

    this.disturbanceEvents.push(createDisturbanceEvent({
      tick: stepTick,
      populationBefore,
      populationAfterShock,
      activeSpeciesBefore,
      activeSpeciesAfterShock,
      totalResourcesBefore,
      totalResourcesAfterShock,
      targetedCells: targetedCellIndices.length,
      affectedCells: affectedCellIndices.size,
      totalCells: this.config.width * this.config.height
    }));
  }

  private markDisturbanceSettlementOpenings(affectedCellIndices: ReadonlySet<number>, stepTick: number): void {
    markDisturbanceSettlementOpenings(
      this.disturbanceSettlementOpenUntilTick,
      this.config.width,
      affectedCellIndices,
      stepTick,
      resolveDisturbanceSettlementOpeningConfig(this.config)
    );
  }

  private disturbanceSettlementOpeningBonusAt(
    parent: Pick<Agent, 'lineage' | 'x' | 'y'>,
    settlementContext: OffspringSettlementContext | undefined,
    x: number,
    y: number,
    currentStepTick: number
  ): number {
    const opening = resolveDisturbanceSettlementOpeningConfig(this.config);
    if (opening.lineageAbsentOnly) {
      const lineageOccupancy = settlementContext?.lineageOccupancy;
      if (!lineageOccupancy) {
        return 0;
      }

      const parentOccupiesCandidate = this.wrapX(parent.x) === this.wrapX(x) && this.wrapY(parent.y) === this.wrapY(y);
      const lineageCrowding = this.sameLineageNeighborhoodCrowdingAt(
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
      openUntilTick: disturbanceSettlementOpenUntilTickAt(this.disturbanceSettlementOpenUntilTick, x, y),
      currentStepTick,
      openingTicks: opening.openingTicks,
      openingBonus: opening.openingBonus
    });
  }

  private activeSpeciesCountFromLivingAgents(): number {
    const species = new Set<number>();
    for (const agent of this.agents) {
      if (agent.energy > 0) {
        species.add(agent.species);
      }
    }
    return species.size;
  }

  private totalResources(): number {
    let total = 0;
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        total += this.resources[y][x];
      }
    }
    return total;
  }

  private recycleDeadAgents(deadAgents: Agent[]): void {
    const stepTick = this.tickCount + 1;
    const spilloverFraction = clamp(this.config.decompositionSpilloverFraction, 0, 1);
    for (const agent of deadAgents) {
      const fertility = this.effectiveBiomeFertilityAt(agent.x, agent.y, stepTick);
      const recycled =
        (this.config.decompositionBase +
          Math.max(0, agent.energy) * this.config.decompositionEnergyFraction) *
        fertility;
      if (recycled <= 0) {
        continue;
      }
      const resourceDeltas = new Map<number, number>();
      this.accumulateResourceDelta(resourceDeltas, agent.x, agent.y, recycled * (1 - spilloverFraction));

      if (spilloverFraction > 0) {
        const cardinalShare = (recycled * spilloverFraction) / 4;
        this.accumulateResourceDelta(resourceDeltas, agent.x + 1, agent.y, cardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x - 1, agent.y, cardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x, agent.y + 1, cardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x, agent.y - 1, cardinalShare);
      }

      for (const [index, delta] of resourceDeltas) {
        const x = index % this.config.width;
        const y = Math.floor(index / this.config.width);
        this.resources[y][x] = clamp(this.resources[y][x] + delta, 0, this.config.maxResource);
      }
    }
  }

  private accumulateResourceDelta(resourceDeltas: Map<number, number>, x: number, y: number, delta: number): void {
    if (delta <= 0) {
      return;
    }

    const index = this.cellIndex(x, y);
    resourceDeltas.set(index, (resourceDeltas.get(index) ?? 0) + delta);
  }

  private effectiveBiomeFertilityAt(x: number, y: number, tick: number): number {
    const base = this.biomeFertility[this.wrapY(y)][this.wrapX(x)];
    const contrastMultiplier = this.seasonalFertilityContrastMultiplierForTick(tick);
    return clamp(1 + (base - 1) * contrastMultiplier, 0.1, 2);
  }

  private seasonalRegenMultiplierForTick(tick: number): number {
    const amplitude = clamp(this.config.seasonalRegenAmplitude, 0, 1);
    if (amplitude === 0) {
      return 1;
    }
    return Math.max(0, 1 + amplitude * this.seasonalWaveForTick(tick));
  }

  private seasonalFertilityContrastMultiplierForTick(tick: number): number {
    const amplitude = clamp(this.config.seasonalFertilityContrastAmplitude, 0, 1);
    if (amplitude === 0) {
      return 1;
    }
    return Math.max(0, 1 + amplitude * this.seasonalWaveForTick(tick));
  }

  private seasonalWaveForTick(tick: number): number {
    return Math.sin(this.seasonalPhaseForTick(tick) * Math.PI * 2);
  }

  private seasonalPhaseForTick(tick: number): number {
    const cycle = this.normalizedSeasonalCycleLength();
    if (cycle <= 1) {
      return 0;
    }
    const normalizedTick = tick <= 0 ? 0 : tick - 1;
    return (normalizedTick % cycle) / cycle;
  }

  private normalizedSeasonalCycleLength(): number {
    return Math.max(0, Math.floor(this.config.seasonalCycleLength));
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

  private cellIndex(x: number, y: number): number {
    return this.wrapY(y) * this.config.width + this.wrapX(x);
  }

  private wrapY(y: number): number {
    const height = this.config.height;
    return ((y % height) + height) % height;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTrait(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function genomeDistance(a: Genome, b: Genome): number {
  return (
    Math.abs(a.metabolism - b.metabolism) +
    Math.abs(a.harvest - b.harvest) +
    Math.abs(a.aggression - b.aggression)
  );
}

function copyGenome(genome: Genome): Genome {
  return {
    metabolism: genome.metabolism,
    harvest: genome.harvest,
    aggression: genome.aggression
  };
}
