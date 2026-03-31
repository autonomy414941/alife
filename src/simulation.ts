import {
  addAgentEnergy,
  getAgentEnergyPools,
  initializeAgentEnergy,
  scaleAgentEnergy,
  spendAgentEnergy,
  syncAgentEnergy
} from './agent-energy';
import {
  CausalTraceCollector,
  CausalTraceCollectorState,
  CausalTraceSamplingConfig,
  DEFAULT_CAUSAL_TRACE_CONFIG
} from './causal-trace';
import {
  clonePolicyState,
  cloneTransientState,
  getPolicyStateValue,
  isNearPolicyThreshold,
  resolveHarvestSecondaryPreference,
  getTransientStateValue,
  INTERNAL_STATE_LAST_HARVEST,
  POLICY_PARAMETER_KEYS,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD,
  INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST,
  INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS,
  DEFAULT_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS,
  DEFAULT_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS,
  normalizeSeedBehavioralState,
  resolveBehavioralPolicyFlags,
  setTransientStateValue,
  computeGradedMovementProbability
} from './behavioral-control';
import {
  getCladeHabitatPreference as lookupCladeHabitatPreference,
  getSpeciesHabitatPreference as lookupSpeciesHabitatPreference,
  habitatMatchEfficiency as calculateHabitatMatchEfficiency,
  initializeCladeHabitatPreferences as seedInitialCladeHabitatPreferences,
  initializeSpeciesHabitatPreferences as seedInitialSpeciesHabitatPreferences
} from './clade-habitat';
import {
  cloneGenomeV2,
  genomeV2HasTraitRole,
  getTrait,
  hasTrait,
  listTraits,
  traitCount
} from './genome-v2';
import {
  DEFAULT_DEFENSE_LEVEL,
  DEFAULT_TROPHIC_LEVEL,
  defenseLevelTraitWithFallback,
  trophicLevelTraitWithFallback
} from './interaction-traits';
import {
  DisturbanceEventState,
  buildDisturbanceCellSets,
  countDisturbanceEventsInWindow,
  createDisturbanceEvent,
  latestDisturbanceEvent,
  markDisturbanceSettlementOpenings,
  resolveDisturbanceFootprintConfig,
  resolveDisturbanceSchedule,
  resolveDisturbanceSettlementOpeningConfig,
  shouldApplyDisturbance,
  updateDisturbanceEventState
} from './disturbance';
import {
  LineageOccupancyGrid
} from './reproduction';
import {
  EncounterOperator,
  EncounterOperatorContext,
  dominantEncounterOperator
} from './encounter';
import {
  resolveDualResourceHarvest,
  resolveHarvestPolicyPayoffMultiplier,
  resolveResourceHarvestShares
} from './resource-harvest';
import {
  binPolicyFitnessValue,
  DEFAULT_POLICY_FITNESS_AGE_BINS,
  DEFAULT_POLICY_FITNESS_CROWDING_BINS,
  DEFAULT_POLICY_FITNESS_FERTILITY_BINS,
  PolicyFitnessRecord,
  PolicyFitnessRunSeries,
  resolveDisturbancePhase
} from './policy-fitness';
import { PolicyDecisionStats, summarizePolicyObservability } from './policy-observability';
import {
  summarizePhenotypeDiversity,
  summarizePolicySensitivePhenotypeDiversity
} from './phenotype-diversity';
import { Rng } from './rng';
import {
  countExtinctionsInWindow,
  countOriginationsInWindow,
  SimulationEvolutionHistory,
  SimulationEvolutionHistoryState
} from './simulation-evolution-history';
import { TaxonHistoryState } from './simulation-history';
import { reproduceInSimulation, resolveSimulationLocalEcologyScore } from './simulation-offspring';
import { runReproductionPhase } from './simulation-reproduction';
import { resolveEncounterLineageTransferMultiplier } from './settlement-cladogenesis';
import {
  adjustLineageOccupancy,
  buildLineageOccupancyGrid,
  buildOccupancyGrid,
  neighborhoodCrowding,
  sameLineageNeighborhoodCrowdingAt
} from './settlement-spatial';
import {
  Agent,
  AgentSeed,
  DisturbanceAnalytics,
  DescentEdge,
  EvolutionAnalyticsSnapshot,
  ForcingAnalytics,
  EvolutionHistorySnapshot,
  Genome,
  GenomeV2,
  GenomeV2Metrics,
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
  maxResource2: 0,
  resourceRegen: 0.6,
  resource2Regen: 0,
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
  reproductionMinPrimaryFraction: 0,
  reproductionMinSecondaryFraction: 0,
  mutationAmount: 0.2,
  policyMutationProbability: 0.5,
  policyMutationMagnitude: 0.3,
  speciationThreshold: 0.25,
  cladogenesisThreshold: -1,
  genomeV2DistanceWeights: {
    categories: {
      policyThreshold: 0.25,
      policyBounded: 0.5
    }
  },
  maxAge: 120
};

export function resolveSimulationConfig(config: Partial<SimulationConfig> = {}): SimulationConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

const MIN_GENOME: Genome = {
  metabolism: 0.3,
  harvest: 0.4,
  aggression: 0,
  harvestEfficiency2: 0.4
};

const MAX_GENOME: Genome = {
  metabolism: 2.2,
  harvest: 2.8,
  aggression: 1,
  harvestEfficiency2: 2.8
};

export interface LifeSimulationOptions {
  seed?: number;
  config?: Partial<SimulationConfig>;
  initialAgents?: AgentSeed[];
  encounterOperator?: EncounterOperator;
  policyCouplingEnabled?: boolean;
}

export interface SimulationLocalityFrameState {
  dominantSpeciesByCell: number[];
  dominanceSharesByOccupiedCell: number[];
  speciesRichnessByOccupiedCell: number[];
  neighborhoodDominantSpeciesByCell: number[];
  neighborhoodDominanceSharesByOccupiedCell: number[];
  neighborhoodSpeciesRichnessByOccupiedCell: number[];
  neighborhoodCenterDominantAlignmentByOccupiedCell: number[];
  occupiedCells: number;
}

type LocalityFrame = SimulationLocalityFrameState;

type MovementGateReason = 'none' | 'energy_reserve' | 'recent_harvest';

interface MovementDecisionOutcome {
  x: number;
  y: number;
  policyGated: boolean;
  gateReason: MovementGateReason;
  energyReservePolicyActive: boolean;
  recentHarvestPolicyActive: boolean;
  energyReserveNearThreshold: boolean;
  recentHarvestNearThreshold: boolean;
}

export interface SimulationStorageDiagnostics {
  cladeHistories: number;
  speciesHistories: number;
  cladeTimelinePoints: number;
  speciesTimelinePoints: number;
  timelineNumericSlotsRetained: number;
  localityFramesRetained: number;
  localityFullCellSlotsRetained: number;
  localityOccupiedMetricSlotsRetained: number;
  localityNumericSlotsRetained: number;
  estimatedRetainedBytesLowerBound: number;
}

export interface LifeSimulationReplayState {
  tickCount: number;
  rngState: number;
  config: SimulationConfig;
  policyCouplingEnabled: boolean;
  biomeFertility: number[][];
  resources: number[][];
  resources2: number[][];
  agents: Agent[];
  nextAgentId: number;
  nextSpeciesId: number;
  nextLineageId: number;
  evolutionHistory: SimulationEvolutionHistoryState;
  cladeFounderGenome: Array<[number, Genome]>;
  cladeFounderGenomeV2: Array<[number, GenomeV2]>;
  cladeHabitatPreference: Array<[number, number]>;
  speciesHabitatPreference: Array<[number, number]>;
  speciesTrophicLevel: Array<[number, number]>;
  speciesDefenseLevel: Array<[number, number]>;
  localityFrames: SimulationLocalityFrameState[];
  disturbanceEvents: DisturbanceEventState[];
  disturbanceSettlementOpenUntilTick: number[][];
  lastStepPolicyFitnessRecords: PolicyFitnessRecord[];
  causalTrace: CausalTraceCollectorState;
}

export interface LifeSimulationReplayOptions {
  encounterOperator?: EncounterOperator;
  policyCouplingEnabled?: boolean;
}

interface LifeSimulationRestoreOptions extends LifeSimulationReplayOptions {
  replayState: LifeSimulationReplayState;
}

export class LifeSimulation {
  private readonly rng: Rng;

  private readonly config: SimulationConfig;

  private readonly encounterOperator: EncounterOperator;

  private readonly policyCouplingEnabled: boolean;

  private readonly biomeFertility: number[][];

  private resources: number[][];

  private resources2: number[][];

  private agents: Agent[];

  private tickCount = 0;

  private nextAgentId = 1;

  private nextSpeciesId = 1;

  private nextLineageId = 1;

  private readonly evolutionHistory = new SimulationEvolutionHistory();

  private readonly cladeFounderGenome = new Map<number, Genome>();

  private readonly cladeFounderGenomeV2 = new Map<number, GenomeV2>();

  private readonly cladeHabitatPreference = new Map<number, number>();

  private readonly speciesHabitatPreference = new Map<number, number>();

  private readonly speciesTrophicLevel = new Map<number, number>();

  private readonly speciesDefenseLevel = new Map<number, number>();

  private readonly localityFrames: LocalityFrame[] = [];

  private readonly disturbanceEvents: DisturbanceEventState[] = [];

  private readonly disturbanceSettlementOpenUntilTick: number[][];

  private lastStepPolicyFitnessRecords: PolicyFitnessRecord[] = [];

  private readonly causalTraceCollector: CausalTraceCollector;

  constructor(options?: LifeSimulationOptions);
  constructor(options: LifeSimulationRestoreOptions);
  constructor(options: LifeSimulationOptions | LifeSimulationRestoreOptions = {}) {
    if ('replayState' in options) {
      const replayState = options.replayState;
      this.config = resolveSimulationConfig(replayState.config);
      this.encounterOperator = options.encounterOperator ?? dominantEncounterOperator;
      this.policyCouplingEnabled = options.policyCouplingEnabled ?? replayState.policyCouplingEnabled;
      this.rng = new Rng(replayState.rngState);
      const causalTraceConfig: CausalTraceSamplingConfig = {
        enabled: this.config.causalTraceEnabled ?? DEFAULT_CAUSAL_TRACE_CONFIG.enabled,
        samplingRate: this.config.causalTraceSamplingRate ?? DEFAULT_CAUSAL_TRACE_CONFIG.samplingRate,
        maxEventsPerTick: this.config.causalTraceMaxEventsPerTick ?? DEFAULT_CAUSAL_TRACE_CONFIG.maxEventsPerTick,
        trackEventTypes: DEFAULT_CAUSAL_TRACE_CONFIG.trackEventTypes
      };
      this.causalTraceCollector = new CausalTraceCollector(causalTraceConfig);
      this.biomeFertility = cloneGrid(replayState.biomeFertility);
      this.resources = cloneGrid(replayState.resources);
      this.resources2 = cloneGrid(replayState.resources2);
      this.disturbanceSettlementOpenUntilTick = cloneGrid(replayState.disturbanceSettlementOpenUntilTick);
      this.agents = replayState.agents.map((agent) => cloneAgent(agent));
      this.tickCount = replayState.tickCount;
      this.nextAgentId = replayState.nextAgentId;
      this.nextSpeciesId = replayState.nextSpeciesId;
      this.nextLineageId = replayState.nextLineageId;
      this.restoreReplayState(replayState);
      return;
    }

    this.config = resolveSimulationConfig(options.config);
    this.encounterOperator = options.encounterOperator ?? dominantEncounterOperator;
    this.policyCouplingEnabled = options.policyCouplingEnabled ?? true;
    this.rng = new Rng(options.seed ?? 1);
    const causalTraceConfig: CausalTraceSamplingConfig = {
      enabled: this.config.causalTraceEnabled ?? DEFAULT_CAUSAL_TRACE_CONFIG.enabled,
      samplingRate: this.config.causalTraceSamplingRate ?? DEFAULT_CAUSAL_TRACE_CONFIG.samplingRate,
      maxEventsPerTick: this.config.causalTraceMaxEventsPerTick ?? DEFAULT_CAUSAL_TRACE_CONFIG.maxEventsPerTick,
      trackEventTypes: DEFAULT_CAUSAL_TRACE_CONFIG.trackEventTypes
    };
    this.causalTraceCollector = new CausalTraceCollector(causalTraceConfig);
    this.biomeFertility = this.buildBiomeFertility();
    this.resources = this.buildInitialResources(this.config.maxResource);
    this.resources2 = this.usesSecondResourceLayer()
      ? this.buildInitialResources(this.config.maxResource2)
      : this.buildZeroGrid();
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
    const nextTick = this.tickCount + 1;
    const policyDecisionStats: PolicyDecisionStats = {
      harvestDecisions: 0,
      harvestPolicyGuided: 0,
      movement: {
        decisions: 0,
        policyGated: 0,
        energyReservePolicyActive: 0,
        recentHarvestPolicyActive: 0,
        blockedByEnergyReserve: 0,
        blockedByRecentHarvest: 0,
        energyReserveNearThreshold: 0,
        recentHarvestNearThreshold: 0
      },
      reproduction: {
        decisions: 0,
        policyGated: 0,
        harvestThresholdPolicyActive: 0,
        suppressedByHarvestThreshold: 0,
        harvestThresholdNearThreshold: 0
      }
    };

    this.regenerateResources();
    this.applyDisturbanceIfScheduled(nextTick);

    const occupancy = buildOccupancyGrid(this.config.width, this.config.height, this.agents);
    const lineageOccupancy = this.usesAdultLineageOccupancy()
      ? buildLineageOccupancyGrid(this.config.width, this.config.height, this.agents)
      : undefined;
    const descentEdges: DescentEdge[] = [];
    const policyFitnessByAgentId = this.initializePolicyFitnessTracking(nextTick, occupancy);
    const turnOrder = this.rng.shuffle([...this.agents]);
    for (const agent of turnOrder) {
      if (!this.isAlive(agent.id)) {
        continue;
      }
      this.processAgentTurn(agent, occupancy, lineageOccupancy, policyFitnessByAgentId, policyDecisionStats);
    }

    this.resolveEncounters();

    const {
      offspring,
      founderOccupancy,
      birthsByParentId,
      policyGatedAgentIds,
      decisionStats: reproductionDecisionStats
    } =
      runReproductionPhase({
      agents: this.agents,
      config: this.config,
      isAlive: (agentId) => this.isAlive(agentId),
      randomFloat: () => this.rng.float(),
      buildOccupancyGrid: (agents) => buildOccupancyGrid(this.config.width, this.config.height, agents),
      buildLineageOccupancyGrid: (agents) =>
        buildLineageOccupancyGrid(this.config.width, this.config.height, agents),
      adjustLineageOccupancy: (occupancy, lineage, x, y, delta) =>
        adjustLineageOccupancy({
          width: this.config.width,
          height: this.config.height,
          lineageOccupancy: occupancy,
          lineage,
          x,
          y,
          delta
        }),
      reproduce: (parent, occupancy, lineageOccupancy) => this.reproduce(parent, occupancy, lineageOccupancy),
      recordDescent: (edge) => {
        descentEdges.push(edge);
        this.causalTraceCollector.recordEvent(
          {
            type: 'reproduction',
            tick: edge.tick,
            parentId: edge.parentId,
            parentLineage: edge.parentLineage,
            parentSpecies: edge.parentSpecies,
            parentX: edge.parentX,
            parentY: edge.parentY,
            offspringId: edge.offspringId,
            offspringLineage: edge.offspringLineage,
            offspringSpecies: edge.offspringSpecies,
            x: edge.settlement.x,
            y: edge.settlement.y,
            parentEnergy: edge.reproduction.parentEnergy,
            offspringEnergy: edge.reproduction.offspringEnergy,
            policyGated: edge.reproduction.policyGated,
            localFertility: edge.reproduction.localFertility,
            localCrowding: edge.reproduction.localCrowding,
            speciationOccurred: edge.reproduction.speciationOccurred,
            foundedNewClade: edge.reproduction.foundedNewClade,
            phenotypeDelta: edge.phenotypeDelta
          },
          () => this.rng.float()
        );
        this.causalTraceCollector.recordEvent(
          {
            type: 'settlement',
            tick: edge.tick,
            parentId: edge.parentId,
            parentLineage: edge.parentLineage,
            offspringId: edge.offspringId,
            offspringLineage: edge.offspringLineage,
            offspringSpecies: edge.offspringSpecies,
            phenotypeDelta: edge.phenotypeDelta,
            parentSpecies: edge.parentSpecies,
            x: edge.settlement.x,
            y: edge.settlement.y,
            settled: edge.settlement.settled,
            movedFromParentCell: edge.settlement.movedFromParentCell,
            localFertility: edge.settlement.localFertility,
            localCrowding: edge.settlement.localCrowding,
            sameLineageCrowding: edge.settlement.sameLineageCrowding
          },
          () => this.rng.float()
        );
      },
      policyCouplingEnabled: this.policyCouplingEnabled
      });
    policyDecisionStats.reproduction.decisions = reproductionDecisionStats.evaluated;
    policyDecisionStats.reproduction.policyGated = reproductionDecisionStats.policyGated;
    policyDecisionStats.reproduction.harvestThresholdPolicyActive =
      reproductionDecisionStats.harvestThresholdPolicyActive;
    policyDecisionStats.reproduction.suppressedByHarvestThreshold =
      reproductionDecisionStats.suppressedByHarvestThreshold;
    policyDecisionStats.reproduction.harvestThresholdNearThreshold =
      reproductionDecisionStats.harvestThresholdNearThreshold;
    this.recordPolicyFitnessBirths(policyFitnessByAgentId, birthsByParentId);
    this.recordPolicyFitnessReproductionGating(policyFitnessByAgentId, policyGatedAgentIds);
    const births = offspring.length;
    this.agents.push(...offspring);

    const survivors: Agent[] = [];
    const deadAgents: Agent[] = [];
    for (const agent of this.agents) {
      if (agent.energy > 0 && agent.age <= this.config.maxAge) {
        survivors.push(agent);
      } else {
        deadAgents.push(agent);
        this.causalTraceCollector.recordEvent(
          {
            type: 'death',
            tick: nextTick,
            agentId: agent.id,
            lineage: agent.lineage,
            species: agent.species,
            x: agent.x,
            y: agent.y,
            age: agent.age,
            reason: agent.energy <= 0 ? 'energy_depletion' : 'max_age',
            finalEnergy: agent.energy
          },
          () => this.rng.float()
        );
      }
    }
    this.recycleDeadAgents(deadAgents);
    this.agents = survivors;
    this.completePolicyFitnessTracking(policyFitnessByAgentId, survivors);

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
      birthsByParentId,
      descentEdges,
      founderOccupancy,
      effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick),
      neighborhoodCrowdingAt: (x, y, occupancy) =>
        neighborhoodCrowding({
          x,
          y,
          occupancy,
          dispersalRadius: this.normalizedDispersalRadius(),
          wrapX: (cellX) => this.wrapX(cellX),
          wrapY: (cellY) => this.wrapY(cellY)
        })
    });
    this.recordLocalityFrame(this.tickCount);
    updateDisturbanceEventState(this.disturbanceEvents, this.tickCount, afterCount, diversity.activeSpecies);

    const genomeV2Metrics = this.genomeV2Metrics();
    const hasGenomeV2Agents = this.agents.some((agent) => agent.genomeV2 !== undefined);
    const policyObservability = summarizePolicyObservability(
      this.agents,
      this.lastStepPolicyFitnessRecords,
      policyDecisionStats
    );
    const genomeV2TraitMetrics = this.computeGenomeV2TraitMetrics();
    const phenotypeDiversity = summarizePhenotypeDiversity(this.agents);
    const policySensitivePhenotypeDiversity = summarizePolicySensitivePhenotypeDiversity(this.agents);

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
      cumulativeExtinctSpecies: this.evolutionHistory.getExtinctSpecies(),
      genomeV2LociCount: hasGenomeV2Agents ? genomeV2Metrics.lociCount : undefined,
      genomeV2ExplicitTraitCount: hasGenomeV2Agents ? genomeV2Metrics.explicitTraitCount : undefined,
      genomeV2ExtendedTraitAgentFraction: hasGenomeV2Agents
        ? genomeV2Metrics.extendedTraitAgentFraction
        : undefined,
      policyObservability,
      genomeV2Metrics: genomeV2TraitMetrics,
      phenotypeDiversity,
      policySensitivePhenotypeDiversity
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

  runWithPolicyFitness(steps: number, stopWhenExtinct = false): PolicyFitnessRunSeries {
    const summaries: StepSummary[] = [];
    const records: PolicyFitnessRecord[] = [];
    for (let i = 0; i < steps; i += 1) {
      const summary = this.step();
      summaries.push(summary);
      records.push(...this.policyFitnessRecords());
      if (stopWhenExtinct && summary.population === 0) {
        break;
      }
    }
    return { summaries, records };
  }

  policyFitnessRecords(): PolicyFitnessRecord[] {
    return this.lastStepPolicyFitnessRecords.map((record) => clonePolicyFitnessRecord(record));
  }

  captureReplayState(): LifeSimulationReplayState {
    return {
      tickCount: this.tickCount,
      rngState: this.rng.getState(),
      config: { ...this.config },
      policyCouplingEnabled: this.policyCouplingEnabled,
      biomeFertility: cloneGrid(this.biomeFertility),
      resources: cloneGrid(this.resources),
      resources2: cloneGrid(this.resources2),
      agents: this.agents.map((agent) => cloneAgent(agent)),
      nextAgentId: this.nextAgentId,
      nextSpeciesId: this.nextSpeciesId,
      nextLineageId: this.nextLineageId,
      evolutionHistory: this.evolutionHistory.snapshotState(),
      cladeFounderGenome: [...this.cladeFounderGenome.entries()].map(([lineage, genome]) => [
        lineage,
        copyGenome(genome)
      ]),
      cladeFounderGenomeV2: [...this.cladeFounderGenomeV2.entries()].map(([lineage, genome]) => [
        lineage,
        cloneGenomeV2(genome)
      ]),
      cladeHabitatPreference: [...this.cladeHabitatPreference.entries()],
      speciesHabitatPreference: [...this.speciesHabitatPreference.entries()],
      speciesTrophicLevel: [...this.speciesTrophicLevel.entries()],
      speciesDefenseLevel: [...this.speciesDefenseLevel.entries()],
      localityFrames: this.localityFrames.map((frame) => cloneLocalityFrame(frame)),
      disturbanceEvents: this.disturbanceEvents.map((event) => ({ ...event })),
      disturbanceSettlementOpenUntilTick: cloneGrid(this.disturbanceSettlementOpenUntilTick),
      lastStepPolicyFitnessRecords: this.lastStepPolicyFitnessRecords.map((record) => clonePolicyFitnessRecord(record)),
      causalTrace: this.causalTraceCollector.snapshotState()
    };
  }

  fork(options: LifeSimulationReplayOptions = {}): LifeSimulation {
    return LifeSimulation.fromReplayState(this.captureReplayState(), {
      encounterOperator: options.encounterOperator ?? this.encounterOperator,
      policyCouplingEnabled: options.policyCouplingEnabled ?? this.policyCouplingEnabled
    });
  }

  static fromReplayState(
    replayState: LifeSimulationReplayState,
    options: LifeSimulationReplayOptions = {}
  ): LifeSimulation {
    return new LifeSimulation({
      replayState,
      encounterOperator: options.encounterOperator,
      policyCouplingEnabled: options.policyCouplingEnabled
    });
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
      agents: this.agents.map((agent) => cloneAgent(agent))
    };
  }

  history(): EvolutionHistorySnapshot {
    return this.evolutionHistory.snapshot();
  }

  causalTrace() {
    return this.causalTraceCollector;
  }

  private restoreReplayState(replayState: LifeSimulationReplayState): void {
    this.rng.setState(replayState.rngState);
    this.evolutionHistory.restoreState(replayState.evolutionHistory);
    this.restoreGenomeMap(this.cladeFounderGenome, replayState.cladeFounderGenome, (genome) => copyGenome(genome));
    this.restoreGenomeMap(this.cladeFounderGenomeV2, replayState.cladeFounderGenomeV2, (genome) => cloneGenomeV2(genome));
    this.restoreNumberMap(this.cladeHabitatPreference, replayState.cladeHabitatPreference);
    this.restoreNumberMap(this.speciesHabitatPreference, replayState.speciesHabitatPreference);
    this.restoreNumberMap(this.speciesTrophicLevel, replayState.speciesTrophicLevel);
    this.restoreNumberMap(this.speciesDefenseLevel, replayState.speciesDefenseLevel);
    this.localityFrames.length = 0;
    this.localityFrames.push(...replayState.localityFrames.map((frame) => cloneLocalityFrame(frame)));
    this.disturbanceEvents.length = 0;
    this.disturbanceEvents.push(...replayState.disturbanceEvents.map((event) => ({ ...event })));
    this.lastStepPolicyFitnessRecords = replayState.lastStepPolicyFitnessRecords.map((record) =>
      clonePolicyFitnessRecord(record)
    );
    this.causalTraceCollector.restoreState(replayState.causalTrace);
  }

  private restoreGenomeMap<T>(
    target: Map<number, T>,
    entries: ReadonlyArray<readonly [number, T]>,
    cloneValue: (value: T) => T
  ): void {
    target.clear();
    for (const [key, value] of entries) {
      target.set(key, cloneValue(value));
    }
  }

  private restoreNumberMap(target: Map<number, number>, entries: ReadonlyArray<readonly [number, number]>): void {
    target.clear();
    for (const [key, value] of entries) {
      target.set(key, value);
    }
  }

  storageDiagnostics(): SimulationStorageDiagnostics {
    const cladeTimelinePoints = this.countTimelinePoints(this.cladeHistory);
    const speciesTimelinePoints = this.countTimelinePoints(this.speciesHistory);
    const localityFullCellSlotsRetained = this.localityFrames.reduce(
      (total, frame) =>
        total + frame.dominantSpeciesByCell.length + frame.neighborhoodDominantSpeciesByCell.length,
      0
    );
    const localityOccupiedMetricSlotsRetained = this.localityFrames.reduce(
      (total, frame) =>
        total +
        frame.dominanceSharesByOccupiedCell.length +
        frame.speciesRichnessByOccupiedCell.length +
        frame.neighborhoodDominanceSharesByOccupiedCell.length +
        frame.neighborhoodSpeciesRichnessByOccupiedCell.length +
        frame.neighborhoodCenterDominantAlignmentByOccupiedCell.length +
        1,
      0
    );
    const timelineNumericSlotsRetained = (cladeTimelinePoints + speciesTimelinePoints) * 4;
    const localityNumericSlotsRetained = localityFullCellSlotsRetained + localityOccupiedMetricSlotsRetained;

    return {
      cladeHistories: this.cladeHistory.size,
      speciesHistories: this.speciesHistory.size,
      cladeTimelinePoints,
      speciesTimelinePoints,
      timelineNumericSlotsRetained,
      localityFramesRetained: this.localityFrames.length,
      localityFullCellSlotsRetained,
      localityOccupiedMetricSlotsRetained,
      localityNumericSlotsRetained,
      estimatedRetainedBytesLowerBound: (timelineNumericSlotsRetained + localityNumericSlotsRetained) * 8
    };
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

  setResource2(x: number, y: number, value: number): void {
    this.resources2[this.wrapY(y)][this.wrapX(x)] = clamp(value, 0, this.config.maxResource2);
  }

  getResource2(x: number, y: number): number {
    return this.resources2[this.wrapY(y)][this.wrapX(x)];
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

  private countTimelinePoints(history: Map<number, TaxonHistoryState>): number {
    let total = 0;
    for (const state of history.values()) {
      total += state.timeline.length;
    }
    return total;
  }

  private countOriginationsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    return countOriginationsInWindow(history, window);
  }

  private countExtinctionsInWindow(history: Map<number, TaxonHistoryState>, window: TurnoverWindow): number {
    return countExtinctionsInWindow(history, window);
  }

  private initializeEvolutionHistory(): void {
    const initialOccupancy = buildOccupancyGrid(this.config.width, this.config.height, this.agents);
    this.evolutionHistory.initialize(this.agents, {
      tick: 0,
      occupancy: initialOccupancy,
      effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick),
      neighborhoodCrowdingAt: (x, y, occupancy) =>
        neighborhoodCrowding({
          x,
          y,
          occupancy,
          dispersalRadius: this.normalizedDispersalRadius(),
          wrapX: (cellX) => this.wrapX(cellX),
          wrapY: (cellY) => this.wrapY(cellY)
        })
    });
  }

  private initializeCladeFounderGenomes(): void {
    for (const agent of this.agents) {
      if (this.cladeFounderGenome.has(agent.lineage)) {
        continue;
      }
      this.cladeFounderGenome.set(agent.lineage, copyGenome(agent.genome));
      if (agent.genomeV2 !== undefined) {
        this.cladeFounderGenomeV2.set(agent.lineage, cloneGenomeV2(agent.genomeV2));
      }
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
      const signal = trophicLevelTraitWithFallback(agent.genomeV2) ?? this.genomeTrophicSignal(agent.genome);
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
      const signal = defenseLevelTraitWithFallback(agent.genomeV2) ?? this.genomeDefenseSignal(agent.genome);
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

  private buildInitialResources(maxResource: number): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => this.rng.float() * Math.max(0, maxResource))
    );
  }

  private buildZeroGrid(): number[][] {
    return Array.from({ length: this.config.height }, () =>
      Array.from({ length: this.config.width }, () => 0)
    );
  }

  private buildOccupancyGrid(agents: ReadonlyArray<Pick<Agent, 'x' | 'y'>> = this.agents): number[][] {
    return buildOccupancyGrid(this.config.width, this.config.height, agents);
  }

  private buildLineageOccupancyGrid(
    agents: ReadonlyArray<Pick<Agent, 'lineage' | 'x' | 'y'>> = this.agents
  ): LineageOccupancyGrid {
    return buildLineageOccupancyGrid(this.config.width, this.config.height, agents);
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
    const useSecondResourceLayer = this.usesSecondResourceLayer();
    for (let i = 0; i < this.config.initialAgents; i += 1) {
      const genome: Genome = {
        metabolism: this.randomTrait(MIN_GENOME.metabolism, MAX_GENOME.metabolism),
        harvest: this.randomTrait(MIN_GENOME.harvest, MAX_GENOME.harvest),
        aggression: this.randomTrait(MIN_GENOME.aggression, MAX_GENOME.aggression)
      };
      if (useSecondResourceLayer) {
        genome.harvestEfficiency2 = this.randomTrait(
          MIN_GENOME.harvestEfficiency2 ?? 0,
          MAX_GENOME.harvestEfficiency2 ?? MAX_GENOME.harvest
        );
      }
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
      syncAgentEnergy(agents[agents.length - 1]);
    }
    return agents;
  }

  private createAgentFromSeed(seed: AgentSeed, fallbackLineage: number, fallbackSpecies: number): Agent {
    const useSecondResourceLayer = this.usesSecondResourceLayer();
    const genome: Genome = {
      metabolism: clamp(seed.genome.metabolism, MIN_GENOME.metabolism, MAX_GENOME.metabolism),
      harvest: clamp(seed.genome.harvest, MIN_GENOME.harvest, MAX_GENOME.harvest),
      aggression: clamp(seed.genome.aggression, MIN_GENOME.aggression, MAX_GENOME.aggression)
    };
    if (seed.genome.harvestEfficiency2 !== undefined || useSecondResourceLayer) {
      genome.harvestEfficiency2 = clamp(
        seed.genome.harvestEfficiency2 ?? seed.genome.harvest,
        MIN_GENOME.harvestEfficiency2 ?? 0,
        MAX_GENOME.harvestEfficiency2 ?? MAX_GENOME.harvest
      );
    }
    const agent: Agent = {
      id: this.nextAgentId++,
      lineage: seed.lineage ?? fallbackLineage,
      species: seed.species ?? fallbackSpecies,
      x: this.wrapX(seed.x),
      y: this.wrapY(seed.y),
      energy: seed.energy,
      age: seed.age ?? 0,
      genome
    };
    if (seed.genomeV2 !== undefined) {
      agent.genomeV2 = cloneGenomeV2(seed.genomeV2);
    }
    const behavioralState = normalizeSeedBehavioralState(seed);
    agent.policyState = behavioralState.policyState;
    agent.transientState = behavioralState.transientState;
    initializeAgentEnergy(agent, seed);
    return agent;
  }

  private processAgentTurn(
    agent: Agent,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined,
    policyFitnessByAgentId: Map<number, PolicyFitnessRecord>,
    policyDecisionStats: PolicyDecisionStats
  ): void {
    agent.age += 1;
    spendAgentEnergy(agent, this.config.metabolismCostBase * agent.genome.metabolism, this.policyCouplingEnabled);
    spendAgentEnergy(agent, this.specializationMetabolicPenalty(agent), this.policyCouplingEnabled);
    if (agent.energy <= 0 || agent.age > this.config.maxAge) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      if (lineageOccupancy) {
        adjustLineageOccupancy({
          width: this.config.width,
          height: this.config.height,
          lineageOccupancy,
          lineage: agent.lineage,
          x: agent.x,
          y: agent.y,
          delta: -1
        });
      }
      return;
    }

    const previousX = agent.x;
    const previousY = agent.y;
    policyDecisionStats.movement.decisions += 1;
    const destination = this.pickDestination(agent, occupancy, lineageOccupancy);
    policyDecisionStats.movement.policyGated += Number(destination.policyGated);
    policyDecisionStats.movement.energyReservePolicyActive += Number(destination.energyReservePolicyActive);
    policyDecisionStats.movement.recentHarvestPolicyActive += Number(destination.recentHarvestPolicyActive);
    policyDecisionStats.movement.blockedByEnergyReserve += Number(destination.gateReason === 'energy_reserve');
    policyDecisionStats.movement.blockedByRecentHarvest += Number(destination.gateReason === 'recent_harvest');
    policyDecisionStats.movement.energyReserveNearThreshold += Number(destination.energyReserveNearThreshold);
    policyDecisionStats.movement.recentHarvestNearThreshold += Number(destination.recentHarvestNearThreshold);
    const moved = destination.x !== agent.x || destination.y !== agent.y;
    const movementEnergyCost = moved ? this.config.moveCost * agent.genome.metabolism : 0;
    agent.x = destination.x;
    agent.y = destination.y;

    this.causalTraceCollector.recordEvent(
      {
        type: 'movement',
        tick: this.tickCount + 1,
        agentId: agent.id,
        lineage: agent.lineage,
        species: agent.species,
        fromX: previousX,
        fromY: previousY,
        toX: agent.x,
        toY: agent.y,
        moved,
        policyGated: destination.policyGated,
        energyCost: movementEnergyCost
      },
      () => this.rng.float()
    );

    if (moved) {
      occupancy[previousY][previousX] = Math.max(0, occupancy[previousY][previousX] - 1);
      occupancy[agent.y][agent.x] += 1;
      if (lineageOccupancy) {
        adjustLineageOccupancy({
          width: this.config.width,
          height: this.config.height,
          lineageOccupancy,
          lineage: agent.lineage,
          x: previousX,
          y: previousY,
          delta: -1
        });
        adjustLineageOccupancy({
          width: this.config.width,
          height: this.config.height,
          lineageOccupancy,
          lineage: agent.lineage,
          x: agent.x,
          y: agent.y,
          delta: 1
        });
      }
      spendAgentEnergy(agent, this.config.moveCost * agent.genome.metabolism, this.policyCouplingEnabled);
    }
    if (agent.energy <= 0) {
      occupancy[agent.y][agent.x] = Math.max(0, occupancy[agent.y][agent.x] - 1);
      if (lineageOccupancy) {
        adjustLineageOccupancy({
          width: this.config.width,
          height: this.config.height,
          lineageOccupancy,
          lineage: agent.lineage,
          x: agent.x,
          y: agent.y,
          delta: -1
        });
      }
      return;
    }

    const available = this.resources[agent.y][agent.x];
    const available2 = this.resources2[agent.y][agent.x];
    const habitatEfficiency = this.habitatMatchEfficiency(agent, agent.x, agent.y);
    const trophicEfficiency = this.trophicForagingEfficiency(agent.species, agent.lineage);
    const defenseEfficiency = this.defenseForagingEfficiency(agent.species, agent.lineage);
    const lineageCrowdingEfficiency = lineageOccupancy
      ? this.lineageHarvestCrowdingEfficiency(agent, lineageOccupancy)
      : 1;
    const harvestSecondaryPreference = resolveHarvestSecondaryPreference(agent, available, this.policyCouplingEnabled);
    const defaultHarvestShares = resolveResourceHarvestShares(agent.genome);
    const harvest = resolveDualResourceHarvest({
      primaryAvailable: available,
      secondaryAvailable: available2,
      genome: agent.genome,
      secondaryPreferenceShare: harvestSecondaryPreference,
      baseCapacity:
      this.config.harvestCap *
        habitatEfficiency *
        trophicEfficiency *
        defenseEfficiency *
        lineageCrowdingEfficiency *
        resolveHarvestPolicyPayoffMultiplier(available, available2, harvestSecondaryPreference)
    });
    policyDecisionStats.harvestDecisions += 1;
    policyDecisionStats.harvestPolicyGuided += Number(
      harvestSecondaryPreference !== undefined &&
      (Math.abs(harvest.primaryShare - defaultHarvestShares.primaryShare) > 1e-9 ||
        Math.abs(harvest.secondaryShare - defaultHarvestShares.secondaryShare) > 1e-9)
    );
    this.resources[agent.y][agent.x] -= harvest.primaryHarvest;
    this.resources2[agent.y][agent.x] -= harvest.secondaryHarvest;
    addAgentEnergy(agent, {
      primary: harvest.primaryHarvest,
      secondary: harvest.secondaryHarvest
    });
    const totalHarvest = harvest.primaryHarvest + harvest.secondaryHarvest;
    setTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST, totalHarvest);
    const policyGuided =
      harvestSecondaryPreference !== undefined &&
      (Math.abs(harvest.primaryShare - defaultHarvestShares.primaryShare) > 1e-9 ||
        Math.abs(harvest.secondaryShare - defaultHarvestShares.secondaryShare) > 1e-9);
    this.causalTraceCollector.recordEvent(
      {
        type: 'harvest',
        tick: this.tickCount + 1,
        agentId: agent.id,
        lineage: agent.lineage,
        species: agent.species,
        x: agent.x,
        y: agent.y,
        primaryHarvest: harvest.primaryHarvest,
        secondaryHarvest: harvest.secondaryHarvest,
        policyGuided,
        habitatEfficiency,
        trophicEfficiency,
        defenseEfficiency,
        lineageCrowdingEfficiency
      },
      () => this.rng.float()
    );
    const policyFitness = policyFitnessByAgentId.get(agent.id);
    if (policyFitness) {
      policyFitness.movementPolicyGated = destination.policyGated;
      policyFitness.harvestPolicyGuided =
        harvestSecondaryPreference !== undefined &&
        (Math.abs(harvest.primaryShare - defaultHarvestShares.primaryShare) > 1e-9 ||
          Math.abs(harvest.secondaryShare - defaultHarvestShares.secondaryShare) > 1e-9);
      policyFitness.harvestIntake = totalHarvest;

      const decisionTimeFertility = this.effectiveBiomeFertilityAt(agent.x, agent.y, this.tickCount + 1);
      const decisionTimeCrowding = neighborhoodCrowding({
        x: agent.x,
        y: agent.y,
        occupancy,
        dispersalRadius: this.normalizedDispersalRadius(),
        wrapX: (x) => this.wrapX(x),
        wrapY: (y) => this.wrapY(y)
      });

      policyFitness.fertilityBin = binPolicyFitnessValue(
        decisionTimeFertility,
        0.1,
        2,
        DEFAULT_POLICY_FITNESS_FERTILITY_BINS
      );
      policyFitness.crowdingBin = binPolicyFitnessValue(
        decisionTimeCrowding,
        0,
        Math.max(1, this.agents.length),
        DEFAULT_POLICY_FITNESS_CROWDING_BINS
      );
      policyFitness.ageBin = binPolicyFitnessValue(
        agent.age,
        0,
        this.config.maxAge,
        DEFAULT_POLICY_FITNESS_AGE_BINS
      );

      const lastDisturbance = latestDisturbanceEvent(this.disturbanceEvents);
      policyFitness.disturbancePhase = resolveDisturbancePhase(
        this.tickCount + 1,
        lastDisturbance?.tick ?? null
      );
    }
  }

  private pickDestination(
    agent: Agent,
    occupancy: number[][],
    lineageOccupancy: LineageOccupancyGrid | undefined
  ): MovementDecisionOutcome {
    const energyReserveThreshold = getPolicyStateValue(
      agent,
      INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD
    );
    const energyReserveSteepness = getPolicyStateValue(
      agent,
      INTERNAL_STATE_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS,
      DEFAULT_MOVEMENT_ENERGY_RESERVE_THRESHOLD_STEEPNESS
    );
    const minRecentHarvest = getPolicyStateValue(agent, INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST);
    const minRecentHarvestSteepness = getPolicyStateValue(
      agent,
      INTERNAL_STATE_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS,
      DEFAULT_MOVEMENT_MIN_RECENT_HARVEST_STEEPNESS
    );
    const recentHarvest = getTransientStateValue(agent, INTERNAL_STATE_LAST_HARVEST);
    const energyReservePolicyActive = energyReserveThreshold > 0;
    const recentHarvestPolicyActive = minRecentHarvest > 0;
    const energyReserveNearThreshold = isNearPolicyThreshold(agent.energy, energyReserveThreshold);
    const recentHarvestNearThreshold = isNearPolicyThreshold(recentHarvest, minRecentHarvest);

    const energyReserveProbability = computeGradedMovementProbability(
      agent.energy,
      energyReserveThreshold,
      energyReserveSteepness
    );
    const recentHarvestProbability = computeGradedMovementProbability(
      recentHarvest,
      minRecentHarvest,
      minRecentHarvestSteepness
    );

    if (energyReservePolicyActive && this.rng.float() >= energyReserveProbability) {
      return {
        x: agent.x,
        y: agent.y,
        policyGated: true,
        gateReason: 'energy_reserve',
        energyReservePolicyActive,
        recentHarvestPolicyActive,
        energyReserveNearThreshold,
        recentHarvestNearThreshold
      };
    }

    if (recentHarvestPolicyActive && this.rng.float() >= recentHarvestProbability) {
      return {
        x: agent.x,
        y: agent.y,
        policyGated: true,
        gateReason: 'recent_harvest',
        energyReservePolicyActive,
        recentHarvestPolicyActive,
        energyReserveNearThreshold,
        recentHarvestNearThreshold
      };
    }

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
      const score = resolveSimulationLocalEcologyScore({
        config: this.config,
        tickCount: this.tickCount,
        dispersalRadius: this.normalizedDispersalRadius(),
        width: this.config.width,
        cladeHistory: this.cladeHistory,
        resources: this.resources,
        resources2: this.resources2,
        speciesHabitatPreference: this.speciesHabitatPreference,
        cladeHabitatPreference: this.cladeHabitatPreference,
        agent,
        x: option.x,
        y: option.y,
        occupancy,
        lineageOccupancy,
        lineagePenalty,
        excludedPosition: { x: agent.x, y: agent.y },
        jitter: this.rng.float() * 0.05,
        effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick),
        wrapX: (x) => this.wrapX(x),
        wrapY: (y) => this.wrapY(y),
        cellIndex: (x, y) => this.cellIndex(x, y)
      });
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }

    return {
      ...best,
      policyGated: false,
      gateReason: 'none',
      energyReservePolicyActive,
      recentHarvestPolicyActive,
      energyReserveNearThreshold,
      recentHarvestNearThreshold
    };
  }

  private initializePolicyFitnessTracking(
    tick: number,
    occupancy: number[][]
  ): Map<number, PolicyFitnessRecord> {
    const records = new Map<number, PolicyFitnessRecord>();
    for (const agent of this.agents) {
      if (agent.energy <= 0) {
        continue;
      }

      const policyFlags = resolveBehavioralPolicyFlags(agent);

      records.set(agent.id, {
        tick,
        agentId: agent.id,
        fertilityBin: -1,
        crowdingBin: -1,
        ageBin: -1,
        disturbancePhase: -1,
        harvestIntake: 0,
        survived: false,
        offspringProduced: 0,
        movementPolicyGated: false,
        reproductionPolicyGated: false,
        harvestPolicyGuided: false,
        policyValues: Object.fromEntries(
          POLICY_PARAMETER_KEYS.map((key) => [key, Math.max(0, getPolicyStateValue(agent, key, 0))])
        ),
        ...policyFlags
      });
    }

    return records;
  }

  private recordPolicyFitnessBirths(
    policyFitnessByAgentId: Map<number, PolicyFitnessRecord>,
    birthsByParentId: ReadonlyMap<number, number>
  ): void {
    for (const [agentId, births] of birthsByParentId) {
      const record = policyFitnessByAgentId.get(agentId);
      if (record) {
        record.offspringProduced += births;
      }
    }
  }

  private recordPolicyFitnessReproductionGating(
    policyFitnessByAgentId: Map<number, PolicyFitnessRecord>,
    policyGatedAgentIds: ReadonlySet<number>
  ): void {
    for (const agentId of policyGatedAgentIds) {
      const record = policyFitnessByAgentId.get(agentId);
      if (record) {
        record.reproductionPolicyGated = true;
      }
    }
  }

  private completePolicyFitnessTracking(
    policyFitnessByAgentId: Map<number, PolicyFitnessRecord>,
    survivors: ReadonlyArray<Pick<Agent, 'id'>>
  ): void {
    const survivorIds = new Set(survivors.map((agent) => agent.id));
    this.lastStepPolicyFitnessRecords = [...policyFitnessByAgentId.values()].map((record) => ({
      ...record,
      survived: survivorIds.has(record.agentId)
    }));
  }

  private lineageHarvestCrowdingEfficiency(
    agent: Pick<Agent, 'lineage' | 'x' | 'y'>,
    lineageOccupancy: LineageOccupancyGrid
  ): number {
    const penalty = Math.max(0, this.config.lineageHarvestCrowdingPenalty);
    if (penalty === 0) {
      return 1;
    }

    const crowding = sameLineageNeighborhoodCrowdingAt({
      width: this.config.width,
      lineage: agent.lineage,
      x: agent.x,
      y: agent.y,
      lineageOccupancy,
      dispersalRadius: this.normalizedDispersalRadius(),
      cellIndex: (x, y) => this.cellIndex(x, y),
      wrapX: (x) => this.wrapX(x),
      wrapY: (y) => this.wrapY(y),
      excludedPosition: { x: agent.x, y: agent.y }
    });
    if (crowding <= 0) {
      return 1;
    }

    return Math.max(0.05, 1 / (1 + penalty * crowding));
  }

  private resolveEncounters(): void {
    const byCell = new Map<string, Agent[]>();
    const context = this.buildEncounterOperatorContext();

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

      this.encounterOperator(agentsInCell, context);
    }
  }

  private buildEncounterOperatorContext(): EncounterOperatorContext {
    return {
      config: this.config,
      blendedTrophicLevel: (species, lineage) => this.blendedTrophicLevel(species, lineage),
      blendedDefenseLevel: (species, lineage) => this.blendedDefenseLevel(species, lineage),
      lineageTransferMultiplier: (dominant, target) =>
        this.encounterLineageTransferMultiplier(dominant, target),
      recordEncounter: (dominant, target, transfer) => {
        this.causalTraceCollector.recordEvent(
          {
            type: 'encounter',
            tick: this.tickCount + 1,
            agentId: dominant.id,
            lineage: dominant.lineage,
            species: dominant.species,
            targetId: target.id,
            targetLineage: target.lineage,
            targetSpecies: target.species,
            energyTransfer: transfer,
            x: dominant.x,
            y: dominant.y
          },
          () => this.rng.float()
        );
      }
    };
  }

  private reproduce(
    parent: Agent,
    occupancy?: number[][],
    lineageOccupancy?: LineageOccupancyGrid
  ) {
    return reproduceInSimulation({
      parent,
      agents: this.agents,
      config: this.config,
      tickCount: this.tickCount,
      width: this.config.width,
      height: this.config.height,
      dispersalRadius: this.normalizedDispersalRadius(),
      occupancy,
      lineageOccupancy,
      speciesHabitatPreference: this.speciesHabitatPreference,
      speciesTrophicLevel: this.speciesTrophicLevel,
      speciesDefenseLevel: this.speciesDefenseLevel,
      cladeFounderGenome: this.cladeFounderGenome,
      cladeFounderGenomeV2: this.cladeFounderGenomeV2,
      cladeHabitatPreference: this.cladeHabitatPreference,
      cladeHistory: this.cladeHistory,
      resources: this.resources,
      resources2: this.resources2,
      disturbanceSettlementOpenUntilTick: this.disturbanceSettlementOpenUntilTick,
      minGenome: MIN_GENOME,
      maxGenome: MAX_GENOME,
      allocateAgentId: () => this.nextAgentId++,
      allocateSpeciesId: () => this.nextSpeciesId++,
      allocateLineageId: () => this.nextLineageId++,
      randomFloat: () => this.rng.float(),
      wrapX: (x) => this.wrapX(x),
      wrapY: (y) => this.wrapY(y),
      cellIndex: (x, y) => this.cellIndex(x, y),
      pickRandomNeighbor: (neighbors) => this.rng.pick(neighbors),
      effectiveBiomeFertilityAt: (x, y, tick) => this.effectiveBiomeFertilityAt(x, y, tick)
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

  private randomTrait(min: number, max: number): number {
    return min + this.rng.float() * (max - min);
  }

  private habitatMatchEfficiency(agent: Pick<Agent, 'species' | 'lineage' | 'genomeV2'>, x: number, y: number): number {
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
    const founderGenomeV2 = this.cladeFounderGenomeV2.get(lineage);
    const directLevel = trophicLevelTraitWithFallback(founderGenomeV2);
    if (directLevel !== undefined) {
      return directLevel;
    }
    return this.genomeTrophicSignal(this.getCladeFounderGenome(lineage));
  }

  private getCladeDefenseLevel(lineage: number): number {
    const founderGenomeV2 = this.cladeFounderGenomeV2.get(lineage);
    const directLevel = defenseLevelTraitWithFallback(founderGenomeV2);
    if (directLevel !== undefined) {
      return directLevel;
    }
    return this.genomeDefenseSignal(this.getCladeFounderGenome(lineage));
  }

  private getSpeciesTrophicLevel(species: number): number {
    const existing = this.speciesTrophicLevel.get(species);
    if (existing !== undefined) {
      return existing;
    }
    this.speciesTrophicLevel.set(species, DEFAULT_TROPHIC_LEVEL);
    return DEFAULT_TROPHIC_LEVEL;
  }

  private getSpeciesDefenseLevel(species: number): number {
    const existing = this.speciesDefenseLevel.get(species);
    if (existing !== undefined) {
      return existing;
    }
    this.speciesDefenseLevel.set(species, DEFAULT_DEFENSE_LEVEL);
    return DEFAULT_DEFENSE_LEVEL;
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
    const resource2RegenMultiplier = this.resource2SeasonalRegenMultiplierForTick(stepTick);
    for (let y = 0; y < this.config.height; y += 1) {
      for (let x = 0; x < this.config.width; x += 1) {
        const fertility = this.effectiveBiomeFertilityAt(x, y, stepTick);
        const fertility2 = this.effectiveBiomeFertility2At(x, y, stepTick);
        this.resources[y][x] = clamp(
          this.resources[y][x] + this.config.resourceRegen * regenMultiplier * fertility,
          0,
          this.config.maxResource
        );
        this.resources2[y][x] = clamp(
          this.resources2[y][x] + this.config.resource2Regen * resource2RegenMultiplier * fertility2,
          0,
          this.config.maxResource2
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
        this.resources2[y][x] = clamp(this.resources2[y][x] * resourceMultiplier, 0, this.config.maxResource2);
      }
    }

    if (energyLoss > 0) {
      const energyMultiplier = 1 - energyLoss;
      for (const agent of this.agents) {
        const cellIndex = agent.y * this.config.width + agent.x;
        if (!affectedCellIndices.has(cellIndex)) {
          continue;
        }
        scaleAgentEnergy(agent, energyMultiplier);
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
        total += this.resources2[y][x];
      }
    }
    return total;
  }

  private recycleDeadAgents(deadAgents: Agent[]): void {
    const stepTick = this.tickCount + 1;
    const spilloverFraction = clamp(this.config.decompositionSpilloverFraction, 0, 1);
    for (const agent of deadAgents) {
      const fertility = this.effectiveBiomeFertilityAt(agent.x, agent.y, stepTick);
      const pools = getAgentEnergyPools(agent);
      const recycled =
        (this.config.decompositionBase +
          pools.total * this.config.decompositionEnergyFraction) *
        fertility;
      if (recycled <= 0) {
        continue;
      }
      const fallbackShares = resolveResourceHarvestShares(agent.genome);
      const primaryShare = pools.total <= 0 ? fallbackShares.primaryShare : pools.primary / pools.total;
      const secondaryShare = pools.total <= 0 ? fallbackShares.secondaryShare : pools.secondary / pools.total;
      const resourceDeltas = new Map<number, number>();
      const resource2Deltas = new Map<number, number>();
      this.accumulateResourceDelta(
        resourceDeltas,
        agent.x,
        agent.y,
        recycled * primaryShare * (1 - spilloverFraction)
      );
      this.accumulateResourceDelta(
        resource2Deltas,
        agent.x,
        agent.y,
        recycled * secondaryShare * (1 - spilloverFraction)
      );

      if (spilloverFraction > 0) {
        const cardinalShare = (recycled * spilloverFraction) / 4;
        const primaryCardinalShare = cardinalShare * primaryShare;
        const secondaryCardinalShare = cardinalShare * secondaryShare;
        this.accumulateResourceDelta(resourceDeltas, agent.x + 1, agent.y, primaryCardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x - 1, agent.y, primaryCardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x, agent.y + 1, primaryCardinalShare);
        this.accumulateResourceDelta(resourceDeltas, agent.x, agent.y - 1, primaryCardinalShare);
        this.accumulateResourceDelta(resource2Deltas, agent.x + 1, agent.y, secondaryCardinalShare);
        this.accumulateResourceDelta(resource2Deltas, agent.x - 1, agent.y, secondaryCardinalShare);
        this.accumulateResourceDelta(resource2Deltas, agent.x, agent.y + 1, secondaryCardinalShare);
        this.accumulateResourceDelta(resource2Deltas, agent.x, agent.y - 1, secondaryCardinalShare);
      }

      for (const [index, delta] of resourceDeltas) {
        const x = index % this.config.width;
        const y = Math.floor(index / this.config.width);
        this.resources[y][x] = clamp(this.resources[y][x] + delta, 0, this.config.maxResource);
      }
      for (const [index, delta] of resource2Deltas) {
        const x = index % this.config.width;
        const y = Math.floor(index / this.config.width);
        this.resources2[y][x] = clamp(this.resources2[y][x] + delta, 0, this.config.maxResource2);
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

  private effectiveBiomeFertility2At(x: number, y: number, tick: number): number {
    const shiftedX = this.wrapX(x + this.resource2BiomeShiftX());
    const shiftedY = this.wrapY(y + this.resource2BiomeShiftY());
    const base = this.biomeFertility[shiftedY][shiftedX];
    const contrastMultiplier = this.resource2SeasonalFertilityContrastMultiplierForTick(tick);
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

  private resource2SeasonalRegenMultiplierForTick(tick: number): number {
    const amplitude = clamp(this.config.resource2SeasonalRegenAmplitude ?? this.config.seasonalRegenAmplitude, 0, 1);
    if (amplitude === 0) {
      return 1;
    }
    return Math.max(0, 1 + amplitude * this.resource2SeasonalWaveForTick(tick));
  }

  private resource2SeasonalFertilityContrastMultiplierForTick(tick: number): number {
    const amplitude = clamp(
      this.config.resource2SeasonalFertilityContrastAmplitude ?? this.config.seasonalFertilityContrastAmplitude,
      0,
      1
    );
    if (amplitude === 0) {
      return 1;
    }
    return Math.max(0, 1 + amplitude * this.resource2SeasonalWaveForTick(tick));
  }

  private seasonalWaveForTick(tick: number): number {
    return Math.sin(this.seasonalPhaseForTick(tick) * Math.PI * 2);
  }

  private resource2SeasonalWaveForTick(tick: number): number {
    return Math.sin(this.resource2SeasonalPhaseForTick(tick) * Math.PI * 2);
  }

  private seasonalPhaseForTick(tick: number): number {
    const cycle = this.normalizedSeasonalCycleLength();
    if (cycle <= 1) {
      return 0;
    }
    const normalizedTick = tick <= 0 ? 0 : tick - 1;
    return (normalizedTick % cycle) / cycle;
  }

  private resource2SeasonalPhaseForTick(tick: number): number {
    return wrapUnitInterval(this.seasonalPhaseForTick(tick) + (this.config.resource2SeasonalPhaseOffset ?? 0));
  }

  private normalizedSeasonalCycleLength(): number {
    return Math.max(0, Math.floor(this.config.seasonalCycleLength));
  }

  private resource2BiomeShiftX(): number {
    const shift = this.config.resource2BiomeShiftX;
    return Number.isFinite(shift) ? Math.trunc(shift ?? 0) : 0;
  }

  private resource2BiomeShiftY(): number {
    const shift = this.config.resource2BiomeShiftY;
    return Number.isFinite(shift) ? Math.trunc(shift ?? 0) : 0;
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

  private genomeV2Metrics(): {
    lociCount: number;
    explicitTraitCount: number;
    extendedTraitAgentFraction: number;
  } {
    const agentsWithV2 = this.agents.filter((agent) => agent.genomeV2 !== undefined);
    if (agentsWithV2.length === 0) {
      return { lociCount: 0, explicitTraitCount: 0, extendedTraitAgentFraction: 0 };
    }

    const totalLociCount = agentsWithV2.reduce((sum, agent) => sum + traitCount(agent.genomeV2!), 0);
    const totalExplicitTraitCount = agentsWithV2.reduce((sum, agent) => {
      return sum + agent.genomeV2!.traits.size;
    }, 0);

    const agentsWithExtendedTraits = agentsWithV2.filter((agent) => genomeV2HasTraitRole(agent.genomeV2!, 'ecological'));

    return {
      lociCount: totalLociCount / agentsWithV2.length,
      explicitTraitCount: totalExplicitTraitCount / agentsWithV2.length,
      extendedTraitAgentFraction: agentsWithExtendedTraits.length / this.agents.length
    };
  }

  private computeGenomeV2TraitMetrics(): GenomeV2Metrics | undefined {
    const agentsWithV2 = this.agents.filter((agent) => agent.genomeV2 !== undefined);
    if (agentsWithV2.length === 0) {
      return undefined;
    }

    const allTraitKeys = new Set<string>();
    for (const agent of agentsWithV2) {
      for (const key of listTraits(agent.genomeV2!)) {
        allTraitKeys.add(key);
      }
    }

    const totalEnergy = agentsWithV2.reduce((sum, agent) => sum + agent.energy, 0);
    const traits = Array.from(allTraitKeys).map((key) => {
      const agentsWithTrait = agentsWithV2.filter((agent) => hasTrait(agent.genomeV2!, key));
      const prevalence = agentsWithTrait.length / agentsWithV2.length;

      const sum = agentsWithV2.reduce((total, agent) => total + getTrait(agent.genomeV2!, key), 0);
      const mean = sum / agentsWithV2.length;

      const varianceSum = agentsWithV2.reduce((total, agent) => {
        const value = getTrait(agent.genomeV2!, key);
        const diff = value - mean;
        return total + diff * diff;
      }, 0);
      const variance = varianceSum / agentsWithV2.length;

      let selectionDifferential = 0;
      if (totalEnergy > 0) {
        const weightedSum = agentsWithV2.reduce(
          (total, agent) => total + getTrait(agent.genomeV2!, key) * agent.energy,
          0
        );
        const weightedMean = weightedSum / totalEnergy;
        selectionDifferential = weightedMean - mean;
      }

      return {
        key,
        prevalence,
        mean,
        variance,
        selectionDifferential
      };
    });

    return { traits };
  }

  private isAlive(agentId: number): boolean {
    return this.agents.some((agent) => agent.id === agentId && agent.energy > 0);
  }

  private usesSecondResourceLayer(): boolean {
    return this.config.maxResource2 > 0 && this.config.resource2Regen > 0;
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

function wrapUnitInterval(value: number): number {
  const wrapped = value % 1;
  return wrapped < 0 ? wrapped + 1 : wrapped;
}

function normalizeTrait(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}

function cloneGrid(grid: ReadonlyArray<ReadonlyArray<number>>): number[][] {
  return grid.map((row) => [...row]);
}

function cloneAgent(agent: Agent): Agent {
  return {
    ...agent,
    genome: copyGenome(agent.genome),
    genomeV2: agent.genomeV2 ? cloneGenomeV2(agent.genomeV2) : undefined,
    policyState: clonePolicyState(agent.policyState),
    transientState: cloneTransientState(agent.transientState)
  };
}

function cloneLocalityFrame(frame: SimulationLocalityFrameState): SimulationLocalityFrameState {
  return {
    dominantSpeciesByCell: [...frame.dominantSpeciesByCell],
    dominanceSharesByOccupiedCell: [...frame.dominanceSharesByOccupiedCell],
    speciesRichnessByOccupiedCell: [...frame.speciesRichnessByOccupiedCell],
    neighborhoodDominantSpeciesByCell: [...frame.neighborhoodDominantSpeciesByCell],
    neighborhoodDominanceSharesByOccupiedCell: [...frame.neighborhoodDominanceSharesByOccupiedCell],
    neighborhoodSpeciesRichnessByOccupiedCell: [...frame.neighborhoodSpeciesRichnessByOccupiedCell],
    neighborhoodCenterDominantAlignmentByOccupiedCell: [...frame.neighborhoodCenterDominantAlignmentByOccupiedCell],
    occupiedCells: frame.occupiedCells
  };
}

function clonePolicyFitnessRecord(record: PolicyFitnessRecord): PolicyFitnessRecord {
  return {
    ...record,
    policyValues: record.policyValues ? { ...record.policyValues } : undefined
  };
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
